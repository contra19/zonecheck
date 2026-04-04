import {
  getCurrentTimeInZone,
  encodeTeam,
  decodeTeam,
  TeamMember,
} from './timezone'

describe('getCurrentTimeInZone', () => {
  it('returns valid result for UTC', () => {
    const result = getCurrentTimeInZone('UTC')
    expect(result).not.toBeNull()
    expect(result!.offset).toBe('UTC+00:00')
    expect(result!.isDST).toBe(false)
    expect(result!.time).toMatch(/^\d{2}:\d{2}$/)
    expect(result!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns valid result for a negative offset zone (America/New_York)', () => {
    const result = getCurrentTimeInZone('America/New_York')
    expect(result).not.toBeNull()
    expect(result!.offset).toMatch(/^UTC-0[45]:00$/) // -05 standard, -04 DST
    expect(result!.time).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns valid result for a positive offset zone (Asia/Tokyo)', () => {
    const result = getCurrentTimeInZone('Asia/Tokyo')
    expect(result).not.toBeNull()
    expect(result!.offset).toBe('UTC+09:00')
    expect(result!.isDST).toBe(false) // Japan does not observe DST
  })

  it('handles DST-observing zones (America/Chicago)', () => {
    const result = getCurrentTimeInZone('America/Chicago')
    expect(result).not.toBeNull()
    // Should be either -06:00 (CST) or -05:00 (CDT)
    expect(result!.offset).toMatch(/^UTC-0[56]:00$/)
    expect(typeof result!.isDST).toBe('boolean')
  })

  it('handles zones with non-hour offsets (Asia/Kolkata +05:30)', () => {
    const result = getCurrentTimeInZone('Asia/Kolkata')
    expect(result).not.toBeNull()
    expect(result!.offset).toBe('UTC+05:30')
  })

  it('returns null for invalid timezone strings', () => {
    expect(getCurrentTimeInZone('Fake/Nowhere')).toBeNull()
    expect(getCurrentTimeInZone('')).toBeNull()
    expect(getCurrentTimeInZone('NotATimezone')).toBeNull()
  })

  it('handles DST boundary zones in both hemispheres', () => {
    // Southern hemisphere DST (Australia/Sydney)
    const sydney = getCurrentTimeInZone('Australia/Sydney')
    expect(sydney).not.toBeNull()
    // +10:00 AEST or +11:00 AEDT
    expect(sydney!.offset).toMatch(/^UTC\+1[01]:00$/)

    // Europe/London: UTC+00:00 or UTC+01:00
    const london = getCurrentTimeInZone('Europe/London')
    expect(london).not.toBeNull()
    expect(london!.offset).toMatch(/^UTC\+0[01]:00$/)
  })
})

describe('encodeTeam / decodeTeam', () => {
  const fiveMembers: TeamMember[] = [
    { name: 'Alice', timezone: 'America/New_York', label: 'Engineering' },
    { name: 'Bob', timezone: 'Europe/London' },
    { name: 'Charlie', timezone: 'Asia/Tokyo', label: 'Design' },
    { name: 'Diana', timezone: 'Australia/Sydney' },
    { name: 'Eve', timezone: 'UTC', label: 'DevOps' },
  ]

  it('round-trips a 5-member team', () => {
    const encoded = encodeTeam(fiveMembers)
    const decoded = decodeTeam(encoded)
    expect(decoded).toEqual(fiveMembers)
  })

  it('produces a URL-safe string (no +, /, or =)', () => {
    const encoded = encodeTeam(fiveMembers)
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('round-trips an empty array', () => {
    expect(decodeTeam(encodeTeam([]))).toEqual([])
  })

  it('round-trips members with optional label omitted', () => {
    const members: TeamMember[] = [
      { name: 'Zara', timezone: 'Pacific/Auckland' },
    ]
    expect(decodeTeam(encodeTeam(members))).toEqual(members)
  })

  it('returns [] for garbage input', () => {
    expect(decodeTeam('not-valid-base64-!!!')).toEqual([])
    expect(decodeTeam('')).toEqual([])
  })

  it('filters out invalid members in the array', () => {
    const mixed = JSON.stringify([
      { name: 'Valid', timezone: 'UTC' },
      { name: 123, timezone: 'UTC' },
      { broken: true },
      null,
    ])
    const encoded = Buffer.from(mixed).toString('base64')
    const decoded = decodeTeam(encoded)
    expect(decoded).toEqual([{ name: 'Valid', timezone: 'UTC' }])
  })

  it('returns [] if decoded value is not an array', () => {
    const encoded = Buffer.from(JSON.stringify({ name: 'X' })).toString('base64')
    expect(decodeTeam(encoded)).toEqual([])
  })
})
