# Billing notes and sales document lists

Billing documents, projects and warehouses now persist through the Nuxt same-origin BFF, Go billing service and PostgreSQL. Quotations retain their existing browser storage. The other five sales document menus have the shared empty list/table; their editors and persistence workflows are not implemented by this change.

## Shared UI

`components/sales/SalesDocumentTable.vue` renders nine columns for all seven sales menus: selection, date, document number, customer/project, due date, VAT-inclusive total, currency, status and actions. Feature wrappers supply document-specific status and action menus. Existing quotation PDF, print, share, duplicate and deletion actions remain available.

`SalesListSearch.vue` provides query, status and date filters, including custom ranges and fiscal-year start selection. Quotation and billing lists sort the matching data before pagination and display up to 250 records. Billing additionally filters ordinary/consolidated documents, exports Excel-compatible UTF-8 CSV, prints selected documents and supports soft deletion/restoration. Creating consolidated documents is not part of this change.

Billing statuses are **draft / waiting / billed / cancelled**, displayed as **ร่าง / รอวางบิล / วางบิลแล้ว / ยกเลิก**. New and legacy records default to draft. Status changes do not create invoices or receipts.

`useDocumentLeave` and `DocumentLeaveDialog` protect both existing document editors on route leave/update. Cancel, close X and Escape retain the form. Discard leaves without saving. Save-and-close awaits persistence and retains the draft on validation, connectivity or version-conflict failures. Browser refresh/tab close use the browser's native confirmation because an application dialog cannot block browser shutdown.

## Contract and persistence

- Contract: `contracts/openapi/openapi.yaml`; regenerate Go/TypeScript/sqlc via `make generate`.
- `GET /api/v1/billing`: workspace documents and catalogs, including recoverable deleted records.
- `POST /api/v1/billing`: one `save`, `status`, `delete`, `restore`, `project`, `warehouse` or `import` command. Editing an existing document requires its last-read version; stale commands return HTTP 409.
- Nuxt `server/api/v1/billing.ts` is a bounded, fixed-upstream proxy, with no mutation retries or business logic. It rejects cross-origin browser writes and bodies exceeding 4 MiB.
- Go `modules/billing`: domain types/validation, service and repository interface, plus separate `http` and `postgres` adapters. Transport DTOs map domain values; sqlc models never leave the adapter.
- Goose migration `20260913150000_billing_documents.sql` adds independent JSONB rows for documents and catalog entries, plus unique indexes for document numbers, catalog names and warehouse codes.
- Commands use `TxManager.WithinTx` and an advisory transaction lock. Number allocation includes imported numbers and soft-deleted documents. The lock is appropriate for the current single development workspace; tenant-scoped locking, authentication and server-side list pagination remain future work.
- The backend validates date/credit relationships, line amounts/discount limits, status, catalog fields and attachment byte lengths. Totals remain derived by the shared integer-satang calculation code; clients cannot submit a stored payable/total override.

This is the existing single-workspace development application. Authentication and tenant isolation are not yet implemented; this change does not deploy a public production service.

## Existing browser data

The list shows **นำเข้าข้อมูลเดิม** when `mind-count:billing-notes:demo:v1` exists. Import sends catalogs and records through the API. Record IDs are preserved and retries do not overwrite an already imported document. Catalog name/code or document-number collisions are reported rather than overwritten. A partial import can be retried.

Only after every command succeeds does the browser copy the original payload to `mind-count:billing-notes:demo:v1:backup` and remove the active legacy key. If reading, importing or making the backup fails, the original remains available. Corrupt browser data does not overwrite PostgreSQL.

PNG/JPG/PDF attachments retain their limits: three files, 1 MiB each and 1.5 MiB combined. They now persist inside the document payload in PostgreSQL. They are not automatically added to print/PDF outputs. Internal notes stay out of public PDF/print/share output. The signature option renders signing spaces, without signature capture or verification.

## Run and verify

With the project's local `.env` configured (ignored by Git):

```sh
docker compose build api web
docker compose run --rm api /app/migrate up
docker compose up -d --wait
make test
make test-integration
pnpm test:e2e
```

Integration tests run against a disposable PostgreSQL 18 container and cover migrations, concurrent numbering, durable reads, attachments, version conflicts, catalog uniqueness, import and deletion/restoration. Browser tests use isolated API fixtures for UI interactions; `billing-backend.spec.ts` traverses the real BFF/API/database and verifies persistence in a second browser context and stale save-and-close behavior. It soft-deletes its uniquely named test document afterwards; test catalog entries remain distinguishable by their `E2E-` names.

Plan and verification: `_bmad-output/implementation-artifacts/billing-notes-table.md`. Runtime evidence: `_wrx-output/evidence/billing-notes-table/`.
