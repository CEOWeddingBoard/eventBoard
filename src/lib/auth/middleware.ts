import { NextRequest } from "next/server";
import { verifyToken } from "./utils";
import { AuthUser } from "./types";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const token = request.cookies.get("auth-token")?.value;
  
  if (!token) {
    throw new UnauthorizedError("No authentication token provided");
  }

  const user = await verifyToken(token);
  
  if (!user) {
    throw new UnauthorizedError("Invalid authentication token");
  }

  return user;
}
