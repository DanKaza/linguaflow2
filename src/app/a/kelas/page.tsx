"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Users, BookOpen, ExternalLink, Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useRouter } from "next/navigation";
import type { ClassWithDetails } from "@/lib/types/database";

export default function KelolaKelas() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formLevel, setFormLevel] = useState("X");
  const [formMajor, setFormMajor] = useState("RPL");
  const [formError, setFormError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const fetchClasses = useCallback(async () => {
    setFetchError("");
    try {
      const res = await fetch("/api/admin/classes");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal memuat data" }));
        throw new Error(err.error || "Gagal memuat kelas");
      }
      const data = await res.json();
      setClasses(data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setFetchError(msg);
      console.error("Gagal fetch kelas:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.major?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          level: formLevel,
          major: formMajor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal membuat kelas");
      } else {
        setModal(false);
        setFormName("");
        setFormLevel("X");
        setFormMajor("RPL");
        fetchClasses();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-ink jp-rule">Kelola Kelas</h1>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus size={15} /> Buat Kelas
        </Button>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <Input
          placeholder="Cari kelas..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {fetchError ? (
        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-error">{fetchError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchClasses}>
            Coba Lagi
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-ink-soft">Belum ada kelas. Buat kelas baru untuk memulai.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} interactive padded>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-btn bg-indigo text-white">
                  <BookOpen size={20} />
                </span>
                <Badge tone="indigo">{c.level}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold text-ink">{c.name}</h3>
              <p className="text-sm text-ink-soft">
                {c.teacher_names?.length ? c.teacher_names.join(", ") : "Belum ada wali"}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-ink-soft">
                <Users size={14} /> {c.student_count} murid
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-ink-soft">Rata-rata</span>
                  <span className="font-semibold text-indigo">{c.avg_score}%</span>
                </div>
                <ProgressBar value={c.avg_score || 0} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={() => router.push(`/g/kelas/${c.name.toLowerCase().replace(/\s+/g, "-")}`)}
              >
                <ExternalLink size={15} /> Lihat Detail
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Buat Kelas */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setModal(false)} />
          <Card className="relative z-10 w-full max-w-md" padded>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Buat Kelas Baru</h2>
              <button onClick={() => setModal(false)} className="text-ink-soft hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">Nama Kelas</label>
                <Input
                  placeholder="XII RPL 3"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Tingkat</label>
                  <Select value={formLevel} onChange={(e) => setFormLevel(e.target.value)}>
                    <option value="X">X</option>
                    <option value="XI">XI</option>
                    <option value="XII">XII</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Jurusan</label>
                  <Select value={formMajor} onChange={(e) => setFormMajor(e.target.value)}>
                    <option value="RPL">RPL</option>
                    <option value="TKJ">TKJ</option>
                    <option value="MM">MM</option>
                  </Select>
                </div>
              </div>
              {formError && (
                <p className="text-sm font-semibold text-error">{formError}</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" fullWidth type="button" onClick={() => setModal(false)}>
                  Batal
                </Button>
                <Button fullWidth type="submit" disabled={submitting}>
                  {submitting ? "Menyimpan..." : "Buat Kelas"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
