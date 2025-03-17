import {
  fetchStakes,
  addStake,
  updateStake,
  deleteStake,
  calculateReturns
} from '../../js/services/dataService';

// Mock dependencies
jest.mock('../../js/services/firebaseService', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn()
}));

describe('dataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStakes', () => {
    it('should fetch stakes for a user', async () => {
      // Arrange
      const mockStakes = [
        { id: '1', amount: 100, validator: 'validator1' },
        { id: '2', amount: 200, validator: 'validator2' }
      ];
      const mockQuerySnapshot = {
        docs: mockStakes.map(stake => ({
          id: stake.id,
          data: () => stake
        }))
      };
      const getDocs = require('../../js/services/firebaseService').getDocs;
      getDocs.mockResolvedValue(mockQuerySnapshot);

      // Act
      const result = await fetchStakes('user123');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ id: '1', amount: 100 }));
      expect(result[1]).toEqual(expect.objectContaining({ id: '2', amount: 200 }));
    });

    it('should return empty array if query fails', async () => {
      // Arrange
      const getDocs = require('../../js/services/firebaseService').getDocs;
      getDocs.mockRejectedValue(new Error('Firestore error'));

      // Act
      const result = await fetchStakes('user123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('addStake', () => {
    it('should add a new stake document', async () => {
      // Arrange
      const newStake = { amount: 100, validator: 'validator1' };
      const mockDocRef = { id: 'newStakeId' };
      const addDoc = require('../../js/services/firebaseService').addDoc;
      addDoc.mockResolvedValue(mockDocRef);

      // Act
      const result = await addStake('user123', newStake);

      // Assert
      expect(addDoc).toHaveBeenCalled();
      expect(result).toEqual({ id: 'newStakeId', ...newStake });
    });
  });

  // Tests for updateStake, deleteStake, calculateReturns, etc.
}); 