// Package middleware implements transport-wide HTTP policies.
package middleware

import (
	"context"
	"net/http"

	"mind-count/apps/api/internal/platform/id"
)

type requestIDKey struct{}

// RequestID generates trusted IDs instead of accepting client-controlled log values.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		value, err := id.New()
		if err != nil {
			panic("request ID entropy source unavailable")
		}
		requestID := value.String()
		w.Header().Set("X-Request-Id", requestID)
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestIDKey{}, requestID)))
	})
}

// ID retrieves the trusted correlation ID for structured logs.
func ID(ctx context.Context) string { value, _ := ctx.Value(requestIDKey{}).(string); return value }
