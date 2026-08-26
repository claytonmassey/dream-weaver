import { auth } from "@/lib/auth";
import {
  getOrCreateGuestUser,
  isGuestEmail,
  readGuestId,
} from "@/lib/auth/guest";
import { isDemoMode } from "@/lib/auth/demo";
import { userStore } from "@/lib/db/user-store";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export type Actor = {
  userId: string;
  isGuest: boolean;
  email?: string | null;
  name?: string | null;
};

export { isDemoMode } from "@/lib/auth/demo";

/** Session user, or a cookie-backed guest account for anonymous capture. */
export async function resolveActor(): Promise<Actor> {
  const session = await auth();
  if (session?.user?.id) {
    const email = session.user.email;
    return {
      userId: session.user.id,
      isGuest: isGuestEmail(email),
      email,
      name: session.user.name,
    };
  }

  if (isDemoMode()) {
    const demo = await userStore.getOrCreateDemoUser();
    return {
      userId: demo.id,
      isGuest: false,
      email: demo.email,
      name: demo.name,
    };
  }

  const guestId = await readGuestId();
  if (!guestId) {
    throw new Error("Missing guest cookie");
  }

  const guest = await getOrCreateGuestUser(guestId);
  return {
    userId: guest.id,
    isGuest: true,
    email: guest.email,
    name: guest.name,
  };
}

export async function requireUserId(): Promise<
  { userId: string; isGuest: boolean } | { error: NextResponse }
> {
  try {
    const actor = await resolveActor();
    return { userId: actor.userId, isGuest: actor.isGuest };
  } catch (error) {
    console.error("[auth] resolveActor failed", error);
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

/** Requires a real signed-in account (not a guest). Used when saving dreams. */
export async function requireRegisteredUserId(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const session = await auth();
  if (session?.user?.id && !isGuestEmail(session.user.email)) {
    return { userId: session.user.id };
  }

  return {
    error: NextResponse.json(
      {
        error: "Create an account to save your dream.",
        code: "AUTH_REQUIRED_TO_SAVE",
      },
      { status: 401 },
    ),
  };
}

export async function requirePageUser(): Promise<{
  id: string;
  email?: string | null;
  name?: string | null;
  isGuest: boolean;
}> {
  try {
    const actor = await resolveActor();
    return {
      id: actor.userId,
      email: actor.email,
      name: actor.name,
      isGuest: actor.isGuest,
    };
  } catch (error) {
    console.error("[auth] requirePageUser failed", error);
    redirect("/login?error=config");
  }
}
