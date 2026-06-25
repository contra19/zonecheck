---
name: wolvryn-forge-conformance-review
description: Adversarial conformance review of implementer output against Wolvryn FORGE standards before the work crosses a duty boundary. Five lanes — security, testing, code, architecture, and (stubbed) observability — each pointing at its criteria skill, each with configurable strictness. Produces a findings report plus a draft remediation prompt (a proposal, never auto-dispatched in manual mode). Use when reviewing a code change or diff for standards conformance, gating implementer work, or running the reviewer role in a two-surface or harnessed workflow. Triggers on "conformance review", "review this diff", "check against standards", "adversarial review", or the reviewer role in a dev loop.
metadata:
  skill_version: "0.1"
  source_repo: "wolvryn-skills"
  source_commit: "da6420e"
---

# Wolvryn FORGE — Conformance Review

Adversarial review of implementer output against FORGE standards, run before that output
crosses a duty boundary. This skill is the *reviewer role*. It does not restate the
standards — each lane points at its criteria skill and adds only the review method.

## Mandate — adversarial by design

The reviewer's job is to find what is wrong, not to confirm what is right. Agreement without
scrutiny is failure. Review the OUTPUT (the diff, the produced code and tests), NOT the
implementer's reasoning or session — a reviewer that reads how the work was justified
anchors on it and rubber-stamps. Come to the artifact cold, with the standards in hand, and
try to break it.

## What this is (and is not)

- This IS per-change review: gate a diff/change before it crosses a boundary. Output is a
  report plus a draft remediation prompt.
- This is NOT the periodic full-codebase audit (see app audit skills, e.g.
  `<app>-security-audit`), which assesses the whole codebase and produces a dated record in
  `docs/`. Review gates new work; audit assesses standing state. They share criteria; they
  differ in scope, timing, and output.

## The five lanes

| Lane | Criteria source | Default strictness |
|------|-----------------|--------------------|
| **Security** | `wolvryn-forge-security` | **Tight** — BLOCK any violation |
| **Testing** | `wolvryn-forge-testing` | **Tight** — test-health (suite RUNS) is a hard BLOCK |
| **Code** | `wolvryn-forge-code-standards` | **Medium-to-tight** |
| **Architecture** | project ADRs + `ARCHITECTURE.md` | **Medium-to-tight, refactor-aware** |
| **Observability** | *(pending `wolvryn-forge-observability`)* | **Stubbed — not yet active** |

Each lane has a lens in `references/<lane>-review.md`: the method, the highest-value checks,
and common blind spots — never a restatement of the criteria, which live in the criteria
skill.

Strictness defaults are set here (enterprise). An app MAY override a lane's strictness in its
own `<app>-*` layer if it has reason; absent an override, these defaults apply.

## The three-tier verdict

Every lane returns one of:
- **BLOCK** — a real standard violation (or, in architecture, an unambiguous contradiction of
  a still-valid decision). Must be resolved before the work crosses the duty boundary.
- **FLAG** — a nit, a judgment call, or (in architecture) a divergence whose correct fix is
  unclear. Noted, non-blocking, routed to the gate for a call.
- **PASS** — conforms.

Only BLOCKs gate the handoff. FLAGs travel with the work for the gate to weigh.

### Strictness, operationally
- **Tight:** BLOCK on any violation; FLAG reserved for genuine style preference only.
- **Medium-to-tight:** BLOCK on clear violations; FLAG judgment calls and minor style.
- The testing lane's "does the suite actually RUN" check is a forced BLOCK regardless of any
  configured level — a non-running suite is never a nit.

## Architecture lane is special — divergence is a question, not a verdict

When code diverges from the documented architecture, do NOT auto-BLOCK. There are two
possible truths: the code violated a still-valid decision (→ BLOCK, fix the code), OR the
documentation is stale because the design legitimately evolved (→ not a code fault; the fix
is updating `ARCHITECTURE.md` / superseding the ADR, which is architect work). The reviewer
FLAGs the divergence, states both branches, and routes to the gate to decide. Reserve BLOCK
for contradictions that are unambiguously the code violating a decision that still holds.
Architecture is updatable by refactor when it makes sense — the reviewer surfaces the
divergence; it does not assume the code is the wrong side.

## Output — report plus draft remediation prompt

The reviewer produces two things (full contract in `references/output-format.md`):
1. A **report** — findings per lane, each with verdict (BLOCK/FLAG/PASS), location, the
   standard at issue, and a one-line rationale; plus an overall verdict.
2. A **draft remediation prompt** — a ready-to-use implementer prompt that would fix the
   BLOCKs, written to the one-concern-per-prompt rule. This is a PROPOSAL, not a dispatch.

The reviewer NEVER writes documentation and NEVER writes the fix itself — it reports and
proposes. The remediation prompt is raw material for the gate.

## Routing — mode-dependent, but the invariant holds

The routing of the draft remediation prompt depends on the operating mode; the
separation-of-duties invariant does not change.

- **Manual / two-surface mode (current):** the reviewer hands the report + draft prompt to
  the gate (Rob + architect). The gate adopts or refines the prompt; the approved prompt goes
  to the implementer. The duty's output then crosses to the documentation duty (Rob +
  architect) before it is authoritative.
- **Harnessed mode (future — "dev team in a box"):** the coder + reviewer are a bonded
  implementation harness; the reviewer dispatches remediation prompts to the coder WITHIN the
  harness and they loop until conformant. The harness output then crosses to a separate
  documentation duty for review before it is authoritative.

**Invariant (all modes):** a duty never closes its own loop without crossing to a separate
review duty. A reviewer drafting a prompt for its own coder is allowed *only* inside a bonded
harness whose output still crosses a boundary. In manual mode there is no harness, so the
draft always routes through the gate.

## Hard rules

- Review the artifact, not the reasoning. Come cold.
- NEVER rubber-stamp. If nothing is wrong, say PASS explicitly per lane and justify it
  briefly — silence is not a verdict.
- NEVER write the fix or the documentation. Report and propose only.
- The remediation prompt is a proposal; in manual mode it is never dispatched without the
  gate.
- Test-health (suite runs) is ALWAYS a BLOCK.
- Architecture divergence is FLAG-and-route unless it is unambiguously code violating a valid
  decision.

## Status

v0.1 — trial. This skill is being calibrated against real review runs before it is treated as
canonical. Expect the adversarial mandate's tightness and the lane methods to be revised from
observed use. The observability lane is stubbed pending the `wolvryn-forge-observability`
criteria skill.