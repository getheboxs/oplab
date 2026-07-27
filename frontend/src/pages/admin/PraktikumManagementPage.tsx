import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Pencil, Plus, Trash2, Upload } from "lucide-react";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminTabs from "../../components/admin/AdminTabs";
import PraktikumFormModal from "../../components/admin/PraktikumFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPraktikumList,
  createPraktikum,
  updatePraktikum,
  updatePraktikumStatus,
  deletePraktikum,
  type Praktikum,
  type PraktikumFormValues,
} from "../../services/praktikumService";

const tingkatLabel: Record<string, string> = {
  mudah: "Pemula",
  sedang: "Menengah",
  sulit: "Mahir",
};

export default function PraktikumManagementPage() {
  const { token } = useAuth();
  const [list, setList] = useState<Praktikum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Praktikum | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Praktikum | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadList = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPraktikumList(token);
      setList(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat data praktikum.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  function openCreateModal() {
    setModalMode("create");
    setSelected(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(item: Praktikum) {
    setModalMode("edit");
    setSelected(item);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmitForm(values: PraktikumFormValues) {
    if (!token) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (modalMode === "create") {
        await createPraktikum(token, values);
      } else if (selected) {
        await updatePraktikum(token, selected.id_praktikum, values);
      }
      setModalOpen(false);
      await loadList();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan praktikum.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(item: Praktikum) {
    if (!token) return;
    const nextStatus = item.status === "aktif" ? "nonaktif" : "aktif";
    try {
      await updatePraktikumStatus(token, item.id_praktikum, nextStatus);
      await loadList();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal mengubah status praktikum.");
    }
  }

  async function handleConfirmDelete() {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deletePraktikum(token, deleteTarget.id_praktikum);
      setDeleteTarget(null);
      await loadList();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus praktikum.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader onRefresh={loadList} />
      <AdminTabs />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Bank Soal &amp; Penjadwalan</h1>
            <p className="mt-1 text-sm text-slate-500">
              Buat, impor, dan jadwalkan kegiatan praktikum di laboratorium pemrograman Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled
              title="Segera hadir"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-400"
            >
              <Upload className="h-4 w-4" />
              Impor Soal JSON
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              Buat Praktikum Baru
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400 shadow-card">
            Memuat data praktikum...
          </div>
        ) : list.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-card">
            <AlertCircle className="h-6 w-6 text-slate-300" />
            <p className="text-sm text-slate-400">
              Belum ada praktikum terdaftar. Klik tombol di kanan atas untuk membuat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {list.map((item) => (
              <div
                key={item.id_praktikum}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-brand-50 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-brand-600">
                      {item.mata_kuliah}
                    </span>
                    <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
                      Bahasa:{" "}
                      <span className="font-mono font-semibold text-sky-600">
                        {item.bahasa === "javascript" ? "JAVASCRIPT" : "TYPESCRIPT"}
                      </span>
                    </span>
                  </div>

                  <span
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      item.status === "aktif"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        item.status === "aktif" ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {item.status === "aktif" ? "AKTIF" : "NONAKTIF"}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">{item.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {item.deskripsi || "Tidak ada deskripsi."}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">
                    Kode: <span className="font-mono font-semibold text-brand-600">{item.kode_akses}</span>
                    {" · "}Durasi: <span className="font-semibold text-slate-700">{item.durasi_menit} Menit</span>
                    {" · "}
                    <span className="font-semibold text-emerald-600">
                      {tingkatLabel[item.tingkat_kesulitan] ?? item.tingkat_kesulitan}
                    </span>
                  </p>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        item.status === "aktif" ? "bg-brand-600" : "bg-slate-200"
                      }`}
                      title={item.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          item.status === "aktif" ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                      title="Ubah"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(item);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PraktikumFormModal
        open={modalOpen}
        mode={modalMode}
        initialData={selected}
        isSubmitting={isSubmitting}
        errorMessage={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Praktikum?"
        description={
          deleteError ??
          `Praktikum "${deleteTarget?.judul}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
        }
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
