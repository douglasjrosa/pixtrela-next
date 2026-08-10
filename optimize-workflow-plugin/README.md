# optimize-workflow

A Cursor plugin for a solo-developer release cycle.

It provides one command and one skill:

- `/optimize` — consolidate the `dev` branch and `master` into a `review`
  branch, reconcile new features against bug fixes, clean up the code, get
  lint/tests green, then ship to `master` (production).
- `optimize-merge` (skill) — how to resolve the conflicts that appear during
  `/optimize`: conflicts are always between new features/edits (`dev`) and bug
  fixes (`master`/`review`), and both sides must be preserved.

## Branching model

- `dev` — daily work (features and edits).
- `review` — temporary integration/stabilization branch created by `/optimize`.
- `master` — production; pushing here triggers the deploy.

## Install

Install at **user scope** from Customize → Plugins so it follows your account on
any machine. See the [Cursor plugins docs](https://cursor.com/docs/plugins).

## Test locally

```bash
ln -s "$(pwd)" ~/.cursor/plugins/local/optimize-workflow
```

Then run **Developer: Reload Window** in Cursor.

## Structure

```text
optimize-workflow/
├── .cursor-plugin/
│   └── plugin.json
├── commands/
│   └── optimize.md
├── skills/
│   └── optimize-merge/
│       └── SKILL.md
├── assets/
│   └── logo.svg
└── README.md
```
