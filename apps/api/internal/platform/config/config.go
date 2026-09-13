// Package config loads and validates process configuration once at startup.
package config

import (
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config contains validated runtime settings. Do not log this value: it holds a DSN.
type Config struct {
	DatabaseURL           string
	HTTPAddr              string
	LogLevel              slog.Level
	DBMaxConns            int32
	DBMaxConnLifetime     time.Duration
	DBHealthCheckPeriod   time.Duration
	DBConnectTimeout      time.Duration
	DBOperationTimeout    time.Duration
	HTTPReadTimeout       time.Duration
	HTTPReadHeaderTimeout time.Duration
	HTTPWriteTimeout      time.Duration
	HTTPIdleTimeout       time.Duration
	ShutdownTimeout       time.Duration
	ReadinessTimeout      time.Duration
	MigrationTimeout      time.Duration
	CORSAllowedOrigins    []string
	RateLimitRPS          int
	RateLimitBurst        int
	RateLimitMaxClients   int
}

// Load reads environment variables. The composition root calls it once.
func Load() (Config, error) { return load(os.Getenv) }

func load(getenv func(string) string) (Config, error) {
	var cfg Config
	var problems []error
	value := func(key, fallback string) string {
		if v := strings.TrimSpace(getenv(key)); v != "" {
			return v
		}
		return fallback
	}
	positiveInt := func(key, fallback string) int {
		v, err := strconv.ParseInt(value(key, fallback), 10, 32)
		if err != nil || v <= 0 {
			problems = append(problems, fmt.Errorf("%s must be a positive 32-bit integer", key))
			return 0
		}
		return int(v)
	}
	duration := func(key, fallback string) time.Duration {
		v, err := time.ParseDuration(value(key, fallback))
		if err != nil || v <= 0 {
			problems = append(problems, fmt.Errorf("%s must be a positive duration", key))
			return 0
		}
		return v
	}
	cfg.DatabaseURL = value("DATABASE_URL", "")
	dsn, err := url.Parse(cfg.DatabaseURL)
	if err != nil || dsn == nil || (dsn.Scheme != "postgres" && dsn.Scheme != "postgresql") || dsn.Hostname() == "" || dsn.Path == "" || dsn.Path == "/" {
		problems = append(problems, errors.New("DATABASE_URL is required and must be a PostgreSQL URL with a host and database"))
	}
	cfg.HTTPAddr = value("HTTP_ADDR", ":8080")
	_, port, err := net.SplitHostPort(cfg.HTTPAddr)
	portNumber, portErr := strconv.Atoi(port)
	if err != nil || portErr != nil || portNumber < 1 || portNumber > 65535 {
		problems = append(problems, errors.New("HTTP_ADDR must contain a host and port in 1..65535"))
	}
	if err := cfg.LogLevel.UnmarshalText([]byte(value("LOG_LEVEL", "info"))); err != nil {
		problems = append(problems, errors.New("LOG_LEVEL must be debug, info, warn or error"))
	}
	cfg.DBMaxConns = int32(positiveInt("DB_MAX_CONNS", "10"))
	cfg.DBMaxConnLifetime = duration("DB_MAX_CONN_LIFETIME", "30m")
	cfg.DBHealthCheckPeriod = duration("DB_HEALTH_CHECK_PERIOD", "30s")
	cfg.DBConnectTimeout = duration("DB_CONNECT_TIMEOUT", "5s")
	cfg.DBOperationTimeout = duration("DB_OPERATION_TIMEOUT", "5s")
	cfg.HTTPReadTimeout = duration("HTTP_READ_TIMEOUT", "10s")
	cfg.HTTPReadHeaderTimeout = duration("HTTP_READ_HEADER_TIMEOUT", "5s")
	cfg.HTTPWriteTimeout = duration("HTTP_WRITE_TIMEOUT", "15s")
	cfg.HTTPIdleTimeout = duration("HTTP_IDLE_TIMEOUT", "60s")
	cfg.ShutdownTimeout = duration("SHUTDOWN_TIMEOUT", "10s")
	cfg.ReadinessTimeout = duration("READINESS_TIMEOUT", "2s")
	cfg.MigrationTimeout = duration("MIGRATION_TIMEOUT", "2m")
	cfg.RateLimitRPS = positiveInt("RATE_LIMIT_RPS", "20")
	cfg.RateLimitBurst = positiveInt("RATE_LIMIT_BURST", "40")
	cfg.RateLimitMaxClients = positiveInt("RATE_LIMIT_MAX_CLIENTS", "10000")
	for _, origin := range strings.Split(value("CORS_ALLOWED_ORIGINS", "http://localhost:3000"), ",") {
		origin = strings.TrimSpace(origin)
		u, err := url.Parse(origin)
		if err != nil || u == nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.User != nil || u.Path != "" || u.RawQuery != "" || u.Fragment != "" {
			problems = append(problems, errors.New("CORS_ALLOWED_ORIGINS must contain explicit HTTP(S) origins without paths"))
			continue
		}
		cfg.CORSAllowedOrigins = append(cfg.CORSAllowedOrigins, origin)
	}
	if cfg.ReadinessTimeout >= cfg.HTTPWriteTimeout {
		problems = append(problems, errors.New("READINESS_TIMEOUT must be shorter than HTTP_WRITE_TIMEOUT"))
	}
	return cfg, errors.Join(problems...)
}
