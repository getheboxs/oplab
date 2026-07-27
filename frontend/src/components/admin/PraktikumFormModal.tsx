import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import type {
  BahasaPemrograman,
  Praktikum,
  PraktikumFormValues,
  TingkatKesulitan,
} from "../../services/praktikumService";
import { toDatetimeLocalValue, toMySQLDatetime } from "../../utils/datetime";

interface PraktikumFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: Praktikum | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: PraktikumFormValues) => void;
}

const emptyForm: PraktikumFormValues = {
  judul: "",
  mata_kuliah: "",
  deskripsi: "",
  bahasa: "javascript",
  tingkat_kesulitan: "mudah",
  instruksi: "",
  starter_code: "",
  contoh_input: "",
  contoh_output: "",
  durasi_menit: 45,
  kode_akses: "",
  status: "nonaktif",
  jadwal_mulai: "",
  jadwal_berakhir: "",
};

export default function PraktikumFormModal({
  open,
  mode,
  initialData,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: PraktikumFormModalProps) {
  const [form, setForm] = useState<PraktikumFormValues>(emptyForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        judul: initialData.judul,
        mata_kuliah: initialData.mata_kuliah,
        deskripsi: initialData.deskripsi ?? "",
        bahasa: initialData.bahasa,
        tingkat_kesulitan: initialData.tingkat_kesulitan,
        instruksi: initialData.instruksi,
        starter_code: initialData.starter_code ?? "",
        contoh_input: initialData.contoh_input ?? "",
        contoh_output: initialData.contoh_output ?? "",
        durasi_menit: initialData.durasi_menit,
        kode_akses: initialData.kode_akses,
        status: initialData.status,
        jadwal_mulai: toDatetimeLocalValue(initialData.jadwal_mulai),
        jadwal_berakhir: toDatetimeLocalValue(initialData.jadwal_berakhir),
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData, open]);

  if (!open) return null;

  function update<K extends keyof PraktikumFormValues>(key: K, value: PraktikumFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      ...form,
      jadwal_mulai: toMySQLDatetime(form.jadwal_mulai),
      jadwal_berakhir: toMySQLDatetime(form.jadwal_berakhir),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {mode === "create" ? "Buat Sesi Praktikum Baru" : "Ubah Sesi Praktikum"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Lengkapi data di bawah ini untuk didaftarkan ke sistem bank praktikum.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6">
          {errorMessage && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <Field label="Judul Praktikum Soal">
            <input
              type="text"
              required
              value={form.judul}
              onChange={(e) => update("judul", e.target.value)}
              placeholder="Contoh: Praktikum 2 - Object Oriented Programming"
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mata Kuliah">
              <input
                type="text"
                required
                value={form.mata_kuliah}
                onChange={(e) => update("mata_kuliah", e.target.value)}
                placeholder="Contoh: Pemrograman Berorientasi Objek"
                className="input-field"
              />
            </Field>
            <Field label="Kode Akses Sesi">
              <input
                type="text"
                value={form.kode_akses}
                onChange={(e) => update("kode_akses", e.target.value.toUpperCase())}
                placeholder="Contoh: LAB-OOP202 (opsional, dibuat otomatis)"
                className="input-field font-mono uppercase"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Bahasa Pemrograman">
              <select
                value={form.bahasa}
                onChange={(e) => update("bahasa", e.target.value as BahasaPemrograman)}
                className="input-field"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>
            </Field>
            <Field label="Timer Pengerjaan (menit)">
              <input
                type="number"
                min={1}
                required
                value={form.durasi_menit}
                onChange={(e) => update("durasi_menit", Number(e.target.value))}
                className="input-field"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tingkat Kesulitan">
              <select
                value={form.tingkat_kesulitan}
                onChange={(e) => update("tingkat_kesulitan", e.target.value as TingkatKesulitan)}
                className="input-field"
              >
                <option value="mudah">Pemula</option>
                <option value="sedang">Menengah</option>
                <option value="sulit">Mahir</option>
              </select>
            </Field>
            <Field label="Status Aktif Sesi">
              <label className="flex h-[42px] items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    update("status", form.status === "aktif" ? "nonaktif" : "aktif")
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    form.status === "aktif" ? "bg-brand-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      form.status === "aktif" ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
                <span className="text-xs leading-snug text-slate-500">
                  Aktifkan sekarang (menonaktifkan soal lain)
                </span>
              </label>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Jadwal Mulai">
              <input
                type="datetime-local"
                required
                value={form.jadwal_mulai}
                onChange={(e) => update("jadwal_mulai", e.target.value)}
                className="input-field"
              />
            </Field>
            <Field label="Jadwal Berakhir">
              <input
                type="datetime-local"
                required
                value={form.jadwal_berakhir}
                onChange={(e) => update("jadwal_berakhir", e.target.value)}
                className="input-field"
              />
            </Field>
          </div>

          <Field label="Deskripsi Masalah">
            <textarea
              rows={2}
              value={form.deskripsi}
              onChange={(e) => update("deskripsi", e.target.value)}
              placeholder="Sebutkan detail instruksi persoalan..."
              className="input-field resize-y"
            />
          </Field>

          <Field label="Petunjuk Pengerjaan Soal (line-by-line)">
            <textarea
              rows={3}
              required
              value={form.instruksi}
              onChange={(e) => update("instruksi", e.target.value)}
              placeholder={"1. Buat class bernamakan Car...\n2. Jangan pakai built-in libraries..."}
              className="input-field resize-y"
            />
          </Field>

          <Field label="Template Starter Code">
            <textarea
              rows={4}
              value={form.starter_code}
              onChange={(e) => update("starter_code", e.target.value)}
              placeholder="// Tulis template kode starter di sini..."
              className="input-field resize-y font-mono text-emerald-700"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contoh Input Uji">
              <textarea
                rows={2}
                value={form.contoh_input}
                onChange={(e) => update("contoh_input", e.target.value)}
                placeholder="Contoh: Car('Toyota', 'Avanza')"
                className="input-field resize-y font-mono text-sm"
              />
            </Field>
            <Field label="Contoh Output Uji">
              <textarea
                rows={2}
                value={form.contoh_output}
                onChange={(e) => update("contoh_output", e.target.value)}
                placeholder="Contoh: { brand: 'Toyota', model: 'Avanza' }"
                className="input-field resize-y font-mono text-sm"
              />
            </Field>
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Sesi Praktikum"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
