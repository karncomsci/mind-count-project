package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"mind-count/apps/api/internal/transport/http/httperr"
)

type visitor struct {
	limiter *rate.Limiter
	seen    time.Time
}

// RateLimit uses bounded, process-local token buckets keyed by the TCP peer.
// Forwarded IP headers are untrusted. Health probes are exempt. No cleanup goroutine is needed.
func RateLimit(rps, burst, maxClients int) func(http.Handler) http.Handler {
	var mu sync.Mutex
	visitors := make(map[string]*visitor)
	lastSweep := time.Now()
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodGet && (r.URL.Path == "/health/live" || r.URL.Path == "/health/ready") {
				next.ServeHTTP(w, r)
				return
			}
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				ip = r.RemoteAddr
			}
			now := time.Now()
			mu.Lock()
			if now.Sub(lastSweep) >= time.Minute {
				for key, v := range visitors {
					if now.Sub(v.seen) > 3*time.Minute {
						delete(visitors, key)
					}
				}
				lastSweep = now
			}
			v := visitors[ip]
			if v == nil && len(visitors) < maxClients {
				v = &visitor{limiter: rate.NewLimiter(rate.Limit(rps), burst)}
				visitors[ip] = v
			}
			permitted := false
			if v != nil {
				v.seen = now
				permitted = v.limiter.AllowN(now, 1)
			}
			mu.Unlock()
			if !permitted {
				w.Header().Set("Retry-After", "1")
				httperr.Write(w, r, &httperr.Error{Status: 429, Code: "rate_limited", Message: "Too many requests"})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
