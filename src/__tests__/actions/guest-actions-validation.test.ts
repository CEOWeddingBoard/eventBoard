import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { createGuest, updateGuest } from '@/lib/actions/guest.actions'
import { prisma } from '@/lib/prisma'
import { ValidationError } from '@/lib/validations/validation-utils'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    guest: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Guest Actions Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createGuest', () => {
    it('should validate and create guest with valid data', async () => {
      const validData = {
        name: 'Jan Kowalski',
        email: 'jan@example.com',
        eventId: 'clx1234567890',
        status: 'PENDING' as const,
      }

      const mockGuest = { id: 'guest-1', ...validData }
      ;(prisma.guest.create as jest.Mock).mockResolvedValue(mockGuest)

      const result = await createGuest(validData)

      expect(prisma.guest.create).toHaveBeenCalledWith({ data: expect.objectContaining(validData) })
      expect(result).toEqual(mockGuest)
    })

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty string
        eventId: 'clx1234567890',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(createGuest(invalidData as any)).rejects.toThrow(ValidationError)
      expect(prisma.guest.create).not.toHaveBeenCalled()
    })

    it('should reject invalid email format', async () => {
      const invalidData = {
        name: 'Jan Kowalski',
        email: 'invalid-email',
        eventId: 'clx1234567890',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(createGuest(invalidData as any)).rejects.toThrow(ValidationError)
    })
  })

  describe('updateGuest', () => {
    it('should validate and update guest', async () => {
      const guestId = 'clx1234567890abcdef123456'
      const updateData = {
        name: 'Jan Nowak',
        dietaryRestrictions: 'Wegetariańska',
      }

      const mockUpdated = { id: guestId, ...updateData }
      ;(prisma.guest.update as jest.Mock).mockResolvedValue(mockUpdated)

      const result = await updateGuest(guestId, updateData)

      expect(prisma.guest.update).toHaveBeenCalled()
      expect(result).toEqual(mockUpdated)
    })

    it('should require valid id (CUID)', async () => {
      const updateData = { name: 'Jan Nowak' }

      await expect(updateGuest('invalid-id', updateData)).rejects.toThrow(ValidationError)
    })
  })
})
