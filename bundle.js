// Find the function that's trying to use analytics.logEvent
// ... existing code ...
value() {
  try {
    // Add null check for analytics service
    if (this.analytics && typeof this.analytics.logEvent === 'function') {
      this.analytics.logEvent(...arguments);
    }
  } catch (error) {
    console.warn('Analytics not available:', error);
  }
}
// ... existing code ...

// Find the function that's using record
// ... existing code ...
value() {
  // Add null check for the record property
  if (this.currentObject && this.currentObject.record) {
    // Use the record property
    return this.currentObject.record;
  } else {
    // Provide a fallback or default behavior
    return { /* default record structure */ };
  }
}
// ... existing code ...

// Find the map creation handler
// ... existing code ...
// After successful map creation, ensure the dialog is closed
EventBus.subscribe('map:created', (map) => {
  // Close the CREATE NEW MAP dialog
  this.closeDialog(); // or whatever method is used to close the dialog

  // Ensure the UI updates to show the new map
  this.showMap(map);

  // Log success (without using Firebase if not available)
  try {
    if (this.analytics && typeof this.analytics.logEvent === 'function') {
      this.analytics.logEvent('map_created', { mapId: map.id });
    }
  } catch (error) {
    console.warn('Analytics logging failed:', error);
  }
});
// ... existing code ...

// Find the save map function that's failing
// ... existing code ...
async saveMap(map) {
  try {
    // Implement a guest mode fallback that uses localStorage
    if (!firebase.auth().currentUser) {
      // Save to localStorage for guest users
      const maps = JSON.parse(localStorage.getItem('guestMaps') || '[]');
      const updatedMap = { ...map, id: map.id || `guest-map-${Date.now()}` };

      const existingIndex = maps.findIndex(m => m.id === updatedMap.id);
      if (existingIndex >= 0) {
        maps[existingIndex] = updatedMap;
      } else {
        maps.push(updatedMap);
      }

      localStorage.setItem('guestMaps', JSON.stringify(maps));

      // Emit events to update the UI
      EventBus.emit('map:created', updatedMap);
      EventBus.emit('map:current-changed', updatedMap);

      return updatedMap;
    } else {
      // Regular Firebase save logic here
      // ... existing Firebase save code ...
    }
  } catch (error) {
    console.error('Error saving map:', error);
    // Handle error gracefully, perhaps show a user notification
  }
}
// ... existing code ... 