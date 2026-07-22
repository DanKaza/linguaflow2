"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileQuestion,
  BarChart3,
  Settings,
  Menu,
  X,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { useState } from "react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

export function AppSidebar({
  role,
  items,
  userName,
  userSub,
}: {
  role: "teacher" | "admin";
  items: SidebarItem[];
  userName: string;
  userSub: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem("lf_role");
        localStorage.removeItem("lf_email");
        router.push("/login");
      }
    } catch {
      // Fallback: langsung redirect ke login
      router.push("/login");
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/" && path.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              href={it.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-indigo-tint-soft text-indigo"
                  : "text-ink-soft hover:bg-indigo-tint-soft/50 hover:text-indigo",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <RoleSwitcher current={role === "admin" ? "admin" : "guru"} />
        <div className="mt-3 flex items-center gap-3 rounded-btn px-2 py-2">
          <UserCircle size={36} className="text-indigo" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{userName}</p>
            <p className="truncate text-xs text-ink-soft">{userSub}</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-2 flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-error/10 hover:text-error"
        >
          <LogOut size={18} />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper/80 px-4 backdrop-blur-md md:hidden">
        <Logo size={24} />
        <button onClick={() => setOpen(true)} aria-label="Buka menu">
          <Menu size={24} className="text-indigo" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-line bg-paper md:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-paper shadow-soft-lg">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 text-ink-soft"
              aria-label="Tutup menu"
            >
              <X size={22} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}

export const teacherItems: SidebarItem[] = [
  { label: "Dashboard", href: "/g/dashboard", icon: LayoutDashboard },
  { label: "Kelas Saya", href: "/g/kelas", icon: Users },
  { label: "Tugas", href: "/g/tugas", icon: ClipboardList },
  { label: "Kuis", href: "/g/kuis", icon: FileQuestion },
  { label: "Laporan", href: "/g/laporan", icon: BarChart3 },
  { label: "Profil", href: "/g/profil", icon: Settings },
];

export const adminItems: SidebarItem[] = [
  { label: "Dashboard", href: "/a/dashboard", icon: LayoutDashboard },
  { label: "Guru", href: "/a/guru", icon: Users },
  { label: "Murid", href: "/a/murid", icon: UserCircle },
  { label: "Kelas", href: "/a/kelas", icon: ClipboardList },
  { label: "Laporan", href: "/a/laporan", icon: BarChart3 },
  { label: "Pengaturan", href: "/a/pengaturan", icon: Settings },
];

export const studentSidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/m/dashboard", icon: LayoutDashboard },
  { label: "Belajar", href: "/m/belajar", icon: ClipboardList },
  { label: "Kuis", href: "/m/kuis", icon: FileQuestion },
  { label: "Kamus", href: "/m/kamus", icon: Users },
  { label: "Leaderboard", href: "/m/leaderboard", icon: BarChart3 },
  { label: "Sensei", href: "/m/sensei", icon: UserCircle },
  { label: "Profil", href: "/m/profil", icon: Settings },
];
