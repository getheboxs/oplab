import { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  AlertTriangle,
  Timer,
  AlertCircle,
  ClipboardCheck,
} from "lucide-react";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminTabs from "../../components/admin/AdminTabs";
import StatCard from "../../components/admin/StatCard";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboardSummary, type DashboardSummary } from "../../services/dashboardService";
import { getViolationMeta } from "../../utils/violationLabels";

function formatJam(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary(token);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat ringkasan statistik.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader onRefresh={loadSummary} />
      <AdminTabs />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Mahasiswa Aktif"
            value={isLoading ? "-" : String(summary?.mahasiswaAktif ?? 0)}
            caption="Sedang menulis kode saat ini"
            accent="rose"
            captionTone="danger"
          />
          <StatCard
            icon={UserCheck}
            label="Selesai Submit"
            value={isLoading ? "-" : String(summary?.selesaiSubmit ?? 0)}
            caption="Sudah menyelesaikan praktikum"
            accent="emerald"
          />
          <StatCard
            icon={AlertTriangle}
            label="Tingkat Pelanggaran"
            value={isLoading ? "-" : `${summary?.tingkatPelanggaranPersen ?? 0}%`}
            caption="Persentase peserta melanggar aturan"
            accent="amber"
          />
          <StatCard
            icon={Timer}
            label="Durasi Rata-rata"
            value={isLoading ? "-" : `${summary?.durasiRataRataMenit ?? 0} Menit`}
            caption="Rata-rata waktu penyelesaian"
            accent="violet"
          />
        </section>

        {/* Panels */}
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Aktivitas Pelanggaran Terbaru */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Aktivitas Pelanggaran Terbaru
                </h2>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-500">
                Real-Time
              </span>
            </div>

            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
                Memuat data...
              </div>
            ) : !summary || summary.pelanggaranTerbaru.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center px-6 py-16 text-center">
                <p className="max-w-xs text-sm text-slate-400">
                  Luar biasa! Belum ada pelanggaran browser yang tercatat saat ini.
                </p>
              </div>
            ) : (
              <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                {summary.pelanggaranTerbaru.map((item) => {
                  const meta = getViolationMeta(item.jenisPelanggaran);
                  return (
                    <li key={item.id} className="flex items-start justify-between gap-4 px-6 py-4">
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="font-bold text-slate-900">{item.nama}</span>{" "}
                          <span className="font-mono text-xs text-slate-400">
                            NIM: {item.nim}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block rounded-md bg-amber-50 px-2 py-1 font-mono text-[10px] font-bold text-amber-700">
                          {meta.badge}
                        </span>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          {formatJam(item.waktuTerjadi)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Sesi Praktikum Aktif */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <ClipboardCheck className="h-4 w-4 text-brand-600" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
                Sesi Praktikum Aktif
              </h2>
            </div>

            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
                Memuat data...
              </div>
            ) : !summary?.sesiAktif ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <p className="max-w-xs text-sm text-slate-500">
                  Tidak ada sesi praktikum yang sedang diaktifkan.
                </p>
                <p className="max-w-xs text-xs text-slate-400">
                  Aktifkan salah satu soal di menu Manajemen Praktikum.
                </p>
              </div>
            ) : (
              <div className="px-6 py-5">
                <span className="inline-block rounded-full bg-brand-50 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase text-brand-600">
                  {summary.sesiAktif.mata_kuliah}
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {summary.sesiAktif.judul}
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="font-mono text-[10px] uppercase text-slate-400">Kode Akses:</p>
                    <p className="font-mono font-bold text-brand-700">
                      {summary.sesiAktif.kode_akses}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="font-mono text-[10px] uppercase text-slate-400">Timer:</p>
                    <p className="font-mono font-bold text-slate-800">
                      {summary.sesiAktif.durasi_menit} Menit
                    </p>
                  </div>
                </div>

                {summary.sesiAktif.deskripsi && (
                  <p className="mt-4 line-clamp-3 text-sm text-slate-500">
                    {summary.sesiAktif.deskripsi}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">
                    Bahasa:{" "}
                    <span className="font-mono font-semibold text-brand-600">
                      {summary.sesiAktif.bahasa === "javascript" ? "JAVASCRIPT" : "TYPESCRIPT"}
                    </span>
                  </span>
                  <span
                    title="Segera hadir"
                    className="cursor-not-allowed font-semibold text-slate-300"
                  >
                    Buka Monitor Live &rarr;
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
