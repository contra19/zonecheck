'use client'

import type { TimezonePickerData } from '@/lib/timezone-utils'

type AddMemberFormProps = {
  name: string
  setName: (s: string) => void
  timezone: string
  setTimezone: (s: string) => void
  label: string
  setLabel: (s: string) => void
  tzData: TimezonePickerData
  onAdd: () => void
}

export function AddMemberForm({
  name,
  setName,
  timezone,
  setTimezone,
  label,
  setLabel,
  tzData,
  onAdd,
}: AddMemberFormProps) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Add Team Member
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="member-name" className="sr-only">
          Team member name
        </label>
        <input
          id="member-name"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          aria-label="Team member name"
          className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <label htmlFor="member-timezone" className="sr-only">
          Timezone
        </label>
        <select
          id="member-timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          aria-label="Timezone"
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
        <label htmlFor="member-label" className="sr-only">
          Team or role label
        </label>
        <input
          id="member-label"
          type="text"
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          aria-label="Team or role label (optional)"
          className="sm:w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={onAdd}
          aria-label="Add team member"
          className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 text-sm font-medium transition-colors whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </section>
  )
}
