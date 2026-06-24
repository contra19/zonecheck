---
name: wolvryn-forge-testing
description: Testing standards for all Wolvryn FORGE products. Coverage expectations, mock patterns, edge-case rules, and test quality standards. Use alongside wolvryn-forge core when writing tests, reviewing test coverage, or running audits. Triggers when writing tests, discussing coverage, or reviewing test files.
---

# Wolvryn FORGE — Testing Standards

Testing standards that apply across all Wolvryn projects regardless of framework or test runner.

---

## Core Rules

- Every lib module has a corresponding test file.
- Every service module has a corresponding test file.
- Tests written before the module is considered done.
- Test file mirrors source path: `src/lib/foo.ts` → `src/__tests__/lib/foo.test.ts`
- Minimum coverage per function: happy path + one failure/error case + edge cases.

---

## What to Test

### Always test:
- Happy path — the function does what it's supposed to do
- Error paths — the function fails gracefully when inputs are bad or dependencies fail
- Edge cases — null, undefined, empty string, empty array, boundary values
- Tier limits — at limit, one over limit, one under limit, for each tier
- Auth boundaries — unauthenticated access, wrong user, admin vs regular

### Test the contract, not the implementation:
- Test what the function returns, not how it builds the return value
- Test what side effects occur (DB writes, API calls), not the internal order of operations
- If you refactor the internals without changing behavior, tests should still pass

---

## Mock Patterns

- **Mock at the boundary** — mock external services (database, APIs, file system), not internal modules.
- **Mock cleanup between tests** — `vi.restoreAllMocks()` (or equivalent) in `afterEach`.
- **Named constants for test data** — no magic strings or numbers in tests.
- **No `as` type casts in tests** — use proper generics and explicit null guards.

```typescript
// BAD — magic values, no cleanup
test('creates person', async () => {
  mockSupabase.from.mockReturnValue({ data: { id: '123', name: 'Bob' } });
  const result = await createPerson('user_abc', { name: 'Bob' });
  expect(result.name).toBe('Bob');
});

// GOOD — named constants, explicit types, cleanup
const TEST_USER_ID = 'user_test_abc';
const TEST_PERSON = { id: 'person_test_123', name: 'Bob Smith' } as const;

afterEach(() => { vi.restoreAllMocks(); });

test('creates person and returns the persisted record', async () => {
  mockSupabase.from.mockReturnValue({ data: TEST_PERSON, error: null });
  const result = await createPerson(TEST_USER_ID, { name: TEST_PERSON.name });
  expect(result).toEqual(TEST_PERSON);
});
```

---

## Null and Edge-Case Coverage

Every function that accepts string input must have tests for:
- `null` passed for optional fields
- Empty string `''` passed for required fields
- String with only whitespace `'   '`
- String at the maximum length boundary
- String exceeding the maximum length

This is non-negotiable. Production 500 errors have been caused by null arriving where empty string was assumed.

---

## Tier-Limit Tests

Every function that enforces tier limits must have tests at:
- One under the limit (should succeed)
- Exactly at the limit (should succeed)
- One over the limit (should fail with clean error)
- For each tier (free and pro, or equivalent)

---

## Test Descriptions

- Describe the expected behavior, not the implementation: `'returns empty array when user has no topics'` not `'calls supabase select and filters'`
- Group related tests with `describe` blocks matching the function name
- Use `it` or `test` consistently within a project (pick one)

---

## What NOT to Test

- Framework internals (React rendering, Next.js routing)
- Third-party library behavior (Supabase client, Clerk auth)
- Pure type definitions
- CSS / styling (visual regression testing is a separate concern)
- Generated code (Supabase types, shadcn components)

---

## Test Quality Checklist

When reviewing tests, check for:
- [ ] Tests that only assert "does not throw" without checking return values
- [ ] Tests with hardcoded timestamps or IDs that will break
- [ ] Missing mock cleanup between tests
- [ ] Tests that pass when the tested function is deleted (testing the mock, not the code)
- [ ] Missing error-path tests for async functions
- [ ] Tests that test multiple behaviors in one test case (split them)
