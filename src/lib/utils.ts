import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDateSafe(date?: string | Date | null, time?: string | null): Date | null {
  if (!date) return null
  try {
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date
    }
    const dateStr = String(date).trim()
    if (!dateStr) return null

    // Check if it's already an ISO or datetime string
    if (time) {
      const cleanTime = String(time).trim()
      // If time contains AM/PM
      if (/am|pm/i.test(cleanTime)) {
        const parts = cleanTime.match(/(\d+):(\d+)(?::(\d+))?\s*(am|pm)/i)
        if (parts) {
          let hours = parseInt(parts[1], 10)
          const minutes = parseInt(parts[2], 10)
          const isPm = parts[4].toLowerCase() === 'pm'
          if (isPm && hours < 12) hours += 12
          if (!isPm && hours === 12) hours = 0
          const padH = String(hours).padStart(2, '0')
          const padM = String(minutes).padStart(2, '0')
          const d = new Date(`${dateStr.split('T')[0]}T${padH}:${padM}:00`)
          if (!isNaN(d.getTime())) return d
        }
      } else {
        const d = new Date(`${dateStr.split('T')[0]}T${cleanTime}`)
        if (!isNaN(d.getTime())) return d
      }
    }

    // If YYYY-MM-DD date-only string, append T00:00:00 to prevent UTC offset shifting
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number)
      return new Date(y, m - 1, d)
    }

    const parsed = new Date(dateStr)
    return isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

export function formatDate(date?: string | Date | null, fallback = '-') {
  if (!date) return fallback
  const parsed = parseDateSafe(date)
  if (!parsed) return fallback
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

export function formatDateTime(date?: string | Date | null, fallback = '-') {
  if (!date) return fallback
  const parsed = parseDateSafe(date)
  if (!parsed) return fallback
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

export function formatTime(time?: string | null, fallback = '') {
  if (!time) return fallback
  const cleanTime = String(time).trim()
  if (!cleanTime) return fallback
  // If already formatted like "10:00 AM"
  if (/am|pm/i.test(cleanTime)) return cleanTime

  const parts = cleanTime.split(':')
  if (parts.length < 2) return cleanTime
  const h = parseInt(parts[0], 10)
  const m = parts[1].slice(0, 2)
  if (isNaN(h)) return cleanTime
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
