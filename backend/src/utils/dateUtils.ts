// backend/src/utils/dateUtils.ts

/**
 * Centralized date handling utilities
 * Single pattern for all date operations
 */

export class DateUtils {
  /**
   * Parse date string to Date object
   * Always returns Date object or throws error
   */
  static parseDate(dateString: string): Date {
    if (!dateString || typeof dateString !== 'string') {
      throw new Error('Date string is required');
    }

    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    return parsed;
  }

  /**
   * Format date to YYYY-MM-DD string
   * Consistent format across the system
   */
  static formatDate(date: Date): string {
    if (!date || !(date instanceof Date)) {
      throw new Error('Valid Date object is required');
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Format date to YYYY-MM-DD HH:MM:SS string
   * Provides a consistent datetime format for display/logging.
   */
  static formatDateTime(date: Date): string { // ✅ Add this function
    if (!date || !(date instanceof Date)) {
      throw new Error('Valid Date object is required');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Validate date string format
   */
  static isValidDateString(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') {
      return false;
    }

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Check if date is in the past
   */
  static isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate < today;
  }

  /**
   * Get start of today
   */
  static getStartOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Get end of today
   */
  static getEndOfToday(): Date {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  /**
   * Get current year
   */
  static getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Get year from date
   */
  static getYearFromDate(date: Date): number {
    if (!date || !(date instanceof Date)) {
      throw new Error('Valid Date object is required');
    }
    return date.getFullYear();
  }

  /**
   * Create date from year
   */
  static createDateFromYear(year: number, month: number = 0, day: number = 1): Date {
    if (!year || year < 1900 || year > 2100) {
      throw new Error('Valid year is required (1900-2100)');
    }
    return new Date(year, month, day);
  }

  /**
   * Get start of year
   */
  static getStartOfYear(year: number): Date {
    return new Date(year, 0, 1);
  }

  /**
   * Get end of year
   */
  static getEndOfYear(year: number): Date {
    return new Date(year, 11, 31, 23, 59, 59, 999);
  }
}