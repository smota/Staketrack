/**
 * Enhanced bundle with proper error handling for Firebase services
 */

// Initialize event bus for application communication
const EventBus = {
  events: {},

  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    console.log(`EventBus: ${event} has ${this.events[event].length} listener(s)`);
    return () => this.unsubscribe(event, callback);
  },

  unsubscribe(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  },

  emit(event, ...args) {
    console.log(`EventBus: Emitting '${event}' with args:`, args);
    if (this.events[event]) {
      console.log(`EventBus: '${event}' has ${this.events[event].length} listener(s)`);
      this.events[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} event handler:`, error);
        }
      });
    } else {
      console.log(`EventBus: No listeners for '${event}'`);
    }
  }
};

// Make EventBus global
window.EventBus = EventBus;

// Analytics wrapper with fallback
class Analytics {
  constructor() {
    this.analytics = window.firebaseAnalytics;
  }

  logEvent() {
    try {
      if (this.analytics && typeof this.analytics.logEvent === 'function') {
        this.analytics.logEvent(...arguments);
      }
    } catch (error) {
      console.warn('Analytics not available:', error);
    }
  }
}

// StakeholderManager - handles stakeholder operations with localStorage fallback
class StakeholderManager {
  constructor() {
    this.initialize();
  }

  initialize() {
    console.log('StakeholderList initialized, listening for stakeholder events');
    EventBus.subscribe('stakeholder:loaded', this.handleStakeholderLoaded.bind(this));
  }

  handleStakeholderLoaded(stakeholders) {
    this.stakeholders = stakeholders || [];
  }

  async getStakeholders(projectId = 'default') {
    try {
      // Check if Firebase is available
      if (window.firebaseFirestore && window.ENV && !window.ENV.CONFIG_INCOMPLETE) {
        const db = window.firebaseFirestore;
        const snapshot = await db.collection('projects').doc(projectId)
          .collection('stakeholders').get();

        const stakeholders = [];
        snapshot.forEach(doc => {
          stakeholders.push(doc.data());
        });

        return stakeholders;
      } else {
        // Use localStorage as fallback
        console.log('Using localStorage fallback for stakeholder retrieval');
        const storageKey = `stakeholders-${projectId}`;
        return JSON.parse(localStorage.getItem(storageKey) || '[]');
      }
    } catch (error) {
      console.error('Error getting stakeholders:', error);
      return [];
    }
  }

  async addStakeholder(stakeholder) {
    try {
      // Add unique ID if not provided
      const stakeholderWithId = {
        ...stakeholder,
        id: stakeholder.id || `stakeholder-${Date.now()}`
      };

      // Check if Firebase is available
      if (window.firebaseFirestore && window.ENV && !window.ENV.CONFIG_INCOMPLETE) {
        // Normal Firebase save logic
        const db = window.firebaseFirestore;
        const projectId = stakeholderWithId.projectId || 'default';

        await db.collection('projects').doc(projectId)
          .collection('stakeholders').doc(stakeholderWithId.id)
          .set(stakeholderWithId);
      } else {
        // Use localStorage as fallback when Firebase isn't available
        console.log('Using localStorage fallback for stakeholder add');

        // Get existing stakeholders from localStorage
        const storageKey = `stakeholders-${stakeholderWithId.projectId || 'default'}`;
        const existingStakeholders = JSON.parse(localStorage.getItem(storageKey) || '[]');

        // Add or update stakeholder
        const existingIndex = existingStakeholders.findIndex(s => s.id === stakeholderWithId.id);
        if (existingIndex >= 0) {
          existingStakeholders[existingIndex] = stakeholderWithId;
        } else {
          existingStakeholders.push(stakeholderWithId);
        }

        // Save back to localStorage
        localStorage.setItem(storageKey, JSON.stringify(existingStakeholders));
      }

      // Emit event to update UI regardless of storage method
      EventBus.emit('stakeholder:added', stakeholderWithId);
      return stakeholderWithId;
    } catch (error) {
      console.error('Error adding stakeholder:', error);
      alert('Failed to add stakeholder. Please try again.');
      throw error;
    }
  }
}

// MapManager - handles map operations with fallback
class MapManager {
  constructor() {
    this.currentMap = null;
    this.initialize();
  }

  initialize() {
    console.log('MatrixView initialized, listening for stakeholder events');
    EventBus.subscribe('map:created', this.handleMapCreated.bind(this));
  }

  handleMapCreated(map) {
    this.currentMap = map;
  }

  getRecord() {
    try {
      if (this.currentMap && this.currentMap.record) {
        return this.currentMap.record;
      } else {
        return {};
      }
    } catch (error) {
      console.warn('Error accessing record:', error);
      return {};
    }
  }

  getPlotPosition(item) {
    try {
      if (item && typeof item.getPlotPosition === 'function') {
        return item.getPlotPosition();
      } else if (item && item.position) {
        return item.position;
      } else {
        console.warn('getPlotPosition not available, using default position');
        return { x: 0, y: 0 };
      }
    } catch (error) {
      console.warn('Error getting plot position:', error);
      return { x: 0, y: 0 };
    }
  }

  async saveMap(map) {
    try {
      const mapWithId = {
        ...map,
        id: map.id || `map-${Date.now()}`
      };

      // Check if Firebase is available
      if (window.firebaseFirestore && window.firebaseAuth && window.firebaseAuth.currentUser) {
        // Normal Firebase save logic for authenticated users
        const db = window.firebaseFirestore;
        await db.collection('maps').doc(mapWithId.id).set(mapWithId);
      } else {
        // Save to localStorage for guest users or when Firebase isn't available
        const maps = JSON.parse(localStorage.getItem('maps') || '[]');

        const existingIndex = maps.findIndex(m => m.id === mapWithId.id);
        if (existingIndex >= 0) {
          maps[existingIndex] = mapWithId;
        } else {
          maps.push(mapWithId);
        }

        localStorage.setItem('maps', JSON.stringify(maps));
      }

      // Emit events to update the UI
      EventBus.emit('map:created', mapWithId);
      EventBus.emit('map:current-changed', mapWithId);

      return mapWithId;
    } catch (error) {
      console.error('Error saving map:', error);
      alert('Failed to save map. Please try again.');
      throw error;
    }
  }
}

// Initialize managers when document is ready
document.addEventListener('DOMContentLoaded', () => {
  window.analytics = new Analytics();
  window.stakeholderManager = new StakeholderManager();
  window.mapManager = new MapManager();
}); 