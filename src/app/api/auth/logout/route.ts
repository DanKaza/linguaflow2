import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Redirect to login page
    return NextResponse.json({ success: true, redirectTo: "/login" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal logout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
