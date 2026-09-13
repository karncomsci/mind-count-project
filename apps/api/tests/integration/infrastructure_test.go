//go:build integration

package integration

import (
	"context"
	"errors"
	"io"
	"io/fs"
	"log/slog"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	"mind-count/apps/api/internal/bootstrap"
	"mind-count/apps/api/internal/db"
	"mind-count/apps/api/internal/db/gen"
	"mind-count/apps/api/internal/platform/config"
	"mind-count/apps/api/internal/platform/database"
)

func TestInfrastructure(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	container, err := postgres.Run(ctx, "postgres:18-alpine", postgres.WithDatabase("mind_count_test"), postgres.WithUsername("test"), postgres.WithPassword("test-only"), testcontainers.WithWaitStrategy(wait.ForLog("database system is ready to accept connections").WithOccurrence(2).WithStartupTimeout(time.Minute)))
	if err != nil {
		t.Fatalf("PostgreSQL 18 testcontainer requires a running Docker daemon: %v", err)
	}
	t.Cleanup(func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := container.Terminate(cleanup); err != nil {
			t.Errorf("terminate container: %v", err)
		}
	})
	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}
	pool, err := database.NewPool(ctx, database.PoolConfig{URL: dsn, MaxConns: 4, MaxConnLifetime: time.Minute, HealthCheckPeriod: time.Second, ConnectTimeout: 5 * time.Second})
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	tx := database.NewTxManager(pool, 5*time.Second)

	t.Run("migration up repeat down up", func(t *testing.T) {
		source, err := fs.Sub(db.Migrations, "migrations")
		if err != nil {
			t.Fatal(err)
		}
		sqlDB := stdlib.OpenDBFromPool(pool)
		defer func() {
			if err := sqlDB.Close(); err != nil {
				t.Error(err)
			}
		}()
		provider, err := goose.NewProvider(goose.DialectPostgres, sqlDB, source)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := provider.Up(ctx); err != nil {
			t.Fatal(err)
		}
		if result, err := provider.Up(ctx); err != nil || len(result) != 0 {
			t.Fatalf("repeat up: result=%v err=%v", result, err)
		}
		if _, err := provider.Down(ctx); err != nil {
			t.Fatal(err)
		}
		if _, err := provider.Up(ctx); err != nil {
			t.Fatal(err)
		}
	})

	if _, err := pool.Exec(ctx, "CREATE TABLE tx_probe (value text NOT NULL)"); err != nil {
		t.Fatal(err)
	}
	insert := func(ctx context.Context, value string) error {
		_, err := tx.Executor(ctx).Exec(ctx, "INSERT INTO tx_probe(value) VALUES ($1)", value)
		return err
	}
	count := func(t *testing.T, value string) int {
		t.Helper()
		var n int
		if err := pool.QueryRow(ctx, "SELECT count(*) FROM tx_probe WHERE value=$1", value).Scan(&n); err != nil {
			t.Fatal(err)
		}
		return n
	}
	t.Run("commit and sqlc executor", func(t *testing.T) {
		if err := tx.WithinTx(ctx, func(ctx context.Context) error {
			if tx.Executor(ctx) == pool {
				return errors.New("transaction not injected")
			}
			if _, err := gen.New(tx.Executor(ctx)).CheckDatabase(ctx); err != nil {
				return err
			}
			return insert(ctx, "commit")
		}); err != nil {
			t.Fatal(err)
		}
		if count(t, "commit") != 1 || tx.Executor(ctx) != pool {
			t.Fatal("commit or context isolation failed")
		}
	})
	t.Run("rollback on callback error", func(t *testing.T) {
		sentinel := errors.New("reject")
		err := tx.WithinTx(ctx, func(ctx context.Context) error {
			if err := insert(ctx, "rollback"); err != nil {
				return err
			}
			return sentinel
		})
		if !errors.Is(err, sentinel) || count(t, "rollback") != 0 {
			t.Fatalf("rollback failed: %v", err)
		}
	})
	t.Run("panic rolls back", func(t *testing.T) {
		func() {
			defer func() {
				if recover() == nil {
					t.Error("panic was swallowed")
				}
			}()
			_ = tx.WithinTx(ctx, func(ctx context.Context) error {
				if err := insert(ctx, "panic"); err != nil {
					return err
				}
				panic("test")
			})
		}()
		if count(t, "panic") != 0 {
			t.Fatal("panic transaction committed")
		}
	})
	t.Run("cancellation rolls back", func(t *testing.T) {
		cancelCtx, stop := context.WithCancel(ctx)
		defer stop()
		err := tx.WithinTx(cancelCtx, func(ctx context.Context) error {
			if err := insert(ctx, "cancel"); err != nil {
				return err
			}
			stop()
			return nil
		})
		if !errors.Is(err, context.Canceled) || count(t, "cancel") != 0 {
			t.Fatalf("cancellation failed: %v", err)
		}
	})
	t.Run("nested transactions rejected", func(t *testing.T) {
		err := tx.WithinTx(ctx, func(ctx context.Context) error { return tx.WithinTx(ctx, func(context.Context) error { return nil }) })
		if !errors.Is(err, database.ErrNestedTransaction) {
			t.Fatalf("unexpected error: %v", err)
		}
	})
	t.Run("real database readiness", func(t *testing.T) {
		router := bootstrap.NewRouter(config.Config{ReadinessTimeout: time.Second, RateLimitRPS: 10, RateLimitBurst: 20, RateLimitMaxClients: 100}, slog.New(slog.NewJSONHandler(io.Discard, nil)), pool)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest("GET", "/health/ready", nil))
		if w.Code != 200 {
			t.Fatalf("readiness: %d %s", w.Code, w.Body.String())
		}
		pool.Close()
		w = httptest.NewRecorder()
		router.ServeHTTP(w, httptest.NewRequest("GET", "/health/ready", nil))
		if w.Code != 503 {
			t.Fatalf("closed pool readiness: %d", w.Code)
		}
	})
}
