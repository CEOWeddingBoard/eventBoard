import { prisma } from "@/lib/prisma";
import { isProductionRuntime } from "@/lib/env";
import { AuthUser } from "./types";
import { getSessionPayloadFromCookies } from "./session";
import { ensureUserAuthColumns } from "./schema-migration";

const MOCK_DEV_USER: AuthUser = {
  id: "mock-user-id",
  email: "mock@example.com",
  name: "Mock User",
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const isDev = process.env.NODE_ENV === "development";
  const devMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  if (isProductionRuntime() && devMode) {
    throw new Error("NEXT_PUBLIC_DEV_MODE is not allowed in production");
  }

  if ((isDev || devMode) && !isProductionRuntime()) {
    return MOCK_DEV_USER;
  }

  try {
    const session = await getSessionPayloadFromCookies();
    if (!session) return null;

    await ensureUserAuthColumns();
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user || !user.isActive) return null;

    return { id: user.id, email: user.email, name: user.name };
  } catch (error) {
    console.error("[auth:getCurrentUser] Error:", error);
    return null;
  }
}

export async function verifyToken(_token: string): Promise<AuthUser | null> {
  return getCurrentUser();
}
