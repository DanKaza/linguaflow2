"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result.success) {
      // Simpan role untuk client-side reference (optional)
      localStorage.setItem("lf_role", result.role);
      localStorage.setItem("lf_email", email);
      router.push(result.redirectTo);
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="seigaiha pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40" />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link href="/">
            <Logo size={32} />
          </Link>
          <p className="mt-3 text-sm text-ink-soft">Belajar Bahasa Jepang, Setiap Hari</p>
        </div>

        <form onSubmit={submit} className="rounded-card border border-line bg-paper p-6 shadow-soft">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@sekolah.sch.id"
              className="pl-10"
              required
              autoComplete="email"
            />
          </div>

          <div className="relative mt-4">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-ink-soft"
              aria-label="Tampilkan password"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <Input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="pl-10"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="mt-3 text-sm font-semibold text-error flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}

          <Button type="submit" fullWidth className="mt-5" disabled={loading || !email || !password}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Memeriksa…
              </>
            ) : (
              "Masuk"
            )}
          </Button>

          <div className="mt-4 text-right">
            <a href="#" className="text-sm font-semibold text-indigo hover:underline">
              Lupa password?
            </a>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-soft">
            <span className="h-px flex-1 bg-line" /> atau <span className="h-px flex-1 bg-line" />
          </div>

          <Link href="/register">
            <Button fullWidth variant="outline" type="button">
              Daftar Akun Baru
            </Button>
          </Link>
        </form>

        {/* Informasi */}
        <div className="mt-5 rounded-card border border-dashed border-indigo/40 bg-indigo-tint-soft/30 p-4">
          <p className="text-xs font-bold text-indigo">💡 Tentang Login</p>
          <p className="mt-1 text-xs text-ink-soft leading-relaxed">
            Login menggunakan akun yang sudah terdaftar. 
            Jika belum punya akun, silakan daftar terlebih dahulu.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">© 2026 LinguaFlow School</p>
      </div>
    </div>
  );
}
