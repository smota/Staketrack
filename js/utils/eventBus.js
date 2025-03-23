/**
 * Event Bus - Utility for event-driven communication between components
 */
class EventBusClass {
  constructor() {
    this.events = {};
    this.debug = false; // Set to true to enable debug logging
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

    if (this.debug) {
      console.log(`EventBus: Subscribed to '${event}', total subscribers: ${this.events[event].length}`);
    }

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);

      if (this.debug) {
        console.log(`EventBus: Unsubscribed from '${event}', remaining subscribers: ${this.events[event]?.length || 0}`);
      }
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

      if (this.debug) {
        console.log(`EventBus: Removed listener from '${event}', remaining: ${this.events[event].length}`);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to callbacks
   */
  emit(event, ...args) {
    console.log(`EventBus: Emitting '${event}'${args.length ? ' with args:' : ''}`, args.length ? args : '');

    if (this.events[event]) {
      const subscribers = this.events[event].length;
      console.log(`EventBus: '${event}' has ${subscribers} listener(s)`);

      this.events[event].forEach((callback, index) => {
        try {
          // For critical events like auth:skip, run them synchronously
          if (event === 'auth:skip') {
            callback(...args);
            console.log(`EventBus: Executed '${event}' listener ${index + 1}/${subscribers} synchronously`);
          } else {
            // Use setTimeout for other events to avoid blocking
            setTimeout(() => {
              try {
                callback(...args);
                if (this.debug) {
                  console.log(`EventBus: Executed '${event}' listener ${index + 1}/${subscribers}`);
                }
              } catch (error) {
                console.error(`EventBus: Error in '${event}' listener ${index + 1}/${subscribers}:`, error);
              }
            }, 0);
          }
        } catch (error) {
          console.error(`EventBus: Error in '${event}' listener ${index + 1}/${subscribers}:`, error);
        }
      });
    } else {
      console.warn(`EventBus: No listeners for '${event}'`);
    }
  }

  /**
   * Clear all event listeners
   */
  clear() {
    this.events = {};

    if (this.debug) {
      console.log('EventBus: All event listeners cleared');
    }
  }

  /**
   * Get all events
   * @returns {Object} - Event object
   */
  getEvents() {
    return this.events;
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`EventBus: Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Singleton instance
export const EventBus = new EventBusClass();

// Enable debug in development environment
if (typeof window !== 'undefined' && window.ENV && window.ENV.ENVIRONMENT === 'DEV') {
  EventBus.setDebug(true);
}
