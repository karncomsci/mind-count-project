# Editable credit terms — Path B / codex-only

User request: match reference dropdown (เครดิต (วัน), เงินสด, เครดิต (ไม่แสดงวันที่)) and allow manual due-date editing.

Behavior: days mode accepts any integer 0–365. Changing document date or days recalculates due date; selecting a due date updates day count. Cash has zero days; cash and undated credit hide the due date in both form and print. Returning to days restores a date from the current day count. Existing saved drafts without the new fields load as days mode with the previous computed due date. No API/database change.

Implementation boundaries: document section emits atomic patches, credit field owns dropdown interaction, date service owns synchronized changes, Zod owns defaults/validation. Keep current light theme.

Verification: first reproduce missing mode picker/read-only due date in browser; test date changes, legacy storage, validation, all modes and print, save/reload; lint, strict types, production build and browser regression.

## Completed review

Implemented `QuotationCreditField.vue`, pure `credit-terms.ts`, document section patches, persisted credit mode/due date, Zod legacy defaults, and print behavior. README and architecture guide document the behavior and file ownership. No dependency additions.

Validation passed: ESLint; strict TypeScript; 14 Vitest tests (4 new credit/date/backward-compatibility tests); production Nuxt Docker build; 4 Chromium E2E tests including all credit modes, manual date edits, save/reopen/reload and print content. Additional browser check passed keyboard Escape/focus return, outside-click dismissal and 390px mobile width. Screenshots visually inspected. A reload race in the new test was corrected by waiting for the edit form before reloading.

Evidence: `_wrx-output/evidence/quotation-credit-verification.md`. Production web refreshed at localhost:33000. Backend unchanged; existing browser records remain readable.
