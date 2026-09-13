# Stop tracking .env.example — 2026-09-13

- Path B, codex-only: removing the tracked template also affects CI setup.
- Keep the local `.env.example` file; remove it from the Git index.
- Remove the ignore exception so the existing `.env.*` rule covers the file.
- CI must generate its own `.env` with a random, temporary PostgreSQL password. Other settings use the existing application and Compose defaults.
- Red proof: the existing CI copy command fails in a checkout without the template.
- Verify that the replacement command creates valid configuration without the template, the local template survives, and Git ignores it.
- Publish the same commit on `main` and `develop`, leaving the checkout on `main`.
- Evidence: `_wrx-output/evidence/env-example-removal.txt`.
- Earlier commits retain the template; this change does not rewrite Git history.
