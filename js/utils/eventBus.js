/**
 * Event Bus - Utility for event-driven communication between components
 */
class EventBusClass {
  constructor() {
    this.events = {};
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Subscribe to an event and only trigger once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  once(event, callback) {
    const onceCallback = (...args) => {
      this.off(event, onceCallback);
      callback.apply(this, args);
    };
    
    return this.on(event, onceCallback);
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to callbacks
   */
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        setTimeout(() => {
          callback(...args);
        }, 0);
      });
    }
  }
  
  /**
   * Clear all event listeners
   */
  clear() {
    this.events = {};
  }
  
  /**
   * Get all events
   * @returns {Object} - Event object
   */
  getEvents() {
    return this.events;
  }
}

// Singleton instance
export const EventBus = new EventBusClass();
