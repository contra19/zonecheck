# Dependency Vulnerability Triage

Generic methodology for triaging `npm audit` findings. Written app-agnostic — this is a
candidate to promote to `wolvryn-forge-security` (enterprise) when a second Wolvryn app
needs the same logic.

## Core principle: severity × reachability

A CVE's headline severity is not its risk to *this* app. Real risk = severity weighted by
whether the vulnerable code path is reachable in this app's runtime. A "high" in a dev-only
tool that never ships is lower real risk than a "moderate" on the request path. Sort
findings by real risk, not by the audit's color coding.

## The two questions for every finding

1. **Does it ship?** Is the vulnerable package a `dependency` (ships to production /
   runtime) or a `devDependency` (build / test / lint only — never in the deployed
   artifact)? DevDependency vulns are near-irrelevant to the runtime attack surface; they
   concern the build environment, not the running app.
2. **Is it reachable?** Even in a shipped dependency, is the vulnerable function, flag, or
   feature actually invoked? A CLI-injection CVE in a library used only as a programmatic
   API is not reachable. Read the advisory's specifics, not just its title.

## The fix ladder — escalating risk, never skip a rung

1. `npm audit` — read everything FIRST. Never act on the summary count alone.
2. `npm audit fix` — applies only in-range (semver-compatible) updates. Safe; will not
   break your declared versions.
3. Re-run `npm audit` — see what remains.
4. Anything still remaining requires `--force` or a major bump. STOP. This is a deliberate
   decision, not an audit action.

## NEVER reflexively `npm audit fix --force`

`--force` installs major-version bumps outside your semver ranges — i.e. breaking changes.
On a pinned framework (e.g. Next.js held at a specific major) it can drag you across majors
mid-project and break the build. A major bump is a scheduled migration with its own
testing, NEVER a security-patch shortcut.

## Disposition every finding — three outcomes

- **Fix-now** — a safe in-range patch exists (`npm audit fix` cleared it and the build
  still passes). Apply it; note it.
- **Schedule** — the only fix is a major bump or migration. File a tracked follow-up
  (GitHub Issue), record the target version and why it is deferred. Do NOT force it now.
- **Accept-and-document** — devDependency, OR unreachable path, OR no fix exists without
  leaving a pinned major. Record the finding, the reason it is accepted, and the conditions
  that would make you revisit. A documented accept is honest; a silently ignored finding is
  not.

## Worked example (illustrative)

A `high` command-injection CVE in `glob`, pulled in transitively by the ESLint config,
fixable only by a major bump of the lint toolchain:

- **Ships?** No — devDependency (lint only).
- **Reachable?** No — the advisory is about glob's CLI `-c` flag; the lint chain uses glob
  as a library, not its CLI.
- **Disposition:** accept-and-document. DevDep + unreachable + fix is a major lint-tooling
  bump deferred to a tooling refresh.

The point: a scary "high" correctly dispositions to "accept" once ship + reachability are
applied. Severity alone would have mis-prioritized it.

## Framework-pinned advisories — a common trap

When every remaining advisory on a pinned framework only clears by leaving its major line
(e.g. fixes were backported to a *later* major, not the pinned one), there is no
within-line patch to take. The honest dispositions are exactly two: accept-and-document the
residual (with the rationale that the app is on the latest patch of its pinned line and the
reachable items are availability-only / low-impact for this app), OR schedule the major
migration as its own tested effort. Do not pretend a `--force` to the new major is a patch.