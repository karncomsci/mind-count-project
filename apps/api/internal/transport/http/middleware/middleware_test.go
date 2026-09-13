package middleware

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRecoveryUsesErrorEnvelope(t *testing.T) {
	log := slog.New(slog.NewJSONHandler(io.Discard, nil))
	h := RequestID(Logger(log)(Recover(log)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) { panic("secret") }))))
	w := httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest("GET", "/", nil))
	if w.Code != 500 || strings.Contains(w.Body.String(), "secret") {
		t.Fatalf("unsafe panic response: %d %s", w.Code, w.Body.String())
	}
	var envelope map[string]map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &envelope); err != nil {
		t.Fatal(err)
	}
	if envelope["error"]["requestId"] != w.Header().Get("X-Request-Id") {
		t.Fatal("request ID mismatch")
	}
}

func TestCORS(t *testing.T) {
	h := RequestID(CORS([]string{"http://localhost:3000"})(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(200) })))
	for _, tc := range []struct {
		name, origin, requestedMethod, requestedHeaders string
		status                                          int
	}{
		{"same origin", "", "", "", 200},
		{"permitted", "http://localhost:3000", "POST", "Content-Type", 204},
		{"forbidden origin", "https://attacker.example", "POST", "", 403},
		{"forbidden method", "http://localhost:3000", "DELETE", "", 403},
		{"forbidden header", "http://localhost:3000", "POST", "X-Admin", 403},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest("OPTIONS", "/", nil)
			r.Header.Set("Origin", tc.origin)
			r.Header.Set("Access-Control-Request-Method", tc.requestedMethod)
			r.Header.Set("Access-Control-Request-Headers", tc.requestedHeaders)
			w := httptest.NewRecorder()
			h.ServeHTTP(w, r)
			if w.Code != tc.status {
				t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
			}
			if tc.status == 204 && w.Header().Get("Access-Control-Allow-Origin") != tc.origin {
				t.Fatal("missing explicit origin")
			}
		})
	}
}

func TestRateLimitCannotBeBypassedByForwardedHeaders(t *testing.T) {
	h := RequestID(RateLimit(1, 1, 2)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(200) })))
	for i, want := range []int{200, 429} {
		r := httptest.NewRequest("GET", "/resource", nil)
		r.RemoteAddr = "192.0.2.1:1234"
		r.Header.Set("X-Forwarded-For", []string{"1.1.1.1", "2.2.2.2"}[i])
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		if w.Code != want {
			t.Fatalf("request %d: status=%d", i, w.Code)
		}
	}
	r := httptest.NewRequest("GET", "/health/live", nil)
	r.RemoteAddr = "192.0.2.1:1234"
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 200 {
		t.Fatal("health probe throttled")
	}
}
