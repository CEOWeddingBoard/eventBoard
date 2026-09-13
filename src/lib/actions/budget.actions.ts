"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createBudgetItemSchema, updateBudgetItemSchema, type BudgetItemInput, type BudgetItemUpdateInput } from "@/lib/validations/budget"
import { validate } from "@/lib/validations/validation-utils"

export async function createBudgetItem(data: BudgetItemInput) {
  const validatedData = validate(createBudgetItemSchema, data, { action: "create_budget_item" })

  const newItem = await prisma.budgetItem.create({
    data: validatedData,
  })

  revalidatePath("/pl/dashboard/budget")
  revalidatePath("/en/dashboard/budget")
  return newItem
}

export async function updateBudgetItem(id: string, data: BudgetItemUpdateInput) {
  const validatedData = validate(updateBudgetItemSchema, { ...data, id }, { action: "update_budget_item" })
  
  // Remove id from data before updating
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _unused, ...updateData } = validatedData

  const updatedItem = await prisma.budgetItem.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/pl/dashboard/budget")
  revalidatePath("/en/dashboard/budget")
  return updatedItem
}

export async function deleteBudgetItem(id: string) {
  await prisma.budgetItem.delete({
    where: { id },
  })

  revalidatePath("/pl/dashboard/budget")
  revalidatePath("/en/dashboard/budget")
}
