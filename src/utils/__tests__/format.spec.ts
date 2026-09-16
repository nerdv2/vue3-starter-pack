import { describe, expect, it } from 'vitest'
import { formatDate, formatFileSize, formatNumber } from '@/utils/format'

describe('formatDate', () => {
  it('renders a placeholder for empty values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('parses the backend datetime format', () => {
    const formatted = formatDate('2026-09-16 08:10:20')

    expect(formatted).not.toBe('—')
    expect(formatted).not.toBe('2026-09-16 08:10:20')
    expect(formatted).toContain('2026')
  })

  it('returns the raw value when it cannot be parsed', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })
})

describe('formatFileSize', () => {
  it('scales units', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})
