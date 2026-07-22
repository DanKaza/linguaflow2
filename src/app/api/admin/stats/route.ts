import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/supabase/check-admin";
import { getDashboardStats } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await checkAdmin();
  if (!admin.ok) return admin.response;

  try {
    const stats = await getDashboardStats(admin.schoolId);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memuat statistik";
    // Return stats kosong kalau database belum siap
    return NextResponse.json({
      total_students: 0,
      total_teachers: 0,
      total_classes: 0,
      active_today: 0,
      top_classes: [],
      top_teachers: [],
      activity_last_30: [],
    });
  }
}
