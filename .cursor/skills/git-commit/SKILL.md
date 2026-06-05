---
name: git-commit
description: Analyzes git diff and writes commit messages in Conventional Commits format. Use when the user asks to commit, create a git commit, write a commit message, or says "закоммить" / "сделай коммит".
---

# Git commit messages

## Before writing the message

1. **Run `release-preflight` skill** when the change ships user-visible work or touches `frontend/package.json`: bump `VERSION` + `frontend/package.json` + `CHANGELOG.md`, sync `package-lock.json` (WSL Docker if deps changed). See `.cursor/skills/release-preflight/SKILL.md`.
2. Run in parallel: `git status`, `git diff` (staged and unstaged), `git log -5 --oneline`.
3. Commit only intended changes; never stage secrets (`.env`, credentials, keys).
4. Match language and tone of recent commits in `git log`; default to English unless the user writes in Russian.

Follow the project's git safety user rules (no force push, no amend unless allowed, commit only when explicitly asked).

## Format (Conventional Commits)

```
<type>(<scope>): <subject>

<optional body — why, not a file list>
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`

**Scopes for this repo:** `api`, `notes`, `store`, `deps`, `tests`, `ci`

**Rules:**

- Subject: imperative mood, ≤72 characters, no trailing period
- Body: 1–3 sentences explaining *why* and user-visible effect; avoid listing filenames
- One logical change per commit; suggest splitting if changes are unrelated

## Examples

**Good:**

```
feat(notes): add in-memory store and REST endpoints

Expose CRUD for notes without a database for the initial API slice.
```

```
test(notes): cover create and list endpoints

Lock in expected status codes and response shapes for the notes router.
```

**Bad:**

```
update files
fixed stuff
added notes.py and store.py
```

## Commit execution (Windows)

Use a PowerShell here-string for multi-line messages:

```powershell
git commit -m @"
feat(notes): add in-memory store and REST endpoints

Expose CRUD for notes without a database for the initial API slice.
"@
```

Single-line commits may use `git commit -m "feat(api): wire notes router"`.
