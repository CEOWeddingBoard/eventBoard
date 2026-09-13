/**
 * @jest-environment node
 */
import { runGenerateTasks, type PlanQuestionnaire } from "../run-generate-tasks";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    task: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/ai/wedding-tasks-data", () => {
  const original = jest.requireActual("@/lib/ai/wedding-tasks-data");
  return {
    ...original,
    getTasksForMonthsUntilWeddingByType: jest.fn(() => [
      {
        title: "Test task",
        monthsBefore: 6,
        role: "TOGETHER",
        category: "Planowanie",
      },
    ]),
    dueDateFromCeremony: jest.fn((_date: Date, _monthsBefore: number) => new Date("2026-01-01T00:00:00Z")),
  };
});

const { prisma } = jest.requireMock("@/lib/prisma") as typeof import("@/lib/prisma");
const { getTasksForMonthsUntilWeddingByType } = jest.requireMock("@/lib/ai/wedding-tasks-data") as typeof import("@/lib/ai/wedding-tasks-data");

describe("runGenerateTasks (mock provider)", () => {
  const baseEvent = {
    id: "event-1",
    date: new Date("2026-08-15T14:00:00Z"),
    style: null,
    estimatedGuestCount: null,
  };

  beforeEach(() => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue(baseEvent);
    (prisma.task.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.task.createMany as jest.Mock).mockResolvedValue({});
    (getTasksForMonthsUntilWeddingByType as jest.Mock).mockClear();
    process.env.AI_PROVIDER = "mock";
  });

  it("uses weddingType from questionnaire when falling back to local template", async () => {
    const questionnaire: PlanQuestionnaire = {
      weddingType: "church",
      weddingStyle: "klasyczny",
    };

    const result = await runGenerateTasks(baseEvent.id, questionnaire);

    expect(getTasksForMonthsUntilWeddingByType).toHaveBeenCalled();
    const callArgs = (getTasksForMonthsUntilWeddingByType as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toBe("church");
    expect(result).toEqual({ count: 1 });
    expect(prisma.task.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          eventId: baseEvent.id,
          title: "Test task",
          status: "TODO",
        }),
      ]),
    });
  });

  it("defaults weddingType to civil when questionnaire is missing", async () => {
    const result = await runGenerateTasks(baseEvent.id, null);

    expect(getTasksForMonthsUntilWeddingByType).toHaveBeenCalled();
    const callArgs = (getTasksForMonthsUntilWeddingByType as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toBe("civil");
    expect(result).toEqual({ count: 1 });
  });
});

