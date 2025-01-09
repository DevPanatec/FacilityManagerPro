import { userService } from '../user.service'
import { supabaseService } from '@/services/supabaseService'

// Mock de supabaseService
jest.mock('@/services/supabaseService', () => ({
  supabaseService: {
    db: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis()
    }
  }
}))

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUsers', () => {
    it('debería obtener todos los usuarios', async () => {
      const mockUsers = [
        { id: '1', email: 'usuario1@test.com', role: 'usuario' },
        { id: '2', email: 'usuario2@test.com', role: 'admin' }
      ]

      const mockResponse = { data: mockUsers, error: null }
      ;(supabaseService.db.from as jest.Mock).mockReturnThis()
      ;(supabaseService.db.select as jest.Mock).mockReturnThis()
      ;(supabaseService.db.order as jest.Mock).mockResolvedValue(mockResponse)

      const result = await userService.getUsers()

      expect(result).toEqual(mockUsers)
      expect(supabaseService.db.from).toHaveBeenCalledWith('users')
      expect(supabaseService.db.select).toHaveBeenCalled()
    })

    it('debería manejar errores al obtener usuarios', async () => {
      const mockError = new Error('Error al obtener usuarios')
      const mockResponse = { data: null, error: mockError }
      ;(supabaseService.db.from as jest.Mock).mockReturnThis()
      ;(supabaseService.db.select as jest.Mock).mockReturnThis()
      ;(supabaseService.db.order as jest.Mock).mockResolvedValue(mockResponse)

      await expect(userService.getUsers()).rejects.toThrow('Error al obtener usuarios')
    })
  })

  describe('getUserById', () => {
    it('debería obtener un usuario por ID', async () => {
      const mockUser = {
        id: '1',
        email: 'usuario@test.com',
        role: 'usuario'
      }

      const mockResponse = { data: mockUser, error: null }
      ;(supabaseService.db.from as jest.Mock).mockReturnThis()
      ;(supabaseService.db.select as jest.Mock).mockReturnThis()
      ;(supabaseService.db.eq as jest.Mock).mockReturnThis()
      ;(supabaseService.db.single as jest.Mock).mockResolvedValue(mockResponse)

      const result = await userService.getUserById('1')

      expect(result).toEqual(mockUser)
      expect(supabaseService.db.from).toHaveBeenCalledWith('users')
      expect(supabaseService.db.select).toHaveBeenCalled()
      expect(supabaseService.db.eq).toHaveBeenCalledWith('id', '1')
    })
  })
}) 