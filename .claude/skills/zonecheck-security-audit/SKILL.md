---
name: zonecheck-security-audit
description: Runs a security audit of the ZoneCheck app against the wolvryn-forge-security standard, plus dependency-vulnerability triage. Use when performing a security review of ZoneCheck, running or interpreting npm audit, dispositioning CVEs, doing a pre-release security check, or producing/updating docs/SECURITY_AUDIT.md. Scopes the enterprise security criteria to ZoneCheck's actual surface — an AI detect endpoint, secrets handling, and the dependency supply chain; ZoneCheck has no database, auth, or user data. Triggers on "security audit", "npm audit", "vulnerability", "CVE", "dependency review", or security work on ZoneCheck.
metadata:
  skill_version: "1.0"
---

# ZoneCheck — Security Audit

App-specific security audit *process* for ZoneCheck. The *criteria* this skill audits
against live in the enterprise `wolvryn-forge-security` skill. This skill does not restate
those criteria — it applies them, scopes them to ZoneCheck's actual surface, triages
dependency findings, and produces the audit record.

## What this skill does

Runs a repeatable security audit of ZoneCheck and produces/updates `docs/SECURITY_AUDIT.md`.
Use it for a full security pass, a dependency-vulnerability review, or a pre-release
security check.

## Authority and boundary

- **Criteria:** `wolvryn-forge-security` (enterprise). ALWAYS audit against it; NEVER
  duplicate its rules here. If a rule seems missing, it belongs in the enterprise skill,
  not this one.
- **Output is state, not instruction.** The filled-in audit record lives in
  `docs/SECURITY_AUDIT.md`. NEVER write the record inside this skill folder — the skill
  holds process only.
- The empty record *shape* is a template → `references/audit-record-format.md`. The
  filled-in record is an instance → `docs/SECURITY_AUDIT.md`.

## ZoneCheck's actual security surface

ZoneCheck has NO database, NO auth, NO user accounts, NO user-persisted data — all state is
URL query params plus React state. This makes large parts of the enterprise checklist Not
Applicable, and the audit MUST record those sections as explicitly-considered-N/A (not
silently skipped), so the record proves full coverage.

**Reachable surface — where the audit concentrates:**
- **AI detect endpoint** (`app/api/detect/route.ts`) — the primary surface. Untrusted user
  text flows into an LLM call. Check: server-side input length cap, prompt
  delimiting/instruction-isolation, output validation (type guard on parsed JSON), clean
  error handling (no raw errors to client), rate limiting.
- **Secrets handling** — `ANTHROPIC_API_KEY` server-only, never `NEXT_PUBLIC_*`, never
  committed, accessed via typed config (not scattered `process.env`).
- **Dependency supply chain** — `npm audit`, triaged per `references/npm-triage.md`.

**N/A for ZoneCheck** (record as considered, with reason "no such surface"): Identity /
client-trust writes, Database Layer / RLS, Auth Gating, Webhook Security, and most Data
Handling (no user data to cascade-delete; no sensitive data in browser storage).

## Audit process

1. Load criteria from `wolvryn-forge-security`. Apply; do not restate.
2. Scope: mark each enterprise section **Applicable** or **N/A — reason** for ZoneCheck.
3. Review the reachable surface (detect route, secrets/env, `next.config`) against the
   applicable criteria.
4. Dependency audit: run `npm audit`, triage every finding per `references/npm-triage.md`.
5. Disposition every finding — **fix-now / schedule / accept-and-document** — each with a
   one-line rationale. NEVER leave a finding undispositioned.
6. Write or update `docs/SECURITY_AUDIT.md` per `references/audit-record-format.md`, dated
   and stamped with the audited commit SHA.

## Hard rules

- NEVER run `npm audit fix --force` as part of an audit. Triage first; major bumps are
  deliberate scheduled decisions, not audit actions (see `references/npm-triage.md`).
- NEVER report an audit "clean" with findings silently ignored. Accept-and-document is the
  honest path for findings not worth fixing.
- ALWAYS record N/A enterprise sections WITH their reason, so the record shows full
  coverage rather than implied gaps.
- This skill produces the AUDIT RECORD only. Code *fixes* the audit recommends are separate
  implementer work under the normal one-concern-per-prompt rule. The audit identifies and
  dispositions; it does not fix in the same pass.

## Promotion note

`references/npm-triage.md` is written generically and is a candidate to promote to
`wolvryn-forge-security` (enterprise) once a second Wolvryn app needs the same triage.
Until then it lives here.