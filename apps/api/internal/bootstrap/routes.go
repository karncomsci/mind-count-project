package bootstrap

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"mind-count/apps/api/internal/platform/config"
	"mind-count/apps/api/internal/transport/http/httperr"
	"mind-count/apps/api/internal/transport/http/middleware"
	"mind-count/apps/api/internal/transport/http/openapi"
)

// Pinger is the readiness handler's narrow database dependency.
type Pinger interface{ Ping(context.Context) error }
type healthHandler struct {
	database Pinger
	timeout  time.Duration
}

func (h *healthHandler) GetLiveness(w http.ResponseWriter, _ *http.Request) { writeHealth(w) }
func (h *healthHandler) GetReadiness(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), h.timeout)
	defer cancel()
	if err := h.database.Ping(ctx); err != nil {
		httperr.Write(w, r, &httperr.Error{Status: 503, Code: "not_ready", Message: "Service is not ready"})
		return
	}
	writeHealth(w)
}

func writeHealth(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(openapi.Health{Status: openapi.Ok})
}

// NewRouter registers generated contract routes and transport policies in one place.
func NewRouter(cfg config.Config, log *slog.Logger, database Pinger) http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.RequestID, middleware.Logger(log), middleware.Recover(log), middleware.CORS(cfg.CORSAllowedOrigins), middleware.RateLimit(cfg.RateLimitRPS, cfg.RateLimitBurst, cfg.RateLimitMaxClients))
	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		httperr.Write(w, r, &httperr.Error{Status: 404, Code: "not_found", Message: "Route not found"})
	})
	router.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		httperr.Write(w, r, &httperr.Error{Status: 405, Code: "method_not_allowed", Message: "Method not allowed"})
	})
	return openapi.HandlerFromMux(&healthHandler{database: database, timeout: cfg.ReadinessTimeout}, router)
}
