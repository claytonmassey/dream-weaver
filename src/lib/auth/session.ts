import { auth } from "@/lib/auth";
import { userStore } from "@/lib/db/user-store";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}

export async function requireUserId(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id };
  }

  // Demo mode: allow unauthenticated local development against demo user
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
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
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
