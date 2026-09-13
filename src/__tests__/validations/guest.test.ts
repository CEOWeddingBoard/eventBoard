import { describe, it, expect } from '@jest/globals'
import { createGuestSchema, updateGuestSchema } from '@/lib/validations/guest'
import { safeValidate } from '@/lib/validations/validation-utils'

describe('Guest Validation', () => {
  describe('createGuestSchema', () => {
    it('should validate valid guest data', () => {
      const validData = {
        name: 'Jan Kowalski',
        email: 'jan@example.com',
        phone: '+48123456789',
        status: 'PENDING' as const,
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createGuestSchema, validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Jan Kowalski')
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'jan@example.com',
        // Missing name and eventId
      }

      const result = safeValidate(createGuestSchema, invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors.some(e => e.field === 'name')).toBe(true)
        expect(result.errors.some(e => e.field === 'eventId')).toBe(true)
      }
    })

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'Jan Kowalski',
        email: 'invalid-email',
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createGuestSchema, invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field === 'email')).toBe(true)
      }
    })

    it('should reject invalid phone number', () => {
      const invalidData = {
        name: 'Jan Kowalski',
        phone: '123', // Too short
        eventId: 'clx1234567890',
      }

      const result = safeValidate(createGuestSchema, invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field === 'phone')).toBe(true)
      }
    })

    it('should accept optional fields', () => {
      const validData = {
        name: 'Jan Kowalski',
        eventId: 'clx1234567890',
        dietaryRestrictions: 'Wegetariańska',
        seatingNotes: 'Przy oknie',
      }

      const result = safeValidate(createGuestSchema, validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateGuestSchema', () => {
    it('should validate partial updates', () => {
      const partialData = {
        id: 'clx1234567890',
        name: 'Jan Nowak',
      }

      const result = safeValidate(updateGuestSchema, partialData)
      expect(result.success).toBe(true)
    })

    it('should require id for updates', () => {
      const invalidData = {
        name: 'Jan Nowak',
        // Missing id
      }

      const result = safeValidate(updateGuestSchema, invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field === 'id')).toBe(true)
      }
    })
  })
})
