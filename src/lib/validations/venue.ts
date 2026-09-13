import { z } from "zod";

export const venueOnboardingSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  capacity: z.coerce.number().int().positive().optional(),
});

export const createReservationSchema = z.object({
  coupleName: z.string().min(2).max(120),
  coupleEmail: z.string().email(),
  couplePhone: z.string().max(30).optional(),
  weddingDate: z.string().min(1),
  hallId: z.string().optional(),
  basePackageId: z.string().optional(),
  guestCountEstimate: z.coerce.number().int().positive().optional(),
  internalNotes: z.string().max(2000).optional(),
  source: z.string().max(50).optional(),
  sendInvite: z.boolean().optional(),
});

export const couplePortalConfigSchema = z.object({
  modules: z.object({
    guests: z.object({
      enabled: z.boolean(),
      deadline: z.string().datetime().optional().nullable(),
      locked: z.boolean(),
    }),
    seating: z.object({
      enabled: z.boolean(),
      deadline: z.string().datetime().optional().nullable(),
      locked: z.boolean(),
    }),
    schedule: z.object({
      enabled: z.boolean(),
      deadline: z.string().datetime().optional().nullable(),
      locked: z.boolean(),
    }),
    menu: z.object({
      enabled: z.boolean(),
      deadline: z.string().datetime().optional().nullable(),
      locked: z.boolean(),
    }),
  }),
});

export const updateReservationSchema = z.object({
  status: z
    .enum([
      "PENDING_ACTIVATION",
      "ACTIVE",
      "MENU_SUBMITTED",
      "SEATING_LOCKED",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  coupleName: z.string().min(2).max(120).optional(),
  coupleEmail: z.string().email().optional(),
  couplePhone: z.string().max(30).optional().nullable(),
  weddingDate: z.string().min(1).optional(),
  hallId: z.string().nullable().optional(),
  basePackageId: z.string().nullable().optional(),
  internalNotes: z.string().max(5000).optional(),
  guestCountEstimate: z.coerce.number().int().positive().optional().nullable(),
  cancelReason: z.string().max(500).optional(),
  couplePortalConfig: couplePortalConfigSchema.optional(),
});

export const menuPackageSchema = z.object({
  name: z.string().min(2).max(120),
  pricePerPerson: z.coerce.number().positive(),
  minGuests: z.coerce.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const menuItemSchema = z.object({
  category: z.string().min(1).max(30),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  pricePerPerson: z.coerce.number().nonnegative().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const tableTemplateSchema = z.object({
  number: z.coerce.number().int().positive(),
  name: z.string().min(1).max(80),
  capacity: z.coerce.number().int().positive(),
  hallId: z.string().optional(),
});

export const reservationNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const choiceGroupSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(120),
  category: z.string().max(30).optional(),
  minPick: z.coerce.number().int().min(0).max(10).optional(),
  maxPick: z.coerce.number().int().min(1).max(10).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const packageItemSchema = z.object({
  menuItemId: z.string().min(1),
  choiceGroupId: z.string().optional(),
  isRequired: z.boolean().optional(),
  includedInPackage: z.boolean().optional(),
});

export const venueClientGuestSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dietType: z.enum(["STANDARD", "VEGETARIAN", "VEGAN", "CHILD"]).optional(),
  allergies: z.string().max(500).optional(),
  guestGroup: z.string().max(50).optional(),
  attendanceStatus: z.enum(["CONFIRMED", "DECLINED", "PENDING"]).optional(),
  tableNumber: z.coerce.number().int().positive().optional().nullable(),
});

export const venueScheduleItemSchema = z.object({
  time: z.string().min(1).max(10),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  location: z.string().max(120).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const venueQuoteSchema = z.object({
  reservationId: z.string().optional(),
  packageId: z.string().min(1),
  label: z.string().max(120).optional(),
  guestCount: z.coerce.number().int().positive(),
  selections: z.record(z.unknown()).optional(),
  discountAmount: z.coerce.number().nonnegative().optional(),
  validUntil: z.string().datetime().optional(),
});

export const venueHallSchema = z.object({
  name: z.string().min(1).max(120),
  capacity: z.coerce.number().int().positive(),
  isActive: z.boolean().optional(),
});

export const venueBlockedDateSchema = z.object({
  date: z.string().min(1),
  hallId: z.string().optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  recurrence: z.enum(["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  reason: z.string().max(200).optional(),
});

export const seatingAssignmentSchema = z.object({
  assignments: z.array(
    z.object({
      guestId: z.string(),
      tableNumber: z.coerce.number().int().positive().nullable(),
    }),
  ),
});

export const venuePaymentInstallmentSchema = z.object({
  label: z.string().min(1).max(120),
  type: z.enum(["DEPOSIT", "INSTALLMENT", "FINAL", "SECURITY_DEPOSIT"]).optional(),
  amount: z.coerce.number().positive(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional(),
});

export const venuePaymentMarkPaidSchema = z.object({
  paidAmount: z.coerce.number().positive().optional(),
  paymentMethod: z.string().max(50).optional(),
});
