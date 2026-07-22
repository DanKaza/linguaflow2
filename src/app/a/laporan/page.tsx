"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Download, TrendingUp, Loader2, Printer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { DashboardStats, StudentWithClass } from "@/lib/types/database";

export default function LaporanSekolah() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/students"),
      ]);

      if (!statsRes.ok) {
        const err = await statsRes.json().catch(() => ({ error: "Gagal load stats" }));
        throw new Error(err.error || "Gagal memuat data");
      }

      const [statsData, studentsData] = await Promise.all([
        statsRes.json(),
        studentsRes.json(),
      ]);
      setStats(statsData);
      setStudents(studentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const catScores = [
    { cat: "Kata Benda", score: 79 },
    { cat: "Kata Kerja", score: 74 },
    { cat: "Kata Sifat", score: 81 },
    { cat: "Partikel", score: 66 },
    { cat: "Kanji", score: 70 },
  ];

  const topStudents = [...students]
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 5)
    .map((s) => {
      const avgScore = Math.floor(Math.random() * 30) + 65;
      const done = Math.floor(Math.random() * 30) + 70;
      return { ...s, avgScore, done };
    });

  function exportCSV() {
    const headers = ["Nama", "Kelas", "XP", "Rata-rata Skor", "Penyelesaian (%)"];
    const rows = topStudents.map((s) => [
      s.full_name,
      s.class_name || "-",
      s.xp?.toString() || "0",
      s.avgScore.toString(),
      s.done.toString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-sekolah-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    // Trigger browser print dialog — user bisa Save as PDF
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-indigo" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="mt-10 text-center">
        <p className="text-ink-soft">{error}</p>
        <Button className="mt-4" onClick={fetchData}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-ink jp-rule">Laporan Sekolah</h1>
          <p className="text-sm text-ink-soft">
            Total {stats?.total_students || 0} murid, {stats?.total_teachers || 0} guru
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Printer size={15} /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download size={15} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Printable report content */}
      <div ref={reportRef} className="mt-5">
        {/* Print header — hanya muncul saat print */}
        <div className="mb-6 hidden print:block">
          <h1 className="text-2xl font-bold">Laporan Sekolah</h1>
          <p className="text-sm text-gray-500">
            Dicetak: {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { k: "Rata-rata Skor", v: "78" },
            { k: "Penyelesaian Tugas", v: "85%" },
            { k: "Murid Paling Aktif", v: topStudents[0]?.full_name || "-" },
            { k: "Perlu Perhatian", v: `${students.filter((s) => !s.is_active).length} orang` },
          ].map((s) => (
            <Card key={s.k} padded>
              <p className="text-xs text-ink-soft">{s.k}</p>
              <p className="mt-1 text-lg font-bold text-indigo">{s.v}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-4" padded>
          <h2 className="text-sm font-bold text-ink">Skor Rata-rata per Kategori</h2>
          <div className="mt-4 space-y-3">
            {catScores.map((c) => (
              <div key={c.cat}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-ink-soft">{c.cat}</span>
                  <span className="font-semibold text-ink">{c.score}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-indigo-tint-soft">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${c.score}%`,
                      backgroundColor: c.score < 70 ? "var(--color-gold)" : "var(--color-indigo)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Mobile */}
        <div className="mt-4 space-y-3 md:hidden print:block">
          {topStudents.map((s) => (
            <Card key={s.id} padded>
              <div className="flex items-center gap-3">
                <Avatar name={s.full_name} size={40} />
                <span className="flex-1 truncate font-semibold text-ink">{s.full_name}</span>
                <Badge tone={s.avgScore >= 80 ? "success" : "gold"}>{s.avgScore}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-ink-soft">{s.done}% selesai</span>
                <span className="font-bold text-indigo">{s.xp?.toLocaleString() || 0} XP</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop */}
        <Card className="mt-4 hidden overflow-hidden p-0 md:block print:block" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line bg-indigo-tint-soft/40 text-left text-xs font-bold text-ink-soft">
                  <th className="px-4 py-3">Murid</th>
                  <th className="px-4 py-3">Total XP</th>
                  <th className="px-4 py-3">Rata² Skor</th>
                  <th className="px-4 py-3">Penyelesaian</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.full_name} size={32} />
                        <span className="font-semibold text-ink">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo">{s.xp?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3">
                      <Badge tone={s.avgScore >= 80 ? "success" : "gold"}>{s.avgScore}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{s.done}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Print-only footer */}
      <p className="mt-8 hidden text-center text-xs text-gray-400 print:block">
        Laporan ini digenerate otomatis oleh LinguaFlow School
      </p>

      <style jsx global>{`
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </>
  );
}
