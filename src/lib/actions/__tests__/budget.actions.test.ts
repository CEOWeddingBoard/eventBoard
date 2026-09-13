/**
 * @jest-environment node
 */
import { prisma } from "@/lib/prisma"
import { createBudgetItem, updateBudgetItem, deleteBudgetItem } from "../budget.actions"
import { BudgetItemStatus } from "@prisma/client"

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    budgetItem: {
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

describe("Budget Server Actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const eventId = "test-event-id";
  const budgetItemData = {
    name: "Venue Rental",
    category: "Venue",
    plannedAmount: 5000,
    status: "PLANNED" as BudgetItemStatus,
    eventId,
  };

  it("should create a new budget item", async () => {
    const mockItem = { id: "clx1234567890", ...budgetItemData, actualAmount: null };
    (prisma.budgetItem.create as jest.Mock).mockResolvedValue(mockItem);

    const result = await createBudgetItem(budgetItemData);

    expect(prisma.budgetItem.create).toHaveBeenCalledWith({ data: budgetItemData });
    expect(result).toEqual(mockItem);
  });

  it("should update an existing budget item", async () => {
    const itemId = "clx1234567890";
    const updatedData = { ...budgetItemData, plannedAmount: 5500 };
    const mockUpdatedItem = { id: itemId, ...updatedData, actualAmount: null };
    (prisma.budgetItem.update as jest.Mock).mockResolvedValue(mockUpdatedItem);

    const result = await updateBudgetItem(itemId, updatedData);

    expect(prisma.budgetItem.update).toHaveBeenCalledWith({
      where: { id: itemId },
      data: updatedData,
    });
    expect(result).toEqual(mockUpdatedItem);
  });

  it("should delete a budget item", async () => {
    const itemId = "clx1234567890";
    (prisma.budgetItem.delete as jest.Mock).mockResolvedValue({});

    await deleteBudgetItem(itemId);

    expect(prisma.budgetItem.delete).toHaveBeenCalledWith({ where: { id: itemId } });
  });
});
