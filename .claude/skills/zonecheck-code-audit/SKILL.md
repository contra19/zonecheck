---
name: zonecheck-code-audit
description: Runs a code-quality and test-coverage audit of the ZoneCheck app against the wolvryn-forge-code-standards and wolvryn-forge-testing standards. Use when reviewing ZoneCheck code quality, checking conformance to FORGE coding/testing standards, doing a pre-release quality pass, or producing/updating docs/CODE_AUDIT.md. Funnels down from the enterprise standards — applies their criteria to ZoneCheck without restating them. Triggers on "code audit", "code review", "quality pass", "conformance check", or code-quality work on ZoneCheck.
metadata:
  skill_version: "1.0"
---

# ZoneCheck — Code Audit

App-specific code-quality and test-coverage audit *process* for ZoneCheck. The *criteria*
live in the enterprise `wolvryn-forge-code-standards` and `wolvryn-forge-testing` skills.
This skill applies them to ZoneCheck and produces the audit record; it does not restate the
standards.

## What this skill does

Runs a repeatable code-quality audit of ZoneCheck and produces/updates `docs/CODE_AUDIT.md`.
Use for a full quality pass, a conformance check against FORGE standards, or a pre-release
review.

## Authority and boundary

- **Criteria:** `wolvryn-forge-code-standards` (code quality) and `wolvryn-forge-testing`
  (coverage). ALWAYS audit against them; NEVER duplicate their rules here.
- **Output is state, not instruction.** The filled-in record lives in `docs/CODE_AUDIT.md`.
  NEVER write it inside this skill folder.
- The record *shape* is a template → `references/audit-record-format.md`. The filled-in
  record is an instance → `docs/CODE_AUDIT.md`.

## ZoneCheck context

Small Next.js 14 / TypeScript / React app. Jest for tests — NOT Vitest; do NOT flag the
absence of Vitest or recommend migrating. The `[default stack]` sections of the enterprise
standards apply directly. Key areas to check:

- File headers on every file; JSDoc on every exported function
- No `any`; type guards over `as` assertions; explicit return types on exported functions
- Modularity limits (40-line function guide, 200-line file review trigger, ≤3 nesting)
- Naming conventions, import ordering, no magic values
- Dependency isolation — the Anthropic SDK accessed behind one owning module, not scattered
- Test coverage — every lib module has a test; happy + error + edge cases; null / empty /
  whitespace / length-boundary coverage on string inputs

## Audit process

1. Load criteria from `wolvryn-forge-code-standards` and `wolvryn-forge-testing`. Apply; do
   not restate.
2. Confirm the test suite RUNS before auditing anything else (see Hard rules).
3. Review `lib/`, `app/`, and any `src/` against the applicable standards.
4. Review test files against the testing standard (coverage, mock patterns, edge cases, no
   "does-not-throw"-only tests).
5. Disposition every finding — fix-now / schedule / accept-and-document — each with
   rationale.
6. Write or update `docs/CODE_AUDIT.md` per `references/audit-record-format.md`, dated and
   commit-stamped.

## Hard rules

- ALWAYS confirm the test suite actually RUNS before auditing coverage. A non-running suite
  (broken install, lockfile, or config) is a CRITICAL finding in itself — more fundamental
  than any style issue, and recorded first. A green "tests pass" is meaningless if the suite
  silently failed to execute.
- NEVER report "clean" with findings silently ignored. Accept-and-document is the honest
  path for findings not worth fixing now.
- This skill produces the AUDIT RECORD only. Code *fixes* are separate implementer work
  under one-concern-per-prompt. The audit identifies and dispositions; it does not fix in
  the same pass.

## Promotion note

`references/audit-record-format.md` shares a structural skeleton with the security-audit
record format. Both are candidates to unify and promote to enterprise once a second app
needs them. Until then each app skill carries its own.
