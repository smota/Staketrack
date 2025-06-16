module.exports = {
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
    addTo: jest.fn()
  }))
}
