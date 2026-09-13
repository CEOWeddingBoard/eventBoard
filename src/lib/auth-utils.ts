import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from "@/lib/auth/utils";

export async function authorizeRequest(
  _req: Request,
  eventId: string
): Promise<{ user: { id: string }; error?: never } | { error: NextResponse; user?: never }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: user.id,
      },
    });

    if (!event) {
      return {
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    return { user: { id: user.id } };
  } catch (error) {
    console.error('Authorization error:', error);
    return {
      error: NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
    };
  }
}
