import { formatHourLabel, formatTime } from './timezone-utils'

describe('formatTime', () => {
  describe('12-hour mode', () => {
    it('formats midnight as 12:00 AM', () => {
      expect(formatTime(0, 0, true)).toBe('12:00 AM')
    })

    it('formats 12:30 AM correctly', () => {
      expect(formatTime(0, 30, true)).toBe('12:30 AM')
    })

    it('formats noon as 12:00 PM', () => {
      expect(formatTime(12, 0, true)).toBe('12:00 PM')
    })

    it('formats 12:30 PM correctly', () => {
      expect(formatTime(12, 30, true)).toBe('12:30 PM')
    })

    it('formats 1 PM as 1:00 PM', () => {
      expect(formatTime(13, 0, true)).toBe('1:00 PM')
    })

    it('formats 11:59 PM correctly', () => {
      expect(formatTime(23, 59, true)).toBe('11:59 PM')
    })

    it('zero-pads single-digit minutes (9:05 AM)', () => {
      expect(formatTime(9, 5, true)).toBe('9:05 AM')
    })
  })

  describe('24-hour mode', () => {
    it('formats midnight as 00:00', () => {
      expect(formatTime(0, 0, false)).toBe('00:00')
    })

    it('formats 1 PM as 13:00', () => {
      expect(formatTime(13, 0, false)).toBe('13:00')
    })

    it('zero-pads both hours and minutes (09:05)', () => {
      expect(formatTime(9, 5, false)).toBe('09:05')
    })

    it('formats 23:59 correctly', () => {
      expect(formatTime(23, 59, false)).toBe('23:59')
    })
  })
})

describe('formatHourLabel', () => {
  describe('12-hour mode', () => {
    it('labels midnight as 12a', () => {
      expect(formatHourLabel(0, true)).toBe('12a')
    })

    it('labels noon as 12p', () => {
      expect(formatHourLabel(12, true)).toBe('12p')
    })

    it('labels 1 AM as 1', () => {
      expect(formatHourLabel(1, true)).toBe('1')
    })

    it('labels 11 AM as 11', () => {
      expect(formatHourLabel(11, true)).toBe('11')
    })

    it('labels 1 PM as 1', () => {
      expect(formatHourLabel(13, true)).toBe('1')
    })

    it('labels 11 PM as 11', () => {
      expect(formatHourLabel(23, true)).toBe('11')
    })
  })

  describe('24-hour mode', () => {
    it('zero-pads midnight as 00', () => {
      expect(formatHourLabel(0, false)).toBe('00')
    })

    it('labels noon as 12', () => {
      expect(formatHourLabel(12, false)).toBe('12')
    })

    it('zero-pads single-digit hours (09)', () => {
      expect(formatHourLabel(9, false)).toBe('09')
    })

    it('labels 11 PM as 23', () => {
      expect(formatHourLabel(23, false)).toBe('23')
    })
  })
})
