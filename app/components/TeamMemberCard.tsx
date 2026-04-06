'use client'

import { STATUS_LABELS } from '@/lib/constants'
import { getCurrentTimeInZone, TeamMember } from '@/lib/timezone'
import { getHourStatus } from '@/lib/timezone-utils'

type TeamMemberCardProps = {
  member: TeamMember
  onRemove: () => void
}

export function TeamMemberCard({ member, onRemove }: TeamMemberCardProps) {
  const info = getCurrentTimeInZone(member.timezone)
  const hour = info ? parseInt(info.time.split(':')[0], 10) : -1
  const status = hour >= 0 ? getHourStatus(hour) : 'red'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 relative group">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label={`Remove ${member.name}`}
      >
        &times;
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor:
                status === 'green'
                  ? '#16a34a'
                  : status === 'amber'
                    ? '#ca8a04'
                    : '#dc2626',
              display: 'inline-block',
              flexShrink: 0,
            }}
            title={STATUS_LABELS[status]}
            aria-hidden="true"
          />
          <span className="truncate">{member.name}</span>
          <span className="sr-only"> — {STATUS_LABELS[status]}</span>
        </div>
        {member.label && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-5">
            {member.label}
          </div>
        )}
        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 mt-1 ml-5">
          {info?.time ?? '--:--'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-5">
          {member.timezone.replace(/_/g, ' ')} &middot; {info?.offset ?? ''}
          {info?.isDST ? ' (DST)' : ''}
        </div>
      </div>
    </div>
  )
}
