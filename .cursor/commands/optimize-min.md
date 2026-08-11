---
name: optimize-min
description: Same solo release cycle as /optimize, but run only Vitest files affected by changes since origin/master instead of the full suite.
---

# /optimize-min

Run the optimization and release cycle with a **lighter test gate**: same flow as
`/optimize`, except step 3 runs **affected tests only** (not `npm test`).

Branching model: daily work on `dev`. `master` is production. `review` is the
integration branch. Use the `optimize-merge` skill for every merge conflict.

## 1. Prepare the `review` branch

1. `git fetch origin` for latest `dev` and `master`.
2. If `review` does not exist: `git checkout -B review origin/master`.
3. Otherwise: `git checkout review`.

## 2. Consolidate master + dev into review

1. `git merge --no-ff origin/master`.
2. `git merge --no-ff origin/dev`.
3. Resolve conflicts with the `optimize-merge` skill (keep **both** dev features
   and master fixes).

## 3. Review, clean up, and get checks green (on review)

Review everything changed since the last commit and fix:

- Remove dead code and unused variables/imports.
- Remove debug/console statements and useless comments.
- Apply DRY; lines <= 100 columns; nesting <= 3 levels.
- Meaningful names; no hardcoded strings or magic numbers.

Then run checks and iterate until clean:

1. **`npm run lint`** — full lint; fix every error and warning (same as
   `/optimize`).
2. **Affected tests only** — compare against production tip, not the last local
   commit on `review`:

   ```bash
   git fetch origin
   npm run test:changed
   ```

   (`test:changed` runs `vitest run --changed origin/master`.)
   `tests/e2e/**` is excluded from Vitest; do **not** run the full Playwright
   suite unless the user asks.

   If the command prints `No test files found` and exits 0, that is acceptable
   only when the diff vs `origin/master` truly has no related tests (e.g. docs
   only). If source or test files changed, investigate before shipping.

   Fallback when `--changed` misses coverage you expect:

   ```bash
   npx vitest related $(git diff --name-only origin/master -- '*.ts' '*.tsx')
   ```

Do not ignore lint or test failures.

## Commit messages

Every commit in this cycle must describe the **actual changes** (features, fixes,
refactors, config), not the `/optimize-min` workflow.

- **Do** write subjects from the diff (e.g. `fix revalidateTag cache profile for
  Next 16`, `restrict Vercel deploys to master branch`).
- **Do not** use `optimize`, `/optimize`, `/optimize-min`, `review release`,
  `release gate`, or similar meta labels in commit subjects or bodies.

Before committing on `review`, read `git diff` (or `git log origin/master..HEAD`)
and name what changed. If you make multiple logical fixes, use separate commits
with specific messages rather than one vague cleanup commit.

## 4. Ship to master (production)

1. Commit any remaining reviewed work on `review` using the rules above.
2. `git checkout master && git merge --no-ff review -m "Merge branch 'review': <short summary of what ships>" && git push origin master`.
   The merge message must summarize the **integrated work** (features, fixes,
   config), not `/optimize-min` or `review release`.
3. Confirm GitHub Action **Deploy prod DB** succeeds when schema changed.

## 5. Continue on dev

`git checkout dev && git merge --ff-only master && git push origin dev`.

## When to use `/optimize` instead

Use full `/optimize` (`npm test`) before large releases, risky refactors, or
when shared libraries (`lib/`, hooks, auth) changed in ways that may not map
cleanly to Vitest’s changed graph.
