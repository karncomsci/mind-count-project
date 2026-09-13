package billing

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Domain errors are mapped to public transport errors in the HTTP adapter.
var (
	ErrInvalid   = errors.New("ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก")
	ErrMissing   = errors.New("ไม่พบเอกสาร")
	ErrConflict  = errors.New("ข้อมูลมีการเปลี่ยนแปลงจากหน้าต่างอื่น กรุณาเปิดข้อมูลล่าสุดก่อนแก้ไข")
	ErrDuplicate = errors.New("ชื่อ รหัส หรือเลขที่เอกสารนี้มีอยู่แล้ว")
)

// Entity is a validated module payload, not a database model.
type Entity struct {
	Kind string
	Body json.RawMessage
}

// Repository stores independent documents and catalog entries.
type Repository interface {
	List(context.Context) ([]Entity, error)
	Get(context.Context, string, string) (json.RawMessage, error)
	Put(context.Context, string, string, json.RawMessage) error
	NextNumber(context.Context, string) (int64, error)
	Lock(context.Context) error
}

// Transactions owns atomic command boundaries.
type Transactions interface {
	WithinTx(context.Context, func(context.Context) error) error
}

// Service implements the billing use cases.
type Service struct {
	repo Repository
	tx   Transactions
}

// NewService wires persistence without importing database or HTTP dependencies.
func NewService(repo Repository, tx Transactions) *Service { return &Service{repo: repo, tx: tx} }

// Read returns the single development workspace, including recoverable deleted records.
func (s *Service) Read(ctx context.Context) (Workspace, error) {
	out := Workspace{Records: []Record{}, Projects: []Project{}, Warehouses: []Warehouse{}}
	rows, err := s.repo.List(ctx)
	if err != nil {
		return out, err
	}
	for _, row := range rows {
		switch row.Kind {
		case "record":
			var v Record
			if err = json.Unmarshal(row.Body, &v); err != nil {
				return out, err
			}
			out.Records = append(out.Records, v)
		case "project":
			var v Project
			if err = json.Unmarshal(row.Body, &v); err != nil {
				return out, err
			}
			out.Projects = append(out.Projects, v)
		case "warehouse":
			var v Warehouse
			if err = json.Unmarshal(row.Body, &v); err != nil {
				return out, err
			}
			out.Warehouses = append(out.Warehouses, v)
		}
	}
	return out, nil
}

// Mutate applies one command under a transaction lock, preventing duplicate numbers and stale writes.
func (s *Service) Mutate(ctx context.Context, c Command) (Result, error) {
	var out Result
	err := s.tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.repo.Lock(ctx); err != nil {
			return err
		}
		if c.Operation == "project" || c.Operation == "warehouse" {
			var id string
			var body any
			if c.Operation == "project" {
				if c.Project == nil {
					return ErrInvalid
				}
				c.Project.Name = strings.TrimSpace(c.Project.Name)
				if !validProject(*c.Project) {
					return ErrInvalid
				}
				id = c.Project.ID
				body = c.Project
				out.Project = c.Project
			} else {
				if c.Warehouse == nil {
					return ErrInvalid
				}
				c.Warehouse.Name = strings.TrimSpace(c.Warehouse.Name)
				c.Warehouse.Code = strings.TrimSpace(c.Warehouse.Code)
				if !validWarehouse(*c.Warehouse) {
					return ErrInvalid
				}
				id = c.Warehouse.ID
				body = c.Warehouse
				out.Warehouse = c.Warehouse
			}
			encoded, err := json.Marshal(body)
			if err != nil {
				return err
			}
			existing, err := s.repo.Get(ctx, c.Operation, id)
			if err == nil {
				var oldValue, newValue any
				if json.Unmarshal(existing, &oldValue) == nil && json.Unmarshal(encoded, &newValue) == nil && reflect.DeepEqual(oldValue, newValue) {
					return nil
				}
				return ErrDuplicate
			}
			if !errors.Is(err, ErrMissing) {
				return err
			}
			return s.repo.Put(ctx, c.Operation, id, encoded)
		}
		var record Record
		if c.Operation == "import" {
			if c.Record == nil {
				return ErrInvalid
			}
			record = *c.Record
			if record.Status == "" {
				record.Status = "draft"
			}
			if record.Kind == "" {
				record.Kind = "billing"
			}
			if !validID(record.ID) || !validNumber(record.Number) || !validStatus(record.Status) || (record.Kind != "billing" && record.Kind != "consolidated") || ValidateDraft(record.Draft) != nil {
				return ErrInvalid
			}
			existing, err := s.repo.Get(ctx, "record", record.ID)
			if err == nil {
				if err = json.Unmarshal(existing, &record); err != nil {
					return err
				}
				out.Record = &record
				return nil
			}
			if !errors.Is(err, ErrMissing) {
				return err
			}
			if record.DeletedAt != nil {
				if _, err := time.Parse(time.RFC3339Nano, *record.DeletedAt); err != nil {
					return ErrInvalid
				}
			}
			record.Version = 1
		} else if c.ID != "" {
			body, err := s.repo.Get(ctx, "record", c.ID)
			if err != nil {
				return err
			}
			if err = json.Unmarshal(body, &record); err != nil {
				return err
			}
			if c.Version != record.Version {
				return ErrConflict
			}
			record.Version++
		} else {
			if c.Operation != "save" || c.Draft == nil {
				return ErrInvalid
			}
			if err := ValidateDraft(*c.Draft); err != nil {
				return err
			}
			prefix := "BL" + strings.ReplaceAll(c.Draft.Date, "-", "")
			n, err := s.repo.NextNumber(ctx, prefix)
			if err != nil {
				return err
			}
			if n > 999999 {
				return ErrInvalid
			}
			record = Record{ID: uuid.NewString(), Number: fmt.Sprintf("%s%04d", prefix, n), Status: "draft", Kind: "billing", Version: 1}
		}
		switch c.Operation {
		case "save":
			if c.Draft == nil || record.DeletedAt != nil {
				return ErrInvalid
			}
			if err := ValidateDraft(*c.Draft); err != nil {
				return err
			}
			record.Draft = *c.Draft
		case "status":
			if !validStatus(c.Status) || record.DeletedAt != nil {
				return ErrInvalid
			}
			record.Status = c.Status
		case "delete":
			now := time.Now().UTC().Format(time.RFC3339Nano)
			record.DeletedAt = &now
		case "restore":
			record.DeletedAt = nil
		case "import":
		default:
			return ErrInvalid
		}
		record.UpdatedAt = time.Now().UTC().Format(time.RFC3339Nano)
		body, err := json.Marshal(record)
		if err != nil {
			return err
		}
		if err = s.repo.Put(ctx, "record", record.ID, body); err != nil {
			return err
		}
		out.Record = &record
		return nil
	})
	return out, err
}
