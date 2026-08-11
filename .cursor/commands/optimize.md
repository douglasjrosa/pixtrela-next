---
name: optimize
description: Consolidate the dev branch and master into a review branch, reconcile new features against bug fixes, get lint/tests green while cleaning up the code, then ship to master (production).
---

# /optimize

Run the full solo-developer optimization and release cycle.

Branching model: daily work happens on `dev`. `master` is production. `review`
is the temporary integration/stabilization branch. Always use the
`optimize-merge` skill to resolve any conflict.

## 1. Prepare the `review` branch

1. `git fetch origin` to get the latest `dev` and `master`.
2. If `review` does not exist yet, create it from production:
   `git checkout -B review origin/master`.
3. If it already exists, check it out: `git checkout review`.

## 2. Consolidate master + dev into review

1. Bring the production line in first (bug fixes / hotfixes):
   `git merge --no-ff origin/master`.
2. Bring the parallel work in next (new features and edits):
   `git merge --no-ff origin/dev`.
3. Resolve every conflict with the `optimize-merge` skill. The rule is always:
   keep BOTH the new functionality (from `dev`) and the bug fixes (from
   `master`), never drop one side.

## 3. Review, clean up, and get everything green (on review)

Review everything changed since the last commit and fix:

- Remove dead code and unused variables/imports.
- Remove debug/console statements and useless comments.
- Apply DRY: extract duplicated logic.
- Keep lines <= 100 columns and nesting <= 3 levels.
- Use meaningful names; no hardcoded strings or magic numbers.

Then run the project's own checks and iterate until they all pass (for example
`npm run lint` and `npm test`, or the equivalent for the project). Do not ignore
any error or warning.

## Commit messages

Every commit in this cycle must describe the **actual changes** (features, fixes,
refactors, config), not the `/optimize` workflow.

- **Do** write subjects from the diff (e.g. `fix revalidateTag cache profile for
  Next 16`, `sync user media URLs without setState in effect`).
- **Do not** use `optimize`, `/optimize`, `review release`, `release gate`, or
  similar meta labels in commit subjects or bodies.

Before committing on `review`, read `git diff` (or `git log origin/master..HEAD`)
and name what changed. If you make multiple logical fixes, use separate commits
with specific messages rather than one vague cleanup commit.

## 4. Ship to master (production)

1. Commit any remaining reviewed work on `review` using the rules above.
2. Promote to production and push:
   `git checkout master && git merge --no-ff review -m "Merge branch 'review': <short summary of what ships>" && git push origin master`.
   The merge message must summarize the **integrated work** (features, fixes,
   config), not `/optimize` or `review release`. Pushing to `master` triggers the
   production deploy.
3. If the GitHub repository does not exist yet, create it under the GitHub
   account that owns this project and push (do not assume a fixed account).

## 5. Continue on dev

Fast-forward `dev` onto the shipped `master` so the next cycle starts clean:
`git checkout dev && git merge --ff-only master && git push origin dev`.
