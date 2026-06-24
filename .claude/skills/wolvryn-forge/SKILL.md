---
name: wolvryn-forge
description: Core development identity and philosophy for all Wolvryn FORGE products. This is the foundation skill — it loads on every session for every Wolvryn project. Covers fix philosophy, separation of duties (Chat vs Code), living-documentation discipline and single source of truth, commit format, versioning, required project structure, and skill architecture. Triggers on any reference to a Wolvryn project, "let's build", "start a new session", "continue working on", or any FORGE product name.
metadata:
  skill_version: "1.1"
  source_repo: "wolvryn-skills"
  source_commit: "b1abde1"
---

# Wolvryn FORGE — Core Standards

The foundation for all Wolvryn Technology Systems products. These principles are stack-agnostic and travel with every project.

---

## Who This Is For

**Developer:** Rob Wisniewski (GitHub: contra19)
**Company:** Wolvryn Technology Systems
**Products:** Wolvryn FORGE micro-SaaS line (Butler, Kumite, Constellation, ZoneCheck, and future products)
**Style:** Direct, no encouragement needed. Rob undersells his accomplishments — push back when he does. He prefers honest assessments over validation.

---

## Fix Philosophy

Every fix must be the correct fix, not the fast fix. This is non-negotiable.

**The rule:** If a fix would need to be redone later to meet proper standards, it is not a fix — it is technical debt disguised as progress. Do not implement it. Implement the proper fix now, or document the proper design and defer the entire item.

**What "correct fix" means:**
- Uses contemporary coding standards and best practices for the stack
- Does not introduce patterns that will need to be unwound
- Follows the project's established architectural patterns
- Is tested at the same standard as the rest of the codebase
- Does not compound existing issues — if touching code adjacent to a known problem, fix the known problem first or alongside

**When the correct fix is too large:**
1. Document the correct design with the architect (as an ADR or in the architect thread)
2. Do NOT implement a "temporary" version that conflicts with the correct design
3. Add the item to the backlog with the documented design
4. Leave the code unchanged until the proper fix can be done

A missing feature is better than a wrong implementation. Wrong implementations get built on top of, and then the rework costs 3x.

**The compounding rule:** Technical debt compounds like interest. One shortcut invites another. Two shortcuts create a pattern. Three shortcuts become "how we do things." Fix it right the first time. Every time.

---

## Dependency Seams & Portability

Depend on external capabilities — hosting platforms, model providers, database
hosts, third-party APIs — through seams the codebase owns. One module or interface
per dependency, so any single one can be swapped with a blast radius of one module,
not a hunt across the app.

- **Commit fully behind the seam.** Use the chosen provider's premium, specific
  features completely *inside* its owning module. The goal is NOT lowest-common-
  denominator portability — that throws away the value you paid for. The goal is
  "committed, but replaceable."
- **Apply per dependency, by risk.** Weight the effort by how likely a swap is and
  how painful lock-in would be. High-churn or high-blast-radius dependencies (model
  provider, hosting platform, data layer) earn a seam. Foundational dependencies you
  will realistically never swap (language, core framework) do NOT — abstracting them
  is a tax that buys portability you'll never exercise and usually costs quality.
- **The operative test:** "If I had to swap this dependency, how many files change?"
  One module is the target. The whole codebase is a smell.

This is the structural form of the Fix Philosophy: isolating a dependency correctly
now is the proper fix; scattering provider calls across the app is debt that costs 3x
to unwind when the swap eventually comes.

---

## Separation of Duties — Architect vs Implementer

Every Wolvryn project is worked by two separated Claude roles plus Rob's judgment.
Strictly separate responsibilities. Non-negotiable. The **roles** are durable; the
**surfaces** they run on may vary by project.

**Rob decides. Claude advises.** Architecture decisions are made collaboratively between
Rob and the **architect** role — it proposes, analyzes trade-offs, and drafts ADRs, but
Rob makes the call. The **implementer** role executes what Rob approves.

**The two roles:**

- **Architect** — owns architecture discussion and ADR drafting (collaborative with Rob),
  document content production (ADR files, ARCHITECTURE.md, CHANGELOG, CLAUDE.md, skill
  files, SESSION.md), Claude Code prompts for the implementer (ready-to-paste, one concern
  each), commit-message drafting, audit triage, and session planning/sequencing. It writes
  **documentation only**; it does not write `src/` or tests.
- **Implementer** — owns code: changes, refactors, bug fixes, running tests/format/build,
  pattern sweeps (grep, audit). It writes **source and tests only**; it does not create,
  edit, or replace documentation — it FLAGS needed doc changes for the architect.

