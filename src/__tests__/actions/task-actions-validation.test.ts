import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createTask, updateTaskStatus } from '@/lib/actions/task.actions'
import { prisma } from '@/lib/prisma'
import { ValidationError } from '@/lib/validations/validation-utils'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Task Actions Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTask', () => {
    it('should validate and create task', async () => {
      const validData = {
        title: 'Zarezerwuj salę',
        category: 'planning',
        status: 'TODO' as const,
        priority: 'HIGH' as const,
        eventId: 'clx1234567890',
      }

      const mockTask = { id: 'task-1', ...validData }
      ;(prisma.task.create as jest.Mock).mockResolvedValue(mockTask)

      const result = await createTask(validData)

      expect(prisma.task.create).toHaveBeenCalled()
      expect(result).toEqual(mockTask)
    })

    it('should reject invalid status', async () => {
      const invalidData = {
        title: 'Task',
        category: 'planning',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'INVALID' as any,
        eventId: 'clx1234567890',
      }

      await expect(createTask(invalidData)).rejects.toThrow(ValidationError)
    })
  })

  describe('updateTaskStatus', () => {
    it('should validate status enum', async () => {
      ;(prisma.task.update as jest.Mock).mockResolvedValue({})

      await updateTaskStatus('task-1', 'DONE')
      expect(prisma.task.update).toHaveBeenCalled()
    })

    it('should reject invalid status', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(updateTaskStatus('task-1', 'INVALID' as any)).rejects.toThrow(ValidationError)
    })
  })
})
