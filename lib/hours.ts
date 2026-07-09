import { WeekHours, DayHours } from '@/types'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export function isLocationOpen(hours: WeekHours, timezone: string): boolean {
  try {
    const now = new Date()
    const localTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'long',
    }).formatToParts(now)

    const weekday = localTime.find(p => p.type === 'weekday')?.value?.toLowerCase() as keyof WeekHours
    const hPart = localTime.find(p => p.type === 'hour')?.value ?? '00'
    const mPart = localTime.find(p => p.type === 'minute')?.value ?? '00'
    const currentMinutes = parseInt(hPart) * 60 + parseInt(mPart)

    const todayHours: DayHours = hours[weekday]
    if (!todayHours?.open || !todayHours?.close) return false

    const [openH, openM] = todayHours.open.split(':').map(Number)
    const [closeH, closeM] = todayHours.close.split(':').map(Number)
    const openMinutes = openH * 60 + openM
    let closeMinutes = closeH * 60 + closeM

    // Handle midnight close (00:00 = next day)
    if (closeMinutes === 0) closeMinutes = 24 * 60

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  } catch {
    return false
  }
}

export function getTodaysHoursDisplay(hours: WeekHours, timezone: string): string {
  try {
    const now = new Date()
    const weekday = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      weekday: 'long',
    }).format(now).toLowerCase() as keyof WeekHours

    const todayHours: DayHours = hours[weekday]
    if (!todayHours?.open) return 'Closed today'
    if (todayHours.open === '00:00' && todayHours.close === '00:00') return 'Open 24 hours'

    return `${formatTime(todayHours.open)} – ${formatTime(todayHours.close ?? '')}`
  } catch {
    return 'Hours unavailable'
  }
}

export function formatTime(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (h === 0 && m === 0) return 'Midnight'
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function formatDayHours(day: DayHours | undefined): string {
  if (!day?.open) return 'Closed'
  if (day.open === '00:00' && day.close === '00:00') return 'Open 24 hours'
  return `${formatTime(day.open)} – ${formatTime(day.close ?? '')}`
}

export const WEEK_DAYS: Array<{ key: keyof WeekHours; label: string; short: string }> = [
  { key: 'monday',    label: 'Monday',    short: 'Mon' },
  { key: 'tuesday',   label: 'Tuesday',   short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday',  label: 'Thursday',  short: 'Thu' },
  { key: 'friday',    label: 'Friday',    short: 'Fri' },
  { key: 'saturday',  label: 'Saturday',  short: 'Sat' },
  { key: 'sunday',    label: 'Sunday',    short: 'Sun' },
]

export function getTodayKey(timezone: string): keyof WeekHours {
  try {
    const weekday = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      weekday: 'long',
    }).format(new Date()).toLowerCase()
    return weekday as keyof WeekHours
  } catch {
    return 'monday'
  }
}
