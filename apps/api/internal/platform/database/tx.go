package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"mind-count/apps/api/internal/db/gen"
)

type transactionKey struct{}
type transactionContext struct {
	owner *TxManager
	tx    pgx.Tx
}

// ErrNestedTransaction rejects accidental nested transaction scopes.
var ErrNestedTransaction = errors.New("nested transactions are not supported")

// TxManager owns transaction boundaries; services depend on a consumer-side interface.
type TxManager struct {
	pool    *pgxpool.Pool
	timeout time.Duration
}

// NewTxManager sets the maximum duration of a transaction and its cleanup.
func NewTxManager(pool *pgxpool.Pool, timeout time.Duration) *TxManager {
	return &TxManager{pool: pool, timeout: timeout}
}

// Executor selects the injected transaction or the ordinary connection pool.
// Repository calls must use a bounded context for the actual generated query.
func (m *TxManager) Executor(ctx context.Context) gen.DBTX {
	if scope, ok := ctx.Value(transactionKey{}).(transactionContext); ok && scope.owner == m {
		return scope.tx
	}
	return m.pool
}

// WithinTx injects a transaction into the callback context and commits only on success.
// Rollback uses an independent bounded context so cancellation cannot prevent cleanup.
func (m *TxManager) WithinTx(ctx context.Context, fn func(context.Context) error) (result error) {
	if ctx.Value(transactionKey{}) != nil {
		return ErrNestedTransaction
	}
	ctx, cancel := context.WithTimeout(ctx, m.timeout)
	defer cancel()
	tx, err := m.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer func() {
		cleanup, cancel := context.WithTimeout(context.WithoutCancel(ctx), m.timeout)
		defer cancel()
		if err := tx.Rollback(cleanup); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			result = errors.Join(result, fmt.Errorf("rollback transaction: %w", err))
		}
	}()
	txCtx := context.WithValue(ctx, transactionKey{}, transactionContext{owner: m, tx: tx})
	if err := fn(txCtx); err != nil {
		return err
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}
	return nil
}
