# Sales document tables, leave confirmation and durable billing — 2026-09-13

PATH: C
REASON: User expanded the table task to all seven sales menus and explicitly requested billing backend/database persistence.
EVIDENCE: Existing quotation/billing editors and five placeholder routes; new generated API contract, billing module and Goose migration.
MODEL ROUTE: codex-only

## Accepted scope

- Work on feature/billing-notes-table from develop; review/test, PR, merge into develop, and finish on develop. Main remains the release branch.
- All seven menus share nine table columns and the search/date-filter component. Quote and billing lists retain real interactions; five remaining menus have empty tables and no new editor forms.
- Billing filters ordinary/consolidated documents; displays at most 250 matches; includes pagination, sorting, selection, CSV, printing, status and soft delete/restore.
- Latest explicit status decision overrides the example HTML: draft / waiting / billed / cancelled; legacy documents default to draft.
- Both existing editors use the three-action leave dialog. Native browser confirmation remains for tab close/refresh.
- Billing documents, project and warehouse catalogs persist in PostgreSQL through the typed API/BFF. Quotation storage remains unchanged.
- Import legacy data without overwriting or deleting the original before successful import and backup.

## Design

Contract-first generated DTOs, domain validation, service-owned transactions and sqlc adapter. Separate JSONB entity rows with uniqueness indexes; version checks prevent lost updates. A transaction-scoped advisory lock serializes number allocation and writes for the single development workspace. API and database operations are bounded. No new auth/tenant subsystem, downstream document issuing or production deployment.

## Red proof

- New list unit tests initially failed because services/list.ts did not exist.
- New custom leave-dialog browser tests failed against the prior production build on port 3002.
- Backend domain tests initially failed to compile with missing ValidateDraft/NewService/domain errors.
- Real browser/API test exposed active deletedAt being serialized as an empty string by the generated DTO. Updated OpenAPI 3.1 to type [string, null], regenerated, and added an HTTP integration assertion for null.

## Verification

Final results are recorded below. Runtime artifacts stay under _wrx-output/.

### Final local checks

- Web lint and Nuxt typecheck: pass.
- Vitest: 31 tests pass (including failed API writes and partial import preserving originals).
- Go lint: 0 issues; `go test -race ./...`: pass.
- PostgreSQL 18 integration with race detector: pass, including nullable response DTOs.
- `pnpm check:generated`: pass; generated Go/sqlc/TypeScript match sources.
- Docker API/web production builds: pass; migration applied locally; API/web/PostgreSQL healthy.
- Playwright against production Docker at http://127.0.0.1:33000: **21 passed**, including real BFF → Go → PostgreSQL persistence across separate browser contexts and stale-save refusal.
- `git diff --check`: pass. `.env` and `.env.example` remain ignored and untracked.

### Final review

No unresolved blocking findings in the reviewed scope. Reviewed async save completion, route-leave cancellation, soft deletion, optimistic version checks, transaction rollback/numbering, DTO nullability, CSV formula escaping and legacy import/backup ordering. Concurrent browser edits during import retain the active legacy key for another import attempt.

Known scope limits: authentication/tenancy are not implemented; quotations retain browser storage; five other menus have shared empty tables but no new editors; consolidated billing creation and downstream invoice/receipt issuing are outside this change. API lists currently load the development workspace before client filtering/pagination.
