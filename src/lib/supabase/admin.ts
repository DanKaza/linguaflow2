"use server";

import { createClient } from "@/utils/supabase/server";
import { adminClient } from "@/utils/supabase/admin-client";
import type { TeacherWithClasses, StudentWithClass, ClassWithDetails, DashboardStats } from "@/lib/types/database";

// ============================================================
// SCHOOL SETTINGS
// ============================================================

export async function getSchool(schoolId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("schools").select("*").eq("id", schoolId).single();
    return data;
  } catch {
    return null;
  }
}

export async function updateSchool(schoolId: string, updates: { name?: string; npsn?: string; email?: string }) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("schools").update(updates).eq("id", schoolId);
    return { error: error?.message || null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal menyimpan" };
  }
}

// ============================================================
// TEACHERS
// ============================================================

export async function getTeachers(schoolId: string): Promise<TeacherWithClasses[]> {
  try {
    const supabase = await createClient();

    const { data: teachers } = await supabase
      .from("profiles")
      .select("*")
      .eq("school_id", schoolId)
      .eq("role", "guru")
      .order("full_name");

    if (!teachers) return [];

    const result: TeacherWithClasses[] = [];

    for (const teacher of teachers) {
      const profile = teacher as any;
      const { data: classData } = await supabase
        .from("class_teachers")
        .select("classes(id, name, level)")
        .eq("teacher_id", profile.id);

      const classes = (classData || [])
        .map((ct: any) => ct.classes)
        .filter(Boolean) || [];

      let student_count = 0;
      for (const cls of classes) {
        const { count } = await supabase
          .from("class_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("class_id", cls.id);
        student_count += count || 0;
      }

      result.push({
        ...profile,
        classes,
        student_count,
      } as TeacherWithClasses);
    }

    return result;
  } catch {
    return [];
  }
}

export async function createTeacher(data: {
  schoolId: string;
  fullName: string;
  email: string;
  nip?: string;
  classIds?: string[];
}) {
  try {
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: "lingua123",
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        role: "guru",
      },
    });

    if (authError) return { error: authError.message };
    if (!authUser.user) return { error: "Gagal membuat user." };

    const supabase = await createClient();
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        school_id: data.schoolId,
        email: data.email,
        nip: data.nip || null,
      })
      .eq("id", authUser.user.id);

    if (profileError) return { error: profileError.message };

    if (data.classIds && data.classIds.length > 0) {
      const { error: assignError } = await supabase.from("class_teachers").insert(
        data.classIds.map((classId) => ({ class_id: classId, teacher_id: authUser.user!.id }))
      );
      if (assignError) return { error: assignError.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal menambah guru" };
  }
}

export async function updateTeacher(teacherId: string, updates: { full_name?: string; nip?: string; email?: string }) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update(updates).eq("id", teacherId);
    return { error: error?.message || null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengupdate guru" };
  }
}

export async function toggleTeacherActive(teacherId: string, isActive: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", teacherId);
    return { error: error?.message || null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal toggle status" };
  }
}

export async function assignTeacherClasses(teacherId: string, classIds: string[]) {
  try {
    const supabase = await createClient();
    await supabase.from("class_teachers").delete().eq("teacher_id", teacherId);

    if (classIds.length > 0) {
      const { error } = await supabase.from("class_teachers").insert(
        classIds.map((classId) => ({ class_id: classId, teacher_id: teacherId }))
      );
      return { error: error?.message || null };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal assign kelas" };
  }
}

// ============================================================
// STUDENTS
// ============================================================

export async function getStudents(schoolId: string): Promise<StudentWithClass[]> {
  try {
    const supabase = await createClient();

    const { data: students } = await supabase
      .from("profiles")
      .select("*")
      .eq("school_id", schoolId)
      .eq("role", "murid")
      .order("full_name");

    if (!students) return [];

    const result: StudentWithClass[] = [];

    for (const student of students) {
      const profile = student as any;
      const { data: enrollment } = await supabase
        .from("class_enrollments")
        .select("classes(id, name)")
        .eq("student_id", profile.id)
        .maybeSingle();

      result.push({
        ...profile,
        class_name: (enrollment as any)?.classes?.name || null,
        class_id: (enrollment as any)?.classes?.id || null,
        xp: 0,
      } as StudentWithClass);
    }

    return result;
  } catch {
    return [];
  }
}

export async function createStudent(data: {
  schoolId: string;
  fullName: string;
  email: string;
  nis: string;
  classId?: string;
}) {
  try {
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: "lingua123",
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        role: "murid",
      },
    });

    if (authError) return { error: authError.message };
    if (!authUser.user) return { error: "Gagal membuat user." };

    const supabase = await createClient();
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        school_id: data.schoolId,
        email: data.email,
        nis: data.nis,
      })
      .eq("id", authUser.user.id);

    if (profileError) return { error: profileError.message };

    if (data.classId) {
      const { error: enrollError } = await supabase
        .from("class_enrollments")
        .insert({ class_id: data.classId, student_id: authUser.user.id });
      if (enrollError) return { error: enrollError.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal menambah murid" };
  }
}