**Two ways to run the roles (project chooses; the separation is identical either way):**

1. **Two-surface (Chat + Code).** The architect is Claude Chat (no repo access — Rob
   pastes docs in and places the architect's output), the implementer is Claude Code (repo
   access). The separation is enforced *structurally*: Chat cannot touch code, Code cannot
   touch docs.
2. **Two-session (two Claude Code sessions).** Both roles run as Claude Code sessions
   against the same local tree; both READ everything (shared reading prevents doc/code
   drift), WRITING is laned by file set (architect → docs, implementer → `src/`). The
   separation is enforced by *convention* (the lane rules) plus Rob's commit review, since
   the filesystem no longer walls it. A project using this form documents its exact write
   lanes in its CLAUDE.md.

Pick the form per project and record it in that project's CLAUDE.md. The durable rule is
the *separation of roles*, not the choice of surface.

**Hard rules (both forms):**
- The implementer must NEVER create, update, or replace documentation files — it flags
  them for the architect.
- The architect must NEVER write `src/` or tests — it drafts a prompt for the implementer
  instead. (In the two-surface form this is automatic; in the two-session form it is a lane
  rule the architect must hold — the *wanting* to write code is the signal to STOP and
  write the prompt.)
- All architect output intended for the repo is ready-to-use: in the two-surface form a
  downloadable file or paste-ready fenced block (no "you could write something like…" —
  write the actual content); in the two-session form, the file written directly in its lane.
- Rob is the commit gate in both forms. Neither role commits or pushes without Rob's review.

**Commit message format:**
```
git commit -m "type: summary line with context (BQ-XXX)

- Bullet detail of what changed and why
- Another change

N/N tests passing, build clean"
```

**Conventional commits:** `feat:` `fix:` `chore:` `test:` `docs:` `refactor:` `security:` `ops:`

### Prompt Granularity Rule

Each Claude Code prompt targets ONE testable concern — one module,
one behavior change, one migration. The prompt is done when its
tests pass and the build is clean.

Combine concerns into a single prompt ONLY when they are
inseparable — e.g., a type change and the one consumer that
uses it, or a delete and the replacement that must exist in
the same commit. If two changes can be tested independently,
they are two prompts.

This is not optional. Batched prompts produce batched bugs.

---

## Living Documentation & Single Source of Truth

Documentation does not fail because it is missing. It fails because a fact lives in
two places, one goes stale, and you can no longer tell which to trust — so you re-read
the code to reconstruct what happened. That reconstruction is the cost this section
exists to eliminate. A feature slips through the cracks not in the decision and not in
the implementation, but in the un-synthesized space between them that nobody owns.

**The rule: every artifact has exactly one job and one source of truth. Never
duplicate what another artifact owns.** If a fact would belong in two artifacts, it
lives in the more authoritative one; the other *points* to it. A document you cannot
trust is worse than no document — it costs you time *and* misleads you.

### Artifact ownership

