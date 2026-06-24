---
name: wolvryn-forge-deploy
description: Production deployment checklist for Wolvryn FORGE products. Infrastructure verification, OAuth setup, smoke tests, and common gotchas. Use when deploying to production for the first time, setting up a new environment, or troubleshooting deploy issues. Triggers on "deploy", "production", "go live", "launch", or environment setup discussions.
---

# Wolvryn FORGE — Deployment Standards

Checklist and gotchas for production deployments across Wolvryn products. This checklist assumes the **default Wolvryn stack** (TypeScript / Next.js / React on a serverless host, with a managed Postgres database and a third-party auth provider). The principles generalize, but specific items (`NEXT_PUBLIC_*`, OAuth redirect flows, cron endpoints) are written for that stack and should be adapted for any product built differently.

---

## Pre-Deploy Infrastructure

- [ ] Database production instance created and schema applied
- [ ] Auth provider production instance created and DNS verified
- [ ] Auth provider connected to database (JWT/third-party auth verified)
- [ ] Hosting platform project created and linked to repo
- [ ] Custom domain configured (DNS records + hosting platform)
- [ ] All environment variables set for **production** (not just preview)
- [ ] `NEXT_PUBLIC_*` vars reviewed — none contain server secrets
- [ ] Debug/admin endpoints return 404 in production (`NODE_ENV` guard)
- [ ] Cron/scheduler configured with correct endpoint URLs and HTTP methods
- [ ] SSL/TLS active on all endpoints

---

## OAuth Setup (if applicable)

- [ ] OAuth consent screen configured in provider (Google, Apple, etc.)
- [ ] OAuth client credentials created for **production domain** (not localhost)
- [ ] Redirect URIs match auth provider's expected format exactly
- [ ] OAuth app published (not in testing mode) — or test users added for staged rollout
- [ ] Credentials saved in both:
  - Auth provider dashboard (Clerk, Auth0, etc.)
  - Hosting platform env vars (Vercel, etc.)

---

## Smoke Test (run after every production deploy)

- [ ] Landing page loads (no blank screen, no error boundary)
- [ ] Sign up → lands on onboarding/first-run experience
- [ ] Complete onboarding → lands on main app
- [ ] All CRUD operations work (create, read, update, delete for each entity)
- [ ] Tier limits enforced (free tier caps respected in the UI AND server-side)
- [ ] Scheduled jobs fire and complete successfully (check logs)
- [ ] Email/notification delivery works end-to-end (send a real one)
- [ ] Admin features accessible (after updating admin user ID for prod)
- [ ] PWA install works (if applicable)
- [ ] Mobile responsive — check on actual device or device emulator

---

## Common Gotchas

These have caused real production issues across Wolvryn projects. Check every one.

**Environment variables:**
- Hosting env vars set to "Preview" only — must also be set for "Production"
- Variables copied from dev but with dev values (wrong API keys, wrong URLs)
- `env.ts` throws on missing optional vars (Stripe, Twilio) — make them optional with fallback or set placeholder values

**Auth:**
- Admin user ID differs between dev and production auth instances — update the env var
- OAuth credentials created but not saved in the auth dashboard after creation
- JWT template not configured in the production auth instance (works in dev, breaks in prod)
- Auth proxy/middleware matcher pattern doesn't cover all protected routes

**Cron:**
- Cron endpoint URL has a typo or missing path segment
- HTTP method mismatch between scheduler config (GET) and route handler (POST)
- Cron secret env var not set in production
- Cron fires successfully but the handler silently fails (check logs, not just the scheduler dashboard)

**Database:**
- RLS policies not applied to production database (schema applied without policies)
- FK constraints missing on production that exist in dev (migration order matters)
- Migration applied to dev but not production before deploy

**General:**
- Form fields arrive as `null` on some code paths even when the UI shows empty string — null-coalesce everything
- Browser caching serves old JS bundle after deploy — verify cache headers or hard-refresh
- Service worker caches stale assets — update SW version or skip-waiting logic

---

## Post-Deploy Monitoring

After the first deploy and for the first 24 hours:
- Watch error tracking (Sentry or equivalent) for new errors
- Watch scheduled job logs for failures
- Check email/SMS delivery logs for bounces or failures
- Verify at least one full cycle of scheduled operations completes end-to-end
- Ask one F&F user to confirm their experience is working
