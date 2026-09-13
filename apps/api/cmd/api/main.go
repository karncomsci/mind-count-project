// Command api starts the Mind Count HTTP API.
package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"mind-count/apps/api/internal/bootstrap"
	"mind-count/apps/api/internal/platform/config"
	"mind-count/apps/api/internal/platform/logger"
)

func main() {
	if err := run(); err != nil {
		_, _ = fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	log := logger.New(os.Stdout, cfg.LogLevel)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	container, err := bootstrap.NewContainer(ctx, cfg, log)
	if err != nil {
		return err
	}
	defer container.Close()
	return bootstrap.Run(ctx, cfg, log, container.Handler)
}
