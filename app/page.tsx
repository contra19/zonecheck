'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CLOCK_REFRESH_MS,
  HOURS,
  TOAST_DURATION_MS,
  WORK_END,
  WORK_START,
} from '@/lib/constants'
import { encodeTeam, decodeTeam, TeamMember } from '@/lib/timezone'
import {
  formatTzAbbr,
  getAllTimezones,
  getHourDiff,
  getLocalTimezone,
  wrapHour,
} from '@/lib/timezone-utils'
import { AddMemberForm } from './components/AddMemberForm'
import { Footer } from './components/Footer'
import {
  BeforeInstallPromptEvent,
  InstallBanner,
} from './components/InstallBanner'
import { MeetingActions } from './components/MeetingActions'
import { PasteDetect, type DetectMessage } from './components/PasteDetect'
import { TeamMemberCard } from './components/TeamMemberCard'
import {
  BestAvailableSummary,
  Timeline,
  WindowSummary,
} from './components/Timeline'

/** Picks the candidate hour closest to 10am viewer time (preferred meeting hour). */
function pickClosestTo10am(hours: number[]): number {
  return hours.reduce((best, h) => (Math.abs(h - 10) < Math.abs(best - 10) ? h : best))
}

export default function Home() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [label, setLabel] = useState('')
  const [, setTick] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [viewerTz, setViewerTz] = useState('UTC')
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [detectMsg, setDetectMsg] = useState<DetectMessage | null>(null)

  const tzData = useMemo(() => getAllTimezones(), [])

  // On mount: detect local tz, restore team from URL, wire up PWA install
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

    // Skip install prompts when already running standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    // Chrome/Android: capture beforeinstallprompt
    const handlePrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)

    // iOS Safari (no beforeinstallprompt): show manual instructions
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    if (isIOS) {
      setShowInstallBanner(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  // Refresh clock display every minute (tick triggers re-render)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), CLOCK_REFRESH_MS)
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

  const removeMember = useCallback((index: number) => {
    setTeam((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDetect = useCallback(async () => {
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
          setDetectMsg({
            text: 'Best guess — please confirm the timezone.',
            type: 'warn',
          })
        }
      }
    } catch {
      setDetectMsg({ text: 'Could not reach the detection API.', type: 'error' })
    } finally {
      setDetecting(false)
    }
  }, [pasteText, timezone])

  // Per-member hour offsets relative to viewer. Integer-stable across ticks,
  // so only team or viewerTz changes recompute. Card clocks read live time
  // directly each render and refresh on every tick.
  const memberDiffs = useMemo(
    () => team.map((m) => getHourDiff(m.timezone, viewerTz, new Date())),
    [team, viewerTz]
  )

  // Per-hour availability count: how many members are in [9, 18) at each viewer-local hour
  const availCounts = useMemo(() => {
    if (team.length === 0) return HOURS.map(() => 0)
    return HOURS.map((h) =>
      memberDiffs.reduce((count, diff) => {
        const mh = wrapHour(h + diff)
        return count + (mh >= WORK_START && mh < WORK_END ? 1 : 0)
      }, 0)
    )
  }, [team.length, memberDiffs])

  // Ideal window: best hour where ALL members are in working hours
  const idealWindow = useMemo<WindowSummary | null>(() => {
    if (team.length < 2) return null
    const fullHours = HOURS.filter((h) => availCounts[h] === team.length)
    if (fullHours.length === 0) return null
    return { hour: pickClosestTo10am(fullHours), count: team.length }
  }, [team.length, availCounts])

  // Best available window: highest availability across all 24 hours
  const bestAvailable = useMemo<BestAvailableSummary | null>(() => {
    if (team.length < 2) return null
    const max = Math.max(...availCounts)
    if (max === 0) return null
    const candidates = HOURS.filter((h) => availCounts[h] === max)
    const hour = pickClosestTo10am(candidates)

    const offHours: BestAvailableSummary['offHours'] = []
    team.forEach((m, i) => {
      const mh = wrapHour(hour + memberDiffs[i])
      if (mh < WORK_START || mh >= WORK_END) {
        offHours.push({
          name: m.name,
          localHour: mh,
          abbr: formatTzAbbr(m.timezone),
        })
      }
    })
    return { hour, count: max, offHours }
  }, [team, memberDiffs, availCounts])

  const copyMeetingInvite = useCallback(() => {
    if (team.length === 0) return
    let bestViewerHour: number
    if (idealWindow) {
      bestViewerHour = idealWindow.hour
    } else if (bestAvailable) {
      bestViewerHour = bestAvailable.hour
    } else {
      bestViewerHour = wrapHour(12 - memberDiffs[0])
    }

    const parts = team.map((m, i) => {
      const memberHour = wrapHour(bestViewerHour + memberDiffs[i])
      const hh = String(memberHour).padStart(2, '0')
      return `${hh}:00 ${formatTzAbbr(m.timezone)}`
    })

    navigator.clipboard.writeText(`Meeting at ${parts.join(' / ')}`)
    setCopied('invite')
    setTimeout(() => setCopied(null), TOAST_DURATION_MS)
  }, [team, idealWindow, bestAvailable, memberDiffs])

  const shareTeam = useCallback(async () => {
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
    setTimeout(() => setCopied(null), TOAST_DURATION_MS)
  }, [team])

  const handleInstallClick = useCallback(async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallBanner(false)
    }
    setInstallPrompt(null)
  }, [installPrompt])

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
        <PasteDetect
          pasteText={pasteText}
          setPasteText={setPasteText}
          detecting={detecting}
          detectMsg={detectMsg}
          onDetect={handleDetect}
        />

        <AddMemberForm
          name={name}
          setName={setName}
          timezone={timezone}
          setTimezone={setTimezone}
          label={label}
          setLabel={setLabel}
          tzData={tzData}
          onAdd={addMember}
        />

        {team.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((member, i) => (
              <TeamMemberCard
                key={i}
                member={member}
                onRemove={() => removeMember(i)}
              />
            ))}
          </section>
        )}

        {team.length > 0 && (
          <Timeline
            team={team}
            viewerTz={viewerTz}
            memberDiffs={memberDiffs}
            availCounts={availCounts}
            idealWindow={idealWindow}
            bestAvailable={bestAvailable}
          />
        )}

        {team.length > 0 && (
          <MeetingActions
            copied={copied}
            onCopyInvite={copyMeetingInvite}
            onShare={shareTeam}
          />
        )}

        {team.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-lg">Add team members to get started</p>
            <p className="text-sm mt-1">
              Paste a name or location above to add someone instantly, or fill in the form manually.
            </p>
          </div>
        )}
      </main>

      {showInstallBanner && (
        <InstallBanner
          installPrompt={installPrompt}
          onInstall={handleInstallClick}
          onDismiss={() => setShowInstallBanner(false)}
        />
      )}

      <Footer />
    </div>
  )
}
