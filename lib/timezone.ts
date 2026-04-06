import { formatInTimeZone, getTimezoneOffset } from 'date-fns-tz'

/**
 * A single team member tracked by ZoneCheck.
 *
 * @property name     Display name (free text).
 * @property timezone IANA timezone identifier (e.g. "America/New_York").
 * @property label    Optional team or role label (e.g. "Engineering").
 */
export type TeamMember = {
  name: string
  timezone: string
  label?: string
}

/**
 * Get the current local time, date, UTC offset, and DST status for an IANA
 * timezone. Returns `null` for invalid or empty timezone strings rather than
 * throwing — callers can render an empty/error state without try/catch.
 *
 * @param ianaTimezone An IANA timezone identifier (e.g. "Asia/Tokyo").
 * @returns An object with `time` (HH:mm), `date` (yyyy-MM-dd), `offset`
 *          (e.g. "UTC+09:00"), and `isDST` flag — or `null` if invalid.
 */
export function getCurrentTimeInZone(
  ianaTimezone: string
): { time: string; date: string; offset: string; isDST: boolean } | null {
  try {
    if (!ianaTimezone) return null
    // Validate by attempting to create a formatter — throws on invalid zones
    Intl.DateTimeFormat(undefined, { timeZone: ianaTimezone })
    const now = new Date()
    const time = formatInTimeZone(now, ianaTimezone, 'HH:mm')
    const date = formatInTimeZone(now, ianaTimezone, 'yyyy-MM-dd')
    const offsetMs = getTimezoneOffset(ianaTimezone, now)
    const totalMinutes = offsetMs / 60_000
    const sign = totalMinutes >= 0 ? '+' : '-'
    const absMinutes = Math.abs(totalMinutes)
    const hours = Math.floor(absMinutes / 60)
    const minutes = absMinutes % 60
    const offset = `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

    // Check DST by comparing January and July offsets
    const jan = new Date(now.getFullYear(), 0, 1)
    const jul = new Date(now.getFullYear(), 6, 1)
    const janOffset = getTimezoneOffset(ianaTimezone, jan)
    const julOffset = getTimezoneOffset(ianaTimezone, jul)
    const standardOffset = Math.min(janOffset, julOffset)
    const isDST = offsetMs !== standardOffset && janOffset !== julOffset

    return { time, date, offset, isDST }
  } catch {
    return null
  }
}

/** Internal: UTF-8 → URL-safe base64 (works in browsers without Buffer). */
function utf8ToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

/** Internal: URL-safe base64 → UTF-8. */
function base64ToUtf8(b64: string): string {
  return decodeURIComponent(escape(atob(b64)))
}

/**
 * Encode a team into a URL-safe base64 string suitable for use as a query
 * parameter. The output strips `+`, `/`, and trailing `=` characters so it
 * can be embedded directly in a URL without further escaping.
 *
 * @param members The team to encode.
 * @returns A URL-safe base64 string.
 */
export function encodeTeam(members: TeamMember[]): string {
  const json = JSON.stringify(members)
  const base64 = utf8ToBase64(json)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a team from a URL-safe base64 query parameter. Returns `[]` on any
 * parse failure or if the payload doesn't look like a valid team — never
 * throws. Members with missing or wrong-typed fields are filtered out.
 *
 * @param param A previously-encoded team string.
 * @returns A validated `TeamMember[]` (possibly empty).
 */
export function decodeTeam(param: string): TeamMember[] {
  try {
    const base64 = param.replace(/-/g, '+').replace(/_/g, '/')
    const json = base64ToUtf8(base64)
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is TeamMember =>
        typeof m === 'object' &&
        m !== null &&
        typeof m.name === 'string' &&
        typeof m.timezone === 'string' &&
        (m.label === undefined || typeof m.label === 'string')
    )
  } catch {
    return []
  }
}
