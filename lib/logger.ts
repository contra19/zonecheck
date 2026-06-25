/**
 * lib/logger.ts
 *
 * What: Minimal centralized logging seam for ZoneCheck server-side code.
 * Does: Routes diagnostic output through a single function so there are no scattered
 *       console.* calls and error detail stays server-side, never reaching clients.
 * Use when: Any server-side module needs to record an event or error. Never pass
 *           secrets or PII (full names, emails) — pass error.message, not the Error.
 */

// ─── Types ───────────────────────────────────────────────────

type LogLevel = 'info' | 'warn' | 'error'

/** Structured, non-sensitive context attached to a log line. */
type LogContext = Record<string, unknown>

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Emits a single structured log line. The one place output leaves the app —
 * swap this body for a transport (Datadog, etc.) without touching call sites.
 *
 * @param level - Severity of the entry.
 * @param scope - Originating module, e.g. 'api/detect'.
 * @param message - Human-readable description (no secrets/PII).
 * @param context - Optional structured detail (no secrets/PII).
 * @returns Nothing.
 * @throws {never}
 */
function emit(level: LogLevel, scope: string, message: string, context?: LogContext): void {
  const entry = { level, scope, message, ...(context ? { context } : {}) }
  // eslint-disable-next-line no-console -- the single sanctioned console seam
  console[level](JSON.stringify(entry))
}

// ─── Logger ──────────────────────────────────────────────────

export const logger = {
  /**
   * Logs an informational event.
   *
   * @param scope - Originating module.
   * @param message - Description (no secrets/PII).
   * @param context - Optional structured detail (no secrets/PII).
   * @returns Nothing.
   * @throws {never}
   */
  info(scope: string, message: string, context?: LogContext): void {
    emit('info', scope, message, context)
  },

  /**
   * Logs a warning event.
   *
   * @param scope - Originating module.
   * @param message - Description (no secrets/PII).
   * @param context - Optional structured detail (no secrets/PII).
   * @returns Nothing.
   * @throws {never}
   */
  warn(scope: string, message: string, context?: LogContext): void {
    emit('warn', scope, message, context)
  },

  /**
   * Logs an error event.
   *
   * @param scope - Originating module.
   * @param message - Description (no secrets/PII).
   * @param context - Optional structured detail (no secrets/PII).
   * @returns Nothing.
   * @throws {never}
   */
  error(scope: string, message: string, context?: LogContext): void {
    emit('error', scope, message, context)
  },
}
