// ============================================================
// LinguaFlow Database Types
// ============================================================

export interface School {
  id: string;
  name: string;
  npsn: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  school_id: string | null;
  full_name: string;
  email: string | null;
  nis: string | null;
  nip: string | null;
  role: "admin" | "guru" | "murid";
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  level: string | null;
  major: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ClassTeacher {
  class_id: string;
  teacher_id: string;
}

export interface ClassEnrollment {
  class_id: string;
  student_id: string;
  enrolled_at: string;
}

// Extended types with joins
export interface TeacherWithClasses extends Profile {
  classes: { id: string; name: string; level: string | null }[];
  student_count: number;
}

export interface StudentWithClass extends Profile {
  class_name: string | null;
  class_id: string | null;
  xp: number;
}

export interface ClassWithDetails extends Class {
  teacher_names: string[];
  student_count: number;
  avg_score: number;
}

// Dashboard stats
export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  active_today: number;
  top_classes: { name: string; progress: number }[];
  top_teachers: { name: string; tasks: number }[];
  activity_last_30: { day: number; value: number }[];
}
