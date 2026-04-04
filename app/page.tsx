'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import {
  getCurrentTimeInZone,
  encodeTeam,
  decodeTeam,
  TeamMember,
} from '@/lib/timezone'

const COMMON_TIMEZONES = [
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

const REGION_ORDER = [
  { label: 'Americas', prefix: 'America/' },
  { label: 'Europe', prefix: 'Europe/' },
  { label: 'Africa', prefix: 'Africa/' },
  { label: 'Asia', prefix: 'Asia/' },
  { label: 'Australia & Pacific', prefixes: ['Australia/', 'Pacific/'] },
  { label: 'Other', prefixes: ['Antarctica/', 'Arctic/', 'Indian/', 'Atlantic/'] },
] as const

function getAllTimezones(): { common: string[]; groups: { label: string; zones: string[] }[] } {
  let all: string[]
  try {
    all = Intl.supportedValuesOf('timeZone')
  } catch {
    all = COMMON_TIMEZONES
  }

  const commonSet = new Set(COMMON_TIMEZONES)
  const grouped: { label: string; zones: string[] }[] = []
  const used = new Set<string>()

  for (const region of REGION_ORDER) {
    const prefixes = 'prefixes' in region ? region.prefixes : [region.prefix]
    const zones = all.filter(
      (tz) => !commonSet.has(tz) && prefixes.some((p) => tz.startsWith(p))
    )
    if (zones.length > 0) {
      grouped.push({ label: region.label, zones })
      zones.forEach((z) => used.add(z))
    }
  }

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

function getHourStatus(hour: number): 'green' | 'amber' | 'red' {
  if (hour >= 9 && hour < 18) return 'green'
  if ((hour >= 7 && hour < 9) || (hour >= 18 && hour < 20)) return 'amber'
  return 'red'
}

const STATUS_COLORS = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-400',
  red: 'bg-red-500',
} as const

const STATUS_LABELS = {
  green: 'Working hours',
  amber: 'Near working hours',
  red: 'Outside working hours',
} as const

function formatTzAbbr(tz: string): string {
  try {
    const parts = Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(new Date())
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz
  } catch {
    return tz
  }
}

function getHourDiff(tz: string, baseTz: string, now: Date): number {
  const baseH = parseInt(formatInTimeZone(now, baseTz, 'H'), 10)
  const baseM = parseInt(formatInTimeZone(now, baseTz, 'm'), 10)
  const tzH = parseInt(formatInTimeZone(now, tz, 'H'), 10)
  const tzM = parseInt(formatInTimeZone(now, tz, 'm'), 10)

  const baseTotalMin = baseH * 60 + baseM
  const tzTotalMin = tzH * 60 + tzM
  let diffMin = tzTotalMin - baseTotalMin
  if (diffMin > 720) diffMin -= 1440
  if (diffMin <= -720) diffMin += 1440
  return Math.round(diffMin / 60)
}

function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/** Shared grid style — extracted so every row uses the identical object ref */
const GRID_COLS_STYLE = { gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }

const HOURS = Array.from({ length: 24 }, (_, i) => i)

/**
 * A single row of 24 hour-cells. The clip boundary (overflow-hidden + rounded)
 * lives on a wrapper <div> rather than on the CSS-grid element itself. This
 * prevents a Chrome/Safari compositing bug where `overflow:hidden` on a grid
 * with fractional-px column widths can collapse cell backgrounds to 0 height.
 */
function TimelineRow({
  cells,
}: {
  cells: { color: string; title: string }[]
}) {
  return (
    <div className="flex-1 overflow-hidden rounded">
      <div className="grid" style={GRID_COLS_STYLE}>
        {cells.map((c, i) => (
          <div
            key={i}
            className={`h-6 ${c.color}`}
            title={c.title}
          />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [label, setLabel] = useState('')
  const [tick, setTick] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [viewerTz, setViewerTz] = useState('UTC')
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [detectMsg, setDetectMsg] = useState<{ text: string; type: 'warn' | 'error' } | null>(null)

  const tzData = useMemo(() => getAllTimezones(), [])

  // Detect local timezone, load team from URL, set up PWA install prompt
  useEffect(() => {
    const localTz = getLocalTimezone()
    setViewerTz(localTz)
    setTimezone(localTz)

    const params = new URLSearchParams(window.location.search)
    const teamParam = params.get('team')
    if (teamParam) {
      const decoded = decodeTeam(teamParam)
      if (decoded.length > 0) setTeam(decoded)
    }

    // Only show install UI when not already installed as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    // Chrome/Android: capture beforeinstallprompt
    const handlePrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)

    // iOS Safari (no beforeinstallprompt): detect and show manual instructions
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    if (isIOS) {
      setShowInstallBanner(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  // Refresh clock every 60s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const addMember = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    setTeam((prev) => [
      ...prev,
      { name: trimmed, timezone, label: label.trim() || undefined },
    ])
    setName('')
    setLabel('')
  }, [name, timezone, label])

  const removeMember = (index: number) => {
    setTeam((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDetect = async () => {
    const trimmed = pasteText.trim()
    if (!trimmed) return
    setDetecting(true)
    setDetectMsg(null)
    try {
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await res.json()
      if (data.error) {
        setDetectMsg({ text: data.error, type: 'error' })
      } else {
        setName(data.name || '')
        setTimezone(data.timezone || timezone)
        setPasteText('')
        if (data.confidence === 'low') {
          setDetectMsg({ text: 'Best guess — please confirm the timezone.', type: 'warn' })
        }
      }
    } catch {
      setDetectMsg({ text: 'Could not reach the detection API.', type: 'error' })
    } finally {
      setDetecting(false)
    }
  }

  // Precompute hour diffs for all members (relative to viewer)
  const now = useMemo(() => new Date(), [tick])
  const memberDiffs = useMemo(
    () => team.map((m) => getHourDiff(m.timezone, viewerTz, now)),
    [team, viewerTz, now]
  )

  // Per-hour availability count: how many members are in [9, 18) at each viewer-local hour
  const availCounts = useMemo(() => {
    if (team.length === 0) return HOURS.map(() => 0)
    return HOURS.map((h) =>
      memberDiffs.reduce((count, diff) => {
        const mh = ((h + diff) % 24 + 24) % 24
        return count + (mh >= 9 && mh < 18 ? 1 : 0)
      }, 0)
    )
  }, [team.length, memberDiffs])

  // Ideal window: best hour where ALL members are in 9-18 (100% availability)
  const idealWindow = useMemo(() => {
    if (team.length < 2) return null
    const fullHours = HOURS.filter((h) => availCounts[h] === team.length)
    if (fullHours.length === 0) return null
    const hour = fullHours.reduce((best, h) =>
      Math.abs(h - 10) < Math.abs(best - 10) ? h : best
    )
    return { hour, count: team.length }
  }, [team.length, availCounts])

  // Best available window: highest availability across all 24 hours
  const bestAvailable = useMemo(() => {
    if (team.length < 2) return null
    const max = Math.max(...availCounts)
    if (max === 0) return null
    const candidates = HOURS.filter((h) => availCounts[h] === max)
    const hour = candidates.reduce((best, h) =>
      Math.abs(h - 10) < Math.abs(best - 10) ? h : best
    )
    // Identify who is outside working hours at this hour
    const offHours: { name: string; localHour: number; abbr: string }[] = []
    team.forEach((m, i) => {
      const mh = ((hour + memberDiffs[i]) % 24 + 24) % 24
      if (mh < 9 || mh >= 18) {
        offHours.push({
          name: m.name,
          localHour: mh,
          abbr: formatTzAbbr(m.timezone),
        })
      }
    })
    return { hour, count: max, offHours }
  }, [team, memberDiffs, availCounts])

  const copyMeetingInvite = () => {
    if (team.length === 0) return
    let bestViewerHour: number
    if (idealWindow) {
      bestViewerHour = idealWindow.hour
    } else if (bestAvailable) {
      bestViewerHour = bestAvailable.hour
    } else {
      bestViewerHour = ((12 - memberDiffs[0]) % 24 + 24) % 24
    }

    const parts = team.map((m, i) => {
      const memberHour = ((bestViewerHour + memberDiffs[i]) % 24 + 24) % 24
      const hh = String(memberHour).padStart(2, '0')
      const abbr = formatTzAbbr(m.timezone)
      return `${hh}:00 ${abbr}`
    })

    const text = `Meeting at ${parts.join(' / ')}`
    navigator.clipboard.writeText(text)
    setCopied('invite')
    setTimeout(() => setCopied(null), 2000)
  }

  const shareTeam = async () => {
    if (team.length === 0) return
    const encoded = encodeTeam(team)
    const url = `${window.location.origin}${window.location.pathname}?team=${encoded}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'ZoneCheck Team', url })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied('share')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleInstallClick = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallBanner(false)
    }
    setInstallPrompt(null)
  }

  // Force re-render uses tick
  void tick

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[family-name:var(--font-geist-sans)]">
      <header className="bg-teal-600 text-white py-6 px-4 shadow-md">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">ZoneCheck</h1>
          <p className="text-teal-100 text-sm mt-1">
            See your team across time zones
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* AI Paste Detection */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Paste Anything
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              placeholder="Paste a name, location, Slack bio, email signature..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={2}
              className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <button
              onClick={handleDetect}
              disabled={detecting || !pasteText.trim()}
              className="self-end rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 text-sm font-medium transition-colors whitespace-nowrap"
            >
              {detecting ? 'Detecting...' : 'Detect'}
            </button>
          </div>
          {detectMsg && (
            <p
              className={`mt-2 text-xs ${
                detectMsg.type === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {detectMsg.text}
            </p>
          )}
        </section>

        {/* Add Member Form */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Add Team Member
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
              className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-xs"
            >
              <optgroup label="Common">
                {tzData.common.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </optgroup>
              {tzData.groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.zones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input
              type="text"
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
              className="sm:w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={addMember}
              className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Add
            </button>
          </div>
        </section>

        {/* Team Cards */}
        {team.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((member, i) => {
              const info = getCurrentTimeInZone(member.timezone)
              const hour = info ? parseInt(info.time.split(':')[0], 10) : -1
              const status = hour >= 0 ? getHourStatus(hour) : 'red'

              return (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 relative group"
                >
                  <button
                    onClick={() => removeMember(i)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                    aria-label={`Remove ${member.name}`}
                  >
                    &times;
                  </button>
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 w-3 h-3 rounded-full shrink-0 ${STATUS_COLORS[status]}`}
                      title={STATUS_LABELS[status]}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {member.name}
                      </div>
                      {member.label && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {member.label}
                        </div>
                      )}
                      <div className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {info?.time ?? '--:--'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {member.timezone.replace(/_/g, ' ')} &middot;{' '}
                        {info?.offset ?? ''}
                        {info?.isDST ? ' (DST)' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* Timeline */}
        {team.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 overflow-x-auto">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Working Hours Timeline
              <span className="ml-2 font-normal normal-case text-gray-400 dark:text-gray-500">
                (your local time: {viewerTz.replace(/_/g, ' ')})
              </span>
            </h2>

            <div className="min-w-[640px]">
              {/* Hour labels */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-28 shrink-0" />
                <div className="flex-1 grid" style={GRID_COLS_STYLE}>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="text-[10px] text-gray-400 text-center"
                    >
                      {String(h).padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Member rows */}
              {team.map((member, i) => {
                const cells = HOURS.map((h) => {
                  const memberHour = ((h + memberDiffs[i]) % 24 + 24) % 24
                  const allAvailable = availCounts[h] === team.length
                  const status = getHourStatus(memberHour)

                  let color = 'bg-gray-200 dark:bg-gray-700'
                  if (status === 'green') {
                    color = allAvailable
                      ? 'bg-teal-400 dark:bg-teal-500'
                      : 'bg-emerald-300 dark:bg-emerald-700'
                  } else if (status === 'amber') {
                    color = 'bg-amber-200 dark:bg-amber-800'
                  }

                  return {
                    color,
                    title: `${member.name}: ${String(memberHour).padStart(2, '0')}:00 local`,
                  }
                })

                return (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-28 shrink-0 text-xs text-gray-600 dark:text-gray-300 truncate text-right pr-1">
                      {member.name}
                    </div>
                    <TimelineRow cells={cells} />
                  </div>
                )
              })}

              {/* Availability heatmap row */}
              {team.length > 1 && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="w-28 shrink-0 text-xs text-green-700 dark:text-green-400 font-medium text-right pr-1">
                    Availability
                  </div>
                  <TimelineRow
                    cells={HOURS.map((h) => {
                      const count = availCounts[h]
                      const total = team.length
                      const pct = count / total

                      let color: string
                      if (pct === 0) {
                        color = 'bg-red-200 dark:bg-red-900'
                      } else if (pct <= 0.33) {
                        color = 'bg-green-100 dark:bg-green-900'
                      } else if (pct <= 0.66) {
                        color = 'bg-green-200 dark:bg-green-800'
                      } else if (pct < 1) {
                        color = 'bg-green-400 dark:bg-green-600'
                      } else {
                        color = 'bg-green-600 dark:bg-green-400'
                      }

                      return {
                        color,
                        title: `${count} of ${total} available`,
                      }
                    })}
                  />
                </div>
              )}

              {/* Meeting window banners */}
              {team.length > 1 && idealWindow && idealWindow.hour === bestAvailable?.hour && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-28 shrink-0" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-green-700 dark:text-green-400">Best window:</span>{' '}
                    <span className="font-semibold">
                      {String(idealWindow.hour).padStart(2, '0')}:00 {formatTzAbbr(viewerTz)}
                    </span>
                    {' '}&middot; All in working hours
                  </p>
                </div>
              )}
              {team.length > 1 && idealWindow && idealWindow.hour !== bestAvailable?.hour && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-28 shrink-0" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-green-700 dark:text-green-400">Ideal window:</span>{' '}
                    <span className="font-semibold">
                      {String(idealWindow.hour).padStart(2, '0')}:00 {formatTzAbbr(viewerTz)}
                    </span>
                    {' '}&middot; All {team.length} in working hours
                  </p>
                </div>
              )}
              {team.length > 1 && bestAvailable && (!idealWindow || idealWindow.hour !== bestAvailable.hour) && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-28 shrink-0" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-teal-600 dark:text-teal-400">Best available:</span>{' '}
                    <span className="font-semibold">
                      {String(bestAvailable.hour).padStart(2, '0')}:00 {formatTzAbbr(viewerTz)}
                    </span>
                    {' '}&middot; {bestAvailable.count} of {team.length} available
                    {bestAvailable.offHours.length > 0 && (
                      <>
                        {' '}&middot;{' '}
                        {bestAvailable.offHours.map((o, i) => (
                          <span key={i} className="text-amber-600 dark:text-amber-400">
                            {i > 0 && ' · '}
                            {o.name} takes {o.localHour < 9 ? 'an early' : 'a late'} call ({String(o.localHour).padStart(2, '0')}:00 {o.abbr})
                          </span>
                        ))}
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700 inline-block" />
                  Working (9am-6pm)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800 inline-block" />
                  Near hours (7-9am, 6-8pm)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700 inline-block" />
                  Off hours
                </span>
                <span className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-4">
                  Availability (% of team):
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900 inline-block" />
                  None
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800 inline-block" />
                  Some
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600 inline-block" />
                  Most
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-400 inline-block" />
                  All
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Action Buttons */}
        {team.length > 0 && (
          <section className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={copyMeetingInvite}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {copied === 'invite' ? 'Copied!' : 'Copy Meeting Invite'}
            </button>
            <button
              onClick={shareTeam}
              className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {copied === 'share' ? 'Link Copied!' : 'Share Team'}
            </button>
          </section>
        )}

        {/* Empty state */}
        {team.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-lg">Add team members to get started</p>
            <p className="text-sm mt-1">
              Paste a name or location above to add someone instantly, or fill in the form manually.
            </p>
          </div>
        )}
      </main>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 pointer-events-none">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 pointer-events-auto flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Install ZoneCheck
              </p>
              {installPrompt ? (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 text-xs font-medium transition-colors"
                  >
                    Install App
                  </button>
                  <button
                    onClick={() => setShowInstallBanner(false)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tap the <strong>Share</strong> button then &ldquo;Add to Home
                  Screen&rdquo; to install.
                </p>
              )}
            </div>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Type for the beforeinstallprompt event (not in lib.dom.d.ts)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
