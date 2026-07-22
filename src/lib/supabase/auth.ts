"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type AuthResult =
  | { success: true; role: string; redirectTo: string }
  | { success: false; error: string };

const roleRedirectMap: Record<string, string> = {
  admin: "/a/dashboard",
  guru: "/g/dashboard",
  murid: "/m/dashboard",
};

/**
 * Sign in with email & password via Supabase Auth.
 * Returns role & redirect path, or error message.
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { success: false, error: "Email atau password salah." };
    }
    return { success: false, error: error.message };
  }

  // Ambil role dari tabel profiles
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Gagal mendapatkan data user." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "murid";
  const redirectTo = roleRedirectMap[role] || "/m/dashboard";

  return { success: true, role, redirectTo };
}

/**
 * Sign up a new user with email & password.
 * Creates auth user + profile row via database trigger.
 */
export async function signUp(data: {
  email: string;
  password: string;
  fullName: string;
  role: "murid" | "guru";
  schoolId?: string;
}): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        role: data.role,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { success: false, error: "Email sudah terdaftar." };
    }
    return { success: false, error: error.message };
  }

  return {
    success: true,
    role: data.role,
    redirectTo: "/login?registered=true",
  };
}

/**
 * Sign out current user.
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  redirect("/login");
}

/**
 * Get current user's profile with role.
 */
export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
