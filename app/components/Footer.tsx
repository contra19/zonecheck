import Image from 'next/image'

const WOLVRYN_URL = 'https://wolvryn.tech'
const FLAME_ORANGE = '#FF6A00'

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-6">
      <div className="flex flex-col items-center gap-2">
        <a
          href={WOLVRYN_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Wolvryn FORGE website"
        >
          <Image
            src="/wolvryn_forge_logo.png"
            alt="Wolvryn FORGE"
            width={160}
            height={40}
            className="h-10 w-auto"
          />
        </a>
        <a
          href={WOLVRYN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-500 transition-colors"
          style={{ fontSize: '12px' }}
        >
          Powered by <span style={{ color: FLAME_ORANGE }}>Wolvryn FORGE</span>
        </a>
      </div>
    </footer>
  )
}
