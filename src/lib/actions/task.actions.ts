"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { canAccessEvent } from "@/lib/auth/event-access"
import { runGenerateTasks, type PlanQuestionnaire } from "@/lib/ai/run-generate-tasks"
import { createTaskSchema, updateTaskSchema, type TaskInput, type TaskUpdateInput } from "@/lib/validations/task"
import { taskStatusSchema } from "@/lib/validations/common"
import { validate } from "@/lib/validations/validation-utils"
import { Task } from "@prisma/client"
import { syncAllToGoogle } from "@/lib/google-calendar-sync"


type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "SKIPPED"

export async function fetchTasks(eventId: string): Promise<Task[]> {
  return await prisma.task.findMany({
    where: { eventId },
    orderBy: { dueDate: 'asc' },
  })
}

export async function createTask(data: TaskInput) {
  const validatedData = validate(createTaskSchema, data, { action: "create_task" })

  const newTask = await prisma.task.create({
    data: validatedData,
  })

  revalidatePath("/pl/tasks")
  revalidatePath("/en/tasks")
  revalidatePath("/pl/dashboard/tasks")
  revalidatePath("/en/dashboard/tasks")
  void syncAllToGoogle().catch(() => {})
  return newTask
}

export async function updateTaskStatus(id: string, status: string) {
  const validatedStatus = validate(taskStatusSchema, status, { action: "update_task_status" })
  
  await prisma.task.update({
    where: { id },
    data: { status: validatedStatus },
  })

  revalidatePath("/pl/tasks")
  revalidatePath("/en/tasks")
  revalidatePath("/pl/dashboard/tasks")
  revalidatePath("/en/dashboard/tasks")
}

export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id },
  })

  revalidatePath("/pl/tasks")
  revalidatePath("/en/tasks")
  revalidatePath("/pl/dashboard/tasks")
  revalidatePath("/en/dashboard/tasks")
  void syncAllToGoogle().catch(() => {})
}

export async function updateTask(id: string, data: TaskUpdateInput) {
  const validatedData = validate(updateTaskSchema, { ...data, id }, { action: "update_task" })
  
  // Remove id from data before updating
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _unused, ...updateData } = validatedData
  
  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  })
  revalidatePath("/pl/tasks")
  revalidatePath("/en/tasks")
  revalidatePath("/pl/dashboard/tasks")
  revalidatePath("/en/dashboard/tasks")
  void syncAllToGoogle().catch(() => {})
  return task
}

export async function generateTasksAI(eventId: string, questionnaire?: PlanQuestionnaire | null) {
  try {
    if (!eventId?.trim()) {
      return { success: false, error: "Brak wydarzenia. Utwórz wesele na stronie głównej." }
    }

    const isDev = process.env.NODE_ENV === "development"
    if (!isDev && !(await canAccessEvent(eventId))) {
      return { success: false, error: "Brak dostępu do wydarzenia." }
    }

    const result = await runGenerateTasks(eventId, questionnaire)
    if ("error" in result) {
      return { success: false, error: result.error }
    }

    revalidatePath("/pl/dashboard/tasks")
    revalidatePath("/en/dashboard/tasks")
    revalidatePath("/pl/tasks")
    revalidatePath("/en/tasks")
    return { success: true, count: result.count }
  } catch (error) {
    console.error("Error generating tasks:", error)
    const msg = error instanceof Error ? error.message : "Nie udało się wygenerować zadań."
    return { success: false, error: msg }
  }
}
