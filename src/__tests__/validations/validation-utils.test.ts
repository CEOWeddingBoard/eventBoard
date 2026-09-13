import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'
import { 
  validate, 
  safeValidate, 
  formatValidationErrors,
  getFirstValidationError,
  isValidationError,
  ValidationError 
} from '@/lib/validations/validation-utils'

describe('Validation Utils', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
  })

  describe('validate', () => {
    it('should return validated data for valid input', () => {
      const validData = { name: 'Test', email: 'test@example.com' }
      const result = validate(testSchema, validData)
      expect(result).toEqual(validData)
    })

    it('should throw ValidationError for invalid input', () => {
      const invalidData = { name: '', email: 'invalid' }
      expect(() => validate(testSchema, invalidData)).toThrow(ValidationError)
    })
  })

  describe('safeValidate', () => {
    it('should return success for valid input', () => {
      const validData = { name: 'Test', email: 'test@example.com' }
      const result = safeValidate(testSchema, validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should return errors for invalid input', () => {
      const invalidData = { name: '', email: 'invalid' }
      const result = safeValidate(testSchema, invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('formatValidationErrors', () => {
    it('should format multiple errors', () => {
      const errors: ValidationErrorItem[] = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' },
      ]
      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('name: Name is required')
      expect(formatted).toContain('email: Invalid email')
    })
  })

  describe('getFirstValidationError', () => {
    it('should return first error message', () => {
      const errors: ValidationErrorItem[] = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' },
      ]
      const first = getFirstValidationError(errors)
      expect(first).toBe('Name is required')
    })

    it('should return default message for empty array', () => {
      const first = getFirstValidationError([])
      expect(first).toBe('Błąd walidacji')
    })
  })

  describe('isValidationError', () => {
    it('should identify ValidationError', () => {
      const error = new ValidationError([{ field: 'name', message: 'Error' }])
      expect(isValidationError(error)).toBe(true)
    })

    it('should reject other errors', () => {
      const error = new Error('Regular error')
      expect(isValidationError(error)).toBe(false)
    })
  })
})
