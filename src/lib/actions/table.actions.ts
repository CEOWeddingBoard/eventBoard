"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createTableSchema, updateTableSchema, type TableInput, type TableUpdateInput } from "@/lib/validations/table"
import { validate } from "@/lib/validations/validation-utils"

export async function createTable(eventId: string, data: Omit<TableInput, 'eventId'>) {
  const validatedData = validate(createTableSchema, { ...data, eventId }, { action: "create_table" })
  
  const newTable = await prisma.table.create({
    data: validatedData,
  })

  revalidatePath("/pl/seating")
  revalidatePath("/en/seating")
  return newTable
}

export async function updateTable(tableId: string, data: TableUpdateInput) {
  const validatedData = validate(updateTableSchema, { ...data, id: tableId }, { action: "update_table" })
  
  // Remove id from data before updating
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _unused, ...updateData } = validatedData
  
  const updatedTable = await prisma.table.update({
    where: { id: tableId },
    data: updateData,
  })

  revalidatePath("/pl/seating")
  revalidatePath("/en/seating")
  return updatedTable
}

export async function deleteTable(tableId: string) {
  await prisma.table.delete({
    where: { id: tableId },
  })

  revalidatePath("/pl/seating")
  revalidatePath("/en/seating")
}
