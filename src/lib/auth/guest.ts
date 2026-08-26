import { cookies } from "next/headers";
import { createId } from "@/lib/utils/id";
import { userStore } from "@/lib/db/user-store";
import type { UserAccount } from "@/types/dream";

export const GUEST_COOKIE = "dw_guest";
export const GUEST_EMAIL_DOMAIN = "guest.dreamweava.local";

export function guestEmailFor(guestId: string): string {
  return `guest_${guestId}@${GUEST_EMAIL_DOMAIN}`;
}

export function isGuestEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${GUEST_EMAIL_DOMAIN}`);
}

export function isGuestAccount(user: Pick<UserAccount, "email" | "passwordHash">): boolean {
  return isGuestEmail(user.email) && !user.passwordHash;
}

/** Read guest id from the request cookie jar (App Router). */
export async function readGuestId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GUEST_COOKIE)?.value ?? null;
}

export async function getOrCreateGuestUser(guestId: string): Promise<UserAccount> {
  const email = guestEmailFor(guestId);
  const existing = await userStore.findByEmail(email);
  if (existing) return existing;
  return userStore.create({
    email,
  });
}

export function newGuestId(): string {
  return createId("g");
}
