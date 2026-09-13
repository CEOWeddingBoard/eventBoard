/**
 * @jest-environment node
 */
import { prisma } from "@/lib/prisma"
import { createVendor, updateVendor, deleteVendor } from "../vendor.actions"
// VendorStatus is not available in simplified schema, using string instead

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    vendor: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe("Vendor Server Actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const eventId = "test-event-id";
  const vendorData = {
    name: "DJ Cool",
    category: "Muzyka / DJ",
    eventId,
    phone: "",
  };

  it("should create a new vendor with generated portalToken", async () => {
    const mockVendor = {
      id: "clx1234567890",
      ...vendorData,
      contact: null,
      portalToken: "generated-token",
    };
    (prisma.vendor.create as jest.Mock).mockResolvedValue(mockVendor);

    const result = await createVendor(vendorData);

    expect(prisma.vendor.create).toHaveBeenCalledTimes(1);
    const callArg = (prisma.vendor.create as jest.Mock).mock.calls[0][0];
    expect(callArg.data).toMatchObject({
      ...vendorData,
      portalToken: expect.any(String),
    });
    expect(result).toEqual(mockVendor);
  });

  it("should update an existing vendor", async () => {
    const vendorId = "clx1234567890";
    const updatedData = { ...vendorData, name: "DJ Super Cool", category: "Muzyka / DJ" };
    const mockUpdatedVendor = { id: vendorId, ...updatedData, contact: null };
    (prisma.vendor.update as jest.Mock).mockResolvedValue(mockUpdatedVendor);

    const result = await updateVendor(vendorId, updatedData);

    expect(prisma.vendor.update).toHaveBeenCalledWith({
      where: { id: vendorId },
      data: updatedData,
    });
    expect(result).toEqual(mockUpdatedVendor);
  });

  it("should delete a vendor", async () => {
    const vendorId = "clx1234567890";
    (prisma.vendor.delete as jest.Mock).mockResolvedValue({});

    await deleteVendor(vendorId);

    expect(prisma.vendor.delete).toHaveBeenCalledWith({ where: { id: vendorId } });
  });
});
