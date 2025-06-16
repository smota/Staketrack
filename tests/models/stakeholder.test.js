import { Stakeholder } from '@/models/Stakeholder'
// Mock config to isolate the test from global settings
jest.mock('@/config', () => ({
  defaults: {
    stakeholder: {
      category: 'external'
    }
  },
  validation: {
    stakeholder: {
      interestsMaxLength: 500
    }
  }
}))
import config from '@/config'

describe('Stakeholder Model', () => {
  let stakeholderData

  beforeEach(() => {
    stakeholderData = {
      id: 'stake-123',
      mapId: 'map-456',
      name: 'John Doe',
      influence: 8,
      impact: 9,
      category: 'internal',
      interests: 'Loves testing',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  })

  it('creates a stakeholder with provided data', () => {
    const stakeholder = new Stakeholder(stakeholderData)
    expect(stakeholder.id).toBe('stake-123')
    expect(stakeholder.name).toBe('John Doe')
    expect(stakeholder.influence).toBe(8)
    expect(stakeholder.quadrant).toBe('manage-closely')
  })

  it('creates a stakeholder with default values', () => {
    const stakeholder = new Stakeholder()
    expect(stakeholder.name).toBe('')
    expect(stakeholder.influence).toBe(5)
    expect(stakeholder.impact).toBe(5)
    expect(stakeholder.quadrant).toBe('monitor')
    expect(stakeholder.category).toBe('other')
  })

  it('updates the updatedAt timestamp when a property is set', () => {
    const stakeholder = new Stakeholder(stakeholderData)
    const initialUpdatedAt = stakeholder.updatedAt
    stakeholder.name = 'Jane Doe'
    expect(stakeholder.updatedAt).not.toBe(initialUpdatedAt)
  })

  it('correctly calculates the quadrant', () => {
    const stakeholder = new Stakeholder(stakeholderData)
    stakeholder.influence = 8
    stakeholder.impact = 8
    expect(stakeholder.quadrant).toBe('manage-closely')

    stakeholder.influence = 8
    stakeholder.impact = 5
    expect(stakeholder.quadrant).toBe('keep-satisfied')

    stakeholder.influence = 5
    stakeholder.impact = 8
    expect(stakeholder.quadrant).toBe('keep-informed')

    stakeholder.influence = 5
    stakeholder.impact = 5
    expect(stakeholder.quadrant).toBe('monitor')
  })

  it('validates numeric ranges', () => {
    stakeholderData.influence = 99
    const stakeholder = new Stakeholder(stakeholderData)
    // Falls back to the default value (5)
    expect(stakeholder.influence).toBe(5)

    stakeholder.influence = 7.8
    expect(stakeholder.influence).toBe(8) // Should round
  })

  it('validates text field length', () => {
    const longText = 'a'.repeat(config.validation.stakeholder.interestsMaxLength + 10)
    stakeholderData.interests = longText
    const stakeholder = new Stakeholder(stakeholderData)
    expect(stakeholder.interests.length).toBe(config.validation.stakeholder.interestsMaxLength)
  })

  it('adds and removes interactions', () => {
    const stakeholder = new Stakeholder(stakeholderData)
    const interaction = { type: 'meeting', notes: 'Discussed testing' }
    const added = stakeholder.addInteraction(interaction)

    expect(stakeholder.interactions.length).toBe(1)
    expect(stakeholder.interactions[0].notes).toBe('Discussed testing')

    const removed = stakeholder.removeInteraction(added.id)
    expect(removed).toBe(true)
    expect(stakeholder.interactions.length).toBe(0)
  })

  it('serializes to and from a plain object', () => {
    const stakeholder = new Stakeholder(stakeholderData)
    const obj = stakeholder.toObject()
    expect(obj.name).toBe('John Doe')

    const newStakeholder = Stakeholder.fromObject(obj)
    expect(newStakeholder.name).toBe('John Doe')
    expect(newStakeholder.quadrant).toBe('manage-closely')
  })
})
