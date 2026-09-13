# Billing notes frontend

The billing feature implements the supplied document-editor and project/warehouse-dialog references using the existing Nuxt/Vue document patterns. It is a browser-local demonstration, not an API-backed billing or approval subsystem.

## Routes and modules

- `/sales/billing-notes`: search and open saved documents.
- `/sales/billing-notes/new`: create a document.
- `/sales/billing-notes/:id`: edit a saved document; unknown IDs display a not-found state.
- `apps/web/app/features/billing-notes/components`: list/editor, catalog selection, project/warehouse dialogs, attachment controls.
- `composables/useBillingEditor.ts`: draft lifecycle, validation, computed totals, and save/leave behavior.
- `model.ts`: validated document/catalog/attachment shapes and independent BL numbering.
- `stores/billing-notes.ts` and `services/storage.ts`: persist documents and catalogs in a single validated snapshot under `mind-count:billing-notes:demo:v1`.

Quotation fields, integer-satang calculations, and output primitives are reused through the public `quotations` entry points, `quotations/model.ts`, and `quotations/documents.ts`. No generated contract, Go module, or database migration changes are needed. Optional print/PDF titles and signature spaces preserve the quotation defaults. The billing item table displays the pre-VAT line amount for exclusive pricing, plus the withholding amount.

## Persistence and interaction

Read local storage only after mount. Validate complete snapshots on read/write, persist before publishing state, and reread the latest snapshot before saving to retain documents created by another tab. Storage errors remain visible; unreadable snapshots are not silently replaced. Simultaneous edits to the same document are not a collaborative editing feature.

Required project names and warehouse names/purposes are validated; optional warehouse postal codes and emails are validated when supplied. Project names and warehouse names/codes are checked for duplicates. Catalog saves immediately select the new entry. Cancel/Escape dismiss without saving, and the shared native dialog restores focus to its opener.

PNG/JPG/PDF attachments are stored as validated data URLs, with three files maximum, 1 MiB per file, and 1.5 MiB combined. Storage quota failures leave the unsaved draft visible. Attachments are for local reference and are not automatically included in outgoing documents. Signature checkboxes control blank signing/stamp spaces, not electronic signature capture or verification.

Print/PDF output excludes internal notes. Share provides a copyable customer-facing summary rather than a local document URL that another browser cannot open. No production deployment or cross-device synchronization is implied.

## Validation

Unit coverage: reference totals, date-based BL numbering, document/catalog validation, attachment URLs, storage isolation/corruption/quota failures, duplicate catalogs, and billing/quotation PDF title separation.

Browser coverage: create project/warehouse, save/edit/reload, line and summary totals, real PDF download, attachments, share/print boundaries, mobile layout, keyboard cancellation/focus, unreadable storage, and missing IDs. Run the quotation browser tests as regression coverage for the shared components.

Plan: [billing-notes.md](../../_bmad-output/implementation-artifacts/billing-notes.md). Runtime screenshots, PDF output, and check results are kept under `_wrx-output/evidence/billing-notes/`.
