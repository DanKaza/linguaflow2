import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/supabase/check-admin";
import { getSchool, updateSchool } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const school = await getSchool(admin.schoolId);
    return NextResponse.json(school);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memuat data sekolah";
    // Jika sekolah belum ada, return data kosong
    return NextResponse.json({ name: "Sekolah Saya", npsn: "", email: "" });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const { error } = await updateSchool(admin.schoolId, body);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan pengaturan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
