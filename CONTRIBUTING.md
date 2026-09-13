# Contributing

Work starts from `Instruction/Markdown.md` and the approved phase. Follow spec-first and test-first development; do not add speculative abstractions.

## Mandatory rules

1. Dependencies point bootstrap → HTTP → service → repository interface ← PostgreSQL. Domain/service never import net/http, Chi or pgx.
2. Map domain values to API DTOs; never return database or sqlc structs directly.
3. External calls accept context.Context and use bounded timeouts.
4. Transactions use TxManager.WithinTx and context-injected Executor only.
5. Cross-module dependencies use narrow interfaces declared by the consumer.
6. Never edit generated sqlc, Go OpenAPI or TypeScript contract code manually.
7. Never rewrite merged migrations; create a new migration.
8. Do not create Go packages named utils, common or helpers.
9. Nuxt server code is proxy/BFF only; business logic belongs in Go services.
10. Never commit .env or secrets.

## Naming and reviews

Go packages use short lowercase names; migrations use UTC YYYYMMDDHHMMSS_name.sql; frontend feature imports go through index.ts. Keep module HTTP and PostgreSQL subpackages separate. Use descriptive commit subjects focused on behavior.

Before a PR: verify scope and path routing, update contract first, generate output, run make lint/typecheck/test/test-integration and pnpm check:generated, include runtime evidence, review migrations and secrets, and document any check that could not run. Preserve unrelated changes. No third module before Phase 1 review passes.

Architecture ADRs and the extended onboarding guide are completed in Phase 2. See README.md for the current runnable setup guide.
