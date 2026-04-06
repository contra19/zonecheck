'use client'

export type DetectMessage = { text: string; type: 'warn' | 'error' }

type PasteDetectProps = {
  pasteText: string
  setPasteText: (s: string) => void
  detecting: boolean
  detectMsg: DetectMessage | null
  onDetect: () => void
}

export function PasteDetect({
  pasteText,
  setPasteText,
  detecting,
  detectMsg,
  onDetect,
}: PasteDetectProps) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Add by AI
      </h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="paste-input" className="sr-only">
          Paste text for detection
        </label>
        <textarea
          id="paste-input"
          placeholder="Paste a name, location, Slack bio, email signature..."
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={2}
          aria-label="Paste a name, location, Slack bio, or email signature for AI detection"
          className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
        <button
          onClick={onDetect}
          disabled={detecting || !pasteText.trim()}
          className="self-end rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 text-sm font-medium transition-colors whitespace-nowrap"
        >
          {detecting ? 'Detecting...' : 'Detect'}
        </button>
      </div>
      {detectMsg && (
        <p
          role="alert"
          className={`mt-2 text-xs ${
            detectMsg.type === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-700 dark:text-amber-300'
          }`}
        >
          {detectMsg.text}
        </p>
      )}
    </section>
  )
}
