# Code Review Lane

**Criteria:** `wolvryn-forge-code-standards`. Apply, do not restate.

**Default strictness: MEDIUM-TO-TIGHT.** BLOCK clear violations; FLAG judgment calls and minor
style; PASS clean.

## BLOCK-level (clear violations)
- `any`, implicit or explicit; a type assertion (`as`) used to silence an error instead of a
  type guard.
- Missing explicit return type on an exported function.
- A provider SDK called directly from a call site instead of its owning module (dependency-
  isolation breach).
- A magic value where a named constant is required.

## FLAG-level (judgment / style)
- A function over the 40-line guide but cohesive (judgment — is it doing one job?).
- A file over the 200-line review trigger (a trigger, not an automatic split).
- Naming that is acceptable but off-convention.
- Missing file header / JSDoc on a non-exported helper.

## Common blind spots
- An `as SomeType` on a fetch/JSON response that quietly defeats type safety.
- Logic creeping into a component that belongs in `lib/`.
- A second call site for a dependency that was previously isolated — isolation eroding one
  call at a time.

## Verdict guidance (medium-to-tight)
Type-safety and dependency-isolation breaches are BLOCK. Length / cohesion / naming are
FLAG-and-judge unless egregious.