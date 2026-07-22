import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/supabase/check-admin";
import { getStudents, createStudent, updateStudent, toggleStudentActive, importStudentsCSV } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const students = await getStudents(admin.schoolId);
    return NextResponse.json(students);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memuat data murid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();

    if (body.action === "import_csv") {
      const result = await importStudentsCSV({
        schoolId: admin.schoolId,
        students: body.students,
      });
      return NextResponse.json(result);
    }

    const result = await createStudent({
      schoolId: admin.schoolId,
      fullName: body.fullName,
      email: body.email,
      nis: body.nis,
      classId: body.classId,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menambah murid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();

    if (body.action === "toggle_active") {
      const result = await toggleStudentActive(body.studentId, body.isActive);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    } else {
      const result = await updateStudent(body.studentId, {
        full_name: body.fullName,
        nis: body.nis,
        email: body.email,
      });
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengubah data murid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
