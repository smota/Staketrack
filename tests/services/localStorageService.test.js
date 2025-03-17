import { 
  setItem, 
  getItem, 
  removeItem, 
  clear 
} from '../../js/services/localStorageService';

describe('localStorageService', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  beforeEach(() => {
    // Clear all mocks and storage before each test
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  describe('setItem', () => {
    it('should store string values in localStorage', () => {
      // Act
      setItem('testKey', 'testValue');

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', '"testValue"');
    });

    it('should stringify objects before storing', () => {
      // Arrange
      const testObject = { name: 'Test', value: 123 };
      
      // Act
      setItem('objectKey', testObject);

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith('objectKey', JSON.stringify(testObject));
    });
  });

  describe('getItem', () => {
    it('should retrieve and parse stored values', () => {
      // Arrange
      const testObject = { name: 'Test', value: 123 };
      localStorage.setItem('objectKey', JSON.stringify(testObject));
      
      // Act
      const result = getItem('objectKey');

      // Assert
      expect(result).toEqual(testObject);
    });

    it('should return null for non-existent keys', () => {
      // Act
      const result = getItem('nonExistentKey');

      // Assert
      expect(result).toBeNull();
    });
  });

  // Tests for removeItem and clear methods
}); 