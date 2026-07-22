"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Upload, Pencil, UserX, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import type { TeacherWithClasses } from "@/lib/types/database";

export default function KelolaGuru() {
  const [teachers, setTeachers] = useState<TeacherWithClasses[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNip, setFormNip] = useState("");
  const [formError, setFormError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const fetchTeachers = useCallback(async () => {
    setFetchError("");
    try {
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal memuat data" }));
        throw new Error(err.error || "Gagal memuat guru");
      }
      const data = await res.json();
      setTeachers(data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setFetchError(msg);
      console.error("Gagal fetch guru:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filtered = teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: formName, email: formEmail, nip: formNip }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal menambah guru");
      } else {
        setModal(null);
        setFormName("");
        setFormEmail("");
        setFormNip("");
        fetchTeachers();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(teacher: TeacherWithClasses) {
    await fetch("/api/admin/teachers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: teacher.id,
        action: "toggle_active",
        isActive: !teacher.is_active,
      }),
    });
    fetchTeachers();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-indigo" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink jp-rule">Kelola Guru</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => alert("Fitur import CSV akan segera hadir.")}>
            <Upload size={15} /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setModal("add")}>
            <Plus size={15} /> Tambah Guru
          </Button>
        </div>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <Input
          placeholder="Cari guru..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {fetchError ? (
        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-error">{fetchError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchTeachers}>
            Coba Lagi
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-ink-soft">Belum ada guru terdaftar.</p>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="mt-4 space-y-3 md:hidden">
            {filtered.map((t) => (
              <Card key={t.id} padded>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.full_name} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{t.full_name}</p>
                      <p className="truncate text-xs text-ink-soft">{t.email}</p>
                    </div>
                  </div>
                  <Badge tone={t.is_active ? "success" : "neutral"}>
                    {t.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                  <span className="text-ink-soft">{t.student_count} murid</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {t.classes?.length ? (
                      t.classes.map((c: any) => (
                        <Badge key={c.id} tone="indigo">
                          {c.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" fullWidth>
                    <Pencil size={15} /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={t.is_active ? "text-error" : "text-success"}
                    onClick={() => handleToggleActive(t)}
                  >
                    <UserX size={15} /> {t.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop */}
          <Card className="mt-4 hidden overflow-hidden p-0 md:block" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-indigo-tint-soft/40 text-left text-xs font-bold text-ink-soft">
                    <th className="px-4 py-3">Guru</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Murid</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={t.full_name} size={32} />
                          <span className="font-semibold text-ink">{t.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{t.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {t.classes?.length ? (
                            t.classes.map((c: any) => (
                              <Badge key={c.id} tone="indigo">
                                {c.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-ink-soft">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink">{t.student_count}</td>
                      <td className="px-4 py-3">
                        <Badge tone={t.is_active ? "success" : "neutral"}>
                          {t.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-indigo" aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                          <button
                            className={t.is_active ? "text-ink-soft hover:text-error" : "text-success"}
                            onClick={() => handleToggleActive(t)}
                            aria-label="Toggle active"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Modal Tambah Guru */}
      {modal === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setModal(null)} />
          <Card className="relative z-10 w-full max-w-md" padded>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Tambah Guru</h2>
              <button onClick={() => setModal(null)} className="text-ink-soft hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Nama Lengkap</label>
                <Input
                  placeholder="Nama lengkap"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Email</label>
                <Input
                  type="email"
                  placeholder="guru@sekolah.sch.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">
                  NIP <span className="text-ink-soft">(opsional)</span>
                </label>
                <Input
                  placeholder="NIP"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                />
              </div>
              {formError && (
                <p className="text-sm font-semibold text-error">{formError}</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" fullWidth type="button" onClick={() => setModal(null)}>
                  Batal
                </Button>
                <Button fullWidth type="submit" disabled={submitting}>
                  {submitting ? "Menyimpan..." : "Tambah Guru"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
