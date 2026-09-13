//go:build integration

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"mind-count/apps/api/internal/bootstrap"
	"mind-count/apps/api/internal/modules/billing"
	billinghttp "mind-count/apps/api/internal/modules/billing/http"
	billingpostgres "mind-count/apps/api/internal/modules/billing/postgres"
	"mind-count/apps/api/internal/platform/config"
	"mind-count/apps/api/internal/platform/database"
)

func testBilling(t *testing.T, ctx context.Context, pool *pgxpool.Pool, tx *database.TxManager) {
	t.Helper()
	newService := func() *billing.Service {
		return billing.NewService(billingpostgres.NewRepository(tx, 5*time.Second), tx)
	}
	service := newService()
	draft := billing.Draft{Customer: billing.Customer{Name: "Database customer"}, Date: "2026-09-13", DueDate: "2026-10-13", CreditDays: 30, CreditMode: "days", PriceMode: "exclusive", Items: []billing.Line{{ID: "line", Description: "computer", Quantity: 1, Unit: "piece", UnitPrice: 20000, VatRate: 7, WithholdingRate: 3}}, Attachments: []billing.Attachment{{ID: "file", Name: "a.pdf", Type: "application/pdf", Size: 4, DataURL: "data:application/pdf;base64,JVBERg=="}}}
	var record billing.Record
	t.Run("concurrent numbering and durable read", func(t *testing.T) {
		var wg sync.WaitGroup
		results := make(chan billing.Result, 8)
		failures := make(chan error, 8)
		for i := 0; i < 8; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				r, e := newService().Mutate(ctx, billing.Command{Operation: "save", Draft: &draft})
				results <- r
				failures <- e
			}()
		}
		wg.Wait()
		close(results)
		close(failures)
		for err := range failures {
			if err != nil {
				t.Fatal(err)
			}
		}
		seen := map[string]bool{}
		for result := range results {
			if seen[result.Record.Number] {
				t.Fatal("duplicate number")
			}
			seen[result.Record.Number] = true
			record = *result.Record
		}
		workspace, err := newService().Read(ctx)
		if err != nil || len(workspace.Records) != 8 {
			t.Fatal("persistence", err)
		}
		if workspace.Records[0].Draft.Attachments[0].DataURL != draft.Attachments[0].DataURL {
			t.Fatal("attachment lost")
		}
	})
	t.Run("stale edit rolls back and deleted document is recoverable", func(t *testing.T) {
		result, err := service.Mutate(ctx, billing.Command{Operation: "status", ID: record.ID, Version: record.Version, Status: "billed"})
		if err != nil {
			t.Fatal(err)
		}
		_, err = service.Mutate(ctx, billing.Command{Operation: "save", ID: record.ID, Version: record.Version, Draft: &draft})
		if !errors.Is(err, billing.ErrConflict) {
			t.Fatal("stale edit accepted", err)
		}
		result, err = service.Mutate(ctx, billing.Command{Operation: "delete", ID: record.ID, Version: result.Record.Version})
		if err != nil || result.Record.DeletedAt == nil {
			t.Fatal(err)
		}
		result, err = service.Mutate(ctx, billing.Command{Operation: "restore", ID: record.ID, Version: result.Record.Version})
		if err != nil || result.Record.DeletedAt != nil || result.Record.Status != "billed" {
			t.Fatal(err)
		}
		record = *result.Record
	})
	t.Run("catalog uniqueness and legacy import are atomic", func(t *testing.T) {
		project := billing.Project{ID: "p1", Name: "Project", Customer: "customer"}
		if _, err := service.Mutate(ctx, billing.Command{Operation: "project", Project: &project}); err != nil {
			t.Fatal(err)
		}
		if _, err := service.Mutate(ctx, billing.Command{Operation: "project", Project: &project}); err != nil {
			t.Fatal("idempotent catalog", err)
		}
		project.ID = "p2"
		if _, err := service.Mutate(ctx, billing.Command{Operation: "project", Project: &project}); !errors.Is(err, billing.ErrDuplicate) {
			t.Fatal("duplicate catalog", err)
		}
		result, err := service.Mutate(ctx, billing.Command{Operation: "import", Record: &record})
		if err != nil || result.Record.Version != record.Version {
			t.Fatal("import overwrote existing record", err)
		}
		legacy := record
		legacy.ID = "legacy"
		legacy.Number = "BL202609130100"
		legacy.Version = 0
		legacy.Status = ""
		if _, err := service.Mutate(ctx, billing.Command{Operation: "import", Record: &legacy}); err != nil {
			t.Fatal(err)
		}
		legacy.ID = "collision"
		if _, err := service.Mutate(ctx, billing.Command{Operation: "import", Record: &legacy}); !errors.Is(err, billing.ErrDuplicate) {
			t.Fatal("number collision", err)
		}
		result, err = service.Mutate(ctx, billing.Command{Operation: "save", Draft: &draft})
		if err != nil || result.Record.Number != "BL202609130101" {
			t.Fatal("import numbering", err)
		}
	})
	t.Run("HTTP contract rejects invalid input and returns persistent data", func(t *testing.T) {
		router := bootstrap.NewRouter(config.Config{ReadinessTimeout: time.Second, RateLimitRPS: 100, RateLimitBurst: 100, RateLimitMaxClients: 100}, slog.New(slog.NewJSONHandler(io.Discard, nil)), pool, billinghttp.NewHandler(service))
		for _, payload := range []string{`{"operation":"status","status":"invoiced"}`, `{"operation":"save","draft":{}}`, `{"operation":"save","unexpected":1}`} {
			w := httptest.NewRecorder()
			router.ServeHTTP(w, httptest.NewRequest("POST", "/api/v1/billing", bytes.NewBufferString(payload)))
			if w.Code != 400 || w.Header().Get("X-Request-ID") == "" {
				t.Fatal(w.Code, w.Body.String())
			}
		}
		w := httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest("GET", "/api/v1/billing", nil))
		var workspace billing.Workspace
		if w.Code != 200 || json.Unmarshal(w.Body.Bytes(), &workspace) != nil || len(workspace.Records) != 10 || workspace.Records[0].DeletedAt != nil {
			t.Fatal(w.Code, w.Body.String())
		}
	})
}
