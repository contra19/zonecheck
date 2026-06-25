---
name: wolvryn-forge-security
description: Security principles for all Wolvryn FORGE products. Identity trust boundaries, database layer rules, secrets management, auth gating, and input validation. Use alongside wolvryn-forge core when doing security-related work, running security audits, adding auth flows, changing database schemas, or handling secrets. Non-negotiable standards.
metadata:
  skill_version: "1.0"
  source_repo: "wolvryn-skills"
  source_commit: "da6420e"
---

# Wolvryn FORGE — Security Standards

Security is more important than the app working flawlessly. A bug gets fixed. A breach destroys trust permanently. These principles are non-negotiable across all Wolvryn projects.

---

## Identity — Never Trust the Client

- **Never accept userId, email, or name as client-supplied parameters for writes.** Derive identity from the authenticated server-side session.
- Server Actions, API routes, or equivalent are the correct place for authenticated writes — they have access to the verified session.
- The client never touches identity values. They are resolved server-side and never cross to the browser.
- Mass-assignment is a CRITICAL vulnerability: upserts must never accept wide payloads that could write fields the user should not control (tier, subscription IDs, admin flags, created_at, id).

---

## Database Layer

- **Row Level Security (RLS) or equivalent must be enabled on every user-data table from day one.**
- RLS is defense-in-depth, not the only defense. The application layer validates first; RLS catches what slips through.
- Every UPDATE policy needs both `USING` (which rows to touch) and `WITH CHECK` (what values are allowed after update). Missing `WITH CHECK` enables row-hijacking attacks.
- Server-side clients that bypass RLS (service role, admin keys) must be server-only — never in the browser bundle. Use `import 'server-only'` or build-time enforcement.
- When using a third-party auth provider with a separate database auth system, verify the JWT integration works before writing any application code against it. The `auth.uid()` equivalent must resolve correctly from the JWT.
- Use `auth.jwt()->>'sub'` or equivalent when the auth provider uses non-UUID identifiers (e.g., Clerk text IDs).

### Database Choice
- **PostgreSQL preferred** for any project with user data and multi-tenancy. Native RLS support is the primary reason.
- **MySQL** has no native RLS — application-layer enforcement only. Acceptable for internal tools or single-tenant apps. Not recommended for multi-tenant SaaS with sensitive data.
- Document the database choice and RLS approach in the project's first ADR.

---

## Secrets and Keys

- All secrets in `.env.local` or equivalent — never committed.
- All env vars documented in `.env.example` with placeholder values and classification (SECRET / CONFIG / PUBLIC).
- Access secrets through a typed config module — never scatter raw `process.env.X` through the codebase.
- Public (client-safe) vars and server-only secrets are strictly separate. Public vars degrade gracefully on missing; server secrets fail loudly.
- Service role keys, admin keys, and equivalent never leave the server. Add build-time protection (`import 'server-only'`).
- `NEXT_PUBLIC_*` vars (or equivalent client-exposed prefix) must never contain server secrets. If the variable name implies client exposure, it must be safe for client exposure.

---

## Auth Gating

- Protected routes are gated at the edge/middleware layer first, then verified again in the route handler. Two layers, always.
- Never trust the proxy/middleware alone — server components verify the session independently.
- Debug and diagnostic endpoints are production-gated (`NODE_ENV === 'development'`). They are tracked in the backlog for deletion before launch as CRITICAL items.
- Token-null edge case: if the auth token returns null while the user appears signed in, the route must NOT redirect to sign-in (infinite loop). Render an error instead.

---

## Input Validation

- Array size caps enforced server-side — UI limits are not security boundaries.
- Free tier limits enforced in the service layer, not just the UI.
- Raw database error messages never reach the user — clean plain-English messages only.
- **All string fields null-coalesced before processing.** Form fields can arrive as `null` even when the UI shows empty strings. Always `(field ?? '').trim()` before validation. This is non-negotiable.
- String fields written to the database must have length caps. Unbounded strings are DoS vectors and prompt injection surfaces.
- URL/email/phone fields require format validation before persistence.
- User-supplied URLs fetched server-side need SSRF protection (block private IPs, file://, localhost).
- Untrusted user input interpolated into LLM prompts must be delimited and instruction-isolated.

---

## Webhook Security

- All webhook endpoints (Stripe, Clerk, etc.) must verify signatures before trusting the payload.
- Webhook handlers must be idempotent — replay-safe via event ID checking.
- Outbound API calls wrapped in try/catch with no secrets in error logs.
- Rate limiting on expensive operations (AI generation, email delivery) — at minimum a per-user daily cap.
- Recipient addresses for delivery (email, SMS) are derived from the trusted database row, never from client-supplied overrides.

---

## Logging Security

- Log lines must NEVER contain: API keys, auth tokens, passwords, session IDs, JWTs, webhook signing secrets, service-role keys.
- Log lines must NEVER contain: full email addresses, full user names, phone numbers, or other PII. User IDs (opaque identifiers) are acceptable.
- Error logging uses `error.message`, not the full Error object (which may contain sensitive stack frames or request context).
- Stack traces are acceptable at DEBUG level only, never at INFO, WARN, or ERROR level.
- All logging goes through the centralized logger — no direct console calls.
- The log-level env var defaults to `'info'` in production (never `'debug'`).

---

## Data Handling

- When a user is deleted, all user-owned data must cascade-delete. Verify the FK dependency graph.
- Content with retention policies (briefings, cache rows) must have cleanup mechanisms.
- No temporary files, debug dumps, or diagnostic output written to disk in production.
- No sensitive data in browser-accessible storage (cookies, localStorage, sessionStorage).
