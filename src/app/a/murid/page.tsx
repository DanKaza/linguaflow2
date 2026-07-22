"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Upload, Pencil, UserX, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { StudentWithClass } from "@/lib/types/database";

export default function KelolaMurid() {
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "import" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNis, setFormNis] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formError, setFormError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const fetchData = useCallback(async () => {
    setFetchError("");
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/classes"),
      ]);

      if (!studentsRes.ok) {
        const err = await studentsRes.json().catch(() => ({ error: "Gagal memuat data" }));
        throw new Error(err.error || "Gagal memuat murid");
      }

      const [studentsData, classesData] = await Promise.all([
        studentsRes.json(),
        classesRes.json(),
      ]);
      setStudents(studentsData || []);
      setClasses(classesData || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setFetchError(msg);
      console.error("Gagal fetch data:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formName,
          email: formEmail,
          nis: formNis,
          classId: formClassId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal menambah murid");
      } else {
        setModal(null);
        setFormName("");
        setFormEmail("");
        setFormNis("");
        setFormClassId("");
        fetchData();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(student: StudentWithClass) {
    await fetch("/api/admin/students", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        action: "toggle_active",
        isActive: !student.is_active,
      }),
    });
    fetchData();
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
        <h1 className="text-2xl font-bold text-ink jp-rule">Kelola Murid</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setModal("import")}>
            <Upload size={15} /> Import Murid
          </Button>
          <Button size="sm" onClick={() => setModal("add")}>
            <Plus size={15} /> Tambah Murid
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            placeholder="Cari murid / NIS..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {fetchError ? (
        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-error">{fetchError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
            Coba Lagi
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-ink-soft">Belum ada murid terdaftar.</p>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="mt-4 space-y-3 md:hidden">
            {filtered.map((s) => (
              <Card key={s.id} padded>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.full_name} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{s.full_name}</p>
                      <p className="text-xs text-ink-soft">NIS {s.nis}</p>
                    </div>
                  </div>
                  <Badge tone={s.is_active ? "success" : "neutral"}>
                    {s.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                  <span className="text-ink-soft">{s.class_name || "—"}</span>
                  <span className="font-bold text-indigo">{s.xp?.toLocaleString() || 0} XP</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" fullWidth>
                    <Pencil size={15} /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={s.is_active ? "text-error" : "text-success"}
                    onClick={() => handleToggleActive(s)}
                  >
                    <UserX size={15} /> {s.is_active ? "Nonaktifkan" : "Aktifkan"}
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
                    <th className="px-4 py-3">Murid</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Total XP</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.full_name} size={32} />
                          <div>
                            <p className="font-semibold text-ink">{s.full_name}</p>
                            <p className="text-xs text-ink-soft">NIS {s.nis}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{s.class_name || "—"}</td>
                      <td className="px-4 py-3 font-bold text-indigo">{s.xp?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3">
                        <Badge tone={s.is_active ? "success" : "neutral"}>
                          {s.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-indigo" aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                          <button
                            className={s.is_active ? "text-ink-soft hover:text-error" : "text-success"}
                            onClick={() => handleToggleActive(s)}
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

      {/* Modal Tambah Murid */}
      {modal === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setModal(null)} />
          <Card className="relative z-10 w-full max-w-md" padded>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Tambah Murid</h2>
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
                  placeholder="murid@sekolah.sch.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">NIS</label>
                <Input
                  placeholder="Nomor Induk Siswa"
                  value={formNis}
                  onChange={(e) => setFormNis(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Kelas</label>
                <Select value={formClassId} onChange={(e) => setFormClassId(e.target.value)}>
                  <option value="">Pilih kelas (opsional)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              {formError && (
                <p className="text-sm font-semibold text-error">{formError}</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" fullWidth type="button" onClick={() => setModal(null)}>
                  Batal
                </Button>
                <Button fullWidth type="submit" disabled={submitting}>
                  {submitting ? "Menyimpan..." : "Tambah Murid"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Import CSV */}
      {modal === "import" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setModal(null)} />
          <Card className="relative z-10 w-full max-w-md" padded>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Import Murid (CSV)</h2>
              <button onClick={() => setModal(null)} className="text-ink-soft hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 flex h-32 items-center justify-center rounded-card border-2 border-dashed border-indigo/40 bg-indigo-tint-soft/30 text-sm text-ink-soft">
              Drop file CSV di sini atau klik untuk pilih
            </div>
            <p className="mt-2 text-xs text-ink-soft leading-relaxed">
              Format: Nama, NIS, Email, Kelas (opsional)
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setModal(null)}>
                Batal
              </Button>
              <Button fullWidth onClick={() => alert("Fitur import CSV akan segera hadir.")}>
                Import
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
