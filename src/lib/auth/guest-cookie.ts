/** Edge-safe guest cookie helpers (no Node fs/path imports). */

export const GUEST_COOKIE = "dw_guest";
export const GUEST_EMAIL_DOMAIN = "guest.dreamweava.local";

export function guestEmailFor(guestId: string): string {
  return `guest_${guestId}@${GUEST_EMAIL_DOMAIN}`;
}

export function isGuestEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${GUEST_EMAIL_DOMAIN}`);
}

export function newGuestId(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `g_${id}`;
}
