# Security Audit Record — Format

Defines the shape of `docs/SECURITY_AUDIT.md` (the filled-in instance). This file is the
*template*; the instance is generated state and lives in `docs/`, NEVER in this skill
folder. Keep the record proportional to the app — ZoneCheck is small, so the record is
thorough but not ceremonial.

## Required sections

### Header
- Date of audit
- Commit SHA audited
- Skill version used (this skill's `skill_version`)
- Auditor (Claude Code session / Rob)

### Scope
- What was audited (the reachable surface)
- Every enterprise `wolvryn-forge-security` section marked **Applicable** or
  **N/A — reason**. List ALL sections so coverage is provable, not implied. N/A sections
  are listed with their reason, never omitted.

### Findings
Grouped by category (code surface, secrets, dependencies). Each finding carries:
- ID / short title
- Severity — CRITICAL / HIGH / MEDIUM / LOW
- Reachable? — yes / no, with a one-line reason
- Description — what, and where (file:line where applicable)
- **Disposition** — fix-now / scheduled / accept-and-document, with rationale

### Scheduled follow-ups
Findings dispositioned "schedule" collected as a list, each with its target version/action
and a tracked GitHub Issue reference.

### Sign-off
- Summary line (e.g. "N findings: X fixed, Y scheduled, Z accepted")
- Date record last updated

## Rules

- EVERY finding carries a disposition. No undispositioned findings.
- N/A enterprise sections are listed WITH reason, never omitted.
- On re-audit, update in place and keep a dated audit-log section so the trend over time is
  visible (rather than overwriting history). Pick this convention and hold it consistently.
- The record never contains secrets, keys, or raw tokens — describe a secrets finding
  without reproducing the secret.