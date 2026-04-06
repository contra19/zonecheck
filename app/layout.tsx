import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const viewport: Viewport = {
  themeColor: '#0d9488',
}

export const metadata: Metadata = {
  title: 'ZoneCheck — See your team across time zones',
  description:
    "See your distributed team's working hours at a glance, find meeting overlap, and schedule across time zones with AI-powered timezone detection. Powered by Wolvryn FORGE.",
  manifest: '/manifest.json',
  openGraph: {
    title: 'ZoneCheck — See your team across time zones',
    description:
      "See your distributed team's working hours at a glance, find meeting overlap, and schedule across time zones with AI-powered timezone detection. Powered by Wolvryn FORGE.",
    url: 'https://zonecheck.wolvryn.tech',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZoneCheck',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
