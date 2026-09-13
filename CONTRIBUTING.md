# Contributing

Work starts from `Instruction/Markdown.md` and the approved phase. Follow spec-first and test-first development; do not add speculative abstractions.

## Mandatory rules

1. Dependencies point bootstrap → HTTP → service → repository interface ← PostgreSQL. Domain/service never import net/http, Chi or pgx.
2. Map domain values to API DTOs; never return database or sqlc structs directly.
3. External calls accept context.Context and use bounded timeouts.
4. Transactions use TxManager.WithinTx and context-injected Executor only.
5. Cross-module dependencies use narrow interfaces declared by the consumer.
6. Never edit generated sqlc, Go OpenAPI or TypeScript contract code manually.
7. Never rewrite merged migrations; create a new migration.
8. Do not create Go packages named utils, common or helpers.
9. Nuxt server code is proxy/BFF only; business logic belongs in Go services.
10. Never commit .env, .env.example, other .env.* files, or secrets.

## Git development workflow

This project uses two long-lived branches. `main` records reviewed releases; `develop` integrates reviewed work for the next release. During development, `develop` normally leads `main`. Do not push both branches merely to keep their code equal.

| Branch | Start from | PR target | Purpose |
| --- | --- | --- | --- |
| `feature/<topic>` | Latest `origin/develop` | `develop` | New behavior |
| `fix/<topic>` | Latest `origin/develop` | `develop` | Bug fix |
| `docs/<topic>` | Latest `origin/develop` | `develop` | Documentation |
| `chore/<topic>` | Latest `origin/develop` | `develop` | Tooling or maintenance |
| `hotfix/<topic>` | Latest `origin/main` | `main` | Urgent fix to released code |

### Start one task

Check the working tree first. Preserve any existing changes before switching branches; do not reset or discard someone else's work. With a clean working tree:

```sh
git status --short --branch
git fetch origin
git switch --no-track -c feature/quotation-search origin/develop
```

Use a short, descriptive branch name for the actual task. Keep branches short-lived and each PR focused. State PATH / REASON / EVIDENCE / MODEL ROUTE before implementation, record the plan under `_bmad-output/implementation-artifacts/`, and keep runtime evidence under `_wrx-output/`. Path B/C bug fixes require red proof before implementation.

### Implement, verify, and commit

Run the checks relevant to the changed behavior and the required project checks listed below. Documentation-only changes need a diff and link review; application checks can be marked not applicable with a reason. CI remains required before merge. Never describe an unrun or failing check as passed.

Inspect `git diff`, stage explicit paths with `git add <path>`, and inspect `git diff --cached` before committing. Keep commits focused; use subjects such as `feat: add quotation search`, `fix: preserve quotation credit terms`, or `docs: explain Git workflow`. Keep environment files, credentials, dependencies, and build output out of commits.

If `develop` advances while the branch is open, merge `origin/develop` into the task branch after fetching, resolve conflicts, and rerun affected checks. Rebase is optional for unpublished personal commits; do not rewrite shared history. Never force-push `main` or `develop`.

### Push and open a PR

```sh
git push -u origin feature/quotation-search
gh pr create --draft --base develop --head feature/quotation-search
```

Use the PR template to explain the problem, resulting behavior, and actual validation. Review the complete diff, mark the PR ready when checks pass, and obtain another contributor's review when one is available. For a solo maintainer, explicitly record self-review; the author cannot approve their own PR.

Use **Squash and merge** for completed task branches into `develop`. Delete the remote task branch after merge, then update the local integration branch with `git switch develop` and `git pull --ff-only origin develop`. If fast-forward fails, inspect the divergence rather than resetting it. Start the next task from the updated remote branch.

### Release and urgent fixes

Open a release PR from `develop` into `main` when the planned release is ready. Run CI and review release behavior and migrations. Use **Create a merge commit** for this PR to retain shared ancestry between the long-lived branches. After merge, tag the released `main` commit with an agreed version such as `v0.1.0` and push that tag. Release approval and deployment follow the task's authorization; merging alone does not claim a deployment occurred.

Bring `main` back into `develop` through a PR using **Create a merge commit**. This also applies after merging a `hotfix/*` PR into `main`, so the next release retains the production fix. If the direct PR has conflicts, create a temporary `sync/<topic>` branch from `origin/develop`, merge `origin/main` there, resolve and test, then open its PR into `develop`. Do not squash these synchronization PRs or reset either long-lived branch to make their commit IDs equal.

### GitHub enforcement

Recommended rules for both `main` and `develop`: require PRs, require the successful `verify` CI check, require resolved review conversations, and block force pushes and deletion. Require one approval when a second maintainer is available; do not require an approval that a solo author cannot supply. Keep merge commits available for release/synchronization PRs, so do not require linear history for this workflow.

These are workflow recommendations, not a claim that repository protection is enabled. Applying repository rules is a separate configuration task and depends on the account/repository capabilities. Do not bypass a failing CI check to merge.

References: [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow) for task branches and PR review; [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) for server-enforced rules. The two-branch release policy above is this project's choice.

## Naming and reviews

Go packages use short lowercase names; migrations use UTC YYYYMMDDHHMMSS_name.sql; frontend feature imports go through index.ts. Keep module HTTP and PostgreSQL subpackages separate. Use descriptive commit subjects focused on behavior.

Before a PR: verify scope and path routing, update contract first, generate output, run make lint/typecheck/test/test-integration and pnpm check:generated, include runtime evidence, review migrations and secrets, and document any check that could not run. Preserve unrelated changes. No third module before Phase 1 review passes.

Architecture ADRs and the extended onboarding guide are completed in Phase 2. See README.md for the current runnable setup guide.
