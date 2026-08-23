import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, BookOpen, Code2 } from "lucide-react";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminTabs from "../../components/admin/AdminTabs";
import { useAuth } from "../../context/AuthContext";
import { fetchMonitorList, type MonitorItem } from "../../services/monitorService";
import { fetchPraktikumList, type Praktikum } from "../../services/praktikumService";

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

export default function MonitorPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<MonitorItem[]>([]);
  const [praktikumOptions, setPraktikumOptions] = useState<Praktikum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialPraktikum = searchParams.get("idPraktikum") || "semua";
  const [search, setSearch] = useState("");
  const [filterPraktikum, setFilterPraktikum] = useState(initialPraktikum);
  const [filterStatus, setFilterStatus] = useState("semua");

  useEffect(() => {
    const qPraktikum = searchParams.get("idPraktikum");
    if (qPraktikum && qPraktikum !== filterPraktikum) {
      setFilterPraktikum(qPraktikum);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    fetchPraktikumList(token)
      .then(setPraktikumOptions)
      .catch(() => undefined);
  }, [token]);

  const loadList = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMonitorList(token, {
        search: search.trim() || undefined,
        idPraktikum: filterPraktikum !== "semua" ? Number(filterPraktikum) : undefined,
        status: filterStatus !== "semua" ? (filterStatus as "mengerjakan" | "selesai") : undefined,
      });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data monitor.");
    } finally {
      setIsLoading(false);
    }
  }, [token, search, filterPraktikum, filterStatus]);

  useEffect(() => {
    const timeout = setTimeout(loadList, 300); // debounce pencarian
    return () => clearTimeout(timeout);
  }, [loadList]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader onRefresh={loadList} />
      <AdminTabs />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">            
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan Nama atau NIM..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterPraktikum}
            onChange={(e) => setFilterPraktikum(e.target.value)}
            className="input-field lg:w-64"
          >
            <option value="semua">Semua Soal</option>
            {praktikumOptions.map((p) => (
              <option key={p.id_praktikum} value={p.id_praktikum}>
                {p.judul}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field lg:w-56"
          >
            <option value="semua">Semua Status</option>
            <option value="mengerjakan">Sedang Mengerjakan</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400 shadow-card">
            Memuat data...
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400 shadow-card">
            Tidak ada peserta yang cocok dengan pencarian/filter.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id_peserta}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {item.nama}{" "}
                      <span className="font-mono text-sm font-normal text-slate-400">
                        ({item.nim})
                      </span>
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      {item.praktikum}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[11px] font-bold ${
                      item.status === "selesai"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-500"
                    }`}
                  >
                    {item.status === "selesai" ? "SUBMITTED" : "MENGERJAKAN"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-xs text-slate-400">Pelanggaran:</p>
                    <p
                      className={`font-mono font-bold ${
                        item.total_pelanggaran > 0 ? "text-amber-600" : "text-slate-700"
                      }`}
                    >
                      {item.total_pelanggaran} Kali
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Durasi:</p>
                    <p className="font-mono font-semibold text-slate-700">
                      {formatDurasi(item.durasi_detik)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Waktu Mulai:</p>
                    <p className="font-mono text-sm text-slate-700">{formatJam(item.waktu_mulai)}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Update terakhir: {formatJam(item.update_terakhir)}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/monitor/${item.id_peserta}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    <Code2 className="h-4 w-4" />
                    Lihat Pekerjaan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
