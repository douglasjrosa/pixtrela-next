---
name: optimize-merge
description: Reconcile Git merge conflicts during the /optimize cycle for a solo developer. Use whenever merging dev and master into the review branch, or whenever a conflict appears while running /optimize. Conflicts are always between new features/edits (dev) and bug fixes (master/review), and both sides must be preserved.
---

# optimize-merge

## Context

- Single developer, no team. There is no "someone else's change" to defer to.
- The two conflicting sides always have the same meaning:
  - `master` / `review` = bug fixes and corrections made while stabilizing the
    last release (the last `/optimize`).
  - `dev` = new features and edits written in parallel while those bugs were
    being fixed.
- A conflict is therefore never "pick one side". It is always "apply the bug fix
  on top of the new feature".

## Resolution principle

For every conflict, produce a result that keeps BOTH intents:

1. Start from the `dev` version; it carries the newest structure and features.
2. Re-apply the bug fix from `master`/`review` onto that structure.
3. If the fix touched logic that the feature rewrote, port the fix into the new
   code path. Do not just paste the old lines back.
4. Never discard a bug fix to keep a feature, and never discard a feature to
   keep a fix.

## Procedure

1. `git status` to list conflicted files; `git diff` to read each hunk.
2. For each `<<<<<<< / ======= / >>>>>>>` block, identify which side is the fix
   and which is the feature. The `dev` side is usually the larger, newer change.
3. Merge the intents by hand and remove all conflict markers.
4. Prefer regenerating derived/lock files instead of hand-merging them (for
   example, re-run the package manager to rebuild a lockfile).
5. After resolving, run the project's lint and tests before committing. Do not
   ignore warnings.
6. `git add` the resolved files and complete the merge commit.

## When unsure

- If it is not clear which side is the fix, inspect the history of both branches
  (`git log --oneline master`, `git log --oneline dev`) and the commit messages.
- If a fix and a feature are genuinely incompatible, keep the feature and
  re-implement the fix inside it, then add a test that locks the fixed behavior.
