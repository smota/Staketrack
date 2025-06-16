import { StakeholderMap } from '@/models/StakeholderMap'
import { Stakeholder } from '@/models/Stakeholder'

// Mock config to isolate the test
jest.mock('@/config', () => ({
  defaults: {
    stakeholderMap: {
      name: 'Default Map Name'
    }
  },
  validation: {
    stakeholderMap: {
      descriptionMaxLength: 100
    },
    stakeholder: {
      maxStakeholdersPerMap: 50
    }
  }
}))

describe('StakeholderMap Model', () => {
  let mapData

  beforeEach(() => {
    mapData = {
      id: 'map-123',
      name: 'Project Alpha Map',
      stakeholders: [
        { id: 's1', name: 'CEO', influence: 9, impact: 9, category: 'internal' },
        { id: 's2', name: 'Regulator', influence: 8, impact: 4, category: 'external' }
      ]
    }
  })

  it('creates a map with provided data', () => {
    const map = new StakeholderMap(mapData)
    expect(map.id).toBe('map-123')
    expect(map.name).toBe('Project Alpha Map')
    expect(map.stakeholderCount).toBe(2)
    expect(map.stakeholders[0]).toBeInstanceOf(Stakeholder)
  })

  it('creates a map with default values', () => {
    const map = new StakeholderMap()
    expect(map.name).toBe('Default Map Name')
    expect(map.stakeholderCount).toBe(0)
  })

  it('groups stakeholders by quadrant and category', () => {
    const map = new StakeholderMap(mapData)
    expect(map.stakeholdersByQuadrant['manage-closely'].length).toBe(1)
    expect(map.stakeholdersByQuadrant['keep-satisfied'].length).toBe(1)
    expect(map.stakeholdersByCategory['internal'].length).toBe(1)
    expect(map.stakeholdersByCategory['external'].length).toBe(1)
  })

  it('adds, gets, updates, and removes a stakeholder', () => {
    const map = new StakeholderMap()
    const stakeholder = map.addStakeholder({ id: 's3', name: 'Newbie' })

    expect(map.stakeholderCount).toBe(1)
    expect(map.getStakeholder('s3')).toBe(stakeholder)

    map.updateStakeholder('s3', { name: 'Veteran' })
    expect(map.getStakeholder('s3').name).toBe('Veteran')

    const removed = map.removeStakeholder('s3')
    expect(removed).toBe(true)
    expect(map.stakeholderCount).toBe(0)
  })

  it('adds an interaction to a stakeholder', () => {
    const map = new StakeholderMap(mapData)
    const interaction = { notes: 'A quick chat' }
    map.addStakeholderInteraction('s1', interaction)

    const ceo = map.getStakeholder('s1')
    expect(ceo.interactions.length).toBe(1)
    expect(ceo.interactions[0].notes).toBe('A quick chat')
  })

  it('serializes to and from a plain object', () => {
    const map = new StakeholderMap(mapData)
    const obj = map.toObject()
    expect(obj.name).toBe('Project Alpha Map')
    expect(obj.stakeholders.length).toBe(2)

    const newMap = StakeholderMap.fromObject(obj)
    expect(newMap.name).toBe('Project Alpha Map')
    expect(newMap.stakeholders[0]).toBeInstanceOf(Stakeholder)
  })
})
