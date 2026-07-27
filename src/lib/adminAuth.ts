import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ssl26_admin";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "SSL26-Admin!";
}

/**
 * Token stored in the admin cookie. Derived from the password, so changing
 * ADMIN_PASSWORD in the environment immediately invalidates old sessions.
 */
export function adminToken(): string {
  return createHmac("sha256", adminPassword()).update("ssl26-admin-v1").digest("hex");
}

export function isValidPassword(candidate: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(adminPassword());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!value) return false;

  const expected = adminToken();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
