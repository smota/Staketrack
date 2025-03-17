const stakeholderController = require('../../js/controllers/stakeholderController');
// Import any mocks needed

describe('Stakeholder Controller', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('getAllStakeholders', () => {
    test('should return all stakeholders', async () => {
      // Arrange
      const req = {
        params: {
          projectId: '123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Act
      await stakeholderController.getAllStakeholders(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object)
        ])
      );
    });
  });
  
  describe('createStakeholder', () => {
    test('should create a new stakeholder successfully', async () => {
      // Arrange
      const req = {
        params: {
          projectId: '123'
        },
        body: {
          name: 'Test Stakeholder',
          influence: 5,
          interest: 4,
          position: { x: 10, y: 20 }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Act
      await stakeholderController.createStakeholder(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Test Stakeholder'
        })
      );
    });
    
    test('should return error when required fields are missing', async () => {
      // Arrange
      const req = {
        params: {
          projectId: '123'
        },
        body: {
          // Missing required fields
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Act
      await stakeholderController.createStakeholder(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('required')
        })
      );
    });
  });
  
  describe('updateStakeholder', () => {
    test('should update stakeholder successfully', async () => {
      // Arrange
      const req = {
        params: {
          projectId: '123',
          stakeholderId: '456'
        },
        body: {
          name: 'Updated Stakeholder',
          influence: 3
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Act
      await stakeholderController.updateStakeholder(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Stakeholder'
        })
      );
    });
  });
  
  // Add more test cases for other methods in stakeholderController
}); 