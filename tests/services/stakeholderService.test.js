import { StakeholderService } from '@/services/stakeholderService'
import { authService } from '@/services/authService'
import { localStorageService } from '@/services/localStorageService'
import { aiService } from '@/services/aiService'
import config from '@/config'

// Mock dependencies
jest.mock('@/firebase', () => ({
  db: {},
  auth: {}
}))

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: class {
    static fromDate(date) {
      return date
    }
    toDate() {
      return this
    }
  }
}))

jest.mock('@/services/authService', () => ({
  authService: {
    getCurrentUser: jest.fn()
  }
}))

jest.mock('@/services/localStorageService', () => ({
  localStorageService: {
    getMaps: jest.fn(),
    saveMap: jest.fn(),
    deleteMap: jest.fn(),
    getStakeholders: jest.fn(),
    saveStakeholder: jest.fn(),
    deleteStakeholders: jest.fn()
  }
}))

jest.mock('@/services/aiService', () => ({
  aiService: {
    getRecommendations: jest.fn()
  }
}))

jest.mock('@/config', () => ({
  features: {
    useEmulators: false
  },
  validation: {
    stakeholderMap: {
      descriptionMaxLength: 500,
      nameMaxLength: 100
    }
  }
}))

const { getDoc, getDocs, addDoc, updateDoc, deleteDoc, Timestamp } = require('firebase/firestore')

describe('Stakeholder Service', () => {
  let stakeholderServiceInstance

  beforeEach(() => {
    jest.clearAllMocks()
    stakeholderServiceInstance = new StakeholderService()
  })

  describe('Online Mode', () => {
    beforeEach(() => {
      authService.getCurrentUser.mockReturnValue({ uid: 'test-user' })
    })

    it('creates a map', async () => {
      const mapData = { name: 'Test Map' }
      addDoc.mockResolvedValue({ id: 'map-1' })
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mapData, createdBy: 'test-user' }),
        id: 'map-1'
      })
      const map = await stakeholderServiceInstance.createMap(mapData)
      expect(addDoc).toHaveBeenCalled()
      expect(map.id).toBe('map-1')
      expect(map.name).toBe('Test Map')
    })

    it('gets a map', async () => {
      const mapData = { id: 'map-1', name: 'Test Map', createdBy: 'test-user', toObject: () => mapData }
      getDoc.mockResolvedValue({ exists: () => true, data: () => mapData, id: 'map-1' })
      getDocs.mockResolvedValue({ docs: [] })
      const map = await stakeholderServiceInstance.getMap('map-1')
      expect(getDoc).toHaveBeenCalled()
      expect(map.name).toBe('Test Map')
    })

    it('updates a map', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ name: 'Test Map', createdBy: 'test-user' }),
        id: 'map-1'
      })
      getDocs.mockResolvedValue({ docs: [] })
      await stakeholderServiceInstance.updateMap('map-1', { name: 'Updated Map' })
      expect(updateDoc).toHaveBeenCalled()
    })

    it('deletes a map', async () => {
      getDocs.mockResolvedValue({ docs: [] }) // Mock docs for stakeholder deletion
      await stakeholderServiceInstance.deleteMap('map-1')
      expect(deleteDoc).toHaveBeenCalled()
    })
  })

  describe('Local Mode', () => {
    beforeEach(() => {
      authService.getCurrentUser.mockReturnValue({ isAnonymous: true })
    })

    it('creates a map locally', async () => {
      const mapData = { name: 'Local Map' }
      await stakeholderServiceInstance.createMap(mapData)
      expect(localStorageService.saveMap).toHaveBeenCalled()
    })
  })
})
