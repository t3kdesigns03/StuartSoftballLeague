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
 * Browser-side Supabase client.
 *
 * This uses the *publishable* (anon) key, which is safe to ship to the browser.
 * Row Level Security policies in supabase/schema.sql are what actually protect
 * the data — never put the secret key in this file.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});
