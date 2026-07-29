import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminHeader from "../../components/admin/AdminHeader";
import { useAuth } from "../../context/AuthContext";
import { fetchMonitorDetail, type MonitorDetail } from "../../services/monitorService";
import { getViolationMeta } from "../../utils/violationLabels";

function formatDurasi(detik: number) {
  const menit = Math.floor(detik / 60);
  const sisaDetik = detik % 60;
  return `${menit}m ${sisaDetik}d`;
}

function formatJam(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

export default function MonitorDetailPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [detail, setDetail] = useState<MonitorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    setIsLoading(true);
    setError(null);
    fetchMonitorDetail(token, Number(id))
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat detail."))
      .finally(() => setIsLoading(false));
  }, [token, id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <button
          type="button"
          onClick={() => navigate("/admin/monitor")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Monitor
        </button>

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400 shadow-card">
            Memuat detail...
          </div>
        ) : error || !detail ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error ?? "Data tidak ditemukan."}
          </div>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:flex-row sm:items-center">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  Pekerjaan: {detail.nama}{" "}
                  <span className="font-mono text-base font-normal text-slate-400">
                    ({detail.nim})
                  </span>
                </h1>
                <p className="mt-1 text-sm text-slate-500">{detail.praktikum}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/monitor")}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Tutup Detail
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-card">
                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
                    <p className="text-sm font-semibold text-slate-200">Kode Di-autosave Mahasiswa</p>
                    <span className="font-mono text-xs font-bold uppercase text-brand-400">
                      {detail.bahasa}
                    </span>
                  </div>
                  <pre className="max-h-[420px] overflow-auto px-5 py-4 font-mono text-sm text-emerald-400">
                    {detail.kode || "// Mahasiswa belum menulis kode apa pun."}
                  </pre>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-card">
                  <div className="border-b border-slate-800 px-5 py-3">
                    <p className="text-sm font-semibold text-slate-200">Hasil Running Code Terakhir</p>
                  </div>
                  <pre className="max-h-[200px] overflow-auto px-5 py-4 font-mono text-sm text-slate-300">
                    {detail.output_terakhir || "Belum pernah menjalankan kode."}
                  </pre>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    Statistik Integritas
                  </p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Total Pelanggaran:</dt>
                      <dd className="font-mono font-bold text-amber-600">
                        {detail.total_pelanggaran} Kali
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Durasi Terpakai:</dt>
                      <dd className="font-mono font-bold text-slate-800">
                        {formatDurasi(detail.durasi_detik)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Status Penyelesaian:</dt>
                      <dd>
                        <span
                          className={`rounded-md px-2 py-1 font-mono text-[11px] font-bold ${
                            detail.status === "selesai"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-500"
                          }`}
                        >
                          {detail.status === "selesai" ? "SELESAI" : "MENGERJAKAN"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    Riwayat Pelanggaran Browser
                  </p>

                  {detail.violations.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-400">Tidak ada pelanggaran tercatat.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {detail.violations.map((v) => {
                        const meta = getViolationMeta(v.jenis_pelanggaran);
                        return (
                          <li key={v.id} className="rounded-xl border border-slate-100 p-3">
                            <div className="flex items-center justify-between">
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700">
                                {meta.badge}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {formatJam(v.waktu_terjadi)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-slate-600">{meta.description}</p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
