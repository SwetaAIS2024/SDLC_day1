import { DateTime } from 'luxon';
import type { RecurrencePattern } from './types';

const SINGAPORE_TIMEZONE = 'Asia/Singapore';

/**
 * Get current date/time in Singapore timezone
 * USE THIS instead of new Date() throughout the application
 */
export function getSingaporeNow(): DateTime {
  return DateTime.now().setZone(SINGAPORE_TIMEZONE);
}

/**
 * Parse an ISO string as Singapore time
 */
export function parseSingaporeDate(isoString: string): DateTime {
  return DateTime.fromISO(isoString, { zone: SINGAPORE_TIMEZONE });
}

/**
 * Format a date for display in Singapore timezone
 */
export function formatSingaporeDate(date: DateTime | string, format: string = 'MMM d, yyyy, h:mm a'): string {
  const dt = typeof date === 'string' ? parseSingaporeDate(date) : date;
  return dt.toFormat(format) + ' SGT';
}

/**
 * Check if a date is in the past (Singapore time)
 */
export function isPastDue(dueDate: string): boolean {
  const now = getSingaporeNow();
  const due = parseSingaporeDate(dueDate);
  return due < now;
}

/**
 * Calculate the next due date for a recurring todo
 * @param currentDueDate - ISO string of current due date
 * @param recurrencePattern - One of 'daily', 'weekly', 'monthly', 'yearly'
 * @returns ISO string of next due date in Singapore timezone
 * @throws Error if currentDueDate is null or recurrencePattern is invalid
 */
export function calculateNextDueDate(
  currentDueDate: string | null,
  recurrencePattern: RecurrencePattern
): string {
  if (!currentDueDate) {
    throw new Error('Due date required for recurring todos');
  }
  
  // Parse current due date in Singapore timezone
  const currentDate = parseSingaporeDate(currentDueDate);
  
  let nextDate: DateTime;
  
  switch (recurrencePattern) {
    case 'daily':
      // Add 1 day
      nextDate = currentDate.plus({ days: 1 });
      break;
    case 'weekly':
      // Add 7 days (1 week)
      nextDate = currentDate.plus({ weeks: 1 });
      break;
    case 'monthly':
      // Add 1 month - luxon handles edge cases automatically
      // (e.g., Jan 31 + 1 month = Feb 28/29 depending on leap year)
      nextDate = currentDate.plus({ months: 1 });
      break;
    case 'yearly':
      // Add 1 year - luxon handles leap year edge cases
      // (e.g., Feb 29, 2024 + 1 year = Feb 28, 2025)
      nextDate = currentDate.plus({ years: 1 });
      break;
    default:
      throw new Error(`Invalid recurrence pattern: ${recurrencePattern}`);
  }
  
  // Return as ISO string in Singapore timezone
  return nextDate.toISO()!;
}

/**
 * Calculate notification time (due date minus reminder minutes)
 * @param dueDate - ISO string of due date
 * @param reminderMinutes - Minutes before due date to notify
 * @returns DateTime of when notification should be sent
 */
export function calculateNotificationTime(
  dueDate: string,
  reminderMinutes: number
): DateTime {
  const dueDateObj = parseSingaporeDate(dueDate);
  return dueDateObj.minus({ minutes: reminderMinutes });
}

/**
 * Determine if a notification should be sent now
 * @param dueDate - ISO string of due date
 * @param reminderMinutes - Minutes before due date to notify
 * @param lastNotificationSent - ISO string of last notification sent time, or null
 * @returns true if notification should be sent
 */
export function shouldSendNotification(
  dueDate: string,
  reminderMinutes: number,
  lastNotificationSent: string | null
): boolean {
  const now = getSingaporeNow();
  const notificationTime = calculateNotificationTime(dueDate, reminderMinutes);
  const dueDateObj = parseSingaporeDate(dueDate);
  
  // Don't send if notification time hasn't arrived yet
  if (now < notificationTime) {
    return false;
  }
  
  // Don't send if todo is already overdue (notification time passed)
  if (dueDateObj < now) {
    return false;
  }
  
  // Don't send if already sent
  if (lastNotificationSent) {
    return false;
  }
  
  return true;
}

/**
 * Format reminder time for display
 * @param dueDate - ISO string of due date
 * @param reminderMinutes - Minutes before due date
 * @returns Formatted string like "Nov 15, 1:00 PM SGT"
 */
export function formatReminderTime(dueDate: string, reminderMinutes: number): string {
  const notificationTime = calculateNotificationTime(dueDate, reminderMinutes);
  return notificationTime.toFormat('MMM d, h:mm a') + ' SGT';
}

/**
 * Get the start of day (00:00:00) for a given date in Singapore timezone
 */
export function startOfDay(date: DateTime): DateTime {
  return date.startOf('day');
}

/**
 * Get the end of day (23:59:59.999) for a given date in Singapore timezone
 */
export function endOfDay(date: DateTime): DateTime {
  return date.endOf('day');
}

/**
 * Get the start of week (Monday 00:00:00) for a given date in Singapore timezone
 */
export function startOfWeek(date: DateTime): DateTime {
  return date.startOf('week');
}

/**
 * Get the end of week (Sunday 23:59:59.999) for a given date in Singapore timezone
 */
export function endOfWeek(date: DateTime): DateTime {
  return date.endOf('week');
}

/**
 * Get the start of month (1st day 00:00:00) for a given date in Singapore timezone
 */
export function startOfMonth(date: DateTime): DateTime {
  return date.startOf('month');
}

/**
 * Get the end of month (last day 23:59:59.999) for a given date in Singapore timezone
 */
export function endOfMonth(date: DateTime): DateTime {
  return date.endOf('month');
}
