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

// NOTE: nilai statistik di bawah ini masih placeholder (empty state).
// Akan dihubungkan ke endpoint ringkasan statistik backend
// (mis. GET /api/admin/dashboard/summary) pada tahap berikutnya.
const summary = {
  mahasiswaAktif: 0,
  selesaiSubmit: 0,
  tingkatPelanggaran: 0,
  durasiRataRata: 0,
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <AdminTabs />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stat cards */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Mahasiswa Aktif"
            value={String(summary.mahasiswaAktif)}
            caption="Sedang menulis kode saat ini"
            accent="rose"
            captionTone="danger"
          />
          <StatCard
            icon={UserCheck}
            label="Selesai Submit"
            value={String(summary.selesaiSubmit)}
            caption="Sudah menyelesaikan praktikum"
            accent="emerald"
          />
          <StatCard
            icon={AlertTriangle}
            label="Tingkat Pelanggaran"
            value={`${summary.tingkatPelanggaran}%`}
            caption="Persentase peserta melanggar aturan"
            accent="amber"
          />
          <StatCard
            icon={Timer}
            label="Durasi Rata-rata"
            value={`${summary.durasiRataRata} Menit`}
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

            <div className="flex min-h-[280px] items-center justify-center px-6 py-16 text-center">
              <p className="max-w-xs text-sm text-slate-400">
                Luar biasa! Belum ada pelanggaran browser yang tercatat saat ini.
              </p>
            </div>
          </div>

          {/* Sesi Praktikum Aktif */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <ClipboardCheck className="h-4 w-4 text-brand-600" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
                Sesi Praktikum Aktif
              </h2>
            </div>

            <div className="flex min-h-[280px] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
              <p className="max-w-xs text-sm text-slate-500">
                Tidak ada sesi praktikum yang sedang diaktifkan.
              </p>
              <button
                type="button"
                title="Segera hadir — Manajemen Praktikum"
                disabled
                className="cursor-not-allowed rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white opacity-60"
              >
                Aktifkan Soal Sekarang
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
