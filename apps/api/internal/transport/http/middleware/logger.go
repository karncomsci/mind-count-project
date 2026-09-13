package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

// Logger records metadata only; credentials, bodies, cookies and query strings are excluded.
func Logger(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			started := time.Now()
			wrapped := chimiddleware.NewWrapResponseWriter(w, r.ProtoMajor)
			defer func(ctx context.Context) {
				status := wrapped.Status()
				if status == 0 {
					status = http.StatusOK
				}
				log.InfoContext(ctx, "http request", "request_id", ID(ctx), "method", r.Method, "path", r.URL.Path, "status", status, "bytes", wrapped.BytesWritten(), "duration_ms", time.Since(started).Milliseconds())
			}(r.Context())
			next.ServeHTTP(wrapped, r)
		})
	}
}
