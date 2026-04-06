/**
 * Shared constants for ZoneCheck — magic numbers, timezone lists, color tables.
 * Centralizing these prevents drift across components and makes tuning trivial.
 */

/** Working-hour boundaries (24-hour clock, member-local). */
export const WORK_START = 9
export const WORK_END = 18

/** "Near working hours" buffer used by the amber status. */
export const NEAR_BEFORE_START = 7
export const NEAR_AFTER_END = 20

/** How often the live clocks refresh, in milliseconds. */
export const CLOCK_REFRESH_MS = 60_000

/** How long copy/share confirmation toasts remain visible. */
export const TOAST_DURATION_MS = 2000

/** Hours-in-a-day constants used by the timeline math. */
export const HOURS_PER_DAY = 24
export const MINUTES_PER_DAY = 1440
export const HALF_DAY_MIN = 720

/** A frozen [0..23] array used by every timeline row. */
export const HOURS: readonly number[] = Array.from({ length: HOURS_PER_DAY }, (_, i) => i)

/**
 * Shared CSS-grid style — extracted so every timeline row uses the identical
 * object reference (helps React skip re-allocs and keeps subpixel alignment
 * consistent across rows).
 */
export const GRID_COLS_STYLE: React.CSSProperties = {
  gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
}

/** The shortlist of timezones shown at the top of the picker. */
export const COMMON_TIMEZONES: readonly string[] = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
]

/** Region groupings for the full IANA picker. */
export const REGION_ORDER = [
  { label: 'Americas', prefixes: ['America/'] },
  { label: 'Europe', prefixes: ['Europe/'] },
  { label: 'Africa', prefixes: ['Africa/'] },
  { label: 'Asia', prefixes: ['Asia/'] },
  { label: 'Australia & Pacific', prefixes: ['Australia/', 'Pacific/'] },
  { label: 'Other', prefixes: ['Antarctica/', 'Arctic/', 'Indian/', 'Atlantic/'] },
] as const

export type HourStatus = 'green' | 'amber' | 'red'

/** Status dot background classes used on member cards. */
export const STATUS_COLORS: Record<HourStatus, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-400',
  red: 'bg-red-500',
}

/** Human-readable status labels (used by tooltips and screen readers). */
export const STATUS_LABELS: Record<HourStatus, string> = {
  green: 'Working hours',
  amber: 'Near working hours',
  red: 'Outside working hours',
}
