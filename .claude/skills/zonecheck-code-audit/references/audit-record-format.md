# Code Audit Record — Format

Defines the shape of `docs/CODE_AUDIT.md` (the filled-in instance). This file is the
*template*; the instance is generated state and lives in `docs/`, NEVER in this skill
folder. Keep the record proportional to the app.

## Required sections

### Header
- Date of audit
- Commit SHA audited
- Skill version used (this skill's `skill_version`)
- Auditor (Claude Code session / Rob)

### Test-health gate (checked and recorded FIRST)
- Confirm the suite RUNS, not merely that it "passes" — record pass/fail and the test count
- A non-running suite is CRITICAL and recorded before any style or coverage finding

### Scope
- Files / areas reviewed
- Enterprise standards applied (`wolvryn-forge-code-standards`, `wolvryn-forge-testing`)
- Any `[default stack]` sections N/A for ZoneCheck (with reason)

### Findings
Grouped by standard area (headers/docs, typing, modularity, naming, dependency isolation,
testing). Each finding carries:
- ID / short title
- Severity — CRITICAL / HIGH / MEDIUM / LOW
- Location — file:line where applicable
- Standard violated — which specific rule
- **Disposition** — fix-now / scheduled / accept-and-document, with rationale

### Scheduled follow-ups
Deferred findings collected as a list, each with a tracked GitHub Issue reference.

### Sign-off
- Summary line (e.g. "N findings: X fixed, Y scheduled, Z accepted")
- Date record last updated

## Rules

- EVERY finding carries a disposition. No undispositioned findings.
- Test-health is checked BEFORE coverage findings — a broken suite outranks any style issue.
- On re-audit, update in place and keep a dated audit-log section so the trend is visible.