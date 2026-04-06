/**
 * UI-layer timezone helpers used by the page and components.
 *
 * These are kept separate from `lib/timezone.ts` (the data layer) so the
 * exported test surface stays minimal and the unit tests don't depend on
 * UI-only behavior.
 */

import { formatInTimeZone } from 'date-fns-tz'
import {
  COMMON_TIMEZONES,
  HALF_DAY_MIN,
  HourStatus,
  MINUTES_PER_DAY,
  NEAR_AFTER_END,
  NEAR_BEFORE_START,
  REGION_ORDER,
  WORK_END,
  WORK_START,
} from './constants'

export type TimezoneGroup = { label: string; zones: string[] }
export type TimezonePickerData = { common: readonly string[]; groups: TimezoneGroup[] }

/**
 * Build the grouped timezone picker data: a "Common" shortlist plus every
 * other IANA zone partitioned by region. Falls back to just the common list
 * if `Intl.supportedValuesOf` is unavailable.
 */
export function getAllTimezones(): TimezonePickerData {
  let all: string[]
  try {
    all = Intl.supportedValuesOf('timeZone')
  } catch {
    all = [...COMMON_TIMEZONES]
  }

  const commonSet = new Set(COMMON_TIMEZONES)
  const grouped: TimezoneGroup[] = []
  const used = new Set<string>()

  for (const region of REGION_ORDER) {
    const zones = all.filter(
      (tz) => !commonSet.has(tz) && region.prefixes.some((p) => tz.startsWith(p))
    )
    if (zones.length > 0) {
      grouped.push({ label: region.label, zones })
      zones.forEach((z) => used.add(z))
    }
  }

  // Catch-all for anything not matched (Etc/*, standalone like UTC, etc.)
  const remaining = all.filter((tz) => !commonSet.has(tz) && !used.has(tz))
  if (remaining.length > 0) {
    const otherGroup = grouped.find((g) => g.label === 'Other')
    if (otherGroup) {
      otherGroup.zones.push(...remaining)
    } else {
      grouped.push({ label: 'Other', zones: remaining })
    }
  }

  return { common: COMMON_TIMEZONES, groups: grouped }
}

/**
 * Classify an hour-of-day as inside working hours, near working hours, or off.
 * Boundaries are configured in `lib/constants.ts`.
 */
export function getHourStatus(hour: number): HourStatus {
  if (hour >= WORK_START && hour < WORK_END) return 'green'
  if (
    (hour >= NEAR_BEFORE_START && hour < WORK_START) ||
    (hour >= WORK_END && hour < NEAR_AFTER_END)
  ) {
    return 'amber'
  }
  return 'red'
}

/**
 * Try to get a friendly timezone abbreviation (e.g. JST, EDT, CT).
 * Falls back through `shortGeneric` → `short` → the IANA name itself.
 * Avoids returning "GMT+9"-style strings when a named abbreviation exists.
 */
export function formatTzAbbr(tz: string): string {
  try {
    const now = new Date()
    for (const style of ['shortGeneric', 'short'] as const) {
      try {
        const parts = Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: style,
        }).formatToParts(now)
        const val = parts.find((p) => p.type === 'timeZoneName')?.value
        if (val && !val.startsWith('GMT+') && !val.startsWith('GMT-')) return val
        if (val && style === 'short') return val // last resort
      } catch {
        // shortGeneric not supported in this engine, try next
      }
    }
    return tz
  } catch {
    return tz
  }
}

/**
 * Compute the integer hour offset of `tz` relative to `baseTz` at time `now`.
 * Returns the number of hours to add to a baseTz hour to get the tz hour.
 *
 * Uses formatInTimeZone (proven correct for card display) so there's no
 * sign-convention ambiguity.
 */
export function getHourDiff(tz: string, baseTz: string, now: Date): number {
  const baseH = parseInt(formatInTimeZone(now, baseTz, 'H'), 10)
  const baseM = parseInt(formatInTimeZone(now, baseTz, 'm'), 10)
  const tzH = parseInt(formatInTimeZone(now, tz, 'H'), 10)
  const tzM = parseInt(formatInTimeZone(now, tz, 'm'), 10)

  const baseTotalMin = baseH * 60 + baseM
  const tzTotalMin = tzH * 60 + tzM
  let diffMin = tzTotalMin - baseTotalMin
  // Normalize to [-720, +720) range to handle day boundary
  if (diffMin > HALF_DAY_MIN) diffMin -= MINUTES_PER_DAY
  if (diffMin <= -HALF_DAY_MIN) diffMin += MINUTES_PER_DAY
  return Math.round(diffMin / 60)
}

/** Detect the user's local IANA timezone, falling back to UTC. */
export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Wrap an arbitrary signed hour delta into the [0, 24) range.
 * Useful for rendering "what hour is it for member X when viewer is at hour H".
 */
export function wrapHour(h: number): number {
  return ((h % 24) + 24) % 24
}

/**
 * Format an (hour, minute) pair as a time string in either 12-hour or
 * 24-hour clock. This is the single source of truth for time rendering
 * across the app — every component that displays a clock value uses it.
 *
 * 12h examples: "9:00 AM", "12:30 PM", "11:49 PM"
 * 24h examples: "09:00", "12:30", "23:49"
 */
export function formatTime(hour: number, minute: number, use12h: boolean): string {
  const mm = String(minute).padStart(2, '0')
  if (!use12h) {
    return `${String(hour).padStart(2, '0')}:${mm}`
  }
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${mm} ${period}`
}

/**
 * Compact hour-of-day label for the timeline axis. Returns the bare number
 * in 24h mode ("00".."23") and a short 12h variant in 12h mode where only
 * 12a/12p carry an a/p suffix and the rest are bare digits ("1".."11").
 */
export function formatHourLabel(hour: number, use12h: boolean): string {
  if (!use12h) return String(hour).padStart(2, '0')
  if (hour === 0) return '12a'
  if (hour === 12) return '12p'
  return String(hour % 12)
}

/**
 * Detect whether the user's locale prefers a 12-hour clock by default.
 * Falls back to true (12-hour) if detection fails.
 */
export function detectLocaleUses12h(): boolean {
  try {
    return Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 ?? true
  } catch {
    return true
  }
}
