'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTimezoneOffset } from 'date-fns-tz'
import {
  getCurrentTimeInZone,
  encodeTeam,
  decodeTeam,
  TeamMember,
} from '@/lib/timezone'

const TIMEZONES = [
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

function getOffsetHours(tz: string): number {
  return getTimezoneOffset(tz, new Date()) / 3_600_000
}

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

export default function Home() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState(TIMEZONES[0])
  const [label, setLabel] = useState('')
  const [tick, setTick] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)

  // Load team from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const teamParam = params.get('team')
    if (teamParam) {
      const decoded = decodeTeam(teamParam)
      if (decoded.length > 0) setTeam(decoded)
    }
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

  const copyMeetingInvite = () => {
    if (team.length === 0) return
    // Find best overlap hour — first hour where all members are in 9-18
    const viewerOffset = getOffsetHours(
      Intl.DateTimeFormat().resolvedOptions().timeZone
    )
    let bestHour: number | null = null
    for (let h = 0; h < 24; h++) {
      const allWorking = team.every((m) => {
        const memberOffset = getOffsetHours(m.timezone)
        const memberHour = ((h + memberOffset - viewerOffset) % 24 + 24) % 24
        return memberHour >= 9 && memberHour < 18
      })
      if (allWorking) {
        bestHour = h
        break
      }
    }
    // Fallback: use noon in first member's timezone
    if (bestHour === null) {
      const firstOffset = getOffsetHours(team[0].timezone)
      bestHour = ((12 - firstOffset + viewerOffset) % 24 + 24) % 24
    }

    const parts = team.map((m) => {
      const memberOffset = getOffsetHours(m.timezone)
      const memberHour = Math.round(
        ((bestHour! + memberOffset - viewerOffset) % 24 + 24) % 24
      )
      const hh = String(memberHour).padStart(2, '0')
      const abbr = formatTzAbbr(m.timezone)
      return `${hh}:00 ${abbr}`
    })

    const text = `Meeting at ${parts.join(' / ')}`
    navigator.clipboard.writeText(text)
    setCopied('invite')
    setTimeout(() => setCopied(null), 2000)
  }

  const shareTeam = () => {
    if (team.length === 0) return
    const encoded = encodeTeam(team)
    const url = `${window.location.origin}${window.location.pathname}?team=${encoded}`
    navigator.clipboard.writeText(url)
    setCopied('share')
    setTimeout(() => setCopied(null), 2000)
  }

  // Timeline computation
  const viewerTz = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC'
  const viewerOffset = getOffsetHours(viewerTz)
  const TIMELINE_START = 0
  const TIMELINE_END = 24
  const hours = Array.from(
    { length: TIMELINE_END - TIMELINE_START },
    (_, i) => i + TIMELINE_START
  )

  function getMemberHourAtViewerHour(memberTz: string, viewerHour: number): number {
    const memberOffset = getOffsetHours(memberTz)
    return ((viewerHour + memberOffset - viewerOffset) % 24 + 24) % 24
  }

  // Overlap hours: hours where ALL members are in 9-18
  const overlapHours = team.length > 0
    ? hours.filter((h) =>
        team.every((m) => {
          const mh = getMemberHourAtViewerHour(m.timezone, h)
          return mh >= 9 && mh < 18
        })
      )
    : []

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
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
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
              <div className="grid grid-cols-24 gap-px mb-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="text-[10px] text-gray-400 text-center"
                  >
                    {String(h).padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Member rows */}
              {team.map((member, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <div className="w-28 shrink-0 text-xs text-gray-600 dark:text-gray-300 truncate text-right pr-1">
                    {member.name}
                  </div>
                  <div
                    className="flex-1 grid gap-px rounded overflow-hidden"
                    style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                  >
                    {hours.map((h) => {
                      const memberHour = getMemberHourAtViewerHour(
                        member.timezone,
                        h
                      )
                      const isOverlap = overlapHours.includes(h)
                      const status = getHourStatus(memberHour)

                      let cellColor = 'bg-gray-100 dark:bg-gray-800'
                      if (status === 'green') {
                        cellColor = isOverlap
                          ? 'bg-teal-400 dark:bg-teal-500'
                          : 'bg-emerald-300 dark:bg-emerald-700'
                      } else if (status === 'amber') {
                        cellColor = 'bg-amber-200 dark:bg-amber-800'
                      }

                      return (
                        <div
                          key={h}
                          className={`h-6 ${cellColor}`}
                          title={`${member.name}: ${String(Math.round(memberHour)).padStart(2, '0')}:00 local`}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Overlap row */}
              {team.length > 1 && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="w-28 shrink-0 text-xs text-teal-600 dark:text-teal-400 font-medium text-right pr-1">
                    Overlap
                  </div>
                  <div
                    className="flex-1 grid gap-px rounded overflow-hidden"
                    style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                  >
                    {hours.map((h) => (
                      <div
                        key={h}
                        className={`h-6 ${
                          overlapHours.includes(h)
                            ? 'bg-teal-500 dark:bg-teal-400'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700 inline-block" />
                  Working (9am–6pm)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-teal-400 dark:bg-teal-500 inline-block" />
                  Overlap
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800 inline-block" />
                  Near hours (7–9am, 6–8pm)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 inline-block" />
                  Off hours
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
              Compare working hours across time zones
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
