import { describe, it, expect } from '@jest/globals'
import { 
  emailSchema,
  phoneSchema,
  futureDateSchema,
  positiveNumberSchema,
  requiredStringSchema,
  idSchema,
  taskStatusSchema,
  taskPrioritySchema,
} from '@/lib/validations/common'
import { safeValidate } from '@/lib/validations/validation-utils'

describe('Common Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate valid email', () => {
      const result = safeValidate(emailSchema, 'test@example.com')
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = safeValidate(emailSchema, 'invalid-email')
      expect(result.success).toBe(false)
    })
  })

  describe('phoneSchema', () => {
    it('should validate Polish phone numbers', () => {
      const validNumbers = ['+48123456789', '123456789', '+48987654321']
      validNumbers.forEach(phone => {
        const result = safeValidate(phoneSchema, phone)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = ['123', 'abc', '123456789012345']
      invalidNumbers.forEach(phone => {
        const result = safeValidate(phoneSchema, phone)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('futureDateSchema', () => {
    it('should validate future dates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      const result = safeValidate(futureDateSchema, futureDate)
      expect(result.success).toBe(true)
    })

    it('should reject past dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      const result = safeValidate(futureDateSchema, pastDate)
      expect(result.success).toBe(false)
    })
  })

  describe('positiveNumberSchema', () => {
    it('should validate positive numbers', () => {
      const result = safeValidate(positiveNumberSchema, 100)
      expect(result.success).toBe(true)
    })

    it('should reject zero', () => {
      const result = safeValidate(positiveNumberSchema, 0)
      expect(result.success).toBe(false)
    })

    it('should reject negative numbers', () => {
      const result = safeValidate(positiveNumberSchema, -10)
      expect(result.success).toBe(false)
    })
  })

  describe('requiredStringSchema', () => {
    it('should validate non-empty strings', () => {
      const schema = requiredStringSchema(1)
      const result = safeValidate(schema, 'test')
      expect(result.success).toBe(true)
    })

    it('should reject empty strings', () => {
      const schema = requiredStringSchema(1)
      const result = safeValidate(schema, '')
      expect(result.success).toBe(false)
    })
  })

  describe('idSchema', () => {
    it('should validate CUID format', () => {
      const validId = 'clx1234567890abcdef'
      const result = safeValidate(idSchema, validId)
      expect(result.success).toBe(true)
    })

    it('should reject invalid IDs', () => {
      const invalidIds = ['123', 'abc', '']
      invalidIds.forEach(id => {
        const result = safeValidate(idSchema, id)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('taskStatusSchema', () => {
    it('should validate valid statuses', () => {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED']
      validStatuses.forEach(status => {
        const result = safeValidate(taskStatusSchema, status)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status', () => {
      const result = safeValidate(taskStatusSchema, 'INVALID')
      expect(result.success).toBe(false)
    })
  })

  describe('taskPrioritySchema', () => {
    it('should validate valid priorities', () => {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH']
      validPriorities.forEach(priority => {
        const result = safeValidate(taskPrioritySchema, priority)
        expect(result.success).toBe(true)
      })
    })
  })
})
