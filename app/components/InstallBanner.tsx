'use client'

/** The `beforeinstallprompt` event isn't in lib.dom.d.ts — declare it locally. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallBannerProps = {
  installPrompt: BeforeInstallPromptEvent | null
  onInstall: () => void
  onDismiss: () => void
}

export function InstallBanner({ installPrompt, onInstall, onDismiss }: InstallBannerProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 pointer-events-none">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 pointer-events-auto flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Install ZoneCheck
          </p>
          {installPrompt ? (
            <div className="mt-2 flex gap-2">
              <button
                onClick={onInstall}
                className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 text-xs font-medium transition-colors"
              >
                Install App
              </button>
              <button
                onClick={onDismiss}
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
          onClick={onDismiss}
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
