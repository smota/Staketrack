const appController = require('../../js/controllers/appController')
// Import any mocks needed

describe('App Controller', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('getProjects', () => {
    test('should return all projects for user', async () => {
      // Arrange
      const req = {
        user: {
          id: 'user123'
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }

      // Act
      await appController.getProjects(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String)
          })
        ])
      )
    })
  })

  describe('createProject', () => {
    test('should create a new project successfully', async () => {
      // Arrange
      const req = {
        user: {
          id: 'user123'
        },
        body: {
          name: 'Test Project',
          description: 'A test project'
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }

      // Act
      await appController.createProject(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Test Project'
        })
      )
    })
  })

  describe('getProjectById', () => {
    test('should return project by id', async () => {
      // Arrange
      const req = {
        params: {
          projectId: '123'
        },
        user: {
          id: 'user123'
        }
      }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }

      // Act
      await appController.getProjectById(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String)
        })
      )
    })
  })
})
