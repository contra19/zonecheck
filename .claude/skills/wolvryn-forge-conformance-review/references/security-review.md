# Security Review Lane

**Criteria:** `wolvryn-forge-security`. Do NOT restate its rules — apply them. This lens is
the review *method* for the security lane.

**Default strictness: TIGHT.** BLOCK on any violation. FLAG reserved for genuine style
preference only. If it is not clean against `wolvryn-forge-security`, it does not cross the
boundary. Security is the strictest lane by design — a missed security finding is the most
expensive kind to discover later.

## Highest-value checks first
- Untrusted input → LLM / DB / shell: delimited and instruction-isolated? Length-capped
  server-side?
- Raw errors or stack traces reaching the client? (BLOCK — clean plain-English messages only)
- Secrets: server-only, accessed via typed config, nothing `NEXT_PUBLIC_*`, nothing committed?
- Identity derived from the server session, never client-supplied for writes? Mass-assignment
  guarded?
- Output validated before return (type guard, not `as`)?
- Rate limiting on expensive / AI endpoints?
- Logging: no secrets/PII; centralized logger; correct levels?

## Common blind spots
- "Working" code that returns the raw provider error in its catch block.
- Length validation present in the UI but not server-side — the UI is not a security boundary.
- A type assertion (`as`) used to make untrusted JSON typecheck — that is not validation.
- A new endpoint added without the rate-limit / input-cap the existing ones have.

## Verdict guidance (tight)
Any deviation from `wolvryn-forge-security` is a BLOCK. Reserve FLAG for pure style.