import { Map } from '@/models/Map'

describe('Map Model', () => {
  let mapData

  beforeEach(() => {
    mapData = {
      id: 'map-123',
      name: 'Project Alpha Map',
      description: 'A map for the Alpha project',
      stakeholderCount: 10,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  })

  it('creates a map with provided data', () => {
    const map = new Map(mapData)
    expect(map.id).toBe('map-123')
    expect(map.name).toBe('Project Alpha Map')
    expect(map.stakeholderCount).toBe(10)
  })

  it('creates a map with default values', () => {
    // Mock crypto.randomUUID if not available in JSDOM
    if (!global.crypto) {
      global.crypto = {
        randomUUID: () => 'default-uuid'
      }
    }
    const map = new Map()
    expect(map.name).toBe('New Map')
    expect(map.description).toBe('')
    expect(map.stakeholderCount).toBe(0)
  })

  it('updates the updatedAt timestamp when a property is set', () => {
    const map = new Map(mapData)
    const initialUpdatedAt = map.updatedAt
    map.name = 'Project Beta Map'
    expect(map.updatedAt).not.toBe(initialUpdatedAt)
    expect(map.updatedAt).toBeInstanceOf(Date)
  })

  it('validates the name setter', () => {
    const map = new Map()
    expect(() => { map.name = '' }).toThrow('Name must be a non-empty string')
    expect(() => { map.name = null }).toThrow('Name must be a non-empty string')
    expect(() => { map.name = 123 }).toThrow('Name must be a non-empty string')
  })

  it('validates the description setter', () => {
    const map = new Map()
    expect(() => { map.description = 123 }).toThrow('Description must be a string')
  })

  it('validates the stakeholderCount setter', () => {
    const map = new Map()
    expect(() => { map.stakeholderCount = -1 }).toThrow('Stakeholder count must be a non-negative integer')
    expect(() => { map.stakeholderCount = 1.5 }).toThrow('Stakeholder count must be a non-negative integer')
    expect(() => { map.stakeholderCount = 'a' }).toThrow('Stakeholder count must be a non-negative integer')
  })

  it('serializes to and from JSON', () => {
    const map = new Map(mapData)
    const json = map.toJSON()
    expect(json.name).toBe('Project Alpha Map')

    const newMap = Map.fromJSON(json)
    expect(newMap.name).toBe('Project Alpha Map')
    expect(newMap.id).toBe('map-123')
  })
})
