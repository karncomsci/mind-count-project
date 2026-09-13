# Billing notes UI — 2026-09-13

PATH: B
REASON: Add a frontend document workflow using the existing quotation patterns.
EVIDENCE: The billing-notes route is a placeholder; five user screenshots specify the editor and project/warehouse dialogs.
MODEL ROUTE: codex-only

## Scope

- Branch: feature/billing-notes from origin/develop; PR target develop. The user explicitly requested merging into develop and returning the local checkout to develop after verification; main remains unchanged.
- Billing list, create, edit, BL numbering, validation, and browser persistence isolated from quotations.
- Customer, date/credit/due date, salesperson, currency, project, reference, price mode, description, warehouse, editable lines, discounts, VAT, withholding, notes, signature spaces, and attachments.
- Project/warehouse menus with create dialogs, required-field validation, cancellation, automatic selection, and catalog persistence.
- Print, PDF download, and share a document summary without exposing internal notes or a nonportable local URL.
- Reuse the existing document fields and integer-satang calculations through explicit public exports; preserve quotation defaults.
- Scope assumes browser persistence, matching the existing quotation UI. No backend or tax/legal compliance claim.

## Acceptance and verification

- 20,000 exclusive price, 7% VAT, 3% withholding gives total 21,400 and payable 20,800.
- Create/edit/reload preserves billing details and catalogs; BL numbering does not use QT records.
- Missing/invalid documents and storage failures are visible and do not overwrite unreadable data.
- Unit coverage for numbering, validation, persistence, calculations, and PDF title; Playwright coverage for dialogs, totals, save/reload, print, attachments, and mobile layout.
- Run frontend lint, typecheck, unit tests, relevant browser regressions, and production build. No backend changes: Go integration checks are not applicable.
- Runtime evidence and reference copies: _wrx-output/evidence/billing-notes/.

## Implementation review and results

- Implemented the list/create/edit routes, catalog dialogs, browser persistence, attachments, Thai PDF, print, copyable share summary, and optional signature spaces.
- Quotation components and calculations are reused through public entry points with backward-compatible output options. Billing-specific geometry is isolated in billing-notes.css.
- Fixed native dialog focus restoration after a failing mobile keyboard test; regression now passes. Fixed percentage row-gap overflow discovered during mobile screenshot review.
- Browser tests explicitly wait for editor readiness before typing. The existing quotation credit test received the same readiness assertion after exposing a hydration race; its behavior assertions are unchanged.
- Frontend lint and TypeScript: passed.
- Vitest: 26 tests passed, including 8 billing tests.
- Chromium development server: 11 billing/quotation tests passed.
- Production build: passed. Chromium production server: all 5 billing tests passed, including mobile footer/totals bounds and a real PDF download.
- Reviewed desktop/mobile and dialog screenshots. Environment files and runtime evidence remain ignored.
- Backend integration checks are not applicable; no backend or generated API contract changes were made.
