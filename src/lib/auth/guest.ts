import { cookies } from "next/headers";
import { userStore } from "@/lib/db/user-store";
import type { UserAccount } from "@/types/dream";
import {
  GUEST_COOKIE,
  guestEmailFor,
  isGuestEmail,
  newGuestId,
} from "@/lib/auth/guest-cookie";

export {
  GUEST_COOKIE,
  GUEST_EMAIL_DOMAIN,
  guestEmailFor,
  isGuestEmail,
  newGuestId,
} from "@/lib/auth/guest-cookie";

export function isGuestAccount(
  user: Pick<UserAccount, "email" | "passwordHash">,
): boolean {
  return isGuestEmail(user.email) && !user.passwordHash;
}

/** Read guest id from the request cookie jar (App Router / Node). */
export async function readGuestId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GUEST_COOKIE)?.value ?? null;
}

export async function getOrCreateGuestUser(
  guestId: string,
): Promise<UserAccount> {
  const email = guestEmailFor(guestId);
  const existing = await userStore.findByEmail(email);
  if (existing) return existing;
  return userStore.create({
    email,
  });
}
