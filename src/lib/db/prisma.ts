/**
 * Prisma is available when DATABASE_URL is configured.
 * The MVP repository uses the local JSON store by default (DEMO_STORE=true).
 * Import this module only from server code that intentionally uses Postgres.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function usePrisma(): boolean {
  return Boolean(process.env.DATABASE_URL) && process.env.DEMO_STORE !== "true";
}
