# Phase 0 — Skeleton and infrastructure

Source: `Instruction/Markdown.md`. Route C; runtime profile codex-only.

## Scope

Create the complete requested monorepo tree. Implement infrastructure, health contracts, Go transport, transaction context handling, Nuxt shell, reproducible generators, Compose, and sequential CI gates. Module and feature files reserved for Phase 1 contain explicit scope comments, not speculative business abstractions. No users/sessions tables or authentication implementation in this phase.

## Acceptance and verification plan

1. Write the OpenAPI 3.1 health/error contract and infrastructure tests before implementation.
2. Verify configuration fails on missing/invalid required settings.
3. Verify live/ready semantics, request IDs, error envelopes, recovery, CORS, and rate limiting.
4. Verify transaction commit, rollback, context injection, cancellation, and nested transaction rejection with PostgreSQL 18 testcontainers.
5. Run Go lint/test/build; Nuxt lint/typecheck/unit/build; repeat generators and compare exact output.
6. Validate Compose and run the three-service smoke test when Docker is available.

## Environment baseline

The workspace initially contained only the instruction file and had no Git repository. Node v25.6.1 is present; Go, pnpm, Docker, sqlc, Goose and golangci-lint are absent from PATH. Downloaded verification tools and evidence stay under `_wrx-output/`. Docker-dependent acceptance must remain explicitly unverified if no daemon is available.

## Phase boundary

Stop after Phase 0 and request the confirmation required by the source instructions before starting Phase 1. Final delivery includes a full-path, full-content file listing artifact.

## Completion

Phase 0 completed and verified locally. See phase-0-review.md for the acceptance matrix, evidence paths and running service URLs. The user-requested Thai tools/setup guide is in README.md. Go 1.25.14 is global and its project-local distribution has been removed. Phase 1 has not started.
