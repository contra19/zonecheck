import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SYSTEM_PROMPT =
  'You are a timezone detection assistant. Extract the person\'s name and most likely IANA timezone from the input. Respond with ONLY a raw JSON object, no markdown, no code fences, no explanation. Format: {"name": "string", "timezone": "string", "confidence": "high" or "low"}. Use low confidence if guessing.'

// In-memory rate limit: 20 requests per IP per 60s window
const RATE_LIMIT = 20
const WINDOW_MS = 60_000
const hits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  try {
    const { text } = await req.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "text" field' },
        { status: 400 }
      )
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!raw) {
      return NextResponse.json(
        { error: 'Unexpected response format' },
        { status: 500 }
      )
    }

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
