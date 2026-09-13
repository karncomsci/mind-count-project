package middleware

import (
	"net/http"
	"strings"

	"mind-count/apps/api/internal/transport/http/httperr"
)

// CORS permits configured origins only and rejects unsafe cross-origin calls.
func CORS(origins []string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(origins))
	for _, origin := range origins {
		allowed[origin] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Vary", "Origin")
			origin := r.Header.Get("Origin")
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}
			if !allowed[origin] {
				httperr.Write(w, r, &httperr.Error{Status: 403, Code: "origin_forbidden", Message: "Origin is not allowed"})
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Expose-Headers", "X-Request-Id, Retry-After")
			if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != "" {
				w.Header().Add("Vary", "Access-Control-Request-Method")
				w.Header().Add("Vary", "Access-Control-Request-Headers")
				method := r.Header.Get("Access-Control-Request-Method")
				if method != "GET" && method != "POST" && method != "OPTIONS" {
					httperr.Write(w, r, &httperr.Error{Status: 403, Code: "cors_forbidden", Message: "Method is not allowed"})
					return
				}
				for _, header := range strings.Split(r.Header.Get("Access-Control-Request-Headers"), ",") {
					header = strings.TrimSpace(strings.ToLower(header))
					if header != "" && header != "content-type" && header != "accept" {
						httperr.Write(w, r, &httperr.Error{Status: 403, Code: "cors_forbidden", Message: "Header is not allowed"})
						return
					}
				}
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
				w.Header().Set("Access-Control-Max-Age", "600")
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
