# Observability Review Lane — STUB (not yet active)

**Status: STUBBED.** This lane is scaffolded but NOT active. It has no criteria skill to point
at yet, so it produces no findings and returns no verdict — the report notes it as "stubbed
(no active criteria)."

**Pending:** the `wolvryn-forge-observability` criteria skill must be authored first — logging
discipline, structured telemetry, SLI/SLO emission points, and operability requirements. Until
it exists, do NOT enforce anything in this lane.

**Planned default strictness:** medium-to-tight (to be calibrated when the criteria skill
lands).

**Planned scope (preview — not enforced):**
- Does new code log through the centralized logger (no stray console calls)?
- Is there telemetry an operator can latch onto — structured, with the fields needed to
  diagnose a problem?
- Are SLI-relevant events emitted at the points the SLOs depend on?
- Is failure observable (errors logged with context) without leaking secrets/PII?

**Overlap note:** the secrets/PII-in-logs rules already live in `wolvryn-forge-security`
(Logging Security). When `wolvryn-forge-observability` is authored, decide which logging rules
live where and have one skill point at the other — do NOT duplicate. Security owns "what must
never be logged"; observability owns "what must be logged and how."

This file is a placeholder describing intent. Adding the lane later is filling this slot, not
restructuring the review skill.