import { toZonedTime, format } from 'date-fns-tz';

const SINGAPORE_TZ = 'Asia/Singapore';

/**
 * Get current date/time in Singapore timezone
 */
export function getSingaporeNow(): Date {
  return toZonedTime(new Date(), SINGAPORE_TZ);
}

/**
 * Convert any date to Singapore timezone
 */
export function toSingaporeTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, SINGAPORE_TZ);
}

/**
 * Format date in Singapore timezone
 */
export function formatSingaporeDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(toZonedTime(dateObj, SINGAPORE_TZ), formatStr, { timeZone: SINGAPORE_TZ });
}

/**
 * Parse date string and return ISO string in Singapore timezone
 */
export function parseSingaporeDate(dateStr: string): string {
  const date = new Date(dateStr);
  return toZonedTime(date, SINGAPORE_TZ).toISOString();
}
