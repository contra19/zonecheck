---
name: wolvryn-forge-code-standards
description: Coding standards for all Wolvryn FORGE products. Universal principles (modularity, dependency isolation, naming by intent, error handling, no magic values) plus default-stack (TypeScript / Next.js / React) conventions. Use alongside wolvryn-forge core when writing code, reviewing code, or running audits. Triggers when writing new code, refactoring, or discussing code quality.
metadata:
  skill_version: "1.0"
  source_repo: "wolvryn-skills"
  source_commit: "b1abde1"
---

# Wolvryn FORGE — Code Standards

Coding standards for all Wolvryn products. The **default Wolvryn stack is TypeScript / Next.js / React**, and the conventions below assume it. Most sections (Philosophy, Comments, Error Handling, Modularity, Dependency Isolation, Naming, Constants) are universal principles that hold regardless of stack. A few sections are stack-specific and are marked **[default stack]** — they apply to TypeScript / React / Next.js projects and should be adapted (or ignored) for any future Wolvryn product built on a different stack. Project-specific conventions (module boundaries, import rules) live in each project's CLAUDE.md.

---

## Philosophy

Code is read far more than it is written. Every file should be understandable by a developer picking it up for the first time with no prior context. Write for that person.

---

## File Headers — Every File

```typescript
/**
 * path/to/file.ts
 *
 * What: One sentence describing what this file is.
 * Does: One sentence describing what it does.
 * Use when: When to use this vs alternatives.
 */
```

---

## JSDoc — Every Exported Function

```typescript
/**
 * Brief description of what the function does.
 *
 * @param paramName - What this parameter is
 * @returns What is returned and when
 * @throws {Error} When the operation fails (or @throws {never})
 */
export async function myFunction(paramName: string): Promise<Result> {
```

JSDoc required on exported **functions** only. Types, interfaces, and constants are covered by the file header.

---

## Comments

- Comment the WHY, not the WHAT.
- No commented-out code committed.
- Section dividers for files with multiple logical sections:

```typescript
// ─── Types ───────────────────────────────────────────────────
// ─── Constants ───────────────────────────────────────────────
// ─── Component ───────────────────────────────────────────────
// ─── Helpers ─────────────────────────────────────────────────
```

---

## TypeScript — [default stack]

- Strict mode. No `any`. No implicit `any` through untyped parameters.
- Explicit return types on all exported functions.
- No type assertions (`as Type`) to silence errors — use type narrowing (`'key' in obj`, `instanceof`, type predicates).
- `as const` and `as const satisfies` are acceptable (compile-time only).
- `as Record<string, unknown>` is acceptable for narrowing untyped JSON responses.
- Prefer `type` over `interface` for plain data shapes.

---

## Error Handling

- All async functions use try/catch. No unhandled promise rejections.
- **Exception:** async functions whose only awaited calls are typed-never-throw helpers (documented with `@throws {never}`) are exempt. Call site must include a comment explaining why.
- Errors logged with context before re-throwing.
- User-facing error messages are plain English. Never expose raw errors or stack traces.
- Framework control-flow errors (Next.js redirects, etc.) must be re-thrown, not swallowed.

```typescript
try {
  const data = await fetchSomething();
  return data;
} catch (error) {
  logger.error('module', 'operation', 'description', {
    error: error instanceof Error ? error.message : String(error),
  });
  throw error;
}
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case.ts` | `briefing-topic-data.ts` |
| Components | `PascalCase.tsx` | `WeatherChip.tsx` |
| Functions | `camelCase` | `fetchWeatherData` |
| Booleans | `is/has/can/should` prefix | `isActive`, `hasExpired` |
| Async fetch | `get/fetch` prefix | `getTopicsByUser` |
| Event handlers | `handle` prefix | `handleSubmit` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_TOPICS_FREE` |
| DB tables | `snake_case` | `source_cache` |
| Env vars | `SCREAMING_SNAKE_CASE` | `ANTHROPIC_API_KEY` |

---

## Modularity

- **One function, one job.** If the description contains "and" — split it.
- **Function length limit: 40 lines.** JSX render functions exempt — UI rendering is inherently verbose.
- **File length: 200 lines triggers review.** Not automatic split. Split only when a file genuinely mixes distinct responsibilities. A 300-line file that does one thing cohesively is fine.
- **No deep nesting.** Maximum 3 levels. Use early returns to flatten logic.
- **Pure functions preferred.** No side effects unless necessary.
- **Named exports** over default exports, except where frameworks require defaults.

---

## Dependency Isolation

A dependency on an external service — database client, model API, platform primitive,
third-party SDK — lives behind one module that owns it. Call sites use that module,
never the SDK directly.

**Audit test:** "If we had to swap this dependency, how many files change?" If the
answer is more than the owning module, the dependency has leaked into the app and
should be re-encapsulated before new code is built on top of it.

- Provider-specific features are used fully *inside* the owning module. Isolation
  contains the blast radius of a swap; it does not mean avoiding good features.
- Do NOT abstract foundational dependencies (language, framework) you will not
  realistically swap. Over-abstraction there costs quality for portability you'll
  never use.

---

## Component File Structure — [default stack]

```typescript
'use client'; // if needed, with comment explaining WHY

/**
 * File header comment
 */

// ─── Imports ─────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────
type Props = { ... }

// ─── Constants ───────────────────────────────────────────────
const SOME_LIMIT = 5;

// ─── Component ───────────────────────────────────────────────
export function MyComponent({ prop }: Props): React.ReactNode {
  // 1. Hooks
  // 2. Derived state / computed values
  // 3. Handlers (handle* naming)
  // 4. Render
}

// ─── Helpers ─────────────────────────────────────────────────
```

---

## Import Ordering — [default stack]

```typescript
// Group 1: Framework core (React, Next.js, etc.)
// Group 2: Third-party packages
// Group 3: Internal config and utils
// Group 4: Internal lib and constants
// Group 5: Internal components
// Group 6: Internal types
// [blank line between each group]
```

`import 'server-only'` goes FIRST — framework requirement, exempt from side-effect ordering.

---

## Formatting — Prettier

Prettier handles all formatting. Standard config:
- Single quotes
- Semicolons: yes
- Tab width: 2 spaces
- Trailing commas: es5
- Print width: 100 characters

Vendor/generated files and markdown docs go in `.prettierignore`.

---

## Constants — No Magic Values

```typescript
// BAD
if (items.length >= 10) { ... }

// GOOD
const MAX_ITEMS_PER_PAGE = 10;
if (items.length >= MAX_ITEMS_PER_PAGE) { ... }
```

Shared constants in a dedicated constants directory. Single-use constants at the top of the file they're used in.
