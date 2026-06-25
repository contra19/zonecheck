# ZoneCheck — Security Audit Record

## Header
- **Audit date:** 2026-06-25
- **Commit audited:** `508c7e6`
- **Record authored at HEAD:** `28863cd` — the commits between `508c7e6` and HEAD are
  skill/documentation/lockfile changes that do not modify the detect route or alter the
  dependency dispositions; findings remain valid at HEAD. If the detect route changed between
  these commits, re-audit. (Verify with `git diff 508c7e6 28863cd -- app/api/detect lib`.)
- **Criteria:** `wolvryn-forge-security`
- **Audit skill:** `zonecheck-security-audit` v1.0
- **Auditor:** Claude Code (implementer) — findings; architect — record
- **Pass type:** Audit-only. No code changed.

---

## Scope — enterprise coverage

Every `wolvryn-forge-security` section evaluated. ZoneCheck has no database, no auth, and no
user-persisted data (state is URL query params + React state), so most sections are N/A by
absence of surface — recorded here as considered, not skipped.

| # | Enterprise section | Status | Reason |
|---|--------------------|--------|--------|
| 1 | Identity — Never Trust the Client | N/A | No auth, no identity, no server-side writes — nothing derives or trusts a userId. |
| 2 | Database Layer (RLS) | N/A | No database. State is URL query params + React state. |
| 3 | Secrets and Keys | **Applicable** | `ANTHROPIC_API_KEY` exists and is used server-side. |
| 4 | Auth Gating | N/A | No auth, no protected routes, no debug/diagnostic endpoints. |
| 5 | Input Validation | **Applicable** | The detect endpoint accepts untrusted user text into an LLM call. |
| 6 | Webhook Security | **Partial** | No webhooks (signatures/idempotency/recipient N/A). One sub-rule applies: rate-limit expensive AI operations. |
| 7 | Logging Security | **Applicable (lite)** | No centralized logger and no `console.*` in the API; relevant only to error-message handling. |
| 8 | Data Handling | N/A | No user data to cascade-delete, no retention rows, no disk writes, no sensitive data in browser storage (query params hold only timezone selections). |

---

## Findings

### Code surface — `app/api/detect/route.ts`

| ID | Finding | Severity | Reachable | Disposition |
|----|---------|----------|-----------|-------------|
| C-1 | No input length cap. `text` accepted unbounded (`route.ts:35-41`) and sent straight to the paid LLM. Primary cost/DoS surface. Enterprise: unbounded strings are DoS + prompt-injection vectors. | High | Yes | **fix-now** — cap length (≤2KB) before the API call. |
| C-2 | User input not delimited / instruction-isolated. Raw text passed as the user message (`route.ts:49`); the untrusted span itself is not delimited. | Medium | Yes | **fix-now** — wrap input in explicit delimiters; pairs with C-1. |
| C-3 | LLM output returned unvalidated. `JSON.parse(cleaned)` returned directly (`route.ts:60-62`), no type guard; any parsed shape forwarded to the client. | Medium | Yes | **fix-now** — add a type guard; reject/normalize non-conforming output. |
| C-4 | Raw error messages returned to client. `catch` returns `err.message` verbatim (`route.ts:63-66`); leaks SDK/internal detail. Enterprise: clean plain-English messages only. | Medium | Yes | **fix-now** — generic message to client; log detail server-side only. |
| C-5 | `message.content[0]` accessed without empty-array guard (`route.ts:52`). If content is empty, throws → currently surfaces as a raw error via C-4. | Low | Yes | **fix-now** — guard alongside C-4 (same change region). |
| C-6 | Rate limit is in-memory, per-serverless-instance, IP-keyed (`route.ts:14-23`). Satisfies the rate-limit-AI rule, but is a soft per-instance limit and the IP comes from client-controllable `x-forwarded-for` (`route.ts:26`) — spoofable for bypass. | Low | Yes | **accept-and-document** — adequate for a Hobby-tier non-auth app; revisit on abuse/cost spike (shared store + trusted IP source). |

### Secrets / environment

| ID | Finding | Severity | Disposition |
|----|---------|----------|-------------|
| S-1 | API key read via raw `process.env` (`route.ts:43`), not a typed config module. Single call site today. | Low | **schedule** — introduce a typed config accessor when the next env var lands. |
| S-2 | No `.env.example`. `.env.local` exists locally; no documented template with placeholders + SECRET/CONFIG/PUBLIC classification. | Low | **fix-now** — add a one-line `.env.example` (placeholder + `# SECRET`). |
| S-3 | `NEXT_PUBLIC_*` misuse: none. Grep confirms zero `NEXT_PUBLIC` references. | — | **pass** |
| S-4 | Secret not committed. `.env.local` git-ignored (`.env*.local`), confirmed absent from `git ls-files`. Route is `runtime='nodejs'`, server-only by construction. | — | **pass** |

### Config — `next.config.mjs` & `app/layout.tsx`

