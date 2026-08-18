---
name: optimize-min
description: Consolidate the dev branch and master into a review branch, reconcile new features against bug fixes, get only most recently changed files lint/tests green while cleaning up the code, then ship to master (production).
---

# /optimize-min

Run the full solo-developer optimization and release cycle.

Branching model: daily work happens on `dev`. `master` is production. `review` is
the temporary integration/stabilization branch. Always use the `optimize-merge`
skill to resolve any conflict.

## 1. Prepare the `review` branch

1. Merge all local PRs and local `dev` branch. Solve conflicts using
   `optimize-merge`. Everything must to be consolidated in `dev` and all PR
   branches must be deleted after merged.
2. `git fetch origin` to get the latest `master`.
3. If `review` does not exist yet, create it from production:
   `git checkout -B review origin/master`.
4. If it already exists, check it out: `git checkout review`.

## 2. Consolidate master + dev into review

1. Bring the production line in first (bug fixes / hotfixes):
   `git merge --no-ff origin/master`.
2. Bring the parallel work in next (new features and edits):
   `git merge --no-ff dev`.
3. Resolve every conflict with the `optimize-merge` skill. The rule is always:
   keep BOTH the new functionality (from `dev`) and the bug fixes (from
   `origin/master`), never drop one side.

## 3. Review, clean up, and get checks green (on review)

Review everything changed since the last commit and fix:

- Remove dead code and unused variables/imports.
- Remove debug/console statements and useless comments.
- Apply DRY; lines <= 100 columns; nesting <= 3 levels.
- Meaningful names; no hardcoded strings or magic numbers.

Then run checks and iterate until clean:

1. `npm run lint` — full lint; fix every error and warning (same as `/optimize`).
2. **Affected tests only** — compare against production tip, not the last local
   commit on `review`:

   ```bash
   git fetch origin
   npm run test:changed
   ```

   (`test:changed` runs `vitest run --changed origin/master`.)
   `tests/e2e/**` is excluded from Vitest.

   If the command prints `No test files found` and exits 0, that is acceptable
   only when the diff vs `origin/master` truly has no related tests (e.g. docs
   only). If source or test files changed, investigate before shipping.

   Fallback when `--changed` misses coverage you expect:

   ```bash
   npx vitest related $(git diff --name-only origin/master -- '*.ts' '*.tsx')
   ```

3. **E2E (Playwright) — new specs only** — run **only** e2e files **added**
   after the last release tip (`origin/master`). Do **not** run specs that already
   existed on `origin/master`, even if they were edited in this cycle.

   ```bash
   git fetch origin
   E2E_NEW=$(git diff --name-only --diff-filter=A origin/master -- 'tests/e2e/**')
   if [ -n "$E2E_NEW" ]; then
     npx playwright test $E2E_NEW
   fi
   ```

   If there are no new e2e specs, skip Playwright entirely. Do **not** run the
   full `tests/e2e` suite unless the user explicitly asks.

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
2. Promote to production and push:
   `git checkout master && git merge --no-ff review -m "Merge branch 'review': <short summary of what ships>" && git push origin master`.
   The merge message must summarize the **integrated work** (features, fixes,
   config), not `/optimize-min` or `review release`. Pushing to `master`
   triggers the production deploy.
3. Confirm GitHub Action **Deploy prod DB** succeeds when schema changed.
4. If the GitHub repository does not exist yet, create it under the GitHub
   account that owns this project and push (do not assume a fixed account).

## 5. Sync origin `dev` with shipped `master`

After pushing `master`, update **only** `origin/dev` so it matches production.
**Do not** merge into or reset **local** `dev` — you may already have new work
there while this cycle ran; that work joins the next `/optimize` or
`/optimize-min`.

```bash
git fetch origin
git push origin origin/master:refs/heads/dev
```

- `origin/dev` ends on the same commit as `origin/master`.
- **Local `dev` stays unchanged** (do not `git checkout dev && git merge master`).

## When to use `/optimize` instead

Use full `/optimize` (`npm test`) before large releases, risky refactors, or when
shared libraries (`lib/`, hooks, auth) changed in ways that may not map cleanly
to Vitest’s changed graph.
