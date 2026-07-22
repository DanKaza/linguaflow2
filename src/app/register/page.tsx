"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Loader2, GraduationCap, School } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"role" | "form" | "done">("role");
  const [role, setRole] = useState<"murid" | "guru">("murid");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: role,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Email sudah terdaftar. Silakan login.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      setStep("done");
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  // Step: Pilih role
  if (step === "role") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10">
        <div className="seigaiha pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40" />
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <Link href="/">
              <Logo size={32} />
            </Link>
            <p className="mt-3 text-sm text-ink-soft">Daftar akun baru</p>
          </div>

          <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
            <h2 className="text-center text-base font-bold text-ink">Siapa kamu?</h2>
            <p className="mt-1 text-center text-sm text-ink-soft">Pilih peran untuk mendaftar</p>

            <div className="mt-5 grid gap-3">
              <button
                onClick={() => { setRole("murid"); setStep("form"); }}
                className="flex items-center gap-4 rounded-btn border-2 border-line bg-warm-white p-4 text-left transition-all hover:border-indigo hover:bg-indigo-tint-soft/30"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-btn bg-indigo text-white">
                  <GraduationCap size={24} />
                </span>
                <div>
                  <p className="font-bold text-ink">Murid</p>
                  <p className="text-sm text-ink-soft">Belajar bahasa Jepang dan kerjakan tugas</p>
                </div>
              </button>

              <button
                onClick={() => { setRole("guru"); setStep("form"); }}
                className="flex items-center gap-4 rounded-btn border-2 border-line bg-warm-white p-4 text-left transition-all hover:border-indigo hover:bg-indigo-tint-soft/30"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-btn bg-vermillion text-white">
                  <School size={24} />
                </span>
                <div>
                  <p className="font-bold text-ink">Guru</p>
                  <p className="text-sm text-ink-soft">Kelola kelas dan buat tugas untuk murid</p>
                </div>
              </button>
            </div>

            <p className="mt-5 text-center text-sm text-ink-soft">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-indigo hover:underline">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step: Sukses
  if (step === "done") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10">
        <div className="seigaiha pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40" />
        <div className="w-full max-w-[420px] text-center">
          <div className="rounded-card border border-success/30 bg-success/5 p-8 shadow-soft">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-3xl">
              ✅
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">Pendaftaran Berhasil!</h2>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              Akun kamu berhasil dibuat. Silakan cek email kamu untuk verifikasi,
              lalu login untuk memulai.
            </p>
            <Button fullWidth className="mt-6" onClick={() => router.push("/login")}>
              Login Sekarang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step: Form pendaftaran
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="seigaiha pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40" />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link href="/">
            <Logo size={32} />
          </Link>
          <p className="mt-1 text-sm text-ink-soft">
            Daftar sebagai {role === "murid" ? "Murid" : "Guru"}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-card border border-line bg-paper p-6 shadow-soft">
          {/* Nama */}
          <label className="mb-1.5 block text-sm font-semibold text-ink">Nama Lengkap</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input
              type="text"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Nama lengkap"
              className="pl-10"
              required
            />
          </div>

          {/* Email */}
          <label className="mb-1.5 mt-4 block text-sm font-semibold text-ink">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="email@contoh.com"
              className="pl-10"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <label className="mb-1.5 mt-4 block text-sm font-semibold text-ink">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft z-10"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <Input
              type={show ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Minimal 6 karakter"
              className="pl-10"
              required
              minLength={6}
            />
          </div>

          {/* Confirm Password */}
          <label className="mb-1.5 mt-4 block text-sm font-semibold text-ink">Konfirmasi Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input
              type={show ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Ulangi password"
              className="pl-10"
              required
            />
          </div>

          {error && (
            <p className="mt-3 text-sm font-semibold text-error">{error}</p>
          )}

          <Button type="submit" fullWidth className="mt-5" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Mendaftarkan…
              </>
            ) : (
              "Daftar"
            )}
          </Button>

          <p className="mt-4 text-center text-sm text-ink-soft">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-indigo hover:underline">
              Masuk
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