export async function updateStudent(studentId: string, updates: { full_name?: string; nis?: string; email?: string }) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update(updates).eq("id", studentId);
    return { error: error?.message || null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengupdate murid" };
  }
}

export async function toggleStudentActive(studentId: string, isActive: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", studentId);
    return { error: error?.message || null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal toggle status" };
  }
}

export async function importStudentsCSV(data: {
  schoolId: string;
  students: { name: string; nis: string; email: string; classId?: string }[];
}) {
  const results: { success: boolean; name: string; error?: string }[] = [];

  for (const student of data.students) {
    const result = await createStudent({
      schoolId: data.schoolId,
      fullName: student.name,
      email: student.email,
      nis: student.nis,
      classId: student.classId,
    });
    results.push({
      success: !result.error,
      name: student.name,
      error: result.error || undefined,
    });
  }

  return { results };
}

// ============================================================
// CLASSES
// ============================================================

export async function getClasses(schoolId: string): Promise<ClassWithDetails[]> {
  try {
    const supabase = await createClient();

    const { data: classes } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("name");

    if (!classes) return [];

    const result: ClassWithDetails[] = [];

    for (const cls of classes) {
      const c = cls as any;
      const { data: teachers } = await supabase
        .from("class_teachers")
        .select("profiles(full_name)")
        .eq("class_id", c.id);

      const teacher_names = (teachers || [])
        .map((t: any) => t.profiles?.full_name)
        .filter(Boolean) || [];

      const { count: student_count } = await supabase
        .from("class_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", c.id);

      result.push({
        ...c,
        teacher_names,
        student_count: student_count || 0,
        avg_score: 0,
      } as ClassWithDetails);
    }

    return result;
  } catch {
    return [];
  }
}

export async function createClass(data: {
  schoolId: string;
  name: string;
  level: string;
  major: string;
  teacherId?: string;
}) {
  try {
    const supabase = await createClient();

    const { data: newClass, error: classError } = await supabase
      .from("classes")
      .insert({
        school_id: data.schoolId,
        name: data.name,
        level: data.level,
        major: data.major,
      })
      .select()
      .single();

    if (classError) return { error: classError.message };
    if (!newClass) return { error: "Gagal membuat kelas." };

    if (data.teacherId) {
      const { error: assignError } = await supabase
        .from("class_teachers")
        .insert({ class_id: newClass.id, teacher_id: data.teacherId });
      if (assignError) return { error: assignError.message };
    }

    return { error: null, class: newClass };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal membuat kelas", class: undefined };
  }
}

export async function updateClass(classId: string, updates: { name?: string; level?: string; major?: string }) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("classes").update(updates).eq("id", classId);
    return { error: error?.message || null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengupdate kelas" };
  }
}

export async function deleteClass(classId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("classes").update({ is_active: false }).eq("id", classId);
    return { error: error?.message || null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal menghapus kelas" };
  }
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getDashboardStats(schoolId: string): Promise<DashboardStats> {
  try {
    const supabase = await createClient();

    const { count: total_students } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("role", "murid")
      .eq("is_active", true);

    const { count: total_teachers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("role", "guru")
      .eq("is_active", true);

    const { count: total_classes } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("is_active", true);

    return {
      total_students: total_students || 0,
      total_teachers: total_teachers || 0,
      total_classes: total_classes || 0,
      active_today: 0,
      top_classes: [],
      top_teachers: [],
      activity_last_30: generateActivityData(),
    };
  } catch {
    return {
      total_students: 0,
      total_teachers: 0,
      total_classes: 0,
      active_today: 0,
      top_classes: [],
      top_teachers: [],
      activity_last_30: generateActivityData(),
    };
  }
}

function generateActivityData() {
  const data = [];
  for (let i = 30; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      day: d.getDate(),
      value: Math.floor(Math.random() * 40) + 60,
    });
  }
  return data;
}
