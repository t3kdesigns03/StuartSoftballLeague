import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ssl26_admin";

/**
 * The admin password, or null if it has not been configured.
 *
 * There is deliberately no fallback default. An earlier version fell back to a
 * hardcoded password when ADMIN_PASSWORD was unset, which meant a typo in the
 * deploy environment (e.g. ADMIN_PASSORD) would silently ship the site with a
 * password that is published in the README. Failing closed makes that mistake
 * loud instead of invisible.
 */
function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length > 0 ? value : null;
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Token stored in the admin cookie. Derived from the password, so changing
 * ADMIN_PASSWORD immediately invalidates every existing session.
 */
export function adminToken(): string | null {
  const password = adminPassword();
  if (!password) return null;
  return createHmac("sha256", password)
    .update("ssl26-admin-v1")
    .digest("hex");
}

export function isValidPassword(candidate: string): boolean {
  const password = adminPassword();
  if (!password) {
    console.error(
      "[ssl26] ADMIN_PASSWORD is not set — /admin is locked. Check the spelling of the environment variable in your host's dashboard.",
    );
    return false;
  }
  return constantTimeEquals(candidate, password);
}

export async function isAdmin(): Promise<boolean> {
  const expected = adminToken();
  if (!expected) return false;

  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;

  return constantTimeEquals(value, expected);
}
