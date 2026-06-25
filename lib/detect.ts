/**
 * lib/detect.ts
 *
 * What: Pure, framework-free helpers for the AI timezone-detect endpoint.
 * Does: Normalizes/length-caps untrusted input, delimits it for LLM instruction
 *       isolation, and validates LLM output against a strict contract before it
 *       reaches the client.
 * Use when: Called by app/api/detect/route.ts. Kept here (no React, no Next) so the
 *           security-critical logic is unit-testable in isolation.
 */

// ─── Types ───────────────────────────────────────────────────

export type DetectConfidence = 'high' | 'low'

/** The validated shape returned to the client by the detect endpoint. */
export type DetectResult = {
  name: string
  timezone: string
  confidence: DetectConfidence
}

/** Result of normalizing untrusted request input: either usable text or a clean error. */
export type NormalizedInput = { ok: true; text: string } | { ok: false; error: string }

// ─── Constants ───────────────────────────────────────────────

/**
 * Maximum characters accepted from the client before the LLM call. Unbounded
 * strings are DoS/cost and prompt-injection surfaces — this is the hard cap.
 */
export const MAX_DETECT_INPUT_LENGTH = 2000

/** Clean, client-safe messages. No internal/SDK detail ever leaks through these. */
export const INVALID_INPUT_MESSAGE = 'Missing or invalid "text" field'
export const TOO_LONG_MESSAGE = `Input exceeds the ${MAX_DETECT_INPUT_LENGTH}-character limit`

/**
 * Core sentinel token shared by both fences. Both delimiters embed this exact
 * string, so neutralizing it in untrusted text makes either fence un-forgeable —
 * single source of truth for the fence and the neutralizer alike.
 */
const SENTINEL_CORE = 'USER_INPUT'

/** Delimiters that fence the untrusted span so the model treats it as data, not instruction. */
const USER_TEXT_OPEN = `<<<${SENTINEL_CORE}`
const USER_TEXT_CLOSE = `${SENTINEL_CORE}>>>`

/** Inert marker swapped in for any user-supplied occurrence of the sentinel core. */
const SENTINEL_REDACTION = '[redacted-delimiter]'

/**
 * Matches the sentinel core case-insensitively, absorbing any adjacent run of
 * angle brackets so bracketed variants (`<<<USER_INPUT`, `USER_INPUT>>>>`, the
 * bare core) all collapse to the inert marker. Built from SENTINEL_CORE — which
 * is regex-literal-safe (letters + underscore) — so there is no second copy of
 * the token to drift.
 */
const SENTINEL_PATTERN = new RegExp(`<*${SENTINEL_CORE}>*`, 'gi')

const VALID_CONFIDENCE: readonly DetectConfidence[] = ['high', 'low']

// ─── Input handling ──────────────────────────────────────────

/**
 * Null-coalesces, trims, and length-caps the untrusted `text` field.
 *
 * @param value - Raw `text` from the request body; may be null/undefined/non-string.
 * @returns `{ ok: true, text }` for valid input, else `{ ok: false, error }` with a
 *          clean client-safe message.
 * @throws {never}
 */
export function normalizeDetectInput(value: unknown): NormalizedInput {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    return { ok: false, error: INVALID_INPUT_MESSAGE }
  }
  const text = (value ?? '').trim()
  if (text.length === 0) {
    return { ok: false, error: INVALID_INPUT_MESSAGE }
  }
  if (text.length > MAX_DETECT_INPUT_LENGTH) {
    return { ok: false, error: TOO_LONG_MESSAGE }
  }
  return { ok: true, text }
}

/**
 * Strips any sentinel token (and bracketed/case variants) out of untrusted text
 * so the user cannot reproduce the closing fence and break out of the delimited
 * span. The isolation in `delimitUserText` is only real because the delimiter
 * cannot be forged — this is what enforces that.
 *
 * @param text - Raw (already length-capped) user text.
 * @returns The text with every sentinel-core occurrence replaced by an inert marker.
 * @throws {never}
 */
export function neutralizeDelimiters(text: string): string {
  return text.replace(SENTINEL_PATTERN, SENTINEL_REDACTION)
}

/**
 * Wraps untrusted user text in explicit delimiters for LLM instruction-isolation.
 * The text is neutralized first so it cannot forge the closing fence.
 *
 * @param text - Already-normalized user text.
 * @returns The neutralized text fenced between sentinel delimiters.
 * @throws {never}
 */
export function delimitUserText(text: string): string {
  return `${USER_TEXT_OPEN}\n${neutralizeDelimiters(text)}\n${USER_TEXT_CLOSE}`
}

// ─── Output validation ───────────────────────────────────────

/**
 * Type guard confirming an unknown value matches the DetectResult contract.
 *
 * @param value - Parsed, untrusted value (e.g. from JSON.parse of LLM output).
 * @returns True only when value is `{ name: string, timezone: string,
 *          confidence: 'high' | 'low' }`.
 * @throws {never}
 */
export function isDetectResult(value: unknown): value is DetectResult {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const obj = value as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.timezone === 'string' &&
    typeof obj.confidence === 'string' &&
    (VALID_CONFIDENCE as readonly string[]).includes(obj.confidence)
  )
}

/**
 * Strips optional code fences, parses JSON, and validates against DetectResult.
 *
 * @param raw - Raw text returned by the model.
 * @returns The validated result, or null when parsing fails or output is
 *          non-conforming. Callers treat null as a clean upstream error.
 * @throws {never}
 */
export function parseDetectResult(raw: string): DetectResult | null {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  if (cleaned.length === 0) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return null
  }
  return isDetectResult(parsed) ? parsed : null
}
