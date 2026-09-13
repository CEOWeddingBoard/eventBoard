import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    // eslint-disable-next-line no-console
    console.error(
      "[prisma] DATABASE_URL is not set. Prisma will fail to connect."
    );
  }

  return new PrismaClient();
};

declare global {
  // eslint-disable-next-line no-var
  // eslint-disable-next-line no-unused-vars
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
