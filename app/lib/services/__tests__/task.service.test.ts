import { taskService } from '../task.service'
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

describe('TaskService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTasks', () => {
    it('debería obtener todas las tareas', async () => {
      const mockTasks = [
        { id: '1', title: 'Tarea 1' },
        { id: '2', title: 'Tarea 2' }
      ]

      const mockResponse = { data: mockTasks, error: null }
      ;(supabaseService.db.from as jest.Mock).mockReturnThis()
      ;(supabaseService.db.select as jest.Mock).mockReturnThis()
      ;(supabaseService.db.order as jest.Mock).mockResolvedValue(mockResponse)

      const result = await taskService.getTasks()

      expect(result).toEqual(mockTasks)
      expect(supabaseService.db.from).toHaveBeenCalledWith('tasks')
      expect(supabaseService.db.select).toHaveBeenCalled()
    })

    it('debería manejar errores al obtener tareas', async () => {
      const mockError = new Error('Error al obtener tareas')
      const mockResponse = { data: null, error: mockError }
      ;(supabaseService.db.from as jest.Mock).mockReturnThis()
      ;(supabaseService.db.select as jest.Mock).mockReturnThis()
      ;(supabaseService.db.order as jest.Mock).mockResolvedValue(mockResponse)

      await expect(taskService.getTasks()).rejects.toThrow('Error al obtener tareas')
    })
  })

  describe('createTask', () => {
    it('debería crear una nueva tarea', async () => {
      const mockTask = {
        title: 'Nueva Tarea',
        description: 'Descripción de la tarea'
      }

      const mockCreatedTask = {
        id: '1',
        ...mockTask,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const mockResponse = { data: mockCreatedTask, error: null }
      ;(supabaseService.db.from as jest.Mock).mockReturnThis()
      ;(supabaseService.db.insert as jest.Mock).mockReturnThis()
      ;(supabaseService.db.select as jest.Mock).mockReturnThis()
      ;(supabaseService.db.single as jest.Mock).mockResolvedValue(mockResponse)

      const result = await taskService.createTask(mockTask)

      expect(result).toEqual(mockCreatedTask)
      expect(supabaseService.db.from).toHaveBeenCalledWith('tasks')
      expect(supabaseService.db.insert).toHaveBeenCalled()
    })
  })
}) 