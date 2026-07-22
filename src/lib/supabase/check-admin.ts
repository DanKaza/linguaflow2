import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export type AdminCheckResult =
  | { ok: true; schoolId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; response: NextResponse };

/**
 * Check that the current user is authenticated and has admin role.
 * Returns either admin profile info or a NextResponse error.
 * All errors are returned as JSON to avoid HTML error pages.
 */
export async function checkAdmin(): Promise<AdminCheckResult> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Belum login. Silakan login terlebih dahulu." },
          { status: 401 }
        ),
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("school_id, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      // Database belum di-setup atau tabel belum ada
      const msg =
        profileError.code === "42P01"
          ? "Database belum di-setup. Jalankan SQL migration di Supabase Dashboard terlebih dahulu."
          : profileError.message;
      return {
        ok: false,
        response: NextResponse.json({ error: msg }, { status: 500 }),
      };
    }

    if (!profile) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Profile tidak ditemukan. Mungkin perlu setup ulang akun." },
          { status: 401 }
        ),
      };
    }

    if (profile.role !== "admin") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Akses ditolak. Halaman ini hanya untuk admin." },
          { status: 403 }
        ),
      };
    }

    if (!profile.school_id) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Sekolah belum terdaftar. Atur profil sekolah terlebih dahulu." },
          { status: 400 }
        ),
      };
    }

    return { ok: true, schoolId: profile.school_id, supabase };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 500 }),
    };
  }
}
