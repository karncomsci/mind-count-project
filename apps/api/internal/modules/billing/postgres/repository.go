// Package postgres adapts the billing repository to sqlc and PostgreSQL.
package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"mind-count/apps/api/internal/db/gen"
	"mind-count/apps/api/internal/modules/billing"
	"mind-count/apps/api/internal/platform/database"
)

// Repository uses the injected transaction executor for every bounded query.
type Repository struct {
	tx      *database.TxManager
	timeout time.Duration
}

// NewRepository constructs the PostgreSQL adapter.
func NewRepository(tx *database.TxManager, timeout time.Duration) *Repository {
	return &Repository{tx: tx, timeout: timeout}
}
func (r *Repository) queries(ctx context.Context) *gen.Queries { return gen.New(r.tx.Executor(ctx)) }

// List maps sqlc rows into module payloads.
func (r *Repository) List(ctx context.Context) ([]billing.Entity, error) {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()
	rows, err := r.queries(ctx).ListBillingEntities(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]billing.Entity, 0, len(rows))
	for _, row := range rows {
		out = append(out, billing.Entity{Kind: row.Kind, Body: row.Body})
	}
	return out, nil
}

// Get reads one document or catalog entry.
func (r *Repository) Get(ctx context.Context, kind, id string) (json.RawMessage, error) {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()
	body, err := r.queries(ctx).GetBillingEntity(ctx, gen.GetBillingEntityParams{Kind: kind, ID: id})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, billing.ErrMissing
	}
	return body, err
}

// Put persists a validated payload and maps unique constraints to a domain error.
func (r *Repository) Put(ctx context.Context, kind, id string, body json.RawMessage) error {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()
	err := r.queries(ctx).PutBillingEntity(ctx, gen.PutBillingEntityParams{Kind: kind, ID: id, Body: body})
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return billing.ErrDuplicate
	}
	return err
}

// Lock serializes short writes in the current single workspace, including number allocation.
func (r *Repository) Lock(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()
	return r.queries(ctx).LockBillingWrites(ctx)
}

// NextNumber allocates against both existing and imported document numbers while locked.
func (r *Repository) NextNumber(ctx context.Context, prefix string) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()
	return r.queries(ctx).NextBillingNumber(ctx, prefix)
}
