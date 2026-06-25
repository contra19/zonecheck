# Architecture Review Lane

**Criteria:** the project's ADRs (`docs/decisions/`) and `ARCHITECTURE.md`, plus the module-
boundary laws in `CLAUDE.md`. Apply, do not restate.

**Default strictness: MEDIUM-TO-TIGHT, REFACTOR-AWARE.**

## Divergence is a question, not a verdict
When code diverges from the documented architecture, there are two possible truths:
1. The code violated a still-valid decision → **BLOCK**, fix the code.
2. The documentation is stale; the design legitimately evolved → **not a code fault**. The fix
   is updating `ARCHITECTURE.md` / superseding the ADR (architect work).

The reviewer SURFACES the divergence, states both branches, and **FLAG-and-routes** to the
gate to decide which truth applies. Do NOT assume the code is the wrong side — architecture is
updatable by refactor when it makes sense.

**Reserve BLOCK** for contradictions that are unambiguously the code violating a decision that
still holds (e.g. code writes to a layer an ADR explicitly forbids, and that ADR is current).

## What to check
- Does the change cross a module boundary the `CLAUDE.md` / `ARCHITECTURE.md` declares? (e.g.
  `lib/` importing from `app/`; a dependency used outside its owning module)
- Does it contradict a CURRENT ADR's decision? (check ADR status — not just existence)
- Does it introduce a pattern `ARCHITECTURE.md` says the system does not use?
- Does it "clean up" a documented deliberate seam — a field or structure whose data-model note
  says it exists for a future reason? This is the highest-value catch: flag it loudly. A field
  whose purpose is undocumented is one someone deletes; a documented seam removed anyway is an
  architecture violation.

## Common blind spots
- A reasonable-looking refactor that quietly violates a boundary law in `CLAUDE.md`.
- Code that matches an OLD ADR already superseded by a newer one — verify ADR status.
- Deleting or altering a field whose `ARCHITECTURE.md` data-model note marks it intentional.

## Verdict guidance
Unambiguous violation of a current decision → BLOCK. Genuine divergence where the doc may be
the stale side → FLAG-and-route (state both branches; the gate decides fix-code vs update-doc).