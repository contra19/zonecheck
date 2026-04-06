'use client'

import {
  GRID_COLS_STYLE,
  HOURS,
  WORK_END,
  WORK_START,
} from '@/lib/constants'
import { TeamMember } from '@/lib/timezone'
import { formatTzAbbr, getHourStatus, wrapHour } from '@/lib/timezone-utils'
import { TimelineRow } from './TimelineRow'

export type WindowSummary = { hour: number; count: number }
export type BestAvailableSummary = WindowSummary & {
  offHours: { name: string; localHour: number; abbr: string }[]
}

type TimelineProps = {
  team: TeamMember[]
  viewerTz: string
  memberDiffs: number[]
  availCounts: number[]
  idealWindow: WindowSummary | null
  bestAvailable: BestAvailableSummary | null
}

function availabilityColor(pct: number): string {
  if (pct === 0) return 'bg-red-200 dark:bg-red-900'
  if (pct <= 0.33) return 'bg-green-100 dark:bg-green-900'
  if (pct <= 0.66) return 'bg-green-200 dark:bg-green-800'
  if (pct < 1) return 'bg-green-400 dark:bg-green-600'
  return 'bg-green-600 dark:bg-green-400'
}

/** Format an hour-of-day (0-23) as "7:00 PM" using 12-hour clock with AM/PM. */
function formatHour12(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:00 ${period}`
}

export function Timeline({
  team,
  viewerTz,
  memberDiffs,
  availCounts,
  idealWindow,
  bestAvailable,
}: TimelineProps) {
  const showBothBanners =
    team.length > 1 &&
    idealWindow !== null &&
    bestAvailable !== null &&
    idealWindow.hour !== bestAvailable.hour
  const showCombinedBanner =
    team.length > 1 &&
    idealWindow !== null &&
    bestAvailable !== null &&
    idealWindow.hour === bestAvailable.hour
  const showBestAvailableBanner =
    team.length > 1 &&
    bestAvailable !== null &&
    (idealWindow === null || idealWindow.hour !== bestAvailable.hour)

  return (
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
              <div key={h} className="text-[10px] text-gray-400 text-center">
                {String(h).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>

        {/* Member rows */}
        {team.map((member, i) => {
          const cells = HOURS.map((h) => {
            const memberHour = wrapHour(h + memberDiffs[i])
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
                const viewerAbbr = formatTzAbbr(viewerTz)
                return {
                  color: availabilityColor(count / total),
                  title: `${formatHour12(h)} ${viewerAbbr} · ${count} of ${total} available`,
                }
              })}
            />
          </div>
        )}

        {/* Combined banner — ideal and best available are the same hour */}
        {showCombinedBanner && idealWindow && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-28 shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-green-700 dark:text-green-400">
                Best window:
              </span>{' '}
              <span className="font-semibold">
                {String(idealWindow.hour).padStart(2, '0')}:00 {formatTzAbbr(viewerTz)}
              </span>
              {' '}&middot; All in working hours
            </p>
          </div>
        )}

        {/* Ideal window banner — shown when distinct from best available */}
        {showBothBanners && idealWindow && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-28 shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-green-700 dark:text-green-400">
                Ideal window:
              </span>{' '}
              <span className="font-semibold">
                {String(idealWindow.hour).padStart(2, '0')}:00 {formatTzAbbr(viewerTz)}
              </span>
              {' '}&middot; All {team.length} in working hours
            </p>
          </div>
        )}

        {/* Best available banner */}
        {showBestAvailableBanner && bestAvailable && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-28 shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-teal-600 dark:text-teal-400">
                Best available:
              </span>{' '}
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
                      {o.name} takes {o.localHour < WORK_START ? 'an early' : 'a late'} call
                      {' '}({String(o.localHour).padStart(2, '0')}:00 {o.abbr})
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
            Working ({WORK_START}am-{WORK_END - 12}pm)
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
  )
}
