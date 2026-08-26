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

// Always cache in serverless/dev so we don't open a new pool every import.
globalForPrisma.prisma = prisma;

export function usePrisma(): boolean {
  if (process.env.DEMO_STORE === "true") return false;
  // Prefer Postgres whenever a URL is configured (required on Vercel for persistence).
  return Boolean(process.env.DATABASE_URL);
}