| ID | Finding | Severity | Disposition |
|----|---------|----------|-------------|
| F-1 | No security response headers. `next.config.mjs` empty — no CSP/HSTS/X-Frame-Options. Not mandated by the enterprise skill; Vercel supplies some defaults. | Low | **accept-and-document** — hardening opportunity, not a standards violation for this surface. |
| F-2 | `app/layout.tsx` clean. No `dangerouslySetInnerHTML`; Analytics/SpeedInsights are first-party; `next/image` in Footer uses a local asset only, no `remotePatterns`. | — | **pass** (relevant to Next advisory reachability). |

### CI / build pipeline

| ID | Finding | Severity | Disposition |
|----|---------|----------|-------------|
| O-1 | `actions/checkout@v4` and `actions/setup-node@v4` target Node 20, which GitHub is deprecating on runners (currently force-run on Node 24; will eventually fail). A warning today, not a failure. | Low | **schedule** — bump both to `@v5` when convenient. |

### Dependencies — `npm audit` (24: 20 moderate, 4 high)

Triaged per `references/npm-triage.md`. `npm audit fix --force` NOT run. Plain `npm audit fix`
clears nothing — all remaining fixes are semver-major.

| ID | Package | Sev | Ships | Reachable | Disposition |
|----|---------|-----|-------|-----------|-------------|
| D-1 | `next` 14.2.35 — 15 advisories (DoS, SSRF-via-WS, cache-poisoning, CSP-nonce / beforeInteractive XSS) | High | Prod | Largely no — no middleware, i18n, WebSocket upgrades, CSP nonces, or beforeInteractive scripts; Image Optimizer uses local images; Vercel-hosted. Residual = availability-only. Already on latest 14.2.x patch. | **schedule** — fixable only by major bump to `next@16` (framework-pinned trap). Track as a tested migration; accept the low-impact residual meanwhile. |
| D-2 | `@anthropic-ai/sdk` 0.82 — GHSA-p7fg-763f-g4gf (insecure default file perms, Local Filesystem Memory Tool) | Moderate | Prod (direct) | No — app uses only `messages.create`; memory tool never instantiated. | **accept-and-document** — unreachable feature; revisit on next SDK upgrade (fix is major bump to 0.106). |
| D-3 | `postcss` <8.5.10 (XSS in CSS stringify) — transitive via `next` | Moderate | Build-time | No — CSS compiled at build, not in runtime artifact; direct devDep `postcss ^8` resolves clean. | **accept-and-document** — clears with the D-1 Next major bump. |
| D-4 | `jest` / `ts-jest` / `babel-jest` / `@jest/*` / `@istanbuljs` chain | Moderate | devDependency | No — test/build only, never deployed. | **accept-and-document** — devDep; revisit at a test-tooling refresh. |
| D-5 | `@next/eslint-plugin-next` / `eslint-config-next` (high, via `glob`) | High | devDependency | No — lint only; `glob` used as a library, not its vulnerable CLI flag. | **accept-and-document** — devDep + unreachable; defer to a lint-tooling bump. |

---

## Scheduled follow-ups

| ID | Action | Target | Track |
|----|--------|--------|-------|
| S-1 | Introduce typed config accessor for env vars | When the next env var lands | GitHub Issue (to file) |
| O-1 | Bump CI actions to `@v5` (Node 24) | Before Node 20 is fully retired on runners | GitHub Issue (to file) |
| D-1 | Migrate `next` 14 → 16 as a tested upgrade | Deliberate migration session | GitHub Issue (to file) |

---

## Remediation scope (fix-now)

The fix-now set is **two implementer prompts**, not six:

1. **Detect-route hardening** — C-1, C-2, C-3, C-4, C-5 all live in `app/api/detect/route.ts`
   and form one cohesive change (input cap, delimiting, output type guard, clean error
   handling, content-array guard).
2. **`.env.example`** — S-2, a trivial standalone file.

Per separation of duties, these are implementer work under one-concern-per-prompt; this audit
identifies and dispositions only. The route-hardening change should pass conformance review
(`wolvryn-forge-conformance-review`) before crossing the duty boundary.

---

## Sign-off

- **Summary:** 17 findings + 3 pass. Disposition counts — **fix-now: 6** (C-1–C-5, S-2);
  **schedule: 3** (S-1, O-1, D-1); **accept-and-document: 6** (C-6, F-1, D-2, D-3, D-4, D-5);
  **pass: 3** (S-3, S-4, F-2).
- **Headline:** The one High-severity actionable item is **C-1 (unbounded input)** on the
  detect endpoint — the app's primary attack/cost surface. The Next.js High advisories are real
  but largely unreachable here and resolve only via the scheduled major migration, not an
  audit-time `--force`. No secrets are exposed or committed.
- **Cross-reference:** Test-health / CI-lockfile history (the suite was non-running due to a
  stale committed lockfile; fixed in a prior commit this session) is a testing-lane concern —
  tracked for `CODE_AUDIT.md`, not duplicated here.
- **Record last updated:** 2026-06-25

---

## Audit log

| Date | Commit | Skill ver | Summary |
|------|--------|-----------|---------|
| 2026-06-25 | `508c7e6` | 1.0 | Initial security audit. 6 fix-now, 3 scheduled, 6 accepted, 3 pass. One High actionable (C-1). |