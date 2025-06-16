import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('returns "Never" for null input', () => {
      expect(formatDate(null)).toBe('Never')
    })

    it('formats a date object', () => {
      const date = new Date(2023, 10, 24)
      expect(formatDate(date)).toBe(new Date(2023, 10, 24).toLocaleDateString())
    })
  })

  describe('formatDateTime', () => {
    it('returns "Never" for null input', () => {
      expect(formatDateTime(null)).toBe('Never')
    })

    it('formats a date-time object', () => {
      const date = new Date('2023-11-24T10:30:00')
      expect(formatDateTime(date)).toBe(new Date('2023-11-24T10:30:00').toLocaleString())
    })
  })

  describe('formatRelativeTime', () => {
    it('returns "Never" for null input', () => {
      expect(formatRelativeTime(null)).toBe('Never')
    })

    it('returns "Just now" for recent times', () => {
      const now = new Date()
      expect(formatRelativeTime(now)).toBe('Just now')
    })

    it('returns minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago')
    })

    it('returns hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago')
    })

    it('returns days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago')
    })
  })
})
