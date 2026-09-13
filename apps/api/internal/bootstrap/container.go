// Package bootstrap is the application's composition root.
package bootstrap

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"mind-count/apps/api/internal/modules/billing"
	billinghttp "mind-count/apps/api/internal/modules/billing/http"
	billingpostgres "mind-count/apps/api/internal/modules/billing/postgres"
	"mind-count/apps/api/internal/platform/config"
	"mind-count/apps/api/internal/platform/database"
)

// Container holds resources owned by the application lifecycle.
type Container struct {
	Pool         *pgxpool.Pool
	Transactions *database.TxManager
	Handler      http.Handler
}

// NewContainer wires all dependencies; module wiring is added here in Phase 1.
func NewContainer(ctx context.Context, cfg config.Config, log *slog.Logger) (*Container, error) {
	pool, err := database.NewPool(ctx, database.PoolConfig{URL: cfg.DatabaseURL, MaxConns: cfg.DBMaxConns, MaxConnLifetime: cfg.DBMaxConnLifetime, HealthCheckPeriod: cfg.DBHealthCheckPeriod, ConnectTimeout: cfg.DBConnectTimeout})
	if err != nil {
		return nil, err
	}
	tx := database.NewTxManager(pool, cfg.DBOperationTimeout)
	service := billing.NewService(billingpostgres.NewRepository(tx, cfg.DBOperationTimeout), tx)
	return &Container{Pool: pool, Transactions: tx, Handler: NewRouter(cfg, log, pool, billinghttp.NewHandler(service))}, nil
}

// Close releases the database pool after HTTP requests have drained.
func (c *Container) Close() { c.Pool.Close() }
