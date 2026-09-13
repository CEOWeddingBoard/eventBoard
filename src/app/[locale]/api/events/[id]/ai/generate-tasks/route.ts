import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyEventAccess, handleApiError } from "@/lib/api/auth-helper";
import { runGenerateTasks } from "@/lib/ai/run-generate-tasks";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);
    if (!(await verifyEventAccess(user.id, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await runGenerateTasks(id);
    if ("error" in result) {
      const status = result.error.includes("OPENAI") || result.error.includes(".env.local") ? 400 : 502;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(
      { message: "Zadania wygenerowane.", count: result.count },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
