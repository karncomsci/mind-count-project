// Package database owns connection pooling and transaction context injection.
package database

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PoolConfig defines bounded connection lifecycle settings.
type PoolConfig struct {
	URL               string
	MaxConns          int32
	MaxConnLifetime   time.Duration
	HealthCheckPeriod time.Duration
	ConnectTimeout    time.Duration
}

// NewPool validates configuration and verifies connectivity before returning.
func NewPool(ctx context.Context, cfg PoolConfig) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.URL)
	if err != nil {
		return nil, errors.New("invalid database connection configuration")
	}
	poolCfg.MaxConns = cfg.MaxConns
	poolCfg.MaxConnLifetime = cfg.MaxConnLifetime
	poolCfg.HealthCheckPeriod = cfg.HealthCheckPeriod
	poolCfg.ConnConfig.ConnectTimeout = cfg.ConnectTimeout
	ctx, cancel := context.WithTimeout(ctx, cfg.ConnectTimeout)
	defer cancel()
	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, errors.New("database pool initialization failed")
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, errors.New("database startup ping failed")
	}
	return pool, nil
}
