import { describe, it, expect } from '@jest/globals'
import { createBudgetItemSchema } from '@/lib/validations/budget'
import { safeValidate } from '@/lib/validations/validation-utils'

describe('Budget Validation', () => {
  describe('createBudgetItemSchema', () => {
    it('should validate valid budget item data', () => {
      const validData = {
        name: 'Fotograf',
        category: 'vendors',
        plannedAmount: 5000,
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createBudgetItemSchema, validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative amounts', () => {
      const invalidData = {
        name: 'Fotograf',
        category: 'vendors',
        plannedAmount: -100,
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createBudgetItemSchema, invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field === 'plannedAmount')).toBe(true)
      }
    })

    it('should accept zero for actualAmount', () => {
      const validData = {
        name: 'Fotograf',
        category: 'vendors',
        plannedAmount: 5000,
        actualAmount: 0,
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createBudgetItemSchema, validData)
      expect(result.success).toBe(true)
    })
  })
})
