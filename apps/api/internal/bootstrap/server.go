package bootstrap

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"mind-count/apps/api/internal/platform/config"
)

// Run starts the HTTP server and drains requests when the signal context is canceled.
func Run(ctx context.Context, cfg config.Config, log *slog.Logger, handler http.Handler) error {
	server := &http.Server{Addr: cfg.HTTPAddr, Handler: handler, ReadTimeout: cfg.HTTPReadTimeout, ReadHeaderTimeout: cfg.HTTPReadHeaderTimeout, WriteTimeout: cfg.HTTPWriteTimeout, IdleTimeout: cfg.HTTPIdleTimeout, MaxHeaderBytes: 1 << 20, ErrorLog: slog.NewLogLogger(log.Handler(), slog.LevelError)}
	result := make(chan error, 1)
	go func() { result <- server.ListenAndServe() }()
	log.InfoContext(ctx, "http server starting", "address", cfg.HTTPAddr)
	select {
	case err := <-result:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), cfg.ShutdownTimeout)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			return errors.Join(err, server.Close())
		}
		if err := <-result; err != nil && !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		log.InfoContext(shutdownCtx, "http server stopped")
		return nil
	}
}
