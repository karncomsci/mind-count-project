package config

import (
	"strings"
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	tests := []struct {
		name      string
		env       map[string]string
		wantError string
	}{
		{"missing database", nil, "DATABASE_URL"},
		{"invalid database", map[string]string{"DATABASE_URL": "garbage"}, "DATABASE_URL"},
		{"invalid integer", map[string]string{"DATABASE_URL": "postgres://u:p@localhost/db", "DB_MAX_CONNS": "many"}, "DB_MAX_CONNS"},
		{"zero timeout", map[string]string{"DATABASE_URL": "postgres://u:p@localhost/db", "HTTP_WRITE_TIMEOUT": "0s"}, "HTTP_WRITE_TIMEOUT"},
		{"invalid origin", map[string]string{"DATABASE_URL": "postgres://u:p@localhost/db", "CORS_ALLOWED_ORIGINS": "*"}, "CORS_ALLOWED_ORIGINS"},
		{"invalid log level", map[string]string{"DATABASE_URL": "postgres://u:p@localhost/db", "LOG_LEVEL": "verbose"}, "LOG_LEVEL"},
		{"valid defaults", map[string]string{"DATABASE_URL": "postgres://u:p@localhost/db"}, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg, err := load(func(key string) string { return tt.env[key] })
			if tt.wantError != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantError) {
					t.Fatalf("want %s error, got %v", tt.wantError, err)
				}
				if strings.Contains(err.Error(), "u:p") {
					t.Fatal("configuration error exposed credentials")
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if cfg.DBMaxConns != 10 || cfg.ReadinessTimeout != 2*time.Second {
				t.Fatalf("unexpected defaults: max=%d timeout=%s", cfg.DBMaxConns, cfg.ReadinessTimeout)
			}
		})
	}
}
