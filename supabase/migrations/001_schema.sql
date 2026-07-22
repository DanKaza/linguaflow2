-- ============================================================
-- LinguaFlow Database Schema v2
-- Execute this in Supabase SQL Editor
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP OLD (idempotent — aman di-run ulang)
-- ============================================================
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "schools_admin_all" ON schools;
DROP POLICY IF EXISTS "schools_read_all" ON schools;
DROP POLICY IF EXISTS "classes_admin_all" ON classes;
DROP POLICY IF EXISTS "classes_teacher_read" ON classes;
DROP POLICY IF EXISTS "class_teachers_admin_all" ON class_teachers;
DROP POLICY IF EXISTS "class_enrollments_admin_all" ON class_enrollments;
DROP POLICY IF EXISTS "class_enrollments_teacher_read" ON class_enrollments;


-- ============================================================
-- TABLES
-- ============================================================

-- 1. SEKOLAH
CREATE TABLE IF NOT EXISTS schools (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  npsn        TEXT,
  email       TEXT,
  address     TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id     UUID REFERENCES schools(id),
  full_name     TEXT NOT NULL,
  email         TEXT,
  nis           TEXT UNIQUE,
  nip           TEXT UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('admin','guru','murid')),
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. KELAS
CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id   UUID NOT NULL REFERENCES schools(id),
  name        TEXT NOT NULL,
  level       TEXT,
  major       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. GURU -> KELAS (many-to-many)
CREATE TABLE IF NOT EXISTS class_teachers (
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, teacher_id)
);

-- 5. MURID -> KELAS (many-to-many)
CREATE TABLE IF NOT EXISTS class_enrollments (
  class_id     UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_school ON profiles(school_id);
CREATE INDEX idx_profiles_nis ON profiles(nis);
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX idx_class_teachers_teacher ON class_teachers(teacher_id);

-- ============================================================
-- SECURITY DEFINER FUNCTIONS (bypass RLS untuk cek role)
-- Fungsi-fungsi ini berjalan dengan hak akses pembuatnya (superuser),
-- sehingga tidak trigger RLS — aman dari infinite recursion.
-- ============================================================

-- Cek apakah user saat ini adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Cek apakah user saat ini adalah guru
CREATE OR REPLACE FUNCTION public.is_guru()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'guru'
  );
$$;

-- Dapatkan school_id user saat ini (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Dapatkan role user saat ini (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- ==========================
-- SCHOOLS POLICIES
-- ==========================

-- Admin bisa melakukan apa saja di sekolahnya
CREATE POLICY "schools_admin_all"
  ON schools FOR ALL
  USING (
    public.is_admin() AND public.get_my_school_id() = schools.id
  );

-- Semua user bisa baca data sekolah
CREATE POLICY "schools_read_all"
  ON schools FOR SELECT
  USING (true);

-- ==========================
-- PROFILES POLICIES
-- ==========================

-- Admin bisa melakukan apa saja di profil dalam sekolahnya
CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL
  USING (
    public.is_admin() AND public.get_my_school_id() = profiles.school_id
  );

-- User bisa lihat profilnya sendiri
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- User bisa insert profilnya sendiri (saat signup trigger)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User bisa update profilnya sendiri
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Guru bisa lihat profil murid di kelasnya
CREATE POLICY "profiles_guru_read_murid"
  ON profiles FOR SELECT
  USING (
    public.is_guru() AND role = 'murid' AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN class_teachers ct ON ct.class_id = ce.class_id
      WHERE ce.student_id = profiles.id
      AND ct.teacher_id = auth.uid()
    )
  );

-- ==========================
-- CLASSES POLICIES
-- ==========================

-- Admin bisa manage kelas di sekolahnya
CREATE POLICY "classes_admin_all"
  ON classes FOR ALL
  USING (
    public.is_admin() AND public.get_my_school_id() = classes.school_id
  );

-- Guru lihat kelas yang diajar
CREATE POLICY "classes_teacher_read"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_teachers
      WHERE class_teachers.class_id = classes.id
      AND class_teachers.teacher_id = auth.uid()
    )
  );

-- ==========================
-- CLASS TEACHERS POLICIES
-- ==========================

-- Admin manage class_teachers
CREATE POLICY "class_teachers_admin_all"
  ON class_teachers FOR ALL
  USING (public.is_admin());

-- ==========================
-- CLASS ENROLLMENTS POLICIES
-- ==========================

-- Admin manage enrollments
CREATE POLICY "class_enrollments_admin_all"
  ON class_enrollments FOR ALL
  USING (public.is_admin());

-- Guru lihat enrollments di kelasnya
CREATE POLICY "class_enrollments_teacher_read"
  ON class_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_teachers
      WHERE class_teachers.class_id = class_enrollments.class_id
      AND class_teachers.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'murid')
  );
  RETURN NEW;
END;
$$;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
