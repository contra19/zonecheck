# ZoneCheck — Claude Code Context

## Project
ZoneCheck is a timezone overlap tool for distributed teams, built under Wolvryn Technology Systems. It is a commercial micro-SaaS product hosted at https://zonecheck.wolvryn.tech

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- date-fns-tz for all timezone math
- Anthropic Claude API (Haiku 4.5) for AI paste detection
- Vercel for hosting (Hobby tier) — auto-deploys on push to main
- GitHub Actions for CI/CD (test + build gate before deploy)
- No database, no auth, no service worker

## Key conventions
- All timezone logic lives in lib/timezone.ts
- API routes live in app/api/
- Use process.env.ANTHROPIC_API_KEY — never hardcode keys
- The /api/detect route must have: export const runtime = 'nodejs'
- TypeScript strict mode — no any types
- Tailwind only for styling — no CSS modules, no styled-components

## Hard rules
- NO service worker — this app is intentionally online-only
- NO offline caching of any kind — stale timezone data is worse than no data
- NO database — all state lives in React useState and URL query params
- NO auth in MVP

## PWA
- Web app manifest at public/manifest.json — display: standalone
- Apple touch icon and meta tags in app/layout.tsx
- Service worker explicitly excluded — do not add one under any circumstances

## AI detect endpoint
- Route: app/api/detect/route.ts
- Model: claude-haiku-4-5-20251001
- Rate limited: 20 requests per IP per 60-second sliding window
- Returns: { name, timezone, confidence: 'high' | 'low' }
- Strips markdown fences from response before JSON.parse

## Testing
- Jest for unit tests
- 14 tests in lib/timezone.test.ts
- Run with: npm test
- All 14 tests must pass before any commit

## CI/CD
- GitHub Actions: .github/workflows/ci.yml
- Pipeline: npm ci → npm test → npm run build
- ANTHROPIC_API_KEY stored as GitHub Actions secret
- Vercel auto-deploys after successful push to main

## Deployment
- Production: https://zonecheck.wolvryn.tech
- Backup: https://zonecheck-wheat.vercel.app
- DNS: Cloudflare CNAME → Vercel (proxy OFF)

## Lighthouse scores (baseline)
- Performance: 97
- Accessibility: 89 (target: 95+)
- Best Practices: 100
- SEO: 100