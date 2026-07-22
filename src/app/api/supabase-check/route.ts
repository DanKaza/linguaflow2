import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  results.env = {
    hasUrl: !!url,
    hasKey: !!key,
    urlPrefix: url ? url.slice(0, 20) + "…" : null,
  };

  if (!url || !key) {
    results.status = "❌ FAILED";
    results.error = "Missing environment variables";
    return NextResponse.json(results, { status: 500 });
  }

  // 2. Try to connect and do a basic query
  try {
    const supabase = await createClient();

    // Try to get the authenticated user (will be null if not logged in — that's fine)
    const { data: authData, error: authError } = await supabase.auth.getUser();
    results.auth = {
      connected: true,
      user: authData?.user ?? null,
      error: authError?.message ?? null,
    };

    results.status = "✅ CONNECTED";
    results.hint =
      "Auth check passed — Supabase is reachable. If you haven't created tables yet, that's fine. Sign up a user via /register or the Supabase dashboard to test full auth flow.";
  } catch (err) {
    results.status = "❌ FAILED";
    results.error =
      err instanceof Error ? err.message : "Unknown error connecting to Supabase";
    return NextResponse.json(results, { status: 500 });
  }

  return NextResponse.json(results);
}
