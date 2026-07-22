import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/supabase/check-admin";
import { getClasses, createClass, updateClass, deleteClass } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const classes = await getClasses(admin.schoolId);
    return NextResponse.json(classes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memuat data kelas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const result = await createClass({
      schoolId: admin.schoolId,
      name: body.name,
      level: body.level,
      major: body.major,
      teacherId: body.teacherId,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, class: result.class });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat kelas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();

    if (body.action === "delete") {
      const result = await deleteClass(body.classId);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    } else {
      const result = await updateClass(body.classId, {
        name: body.name,
        level: body.level,
        major: body.major,
      });
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengubah data kelas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
