/**
 * Date Utilities - Helper functions for working with dates
 */
class DateUtils {
  /**
   * Format a date to a string
   * @param {Date} date - Date to format
   * @param {string} [format='date'] - Format type ('full', 'date', 'time', 'datetime', 'relative')
   * @returns {string} - Formatted date string
   */
  formatDate(date, format = 'date') {
    if (!date) return '';
    
    // Ensure date is a Date object
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    switch (format) {
      case 'full':
        return date.toLocaleString();
      case 'date':
        return date.toLocaleDateString();
      case 'time':
        return date.toLocaleTimeString();
      case 'datetime':
        // Format as YYYY-MM-DD HH:MM
        return `${date.getFullYear()}-${this._padZero(date.getMonth() + 1)}-${this._padZero(date.getDate())} ${this._padZero(date.getHours())}:${this._padZero(date.getMinutes())}`;
      case 'relative':
        return this.getRelativeTime(date);
      default:
        return date.toLocaleString();
    }
  }
  
  /**
   * Get relative time (e.g., "5 minutes ago")
   * @param {Date} date - Date to get relative time for
   * @returns {string} - Relative time string
   */
  getRelativeTime(date) {
    if (!date) return '';
    
    // Ensure date is a Date object
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    const now = new Date();
    const diffMs = now - date;
    
    // Convert to seconds, minutes, hours, days
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSec < 5) {
      return 'just now';
    } else if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else if (diffHrs < 24) {
      return diffHrs === 1 ? '1 hour ago' : `${diffHrs} hours ago`;
    } else if (diffDays < 30) {
      return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  }
  
  /**
   * Get date difference in days
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} - Difference in days
   */
  getDaysDifference(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    // Ensure dates are Date objects
    if (!(startDate instanceof Date)) {
      startDate = new Date(startDate);
    }
    if (!(endDate instanceof Date)) {
      endDate = new Date(endDate);
    }
    
    // Set times to midnight to compare only dates
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Calculate difference in days
    const diffMs = end - start;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Check if a date is in the past
   * @param {Date} date - Date to check
   * @returns {boolean} - True if date is in the past
   */
  isPast(date) {
    if (!date) return false;
    
    // Ensure date is a Date object
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    return date < new Date();
  }
  
  /**
   * Check if a date is today
   * @param {Date} date - Date to check
   * @returns {boolean} - True if date is today
   */
  isToday(date) {
    if (!date) return false;
    
    // Ensure date is a Date object
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
  
  /**
   * Add days to a date
   * @param {Date} date - Original date
   * @param {number} days - Number of days to add
   * @returns {Date} - New date
   */
  addDays(date, days) {
    if (!date) return null;
    
    // Ensure date is a Date object
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  /**
   * Pad a number with leading zero if needed
   * @param {number} num - Number to pad
   * @returns {string} - Padded number
   * @private
   */
  _padZero(num) {
    return num.toString().padStart(2, '0');
  }
}

// Singleton instance
export const dateUtils = new DateUtils();
