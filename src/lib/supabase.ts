import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Copy .env.local.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

/**
 * Refuse to build if a privileged key was pasted into the public variable.
 *
 * Anything prefixed NEXT_PUBLIC_ is inlined into the client bundle and served
 * to every visitor. A secret / service_role key there bypasses Row Level
 * Security completely, so this must fail the build rather than deploy.
 *
 * This check exists because it has already happened once: the secret key was
 * pasted into NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the host dashboard and
 * shipped to production. Nothing caught it — the build was green, and the only
 * visible symptom was a 401 on the realtime socket.
 */
const PRIVILEGED_KEY_PATTERNS = [
  { prefix: "sb_secret_", label: "secret key" },
  { prefix: "eyJ", label: "legacy JWT (possibly service_role)", jwt: true },
];

for (const pattern of PRIVILEGED_KEY_PATTERNS) {
  if (!supabaseKey.startsWith(pattern.prefix)) continue;

  // Legacy anon keys are also JWTs, so only reject those that decode to a
  // privileged role. Anything we cannot decode is allowed through.
  if (pattern.jwt) {
    try {
      const payload = JSON.parse(
        Buffer.from(supabaseKey.split(".")[1], "base64").toString("utf8"),
      ) as { role?: string };
      if (payload.role !== "service_role") continue;
    } catch {
      continue;
    }
  }

  throw new Error(
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contains a Supabase ${pattern.label}. ` +
      "That value is inlined into the browser bundle and would expose your " +
      "entire database. Revoke the key in Supabase, then set this variable to " +
      "the publishable key (sb_publishable_...) instead.",
  );
}

/**
 * Browser-side Supabase client.
 *
 * This uses the *publishable* (anon) key, which is safe to ship to the browser.
 * Row Level Security policies in supabase/schema.sql are what actually protect
 * the data — never put a secret key here.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});
