import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client using service_role key.
 * ONLY use in server-side API routes / server actions.
 * Bypasses RLS — be careful!
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment");
}

if (!supabaseServiceKey) {
  console.warn(
    "[WARN] SUPABASE_SERVICE_ROLE_KEY is not set. " +
    "Admin operations (createUser) will fail. " +
    "Get it from Supabase Dashboard → Settings → API → service_role key"
  );
}

export const adminClient = createClient(supabaseUrl, supabaseServiceKey || "");
