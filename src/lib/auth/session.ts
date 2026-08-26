import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireUserId(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id };
  }

  // Demo mode: allow unauthenticated local development against demo user
  if (process.env.DEMO_MODE !== "false") {
    const { localDb } = await import("@/lib/db/local-store");
    const demo = await localDb.getOrCreateDemoUser();
    return { userId: demo.id };
  }

  return {
    error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
