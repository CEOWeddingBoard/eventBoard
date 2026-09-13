// src/lib/auth-middleware-mock.ts
import { NextRequest, NextResponse } from 'next/server';

type MiddlewareFunction = (req: NextRequest) => NextResponse | Promise<NextResponse> | void;

interface AuthMiddlewareOptions {
  beforeAuth?: MiddlewareFunction;
  publicRoutes?: string[];
}

export const authMiddleware = (options?: AuthMiddlewareOptions) => {
  return (req: NextRequest) => {
    if (options?.beforeAuth) {
      return options.beforeAuth(req);
    }
    return NextResponse.next();
  };
};
