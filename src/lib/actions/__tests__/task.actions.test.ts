/**
 * @jest-environment node
 */
import { prisma } from "@/lib/prisma"
import { createTask, updateTaskStatus, deleteTask, generateTasksAI } from "../task.actions"
// TaskStatus is not available in simplified schema, using string instead

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
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

jest.mock("@/lib/ai/run-generate-tasks", () => ({
  runGenerateTasks: jest.fn(),
}));

jest.mock("@/lib/auth/utils", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/api/auth-helper", () => ({
  verifyEventAccess: jest.fn(),
}));

describe("Task Server Actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const eventId = "test-event-id";
  const taskData = {
    title: "Book a photographer",
    category: "Photography",
    status: "TODO",
    priority: "MEDIUM",
    eventId,
  };

  it("should create a new task", async () => {
    const mockTask = { id: "clx1234567890", ...taskData };
    (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

    const result = await createTask(taskData);

    expect(prisma.task.create).toHaveBeenCalledWith({ data: taskData });
    expect(result).toEqual(mockTask);
  });

  it("should update a task's status", async () => {
    const taskId = "clx1234567890";
    const newStatus = "DONE";
    (prisma.task.update as jest.Mock).mockResolvedValue({});

    await updateTaskStatus(taskId, newStatus);

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: taskId },
      data: { status: newStatus },
    });
  });

  it("should delete a task", async () => {
    const taskId = "clx1234567890";
    (prisma.task.delete as jest.Mock).mockResolvedValue({});

    await deleteTask(taskId);

    expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: taskId } });
  });

  it("should call runGenerateTasks with questionnaire and return success", async () => {
    const { runGenerateTasks } = jest.requireMock("@/lib/ai/run-generate-tasks") as typeof import("@/lib/ai/run-generate-tasks");
    const { getCurrentUser } = jest.requireMock("@/lib/auth/utils") as typeof import("@/lib/auth/utils");
    const { verifyEventAccess } = jest.requireMock("@/lib/api/auth-helper") as typeof import("@/lib/api/auth-helper");

    (getCurrentUser as jest.Mock).mockResolvedValue({ id: "user-1" });
    (verifyEventAccess as jest.Mock).mockResolvedValue(true);
    (runGenerateTasks as jest.Mock).mockResolvedValue({ count: 5 });

    const questionnaire = {
      weddingType: "church",
      weddingStyle: "klasyczny",
      budgetLevel: "medium",
      guestScale: "medium",
    };

    const result = await generateTasksAI(eventId, questionnaire as any);

    expect(runGenerateTasks).toHaveBeenCalledWith(eventId, questionnaire);
    expect(result).toEqual({ success: true, count: 5 });
  });
});
