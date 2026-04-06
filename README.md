# ZoneCheck

> See your team across time zones — instantly.

A live timezone overlap tool for distributed teams. Add your team members, see everyone's local time at a glance, find the best meeting window, and share with one click. Powered by AI timezone detection.

🌐 **Live at [zonecheck.wolvryn.tech](https://zonecheck.wolvryn.tech)**

## Features

- **Live clocks with DST awareness** — every member's current local time, refreshed every minute, with daylight-saving offsets handled automatically
- **Availability heatmap timeline** — a 24-hour view of who's working when, color-coded by how many of the team is available at each hour
- **AI timezone detection** — paste a name, Slack bio, email signature, or just a city name and Claude figures out the timezone automatically
- **Smart meeting suggestions** — finds the ideal window where everyone is in working hours, plus a "best available" fallback showing exactly who takes an early or late call and at what local time
- **12h/24h time format toggle** — switch between 12-hour and 24-hour display across all times in the app — member clocks, timeline labels, tooltips, banners, and meeting invite output. Auto-detected from your locale and persisted across sessions
- **Auto-saved team** — your last team is automatically saved and restored on page refresh, no account required. Shared URLs always take priority over saved teams
- **Shareable team URLs** — encode your entire team into a URL and send it to anyone; opening the link restores the full team instantly
- **PWA installable** — add to home screen on iOS or install as a standalone app on desktop/Android
- **Full IANA timezone database** — every zone supported by the browser, grouped by region with a "Common" shortlist on top

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **AI:** Anthropic Claude Haiku 4.5
- **Timezone math:** date-fns-tz + native `Intl` APIs
- **Hosting:** Vercel
- **CI/CD:** GitHub Actions

## Getting Started

```bash
git clone https://github.com/contra19/zonecheck.git
cd zonecheck
npm install
```

Add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running Tests
```bash
npm test
```

35 Jest unit tests across 2 test suites:

- **lib/timezone.test.ts** — 14 tests covering timezone math, DST boundaries, UTC and offset edge cases, invalid timezone handling, and team encode/decode round-trips
- **lib/timezone-utils.test.ts** — 21 tests covering time formatting (12h/24h), hour label generation, midnight/noon edge cases, and zero-padding behavior

Test quality verified with mutation testing — intentional bugs introduced into each function confirmed the relevant tests catch real failures before restoration.

## CI/CD

Every push and pull request to `main` triggers a GitHub Actions workflow that runs the full test suite and a production build. Only when all checks pass does the workflow deploy to Vercel via the Vercel CLI. Failed tests block deployment — broken code never ships to production.

## License

© 2025 Wolvryn Technology Systems. All rights reserved.

This project is source-available for portfolio and educational viewing. Commercial use, redistribution, or deployment of competing services is prohibited without explicit written permission. Contact rwisniewski@wolvryn.com.

## Built by

A **Wolvryn FORGE** product.