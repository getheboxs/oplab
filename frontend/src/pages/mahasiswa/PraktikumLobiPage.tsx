import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, User, BookOpen, AlertCircle } from "lucide-react";
import {
  fetchPraktikumAktif,
  registerPeserta,
  type PraktikumAktif,
} from "../../services/publicPraktikumService";
import SafeModeWarningModal from "../../components/mahasiswa/SafeModeWarningModal";

const tingkatLabel: Record<string, string> = {
  mudah: "Pemula",
  sedang: "Menengah",
  sulit: "Mahir",
};

export default function PraktikumLobiPage() {
  const navigate = useNavigate();
  const [praktikum, setPraktikum] = useState<PraktikumAktif | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [kodeAkses, setKodeAkses] = useState("");
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");

  const [warningOpen, setWarningOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchPraktikumAktif()
      .then((data) => {
        setPraktikum(data);
        if (data) setKodeAkses(data.kode_akses);
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Gagal memuat praktikum aktif.")
      )
      .finally(() => setIsLoading(false));
  }, []);

  function handleOpenWarning(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setWarningOpen(true);
  }

  async function handleConfirmStart() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await registerPeserta({ kode_akses: kodeAkses, nim, nama });

      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen().catch(() => {
          /* jika ditolak browser, tetap lanjut — akan tercatat sebagai pelanggaran nantinya */
        });
      }

      // NOTE: halaman editor kode praktikum belum dibuat — ditangani pada tahap berikutnya.
      navigate("/praktikum/mulai", { state: { id_peserta: result.id_peserta } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal memulai praktikum.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Lobi
          </button>
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            Portal Mahasiswa
            <span className="h-2 w-2 rounded-full bg-brand-500" />
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-400">
            Memuat praktikum aktif...
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        ) : !praktikum ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-card">
            <AlertCircle className="h-6 w-6 text-slate-300" />
            <p className="text-sm text-slate-500">
              Tidak ada praktikum yang sedang aktif saat ini. Silakan hubungi dosen atau asisten
              laboratorium Anda.
            </p>
          </div>
        ) : (
          <>
            {/* Info praktikum aktif */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {praktikum.mata_kuliah}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                  Aktif Sekarang
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{praktikum.judul}</h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
                  Bahasa:{" "}
                  <span className="font-mono font-semibold text-sky-600">
                    {praktikum.bahasa === "javascript" ? "JAVASCRIPT" : "TYPESCRIPT"}
                  </span>
                </span>
                <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
                  Waktu:{" "}
                  <span className="font-semibold text-slate-700">
                    {praktikum.durasi_menit} Menit
                  </span>
                </span>
                <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
                  Kesulitan:{" "}
                  <span className="font-semibold text-emerald-600">
                    {tingkatLabel[praktikum.tingkat_kesulitan] ?? praktikum.tingkat_kesulitan}
                  </span>
                </span>
              </div>
            </div>

            {/* Form registrasi */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-xl font-extrabold text-slate-900">Registrasi Praktikum</h2>
              <p className="mt-1 text-sm text-slate-500">
                Silakan masukkan NIM, nama lengkap, dan kode akses praktikum untuk mengakses
                lembar editor kode Anda.
              </p>

              <form onSubmit={handleOpenWarning} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <KeyRound className="h-3.5 w-3.5" />
                    Kode Akses Praktikum
                  </span>
                  <input
                    type="text"
                    required
                    value={kodeAkses}
                    onChange={(e) => setKodeAkses(e.target.value.toUpperCase())}
                    className="input-field font-mono uppercase"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" />
                    Nomor Induk Mahasiswa (NIM)
                  </span>
                  <input
                    type="text"
                    required
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Contoh: 2209106042"
                    className="input-field"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    Nama Lengkap Anda
                  </span>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Siti Rahmawati"
                    className="input-field"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
                >
                  Mulai Praktikum Sekarang
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Aplikasi memantau aktivitas Fullscreen dan Visibilitas browser Anda selama
              pengerjaan.
            </p>
          </>
        )}
      </main>

      <SafeModeWarningModal
        open={warningOpen}
        isSubmitting={isSubmitting}
        errorMessage={submitError}
        onConfirm={handleConfirmStart}
        onCancel={() => setWarningOpen(false)}
      />
    </div>
  );
}
