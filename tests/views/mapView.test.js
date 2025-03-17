import { MapView } from '../../js/views/mapView';
// You might need to adjust these imports based on your actual implementation
import { mockMapData } from '../mocks/mapMocks';

// Mock leaflet or other map library
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    on: jest.fn(),
    remove: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(() => ({
      openPopup: jest.fn()
    }))
  })),
  layerGroup: jest.fn(() => ({
    addTo: jest.fn(),
    clearLayers: jest.fn(),
    addLayer: jest.fn()
  }))
}));

describe('MapView', () => {
  let mapView;
  let container;

  beforeEach(() => {
    // Setup DOM element to mount the view
    container = document.createElement('div');
    container.id = 'map-container';
    document.body.appendChild(container);
    
    // Initialize the view
    mapView = new MapView(container);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
    mapView.destroy(); // Assuming there's a cleanup method
  });

  test('initializes map correctly', () => {
    // Verify map was initialized with container
    expect(mapView.map).toBeDefined();
  });

  test('renders markers for locations', () => {
    mapView.renderLocations(mockMapData.locations);
    
    // Check if markers were created for each location
    expect(mapView.markers.length).toBe(mockMapData.locations.length);
  });

  test('centers map on selected location', () => {
    const location = mockMapData.locations[0];
    mapView.centerOn(location);
    
    // Verify map was centered
    expect(mapView.map.setView).toHaveBeenCalledWith(
      [location.latitude, location.longitude],
      expect.any(Number) // zoom level
    );
  });

  test('handles click on map', () => {
    // Mock click callback
    const onClickMock = jest.fn();
    mapView.onClick(onClickMock);
    
    // Simulate map click event
    const clickEvent = {
      latlng: { lat: 34.5, lng: -118.2 }
    };
    
    // Trigger the event handler directly
    const mapClickHandler = mapView.map.on.mock.calls.find(
      call => call[0] === 'click'
    )[1];
    
    mapClickHandler(clickEvent);
    
    // Verify callback was called with coordinates
    expect(onClickMock).toHaveBeenCalledWith(clickEvent.latlng);
  });

  test('updates polygon overlays', () => {
    const polygons = mockMapData.polygons;
    mapView.renderPolygons(polygons);
    
    // Check if layer group was used and polygons were added
    expect(mapView.polygonLayer.clearLayers).toHaveBeenCalled();
    expect(mapView.polygonLayer.addLayer).toHaveBeenCalledTimes(polygons.length);
  });
}); 