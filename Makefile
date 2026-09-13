SHELL := /bin/sh
PNPM ?= pnpm
GO ?= go
SQLC ?= sqlc
OAPI_CODEGEN ?= oapi-codegen
GOLANGCI_LINT ?= golangci-lint
COMPOSE ?= docker compose
export GOTOOLCHAIN := local

.PHONY: dev down migrate-up migrate-down migrate-create generate generate-sqlc lint typecheck test test-integration seed build tools

dev:
	$(COMPOSE) up --build --detach --wait

down:
	$(COMPOSE) down

migrate-up:
	$(COMPOSE) run --rm api /app/migrate up

migrate-down:
	$(COMPOSE) run --rm api /app/migrate down

migrate-create:
	$(PNPM) exec node scripts/migrate-create.mjs "$(name)"

generate: generate-sqlc
	$(OAPI_CODEGEN) -config contracts/openapi/oapi-codegen.yaml contracts/openapi/openapi.yaml
	$(PNPM) generate:ts

generate-sqlc:
	cd apps/api && $(SQLC) generate

lint:
	cd apps/api && $(GOLANGCI_LINT) run
	$(PNPM) lint

typecheck:
	$(PNPM) typecheck

test:
	cd apps/api && $(GO) test -race ./...
	$(PNPM) test

test-integration:
	cd apps/api && $(GO) test -race -tags=integration -timeout=5m ./tests/integration/...

seed:
	$(COMPOSE) run --rm api /app/migrate seed

build:
	cd apps/api && $(GO) build ./cmd/api ./cmd/migrate
	$(PNPM) build

tools:
	$(GO) install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.30.0
	$(GO) install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.8.0
	$(GO) install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.5.0
