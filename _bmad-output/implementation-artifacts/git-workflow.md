# Git development workflow — 2026-09-13

- Path B, codex-only: define the branch/review/release process across contribution guidance, README, and a PR template.
- User intent: follow Git development best practices with existing `main` and `develop` branches.
- Start from `origin/develop` on `docs/git-workflow`; publish a draft PR into `develop`.
- Document focused task branches, explicit staging, meaningful validation, PR review, squash merges for tasks, and merge commits for releases and synchronization.
- Keep `main` and `develop` at their existing commits during this documentation task; merge through the documented PR process.
- Replace the stale README statement that the project has no Git repository.
- Document recommended branch protection without changing GitHub repository settings.
- Verification: whitespace/diff review, documentation link/anchor checks, PR-template review, and remote branch/PR confirmation. Application tests are not applicable to these documentation-only changes; CI must pass before merge.
- Red proof is not applicable: this is workflow documentation, not an application bug fix.
- Evidence: `_wrx-output/evidence/git-workflow.txt`.
