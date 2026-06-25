# Testing Review Lane

**Criteria:** `wolvryn-forge-testing`. Apply, do not restate.

**Default strictness: TIGHT.** And one forced rule above strictness:

## The test-health gate — ALWAYS a BLOCK
Before any coverage judgment, confirm the suite actually RUNS. A suite that fails to execute
(broken install, lockfile mismatch, config error) is a CRITICAL BLOCK regardless of configured
strictness. A green "tests pass" is meaningless if the suite silently failed to run — verify
execution, not just an exit code. This rule exists because a non-running suite has shipped
undetected before; it is never a nit.

## Then the coverage checks
- Every new lib / service module has a corresponding test file?
- Happy path + error path + edge cases (null, empty string, whitespace, length boundary) for
  every function that takes input?
- Tier-limit tests where limits exist (under / at / over, per tier)?
- Tests assert behavior and return values, not just "does not throw"?
- Mock at the boundary; cleanup between tests; named constants (no magic values); no `as` casts
  in tests?

## Common blind spots
- A new function added with no test, build still green (coverage not gated by CI).
- Tests that pass when the tested function is deleted (testing the mock, not the code).
- Missing the null / whitespace string cases — the exact class that causes production 500s.

## Verdict guidance (tight)
Test-health failure → BLOCK, always, first. Missing required coverage → BLOCK. A weak-but-
present test → FLAG.