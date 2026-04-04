import { formatInTimeZone, getTimezoneOffset } from 'date-fns-tz'

export type TeamMember = {
  name: string
  timezone: string
  label?: string
}

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

export function encodeTeam(members: TeamMember[]): string {
  const json = JSON.stringify(members)
  const base64 = Buffer.from(json, 'utf-8').toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeTeam(param: string): TeamMember[] {
  try {
    const base64 = param.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(base64, 'base64').toString('utf-8')
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
