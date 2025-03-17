const Map = require('../../js/models/map');

describe('Map Model', () => {
  let map;
  
  beforeEach(() => {
    // Setup with mock data
    map = new Map({
      id: 'map-1',
      name: 'Test Map',
      description: 'A test map',
      stakeholders: []
    });
  });

  test('should create an instance of Map', () => {
    expect(map).toBeInstanceOf(Map);
  });

  test('should have correct properties', () => {
    expect(map.id).toBe('map-1');
    expect(map.name).toBe('Test Map');
    expect(map.description).toBe('A test map');
    expect(map.stakeholders).toEqual([]);
  });

  test('should add stakeholder correctly', () => {
    const stakeholder = { id: 'stakeholder-1', name: 'Test Stakeholder' };
    map.addStakeholder(stakeholder);
    
    expect(map.stakeholders).toContainEqual(stakeholder);
  });

  test('should remove stakeholder correctly', () => {
    const stakeholder = { id: 'stakeholder-1', name: 'Test Stakeholder' };
    map.addStakeholder(stakeholder);
    map.removeStakeholder('stakeholder-1');
    
    expect(map.stakeholders).not.toContainEqual(stakeholder);
  });

  test('should find stakeholder by id', () => {
    const stakeholder = { id: 'stakeholder-1', name: 'Test Stakeholder' };
    map.addStakeholder(stakeholder);
    
    expect(map.findStakeholderById('stakeholder-1')).toEqual(stakeholder);
  });

  test('should update map properties', () => {
    map.update({ name: 'Updated Map', description: 'Updated description' });
    
    expect(map.name).toBe('Updated Map');
    expect(map.description).toBe('Updated description');
  });

  // Test any other methods specific to Map model
}); 