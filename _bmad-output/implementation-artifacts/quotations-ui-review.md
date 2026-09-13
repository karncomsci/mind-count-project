# Quotation frontend review

PATH: B
REASON: Multi-file user-facing feature with financial demo calculations and responsive forms.
EVIDENCE: `apps/web/app/features/quotations`, sales navigation/layouts/routes, unit and browser tests.
MODEL ROUTE: codex-only.

## Delivered scope

- Sales documents parent menu and quotations child menu; list, create and edit routes.
- Light white/gray template, cyan headers, green primary actions, thin separators. Removed summary cards and repeated notices following the user's design feedback.
- Typed Vue sections for customer, document, details, line items, notes and totals. Composable owns draft lifecycle; Pinia owns saved records; Zod validates; pure services calculate/export/persist.
- Demo customer/product suggestions, 8 sample quotations, search/status/date sort/pagination/selection/CSV.
- Save/reload/edit using validated localStorage, native print/PDF excluding internal notes, unsaved-change guard, visible save errors.
- README usage/tools and architecture guide updated. No new API contract, database schema, or Go business module.

## Browser findings and fixes

Initial red evidence: `_wrx-output/evidence/quotations-e2e-red.log`. On a cold development page, clicking before hydration produced no submit/menu event. A separate mobile inspection showed document scroll width 997px at a 390px viewport: absolutely positioned screen-reader labels inside the wide table escaped the scroll container.

Fixes: gate interaction until mounted with `inert` and disabled submit/menu buttons; keep closed mobile navigation invisible to keyboard/accessibility navigation; position table scroll wrappers relatively to contain screen-reader labels. Mobile regression verifies no root overflow and closed-menu visibility. API readiness initially failed because the Compose services were stopped; restarting existing services resolved it.

## Verification

- Frontend lint: passed, no issues.
- Vitest: 10 tests passed (money rounding/discount/tax, validation, dates/numbers, storage, existing API errors).
- Development browser E2E: 3 tests passed (create/calculate/save/reload/edit/print privacy, mobile navigation/overflow, readiness proxy).
- Final production build/typecheck and production browser verification are recorded in `_wrx-output/evidence/quotations-final-verification.md`.

## Practical limits

Data remains local to a browser origin and is demo data. Sample status values do not represent an approval workflow. No authentication, real signature, upload service, external sharing, or database persistence. Backend must validate and recalculate totals when API integration is implemented. Multiple browser tabs are not a collaborative editing mechanism.
