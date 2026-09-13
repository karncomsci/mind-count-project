package bootstrap

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http/httptest"
	"testing"
	"time"

	"mind-count/apps/api/internal/platform/config"
)

type fakePinger struct {
	err   error
	calls int
}

func (p *fakePinger) Ping(ctx context.Context) error {
	p.calls++
	if _, ok := ctx.Deadline(); !ok {
		return errors.New("missing deadline")
	}
	return p.err
}

func TestHealthAndTransportContract(t *testing.T) {
	for _, tc := range []struct {
		name, method, path string
		dbError            error
		status, pings      int
	}{
		{"live without database", "GET", "/health/live", errors.New("database down"), 200, 0},
		{"ready", "GET", "/health/ready", nil, 200, 1},
		{"not ready", "GET", "/health/ready", errors.New("private database failure"), 503, 1},
		{"not found", "GET", "/unknown", nil, 404, 0},
		{"method not allowed", "POST", "/health/live", nil, 405, 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p := &fakePinger{err: tc.dbError}
			cfg := config.Config{ReadinessTimeout: time.Second, RateLimitRPS: 10, RateLimitBurst: 20, RateLimitMaxClients: 100}
			handler := NewRouter(cfg, slog.New(slog.NewJSONHandler(io.Discard, nil)), p)
			w := httptest.NewRecorder()
			handler.ServeHTTP(w, httptest.NewRequest(tc.method, tc.path, nil))
			if w.Code != tc.status {
				t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
			}
			if w.Header().Get("X-Request-Id") == "" {
				t.Fatal("missing request ID")
			}
			if p.calls != tc.pings {
				t.Fatalf("ping calls=%d", p.calls)
			}
			if tc.status >= 400 {
				var body struct {
					Error struct {
						Code      string
						Message   string
						Details   map[string]any
						RequestID string `json:"requestId"`
					}
				}
				if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
					t.Fatal(err)
				}
				if body.Error.Code == "" || body.Error.Message == "" || body.Error.Details == nil || body.Error.RequestID != w.Header().Get("X-Request-Id") {
					t.Fatalf("invalid error envelope: %s", w.Body.String())
				}
				if body.Error.Message == "private database failure" {
					t.Fatal("leaked internal failure")
				}
			}
		})
	}
}
