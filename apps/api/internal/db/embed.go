// Package db embeds the immutable Goose migrations and development seed script.
package db

import "embed"

// Migrations is the source of truth used by the migration command.
//
//go:embed migrations/*.sql
var Migrations embed.FS

// Seeds contains explicit development-only SQL, never executed at API startup.
//
//go:embed seeds/*.sql
var Seeds embed.FS
