import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/supabase/check-admin";
import { getTeachers, createTeacher, updateTeacher, toggleTeacherActive } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const teachers = await getTeachers(admin.schoolId);
    return NextResponse.json(teachers);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memuat data guru";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const result = await createTeacher({
      schoolId: admin.schoolId,
      fullName: body.fullName,
      email: body.email,
      nip: body.nip,
      classIds: body.classIds,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menambah guru";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();

    if (body.action === "toggle_active") {
      const result = await toggleTeacherActive(body.teacherId, body.isActive);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    } else {
      const result = await updateTeacher(body.teacherId, {
        full_name: body.fullName,
        nip: body.nip,
        email: body.email,
      });
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengubah data guru";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
