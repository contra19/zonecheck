# ZoneCheck — Claude Code Context

## What this is
ZoneCheck is a timezone overlap tool for distributed teams — a commercial micro-SaaS under
Wolvryn Technology Systems, live at https://zonecheck.wolvryn.tech. No database, no auth,
no service worker — intentionally simple and online-only.

## FORGE skills are authoritative
This repo carries the Wolvryn FORGE skills under `.claude/skills/`. They define HOW we work;
this file carries only project-specific facts and rules. When this file and a skill disagree
on process or standards, the skill wins. This file never restates skill content.

**Enterprise skills (vendored from `wolvryn-skills` @ `b1abde1`):**
`wolvryn-forge` (core), `wolvryn-forge-code-standards`, `wolvryn-forge-security`,
`wolvryn-forge-testing`, `wolvryn-forge-deploy`. These are vendored snapshots — never
hand-edit them here; edit canonical in `wolvryn-skills` and re-vendor.

**App skills (authored in this repo):**
`zonecheck-security-audit` — runs the security audit (criteria from `wolvryn-forge-security`),
triages dependencies, produces `docs/SECURITY_AUDIT.md`.
`zonecheck-code-audit` — runs the code-quality/coverage audit (criteria from
`wolvryn-forge-code-standards` + `wolvryn-forge-testing`), produces `docs/CODE_AUDIT.md`.

## Separation of duties — two-surface form
This project runs the **two-surface** form (see `wolvryn-forge` core).
- **Architect = Claude Chat.** No repo access. Owns architecture, ADRs, all documentation
  (including this file and skill files), Claude Code prompts, commit-message drafting, audit
  triage. Rob places its output into the repo.
- **Implementer = Claude Code.** Repo access. Owns `src`/`app`/`lib` code and tests, running
  format/test/build, audits. NEVER creates, edits, or replaces documentation — it FLAGS
  needed doc changes for the architect.
- Rob is the commit gate. Neither surface commits without his review.

## IMPORTANT: this codebase predates the skills
ZoneCheck was built before the FORGE skills existed. The current code does NOT yet fully
conform — a security and conformance pass is pending. Do NOT assume existing code follows the
standards. Known-open items, pending the audit/hardening pass:
- `app/api/detect/route.ts`: no server-side input length cap; raw error messages returned to
  the client; LLM output returned unvalidated (no type guard); user text not delimited /
  instruction-isolated in the prompt.
- No `.env.example` documenting env vars with classification.
- Dependency advisories triaged but residuals accepted/scheduled (see `docs/SECURITY_AUDIT.md`
  once produced).
Flag conformance issues when you encounter them; do not rubber-stamp.

## Stack (verified from package.json)
- Next.js 14.2.35 (App Router), React 18, TypeScript 5
- Tailwind CSS 3.4 — all styling (config: `tailwind.config.ts`)
- date-fns-tz 3.2 — all timezone math
- @anthropic-ai/sdk 0.82, model `claude-haiku-4-5-20251001` — AI paste detection
- Vercel hosting (Hobby), auto-deploy on push to main
- @vercel/analytics + @vercel/speed-insights (in `app/layout.tsx`)
- ESLint: `next/core-web-vitals` + `next/typescript` (stock Next)

## Module layout & boundaries
```
app/                      # Next App Router — presentation + routing
  layout.tsx, page.tsx
  api/detect/route.ts     # the AI detect endpoint (owns the Anthropic SDK)
  components/             # TeamMemberCard, InstallBanner, MeetingActions, AddMemberForm,
                          #   Timeline, TimelineRow, PasteDetect, Footer
lib/                      # pure, framework-free logic — NO React, NO Next imports
  timezone.ts             # all timezone math
  timezone-utils.ts       # timezone helpers
  constants.ts            # shared constants
  *.test.ts               # Jest tests (38 total)
```
**Boundary rules:**
- `lib/` is pure and framework-free. It NEVER imports from `app/`, React, or Next. All
  timezone math lives here — never duplicated into components.
- `app/` may import from `lib/`. Components hold presentation; logic belongs in `lib/`.
- The Anthropic SDK is accessed ONLY within `app/api/detect/` — never imported by components
  or `lib/`. (Dependency isolation; the owning module contains the swap blast radius.)

## Hard constraints — do not violate
- NO service worker. App is intentionally online-only.
- NO offline caching of any kind — stale timezone data is worse than none.
- NO database — all state lives in React state and URL query params.
- NO auth in MVP.
- TypeScript strict — no `any`; type guards over `as` assertions; explicit return types on
  exported functions (see code-standards skill).
- Tailwind only — no CSS modules, no styled-components.
- Secrets via `process.env.ANTHROPIC_API_KEY`, server-only — never hardcode, never
  `NEXT_PUBLIC_*`.

## AI detect endpoint
- Route: `app/api/detect/route.ts`, `export const runtime = 'nodejs'`
- Model: `claude-haiku-4-5-20251001`, max_tokens 150
- Rate limit: 20 req/IP/60s, FIXED window, in-memory Map (per serverless instance — a soft
  limit, not a global guarantee)
- Returns `{ name, timezone, confidence: 'high' | 'low' }`
- Has open security findings (see "predates the skills" above) — pending hardening pass.

## Testing
- Jest (NOT Vitest — do NOT migrate or flag the absence of Vitest). jest 30 + ts-jest 29 +
  jest-environment-jsdom.
- Tests in `lib/*.test.ts`; run with `npm test`. 38 tests.
- ALWAYS confirm the suite RUNS, not just "passes" — a non-running suite (broken install /
  lockfile / config) is CRITICAL. CI uses `npm ci` against the committed lockfile precisely
  so local and CI agree; if they diverge, the lockfile is the suspect.
- All tests must pass before any commit.

## CI/CD & deployment
- GitHub Actions: `.github/workflows/ci.yml` — `npm ci` → `npm test` → `npm run build`
- ANTHROPIC_API_KEY is a GitHub Actions secret and a Vercel env var
- Production: https://zonecheck.wolvryn.tech (Cloudflare CNAME → Vercel, proxy OFF)
- Backup: https://zonecheck-wheat.vercel.app
- Known CI item: `actions/checkout@v4` + `actions/setup-node@v4` warn on Node 20 deprecation;
  bump to `@v5` when convenient (warning, not failure).

## Skills maintenance
The `wolvryn-*` skills in `.claude/skills/` are VENDORED SNAPSHOTS from `wolvryn-skills`
(@ `b1abde1` at time of vendoring), carrying a `source_commit` stamp. They do NOT auto-update.
To refresh: re-copy the skill folders from `wolvryn-skills` and update each `source_commit`.
The canonical source is always `wolvryn-skills` — if a local copy conflicts, `wolvryn-skills`
wins. The `zonecheck-*` app skills are authored here (no provenance stamp; not vendored).