| Artifact | Owns | Mutability |
|----------|------|------------|
| **ADRs** (`docs/decisions/`) | *Why* a decision was made, at a point in time, and the alternatives weighed | Immutable. Superseded or amended by later ADRs — never edited to describe current state |
| **ARCHITECTURE.md** (`docs/`) | *How the system works now*, synthesized: current structure, module graph, data flow, and a data-model / data-dictionary section (every table and field's canonical meaning, who writes it, what reads it, and why it exists) | Mutable. Always reflects *now*. Edited in place |
| **CLAUDE.md** (repo root) | Architectural *rules and constraints* Claude Code must obey; module-boundary laws; coding standards | Mutable. Changes when a rule changes |
| **SESSION.md** (repo root) | *Where work stands now*: current phase/sub-step, the last thing completed, the next task, open decisions awaiting Rob, and any in-flight context needed to resume — the portable resume-point. Owns working state ONLY; never decisions (ADRs) or current architecture (ARCHITECTURE.md) — it *points* at those | Mutable, committed. Updated as work progresses; read first at session start |
| **Skills** (`.claude/skills/<name>/`) | Reusable *how-to* instruction — enterprise (vendored) and app-specific. Holds instruction only, never generated output | Enterprise (`wolvryn-*`): mutable in `wolvryn-skills` only. App (`<app>-*`): mutable in-repo. See Skill Architecture |
| **CHANGELOG.md** | The release record (semver) | Append-only per release |
| **GitHub Issues** | The backlog | Living |

The three easiest to confuse are ADRs, CLAUDE.md, and ARCHITECTURE.md. Hold the line:

- **ADRs answer "why," never "what is now."** An ADR is a dated decision; when the
  decision changes you supersede it, you do not edit it to describe the present. ADRs
  are a decision log, not a system description.
- **CLAUDE.md answers "what rule must I follow."** "lib never calls lib" is a rule — an
  imperative, not a description.
- **ARCHITECTURE.md answers "how does it actually work right now."** "An action enters
  here → the engine loads state → resolves → writes → narrates" is a description. It
  points to the ADRs for *why* it is shaped this way and to CLAUDE.md for the *rules*;
  it never re-derives either.

When you move where something lives, or change how data flows, **ARCHITECTURE.md is the
file that changes** — and because it is the one canonical current-state document, the
change cannot slip through a crack, because there is exactly one crack and it is the
file you are editing.

### The data-model section is load-bearing

ARCHITECTURE.md's data-model section records, for every table and field: its canonical
meaning, who writes it, what reads it, and *why it exists*. That last point matters most
for fields that look removable but are not — a column that holds a single value today
because a future capability is not yet active, or an identifier whose form is a
deliberate seam. **Record why such a field exists, so a future session does not "clean
up" the exact seam that keeps a future cheap.** A field whose purpose is undocumented is
a field someone will eventually delete.

### Keeping it alive — update triggers, not good intentions

Documents rot when updating them is a separate act from the change that made them stale.
The fix is to make the update part of the change, enforced at the same gate as tests:

- If **where something lives or how data flows** changed → ARCHITECTURE.md is updated
  *before the commit*.
- If a **field or table changed meaning, ownership, or existence** → the data-model
  section is updated *before the commit*.

These are pre-commit gates with the same standing as "tests pass." Per the
separation of duties, **the implementer does not author these documents.** When the
implementer makes a structural or data change, it *flags* the needed ARCHITECTURE.md update
— exactly as it flags decisions for ADRs — the architect authors the update, Rob places it,
and the commit waits on it.

### Proportionality

Match documentation weight to what exists. A young repo with no code has a near-empty
ARCHITECTURE.md, and that is correct — it fills in *as the system is built*, not ahead of
it. Writing a rich current-state document before the system exists is just a second guess
that goes stale against the real build. Stub the structure and the discipline early; grow
the content with the code. Over-documentation is its own failure mode: if updating the
docs is heavier than the change, the update gets skipped, and staleness returns by another
road.

---

## Session Protocol

### Session Start — in order
1. Read `SESSION.md` — where work stands now: current phase/sub-step, last completed, next task, open decisions. This is the resume-point; read it first so the session knows where it is.
2. Read `CLAUDE.md` — architecture rules, module boundaries, coding standards, and which two-role form this project runs (and its write lanes)
3. Read `ARCHITECTURE.md` — current structure, data flow, and data model (how the system works *now*)
4. Read the backlog — open items, note anything CRITICAL
5. Read specific ADRs relevant to today's work (from `docs/decisions/`)
6. (Implementer) Run the code audit skill
7. (Implementer) Fix any CRITICAL audit findings before writing new code

### During the Session
8. (Implementer) Write tests before implementation when possible
9. (Implementer) After every code change: run format check. Never report a task as complete without passing format, tests, and build.
10. When a non-blocking issue is found, add it to the backlog immediately with a BQ number
11. If a decision affects architecture, it becomes an ADR — the implementer FLAGS it, the architect authors it
12. If structure, flow, or a field's meaning/ownership/existence changed, ARCHITECTURE.md is updated — the implementer FLAGS it, the architect authors it
13. Keep implementer prompts small and focused — one concern per prompt

### Session End — before committing
14. Review the backlog — resolve any items fixable quickly
15. Ensure ARCHITECTURE.md reflects any structural, flow, or data-model change made this session (implementer flags; architect authors; before the commit)
16. Update `SESSION.md` (architect) — last completed, next task, any new open decisions — so the next session resumes cleanly
17. Run the full pre-commit checklist
18. Commit with a conventional commit message (Rob is the commit gate)

---

## Required Project Structure

| Element | Purpose | Location |
|---------|---------|----------|
| `CLAUDE.md` | Architecture rules, coding standards | Repo root (Claude Code reads automatically) |
| `SESSION.md` | Current working state — phase, last completed, next task, open decisions (the resume-point) | Repo root |
| `ARCHITECTURE.md` | Current system structure, data flow, and data model/dictionary (the single current-state document) | `docs/` |
| ADR files | Individual architecture decisions | `docs/decisions/ADR-NNN.md` with INDEX.md |
| Backlog | GitHub Issues — labeled by severity, milestoned by version | GitHub |
| `CHANGELOG.md` | Canonical release record (semver) | Repo root |
| `README.md` | Project overview, stack, status | Repo root |
| `.env.example` | All env vars with placeholders | Repo root (if project has secrets) |
| Skills | Enterprise (vendored, `wolvryn-*`) + app-specific (`<app>-*`) Claude instruction — see **Skill Architecture** | `.claude/skills/<name>/` |
| Generated state | Dated outputs a run produces (audit records, reports) — never inside a skill folder | `docs/` |

---

## Skill Architecture

Skills are the reusable instruction layer that travels with every Wolvryn project. They
follow the open Agent Skills specification (agentskills.io) so they validate with standard
tooling and stay portable across agents. Two tiers, one structure, one hard boundary.

### Two tiers — enterprise vs app

| Tier | Prefix | Scope | Source of truth | How it enters a repo |
|------|--------|-------|-----------------|----------------------|
| **Enterprise** | `wolvryn-*` | Cross-product. Loads in every Wolvryn repo. Wolvryn-wide judgment (FORGE core, code/security/testing/deploy standards). | The `wolvryn-skills` repo — one canonical copy | Vendored: copied into the app's `.claude/skills/`. Never hand-edited in an app repo. |
| **App** | `<app>-*` | Single product. Loads only in that app's repo. App-specific process, parameters, output formats. | The app's own repo | Authored in place, committed normally. |

**The prefix is the discriminator.** `wolvryn-*` means vendored — its truth lives in
`wolvryn-skills`; to change it, edit canonical and re-sync, never edit the app copy.
`<app>-*` means local — authored and owned in the app repo. This naming rule is what lets
a re-sync overwrite enterprise skills safely without touching app skills: the name tells
the tooling which is which.

**App skills funnel down from enterprise skills; they never duplicate them.** An app skill
*references* the enterprise standard for criteria and adds only what is app-specific. It
points up; it does not restate. Duplicated criteria is the exact drift this discipline
exists to prevent — the single-source-of-truth rule applies to skills as much as to docs.

### Structure (Agent Skills spec)

```
.claude/skills/<name>/
├── SKILL.md              # Required. Lean instruction + frontmatter.
├── references/           # Optional. Detail loaded on demand (plural directory name).
│   └── <topic>.md
├── scripts/              # Optional. Executable helpers.
└── assets/               # Optional. Templates, data, resources.
```

- **Directory form only.** The directory name MUST equal the frontmatter `name`. Flat
  `<name>-SKILL.md` files are NOT loaded as skills. (Flat copies may exist outside the
  loader path purely as upload/transport convenience, but they are derived from the
  directory, never the source of truth.)
- **Keep `SKILL.md` lean** — target under 500 lines / ~5,000 tokens. Push bulky detail
  (decision tables, worked examples, output formats) into `references/`, which the agent
  loads only when the task needs it. Progressive disclosure: metadata always, body on
  activation, references on demand.
- **Frontmatter `name`:** lowercase alphanumeric and hyphens only; no leading, trailing,
  or consecutive hyphens; ≤64 chars; matches the directory.
- **Frontmatter `description`:** what the skill does AND when to use it; ≤1024 chars;
  keyword-rich so the agent triggers it correctly.
- **Validate** a new or changed skill with `skills-ref validate ./<name>` before committing.

### Instruction vs state — the hard boundary

A skill folder holds **instruction only** — reusable and version-stable: `SKILL.md`,
`references/`, `scripts/`, `assets/`. It never holds generated output.

All **generated state** — dated audit records, reports, any filled-in artifact a run
produces — lives in `docs/`. A skill may *read* prior state from `docs/` by path; it never
*contains* it.

The distinction that keeps this clean:
- A **template** (the empty shape of an output) is reusable instruction → it lives in the
  skill's `references/<format>.md`.
- An **instance** (the filled-in output) is state → it lives in `docs/<name>.md`.

Putting a generated file inside a skill folder breaks the skill's reusability: the folder
mutates per run and stops being stable instruction. **Skill folder = *how* (reusable).
`docs/` = *what happened* (dated, mutable).**

### Vendored-skill metadata

Skills carry provenance in their frontmatter `metadata` block. Per the spec, metadata
values are flat strings. The stamp differs by where the skill lives, because a copy needs
to know where it came from but the source does not:

- **Canonical enterprise skill** (in `wolvryn-skills`) — `skill_version` only. It is the
  source; a `source_commit` pointing at itself is meaningless.
- **Vendored copy** (in an app's `.claude/skills/`) — `skill_version` plus the provenance
  added at vendoring time:

  ```yaml
  metadata:
    skill_version: "1.1"
    source_repo: "wolvryn-skills"
    source_commit: "<short-sha>"
  ```

- **App skill** (`<app>-*`, authored in the app repo) — `skill_version` only. It is not
  vendored from elsewhere.

The stamp lets the sync tooling — and a human — tell at a glance whether an app's vendored
copy is behind canonical, without diffing file contents.

### Vendoring reality

The copies of `wolvryn-*` skills under an app's `.claude/skills/` are vendored snapshots of
`wolvryn-skills`. Sync is currently **manual**: pull `wolvryn-skills`, copy the `wolvryn-*`
directories into the app, update each copy's `source_commit`. A pull-and-distribute tool
that automates this — producing both the flat upload copies (canonical → `<name>-SKILL.md`)
and the app directory copies (canonical → `<app>/.claude/skills/<name>/`) — is a planned
component. Until it exists, the discipline is manual and the rule holds regardless:
**if an app's vendored copy ever conflicts with `wolvryn-skills`, the `wolvryn-skills`
version wins.** Vendored skills and flat copies are *generated*, never hand-maintained.

---

## Project Initialization

Every Wolvryn project begins the same way, before any application code:

1. **Git repository first.** Initialize the repo and push to GitHub as step
   zero. No code, doc, or ADR exists outside version control.
2. **`.gitignore` before secrets.** Commit a `.gitignore` covering env files,
   build output, dependencies, and local tooling before any secret-bearing
   file could be created.
3. **Backlog lives in GitHub Issues.** Issues are the canonical backlog —
   not a markdown file in the repo. Use labels for severity (CRITICAL / HIGH /
   MEDIUM / LOW) and the version milestone for sequencing. BQ-style references
   in commits point at issue numbers.
4. **ADRs are independent files, indexed by a registry.** Each decision is its
   own `docs/decisions/ADR-NNN.md`. `docs/decisions/INDEX.md` is the registry —
   one row per ADR (number, title, status, date). The architect writes the full
   ADR file plus the single index row; nothing else edits the index.
5. **No DESIGN.md.** Structural decisions are ADRs. There is no separate design
   document.
6. **Stub ARCHITECTURE.md.** Create it at init in `docs/`, near-empty is correct. It is
   the single current-state document — how the system works now, its data flow, and its
   data model/dictionary. It grows with the code; it is never written ahead of it.
7. **Stub SESSION.md.** Create it at repo root at init. It holds the current working state
   (phase, last completed, next task, open decisions) and is the resume-point read first at
   session start. It owns working state only — never decisions (ADRs) or architecture
   (ARCHITECTURE.md), which it points at. The architect maintains it; it is committed so it
   travels with the repo as portable, durable memory of where work stands.
8. **Vendor the enterprise skills.** Copy the current `wolvryn-*` skills from
   `wolvryn-skills` into `.claude/skills/`, stamping each copy's `source_commit`. App
   skills (`<app>-*`) are authored as needed thereafter. See Skill Architecture.

---

## Versioning

Semantic versioning. Git tags mark each release. CHANGELOG.md is the canonical record.

- **Patch (vX.X.n):** Bug fixes, code quality, security, refactors. No user-facing changes.
- **Minor (vX.n.0):** New user-visible features.
- **Major (vn.0.0):** Breaking changes or platform shifts.

Work organized by target version, not by day or session number.

---

## Pre-Commit Checklist

- [ ] Audit run — all CRITICAL issues resolved
- [ ] Format check passes
- [ ] All tests passing
- [ ] Build passes
- [ ] `SESSION.md` updated — last completed, next task, open decisions current
- [ ] New ADRs written if decisions were made
- [ ] ARCHITECTURE.md updated if structure or data flow changed
- [ ] Data-model section updated if a field or table changed meaning, ownership, or existence
- [ ] README updated if stack or status changed
- [ ] Backlog reviewed — no blocking items unresolved
- [ ] Commit message follows conventional commits

---

## What These Standards Are NOT

- **Not stack-specific.** The stack changes per project. These principles don't.
- **Not a substitute for CLAUDE.md.** Each project's CLAUDE.md documents project-specific architecture.
- **Not optional.** Security principles especially are non-negotiable.