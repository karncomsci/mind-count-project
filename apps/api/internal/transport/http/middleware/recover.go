package middleware

import (
	"context"
	"log/slog"
	"net/http"

	"mind-count/apps/api/internal/transport/http/httperr"
)

// Recover contains handler panics without returning panic payloads to clients or logs.
func Recover(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func(ctx context.Context) {
				if recovered := recover(); recovered != nil {
					if recovered == http.ErrAbortHandler {
						panic(recovered)
					}
					log.ErrorContext(ctx, "http handler panic", "request_id", ID(ctx))
					if writer, ok := w.(interface{ Status() int }); ok && writer.Status() != 0 {
						panic(http.ErrAbortHandler)
					}
					httperr.Write(w, r, &httperr.Error{Status: 500, Code: "internal_error", Message: "An internal error occurred"})
				}
			}(r.Context())
			next.ServeHTTP(w, r)
		})
	}
}
