# Quotation list actions — Path B / codex-only

Scope: selected-row PDF download / document print / DL envelope print, persisted status changes, row edit/print/share/download/envelope/duplicate/delete. Existing browser-local architecture retained. Native share requires user choice; unsupported browsers offer PDF download. No local-only URL shared as a public document.

Conversion entries in the reference create other document types, not quotation statuses. User clarified: add all seven sales menus first (quotation, billing, invoice, receipt, cash sale, credit note, debit note); details follow later. All seven routes/menu labels provided; six non-quotation pages are explicitly placeholders. Conversion actions remain disabled and labeled unavailable.

Components: reusable accessible dropdown/dialog, quotation status and action menus, share dialog and print batch. Store commits storage before state for status/duplicate/delete. PDF service lazy-loads pdfmake with bundled Sarabun fonts; pure document definition excludes internal notes and paginates long tables. Print uses existing document component and new envelope sheets.

Acceptance: selected actions appear/clear, status survives reload, duplicate has unique number/id and independent draft, delete cancel/confirm, valid Thai multi-document PDF, correct printed selection and envelope recipient, no internal notes in shared output, dropdown not clipped by table scroll, existing tests remain green.

## Review findings

Functional browser tests passed selection/PDF, status persistence, share file preparation, duplicate/delete and all seven routes. Visual review confirmed Thai PDF font rendering and menus. Enlarged the PDF index column to prevent splitting its Thai header; shortened repeated conversion unavailability labels.

Physical page-count inspection found an extra trailing A4 blank page after two DL envelopes. Red artifact: `_wrx-output/evidence/envelopes-extra-page-before.pdf` (3 pages). A browser CSS proof assigned the envelope page name to the containing body and removed flex layout for print, producing exactly 2 DL pages; implemented in print styles and added PDF page-object count assertions for document/envelope batches. This is a rendering fix, not a backend change.

PDF library is dynamically imported (~346 KB gzip when requested); bundled Sarabun fonts are covered by the included OFL license. Native share and print chooser behavior depends on the browser/device. Browser tests prepare/download files and simulate the print trigger, then inspect Chromium's rendered print output; no physical printer or external recipient was used.

Final result: all acceptance checks completed. Frontend lint, strict types, 18 unit tests, production build and 7 browser tests pass. Both document and envelope batches have exactly two pages for two selected records. Final evidence is `_wrx-output/evidence/quotation-actions-verification.md`. README and component architecture guide updated.
