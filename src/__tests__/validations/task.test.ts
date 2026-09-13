import { describe, it, expect } from '@jest/globals'
import { createTaskSchema } from '@/lib/validations/task'
import { safeValidate } from '@/lib/validations/validation-utils'

describe('Task Validation', () => {
  describe('createTaskSchema', () => {
    it('should validate valid task data', () => {
      const validData = {
        title: 'Zarezerwuj salę',
        category: 'planning',
        status: 'TODO' as const,
        priority: 'HIGH' as const,
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createTaskSchema, validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        category: 'planning',
        // Missing title and eventId
      }

      const result = safeValidate(createTaskSchema, invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate status enum', () => {
      const invalidData = {
        title: 'Task',
        category: 'planning',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'INVALID_STATUS' as any,
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createTaskSchema, invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate priority enum', () => {
      const invalidData = {
        title: 'Task',
        category: 'planning',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        priority: 'INVALID_PRIORITY' as any,
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createTaskSchema, invalidData)
      expect(result.success).toBe(false)
    })
  })
})
