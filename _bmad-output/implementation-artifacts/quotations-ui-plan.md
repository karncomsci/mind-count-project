# Sales quotations frontend

PATH B; codex-only. The user's new request authorizes a quotations frontend feature after Phase 0. It does not initiate the previous authentication phase or add a Go business module.

## Scope and acceptance

- Thai sales navigation, quotation list, and create/edit document screen based on the two supplied references.
- Sample customers, products and quotations; browser-local persistence clearly identified as demo data. No backend contract/schema changes.
- Search, status filtering, pagination, empty state, opening a document, adding/removing lines, customer selection, validation, save, print, and totals for included/excluded VAT, discounts and withholding.
- Vue SFC sections receive typed props and emit updates; page-level composables orchestrate; Pinia owns saved records; pure functions own arithmetic; Zod owns validation; browser storage has a dedicated adapter.
- Preserve existing services and ports. Verify unit arithmetic/validation/storage, lint, strict typecheck, build, browser create/save/reload/edit/filter, and narrow screens.

## Sample calculation convention

This is a UI demo, not accounting or tax policy. Round to integer satang per line; apply line percentage discounts, then allocate document amount discount proportionally; calculate each line's VAT and withholding after discount. VAT-inclusive prices extract VAT from the discounted price. Rates are explicit editable sample choices.

## Boundaries

Layout owns navigation. QuotationList owns list interaction. QuotationEditor orchestrates customer/document/items/notes/totals sections. New and [id] pages only select mode. No database persistence, real signatures, external share delivery, or upload service is implied.
