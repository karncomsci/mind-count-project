// Command migrate applies embedded Goose migrations and development seeds.
package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/pressly/goose/v3/lock"

	"mind-count/apps/api/internal/db"
	"mind-count/apps/api/internal/platform/config"
)

func main() {
	if err := run(); err != nil {
		_, _ = fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	if len(os.Args) != 2 {
		return errors.New("usage: migrate up|down|status|seed")
	}
	command := os.Args[1]
	if command != "up" && command != "down" && command != "status" && command != "seed" {
		return errors.New("usage: migrate up|down|status|seed")
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	ctx, cancel := context.WithTimeout(ctx, cfg.MigrationTimeout)
	defer cancel()
	connection, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		return errors.New("cannot open migration database")
	}
	defer func() { _ = connection.Close() }()
	connection.SetMaxOpenConns(1)
	connection.SetConnMaxLifetime(cfg.DBMaxConnLifetime)
	if err := connection.PingContext(ctx); err != nil {
		return errors.New("migration database is unavailable")
	}
	if command == "seed" {
		seed, err := db.Seeds.ReadFile("seeds/development.sql")
		if err != nil {
			return err
		}
		if _, err := connection.ExecContext(ctx, string(seed)); err != nil {
			return errors.New("development seed failed")
		}
		return nil
	}
	source, err := fs.Sub(db.Migrations, "migrations")
	if err != nil {
		return err
	}
	locker, err := lock.NewPostgresSessionLocker()
	if err != nil {
		return err
	}
	provider, err := goose.NewProvider(goose.DialectPostgres, connection, source, goose.WithSessionLocker(locker))
	if err != nil {
		return err
	}
	switch command {
	case "up":
		_, err = provider.Up(ctx)
	case "down":
		_, err = provider.Down(ctx)
	case "status":
		var status []*goose.MigrationStatus
		status, err = provider.Status(ctx)
		if err == nil {
			for _, migration := range status {
				_, _ = fmt.Fprintf(os.Stdout, "%d %s\n", migration.Source.Version, migration.State)
			}
		}
	}
	if err != nil {
		return errors.New("migration failed; inspect database availability and migration SQL")
	}
	return nil
}
