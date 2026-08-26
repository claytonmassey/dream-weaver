import { auth } from "@/lib/auth";
import { isDemoMode } from "@/lib/auth/demo";
import { prisma, usePrisma } from "@/lib/db/prisma";
import { userStore } from "@/lib/db/user-store";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export { isDemoMode } from "@/lib/auth/demo";

/**
 * Session user ids from before DATABASE_URL was set may not exist in Postgres.
 * Create a stub row so dream FKs succeed.
 */
async function ensureSessionUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<string> {
  if (!usePrisma()) return user.id;

  const byId = await prisma.user.findUnique({ where: { id: user.id } });
  if (byId) return byId.id;

  const email =
    user.email?.toLowerCase().trim() ||
    `recovered-${user.id.slice(0, 12)}@dreamweava.local`;

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    // Prefer the DB id — JWT may be stale from the memory-store era.
    return byEmail.id;
  }

  try {
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email,
        name: user.name ?? undefined,
      },
    });
    return created.id;
  } catch {
    // Race / unique conflict — re-read
    const again =
      (await prisma.user.findUnique({ where: { id: user.id } })) ||
      (await prisma.user.findUnique({ where: { email } }));
    if (again) return again.id;
    throw new Error("Could not sync your account to the database. Sign out and sign up again.");
  }
}

export async function requireUserId(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const session = await auth();
  if (session?.user?.id) {
    try {
      const userId = await ensureSessionUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      });
      return { userId };
    } catch (error) {
      console.error("[auth] ensureSessionUser failed", error);
      return {
        error: NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Account sync failed. Sign out and sign in again.",
          },
          { status: 500 },
        ),
      };
    }
  }

  if (isDemoMode()) {
    const demo = await userStore.getOrCreateDemoUser();
    return { userId: demo.id };
  }

  return {
    error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

/** For server pages — redirects to login when auth is required. */
export async function requirePageUser(): Promise<{
  id: string;
  email?: string | null;
  name?: string | null;
}> {
  const session = await auth();
  if (session?.user?.id) {
    try {
      const id = await ensureSessionUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      });
      return {
        id,
        email: session.user.email,
        name: session.user.name,
      };
    } catch (error) {
      console.error("[auth] ensureSessionUser failed", error);
      redirect("/login?error=config");
    }
  }

  if (isDemoMode()) {
    try {
      const demo = await userStore.getOrCreateDemoUser();
      return {
        id: demo.id,
        email: demo.email,
        name: demo.name,
      };
    } catch (error) {
      console.error("[auth] demo user bootstrap failed", error);
      redirect("/login?error=config");
    }
  }

  redirect("/login");
}
