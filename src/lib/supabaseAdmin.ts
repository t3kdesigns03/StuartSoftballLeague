import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Server-only Supabase client using the secret key.
 *
 * The secret key bypasses Row Level Security, so this must never reach the
 * browser. Two things enforce that:
 *   1. `import "server-only"` — the build fails if a client component imports
 *      this file, rather than silently bundling the key.
 *   2. The variable is NOT prefixed NEXT_PUBLIC_, so Next.js will not inline it.
 *
 * Used only by route handlers under /api/admin, all of which check the admin
 * cookie first. See src/lib/adminAuth.ts.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. The admin " +
        "roster needs the Supabase secret key. Add it in your host's " +
        "environment settings — never with a NEXT_PUBLIC_ prefix.",
    );
  }

  return createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
