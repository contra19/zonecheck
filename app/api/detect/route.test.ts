/**
 * @jest-environment node
 */

/**
 * app/api/detect/route.test.ts
 *
 * What: Integration tests for the detect API route handler (POST).
 * Does: Mocks the Anthropic SDK at the boundary and asserts rate-limit, input
 *       validation, prompt delimiting, output validation, and error sanitizing.
 * Use when: Run by `npm test`; verifies the route wiring that the pure lib tests can't.
 */
import { NextRequest } from 'next/server'

import { logger } from '@/lib/logger'
import { MAX_DETECT_INPUT_LENGTH } from '@/lib/detect'

import { POST } from './route'

// Mock the Anthropic SDK at the boundary. The implementation closure reads
// `mockCreate` lazily (only when `new Anthropic()` runs inside POST), so the
// `mock`-prefixed reference is safe under jest's factory hoisting.
const mockCreate = jest.fn()
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ─── Helpers ─────────────────────────────────────────────────

const VALID_RESULT = { name: 'Bob', timezone: 'Europe/Berlin', confidence: 'high' } as const

/** Wraps a model JSON payload in the SDK's content-block response shape. */
function textResponse(payload: string): { content: Array<{ type: string; text: string }> } {
  return { content: [{ type: 'text', text: payload }] }
}

let ipCounter = 0
/** Builds a POST request with a unique IP so the in-memory rate limit never bleeds across tests. */
function buildRequest(body: unknown): NextRequest {
  ipCounter += 1
  return new NextRequest('http://localhost/api/detect', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  })
}

// ─── Setup ───────────────────────────────────────────────────

beforeEach(() => {
  mockCreate.mockReset()
  // Silence + observe the logging seam; never let real output hit the console.
  jest.spyOn(logger, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

// ─── Input validation (pre-LLM) ──────────────────────────────

describe('POST /api/detect — input validation', () => {
  it('returns 400 for missing text without calling the LLM', async () => {
    const res = await POST(buildRequest({}))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe('Missing or invalid "text" field')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 for null text without calling the LLM', async () => {
    const res = await POST(buildRequest({ text: null }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 for whitespace-only text without calling the LLM', async () => {
    const res = await POST(buildRequest({ text: '   ' }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 for text over the length cap without calling the LLM', async () => {
    const res = await POST(buildRequest({ text: 'a'.repeat(MAX_DETECT_INPUT_LENGTH + 1) }))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toContain(`${MAX_DETECT_INPUT_LENGTH}`)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('accepts text exactly at the length cap and calls the LLM', async () => {
    mockCreate.mockResolvedValue(textResponse(JSON.stringify(VALID_RESULT)))
    const res = await POST(buildRequest({ text: 'a'.repeat(MAX_DETECT_INPUT_LENGTH) }))
    expect(res.status).toBe(200)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})

// ─── Prompt delimiting ───────────────────────────────────────

describe('POST /api/detect — prompt delimiting', () => {
  it('fences the user text inside delimiters in the LLM message', async () => {
    mockCreate.mockResolvedValue(textResponse(JSON.stringify(VALID_RESULT)))
    await POST(buildRequest({ text: 'Bob in Berlin' }))
    const call = mockCreate.mock.calls[0][0]
    const sentContent = call.messages[0].content
    expect(sentContent).toContain('<<<USER_INPUT')
    expect(sentContent).toContain('USER_INPUT>>>')
    expect(sentContent).toContain('Bob in Berlin')
  })
})

// ─── Output validation ───────────────────────────────────────

describe('POST /api/detect — output validation', () => {
  it('returns the parsed result for conforming LLM output', async () => {
    mockCreate.mockResolvedValue(textResponse(JSON.stringify(VALID_RESULT)))
    const res = await POST(buildRequest({ text: 'Bob in Berlin' }))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toEqual(VALID_RESULT)
  })

  it('returns 502 with a clean message for non-conforming LLM output', async () => {
    mockCreate.mockResolvedValue(textResponse(JSON.stringify({ foo: 'bar' })))
    const res = await POST(buildRequest({ text: 'Bob in Berlin' }))
    const data = await res.json()
    expect(res.status).toBe(502)
    expect(data.error).not.toContain('foo')
    expect(data).not.toHaveProperty('foo')
    expect(logger.error).toHaveBeenCalled()
  })

  it('returns 502 when the LLM returns no content blocks', async () => {
    mockCreate.mockResolvedValue({ content: [] })
    const res = await POST(buildRequest({ text: 'Bob in Berlin' }))
    expect(res.status).toBe(502)
    expect(logger.error).toHaveBeenCalled()
  })

  it('returns 502 when the first content block is not text', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'tool_use' }] })
    const res = await POST(buildRequest({ text: 'Bob in Berlin' }))
    expect(res.status).toBe(502)
    expect(logger.error).toHaveBeenCalled()
  })
})

// ─── Error sanitizing ────────────────────────────────────────

describe('POST /api/detect — error sanitizing', () => {
  it('returns a generic 500 message and never leaks the SDK error detail', async () => {
    mockCreate.mockRejectedValue(new Error('SECRET sdk internal detail'))
    const res = await POST(buildRequest({ text: 'Bob in Berlin' }))
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBe('Something went wrong. Please try again.')
    expect(JSON.stringify(data)).not.toContain('SECRET')
  })

  it('logs the real error detail server-side through the centralized logger', async () => {
    mockCreate.mockRejectedValue(new Error('SECRET sdk internal detail'))
    await POST(buildRequest({ text: 'Bob in Berlin' }))
    expect(logger.error).toHaveBeenCalledWith(
      'api/detect',
      'detect request failed',
      expect.objectContaining({ error: 'SECRET sdk internal detail' })
    )
  })
})
