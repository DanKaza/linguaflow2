"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, UserCircle, ClipboardList, Activity, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import type { DashboardStats } from "@/lib/types/database";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-indigo" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: "Total Murid",
      value: stats?.total_students?.toLocaleString() || "0",
      trend: "Aktif",
    },
    {
      icon: UserCircle,
      label: "Total Guru",
      value: stats?.total_teachers?.toLocaleString() || "0",
      trend: "Terdaftar",
    },
    {
      icon: ClipboardList,
      label: "Total Kelas",
      value: stats?.total_classes?.toLocaleString() || "0",
      trend: "Aktif",
    },
    {
      icon: Activity,
      label: "Aktif Hari Ini",
      value: stats?.active_today?.toLocaleString() || "0",
      trend: "Login hari ini",
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold text-ink jp-rule">Dashboard Sekolah</h1>
      <p className="text-sm text-ink-soft">{today}</p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} padded>
              <span className="flex h-10 w-10 items-center justify-center rounded-btn bg-indigo-tint-soft">
                <Icon size={20} className="text-indigo" />
              </span>
              <p className="mt-3 text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-sm text-ink-soft">{s.label}</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-success">
                <TrendingUp size={13} /> {s.trend}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Activity line chart */}
      <Card className="mt-6" padded>
        <h2 className="text-sm font-bold text-ink">Aktivitas Belajar 30 Hari Terakhir</h2>
        <div className="mt-4 overflow-x-auto thin-scroll">
          <div className="flex min-w-[640px] items-end gap-1">
            {(stats?.activity_last_30 || []).map((a, i) => (
              <div key={i} className="flex-1">
                <div
                  className="w-full rounded-t-sm bg-indigo/70"
                  style={{ height: `${a.value * 0.6}px` }}
                  title={`Hari ${a.day}: ${a.value}%`}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Top Classes */}
        <Card padded>
          <h2 className="text-sm font-bold text-ink">Kelas Paling Aktif</h2>
          {stats?.top_classes?.length ? (
            <div className="mt-3 space-y-3">
              {stats.top_classes.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-ink">{c.name}</span>
                    <span className="text-indigo">{c.progress}%</span>
                  </div>
                  <ProgressBar value={c.progress} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">Belum ada data kelas.</p>
          )}
        </Card>

        {/* Top Teachers */}
        <Card padded>
          <h2 className="text-sm font-bold text-ink">Guru Paling Aktif</h2>
          {stats?.top_teachers?.length ? (
            <div className="mt-3 space-y-3">
              {stats.top_teachers.map((t, i) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-indigo">#{i + 1}</span>
                  <Avatar name={t.name} size={32} />
                  <span className="flex-1 text-sm font-semibold text-ink">{t.name}</span>
                  <span className="text-xs text-ink-soft">{t.tasks} tugas</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">Belum ada data guru.</p>
          )}
        </Card>
      </div>
    </>
  );
}
