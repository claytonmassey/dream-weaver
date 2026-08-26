/**
 * Prisma is available when a Postgres URL is configured.
 * Import this module only from server code that intentionally uses Postgres.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Neon / Vercel often inject POSTGRES_PRISMA_URL or POSTGRES_URL
 * instead of (or in addition to) DATABASE_URL.
 */
export function databaseUrl(): string | undefined {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    undefined;
  const trimmed = url?.trim();
  return trimmed || undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl()
      ? { db: { url: databaseUrl() } }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Always cache in serverless/dev so we don't open a new pool every import.
globalForPrisma.prisma = prisma;

export function usePrisma(): boolean {
  if (process.env.DEMO_STORE === "true") return false;
  return Boolean(databaseUrl());
}
