// Package id creates sortable UUIDv7 identifiers.
package id

import "github.com/google/uuid"

// New returns a UUIDv7 or an entropy source error.
func New() (uuid.UUID, error) { return uuid.NewV7() }
