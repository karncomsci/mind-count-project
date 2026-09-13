// Package logger constructs the structured application logger.
package logger

import (
	"io"
	"log/slog"
)

// New writes JSON records to the supplied output.
func New(output io.Writer, level slog.Level) *slog.Logger {
	return slog.New(slog.NewJSONHandler(output, &slog.HandlerOptions{Level: level}))
}
