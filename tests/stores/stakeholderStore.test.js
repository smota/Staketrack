import { useStakeholderStore } from '@/stores/stakeholderStore'
import { stakeholderService } from '@/services'

// Mock the stakeholderService
jest.mock('@/services', () => ({
  stakeholderService: {
    getStakeholders: jest.fn()
  }
}))

describe('Stakeholder Store', () => {
  let store

  beforeEach(() => {
    jest.resetModules()
    const { useStakeholderStore: freshStore } = require('@/stores/stakeholderStore')
    const freshService = require('@/services').stakeholderService
    store = freshStore()
    // Clear mocks before each test
    freshService.getStakeholders.mockClear()
  })

  it('loads stakeholders for a map', async () => {
    const mapId = 'map1'
    const mockStakeholders = [{ id: 's1', name: 'CEO' }]
    const freshService = require('@/services').stakeholderService
    freshService.getStakeholders.mockResolvedValue(mockStakeholders)

    const promise = store.loadStakeholders(mapId)

    // Check loading state
    expect(store.isLoading(mapId)).toBe(true)

    await promise

    expect(freshService.getStakeholders).toHaveBeenCalledWith(mapId)
    expect(store.getStakeholders(mapId)).toEqual(mockStakeholders)
    expect(store.isLoading(mapId)).toBe(false)
  })

  it('handles errors when loading stakeholders', async () => {
    const mapId = 'map2'
    const freshService = require('@/services').stakeholderService
    freshService.getStakeholders.mockRejectedValue(new Error('Fetch failed'))

    // Suppress console.error for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

    await store.loadStakeholders(mapId)

    expect(store.getStakeholders(mapId)).toEqual([])
    expect(store.isLoading(mapId)).toBe(false)

    consoleErrorSpy.mockRestore()
  })

  it('gets a single stakeholder by ID', async () => {
    const mapId = 'map3'
    const mockStakeholders = [{ id: 's1', name: 'CFO' }, { id: 's2', name: 'CTO' }]
    const freshService = require('@/services').stakeholderService
    freshService.getStakeholders.mockResolvedValue(mockStakeholders)

    await store.loadStakeholders(mapId)

    const cto = store.getStakeholderById(mapId, 's2')
    expect(cto.name).toBe('CTO')
  })
})
