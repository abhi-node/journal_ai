/**
 * Timezone utilities for converting UTC timestamps to user's local timezone.
 * All timestamps from the backend are in UTC and need to be converted for display.
 */

/**
 * Get the user's current timezone.
 * @returns Timezone string (e.g., "America/New_York")
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback to UTC if timezone detection fails
    return 'UTC';
  }
};

/**
 * Convert a UTC timestamp to the user's local timezone.
 * @param utcTimestamp - ISO string timestamp in UTC
 * @returns Date object in user's local timezone
 */
export const utcToLocal = (utcTimestamp: string): Date => {
  return new Date(utcTimestamp);
};

/**
 * Format a UTC timestamp for display in user's local timezone.
 * @param utcTimestamp - ISO string timestamp in UTC
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date/time string in user's local timezone
 */
export const formatUTCToLocal = (
  utcTimestamp: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = utcToLocal(utcTimestamp);
  return date.toLocaleString('en-US', options);
};

/**
 * Format a UTC timestamp as a date in user's local timezone.
 * @param utcTimestamp - ISO string timestamp in UTC
 * @returns Formatted date string (e.g., "Aug 29, 2024")
 */
export const formatUTCToLocalDate = (utcTimestamp: string): string => {
  return formatUTCToLocal(utcTimestamp, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a UTC timestamp as a time in user's local timezone.
 * @param utcTimestamp - ISO string timestamp in UTC
 * @returns Formatted time string (e.g., "3:30 PM")
 */
export const formatUTCToLocalTime = (utcTimestamp: string): string => {
  return formatUTCToLocal(utcTimestamp, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format a UTC timestamp as date and time in user's local timezone.
 * @param utcTimestamp - ISO string timestamp in UTC
 * @returns Formatted date/time string (e.g., "Aug 29, 2024 at 3:30 PM")
 */
export const formatUTCToLocalDateTime = (utcTimestamp: string): string => {
  const date = formatUTCToLocalDate(utcTimestamp);
  const time = formatUTCToLocalTime(utcTimestamp);
  return `${date} at ${time}`;
};

/**
 * Check if a UTC timestamp is today in user's local timezone.
 * @param utcTimestamp - ISO string timestamp in UTC
 * @returns True if the timestamp is today in user's timezone
 */
export const isToday = (utcTimestamp: string): boolean => {
  const date = utcToLocal(utcTimestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a UTC timestamp is yesterday in user's local timezone.
 * @param utcTimestamp - ISO string timestamp in UTC
 * @returns True if the timestamp is yesterday in user's timezone
 */
export const isYesterday = (utcTimestamp: string): boolean => {
  const date = utcToLocal(utcTimestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Format a date for display with relative terms.
 * @param utcTimestamp - ISO string timestamp in UTC
 * @returns "Today", "Yesterday", or formatted date
 */
export const formatRelativeDate = (utcTimestamp: string): string => {
  if (isToday(utcTimestamp)) {
    return 'Today';
  } else if (isYesterday(utcTimestamp)) {
    return 'Yesterday';
  } else {
    return formatUTCToLocalDate(utcTimestamp);
  }
};

/**
 * Get the current date in ISO format for the user's timezone.
 * This is useful for API requests that need the current date.
 * @returns Date string in YYYY-MM-DD format
 */
export const getCurrentDateForUser = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert a date string to ISO format with user's timezone.
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns ISO string with timezone information
 */
export const dateToISOWithTimezone = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString();
};