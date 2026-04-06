'use client'

type MeetingActionsProps = {
  copied: string | null
  onCopyInvite: () => void
  onShare: () => void
}

export function MeetingActions({ copied, onCopyInvite, onShare }: MeetingActionsProps) {
  return (
    <section className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={onCopyInvite}
        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2.5 text-sm font-medium transition-colors"
      >
        {copied === 'invite' ? 'Copied!' : 'Copy Meeting Invite'}
      </button>
      <button
        onClick={onShare}
        className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 text-sm font-medium transition-colors"
      >
        {copied === 'share' ? 'Link Copied!' : 'Share Team'}
      </button>
    </section>
  )
}
