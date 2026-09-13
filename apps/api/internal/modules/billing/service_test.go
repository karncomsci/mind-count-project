package billing

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
)

func validDraft() Draft {
	return Draft{Customer: Customer{Name: "ลูกค้า"}, Date: "2026-09-13", DueDate: "2026-10-13", CreditDays: 30, CreditMode: "days", PriceMode: "exclusive", Items: []Line{{ID: "line", Description: "คอม", Quantity: 1, Unit: "เครื่อง", UnitPrice: 20000, VatRate: 7, WithholdingRate: 3}}, Attachments: []Attachment{}}
}
func TestDraftValidation(t *testing.T) {
	d := validDraft()
	if err := ValidateDraft(d); err != nil {
		t.Fatal(err)
	}
	for _, change := range []func(*Draft){func(d *Draft) { d.Items[0].Quantity = -1 }, func(d *Draft) { d.DueDate = "2026-10-12" }, func(d *Draft) { d.Customer.Name = " " }, func(d *Draft) { d.DocumentDiscount = 20001 }, func(d *Draft) { d.Items[0].VatRate = 9 }, func(d *Draft) { d.Date = "2026-02-30" }, func(d *Draft) {
		d.Attachments = []Attachment{{ID: "a", Name: "a.pdf", Type: "application/pdf", Size: 12, DataURL: "data:application/pdf;base64,QQ=="}}
	}} {
		d = validDraft()
		change(&d)
		if !errors.Is(ValidateDraft(d), ErrInvalid) {
			t.Fatal("accepted invalid draft", d)
		}
	}
}

type memoryRepo struct{ rows map[string]json.RawMessage }

func (m *memoryRepo) List(context.Context) ([]Entity, error) { return []Entity{}, nil }
func (m *memoryRepo) Get(_ context.Context, kind, id string) (json.RawMessage, error) {
	b, ok := m.rows[kind+id]
	if !ok {
		return nil, ErrMissing
	}
	return b, nil
}
func (m *memoryRepo) Put(_ context.Context, kind, id string, b json.RawMessage) error {
	m.rows[kind+id] = b
	return nil
}
func (*memoryRepo) NextNumber(context.Context, string) (int64, error) { return 1, nil }
func (*memoryRepo) Lock(context.Context) error                        { return nil }

type directTx struct{}

func (directTx) WithinTx(ctx context.Context, fn func(context.Context) error) error { return fn(ctx) }
func TestSaveVersionStatusAndIdempotentImport(t *testing.T) {
	ctx := context.Background()
	repo := &memoryRepo{rows: map[string]json.RawMessage{}}
	s := NewService(repo, directTx{})
	d := validDraft()
	result, err := s.Mutate(ctx, Command{Operation: "save", Draft: &d})
	if err != nil {
		t.Fatal(err)
	}
	record := result.Record
	if record.Status != "draft" || record.Number != "BL202609130001" || record.Version != 1 {
		t.Fatal(record)
	}
	_, err = s.Mutate(ctx, Command{Operation: "status", ID: record.ID, Version: 0, Status: "billed"})
	if !errors.Is(err, ErrConflict) {
		t.Fatal("stale write", err)
	}
	result, err = s.Mutate(ctx, Command{Operation: "status", ID: record.ID, Version: 1, Status: "billed"})
	if err != nil || result.Record.Status != "billed" {
		t.Fatal(err)
	}
	_, err = s.Mutate(ctx, Command{Operation: "status", ID: record.ID, Version: 2, Status: "invoiced"})
	if !errors.Is(err, ErrInvalid) {
		t.Fatal("status", err)
	}
	result, err = s.Mutate(ctx, Command{Operation: "import", Record: record})
	if err != nil || result.Record.Version != 2 {
		t.Fatal("import must not overwrite", err)
	}
}
