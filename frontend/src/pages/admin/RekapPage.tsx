import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminTabs from "../../components/admin/AdminTabs";
import { useAuth } from "../../context/AuthContext";
import { fetchRekap, type RekapItem } from "../../services/rekapService";
import { fetchPraktikumList, type Praktikum } from "../../services/praktikumService";

function formatWaktuMulai(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function formatDurasi(detik: number | null | undefined) {
  const d = Number(detik) || 0;
  const menit = Math.floor(d / 60);
  const sisaDetik = d % 60;
  return `${menit}m ${sisaDetik}d`;
}

function statusLabel(status: string | null | undefined) {
  if (!status) return "-";
  return status === "selesai" ? "SELESAI" : "SEDANG_MENGERJAKAN";
}

/**
 * Format string/nilai ke dalam cell murni tanpa tanda petik ganda di awal & akhir.
 * Membersihkan karakter pemisah agar tiap data masuk ke 1 cell tersendiri.
 */
function toCleanCell(value: unknown, delimiter = ";"): string {
  if (value === null || value === undefined) {
    return "";
  }
  let text = String(value).trim();
  // Hilangkan tanda petik ganda
  text = text.replace(/"/g, "");
  // Ganti delimiter internal agar cell tidak terbelah tidak sengaja
  if (delimiter === ";") {
    text = text.replace(/;/g, " - ");
  } else if (delimiter === ",") {
    text = text.replace(/,/g, " - ");
  }
  // Ganti baris baru menjadi spasi
  text = text.replace(/[\r\n]+/g, " ");
  return text;
}

export default function RekapPage() {
  const { token } = useAuth();
  const [praktikumOptions, setPraktikumOptions] = useState<Praktikum[]>([]);
  const [rekap, setRekap] = useState<RekapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterPraktikum, setFilterPraktikum] = useState<string>("semua");
  const [filterStatus, setFilterStatus] = useState<string>("semua");

  useEffect(() => {
    if (!token) return;
    fetchPraktikumList(token)
      .then(setPraktikumOptions)
      .catch(() => {
        /* daftar filter opsional; abaikan bila gagal */
      });
  }, [token]);

  const loadRekap = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRekap(token, {
        idPraktikum: filterPraktikum !== "semua" ? Number(filterPraktikum) : undefined,
        status: filterStatus !== "semua" ? (filterStatus as "mengerjakan" | "selesai") : undefined,
      });
      setRekap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data rekapitulasi.");
    } finally {
      setIsLoading(false);
    }
  }, [token, filterPraktikum, filterStatus]);

  useEffect(() => {
    loadRekap();
  }, [loadRekap]);

  const praktikumTerpilihLabel = useMemo(() => {
    if (filterPraktikum === "semua") return "semua-soal";
    const found = praktikumOptions.find((p) => String(p.id_praktikum) === filterPraktikum);
    return found ? found.judul.replace(/\s+/g, "-").toLowerCase() : "praktikum";
  }, [filterPraktikum, praktikumOptions]);

  function handleDownloadCsv() {
    const activeDelim = ";";
    const headers = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      "Praktikum / Mata Kuliah",
      "Waktu Mulai",
      "Jumlah Pelanggaran",
      "Durasi Pengerjaan",
      "Status",
    ];

    const rows = rekap.map((item, idx) => [
      idx + 1,
      item.nim ?? "",
      item.nama ?? "",
      item.praktikum ?? "",
      formatWaktuMulai(item.waktu_mulai),
      item.jumlah_pelanggaran !== undefined && item.jumlah_pelanggaran !== null
        ? `${item.jumlah_pelanggaran} Kali`
        : "0 Kali",
      formatDurasi(item.durasi_detik),
      statusLabel(item.status),
    ]);

    // Format setiap baris bersih tanpa tanda petik ganda
    const csvLines = [
      headers.map((h) => toCleanCell(h, activeDelim)).join(activeDelim),
      ...rows.map((row) => row.map((cell) => toCleanCell(cell, activeDelim)).join(activeDelim)),
    ];

    const csvContent = csvLines.join("\r\n");

    // Tambahkan UTF-8 BOM (\uFEFF) agar terbaca rapi di Microsoft Excel, LibreOffice, dan Google Sheets
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const statusPart = filterStatus === "semua" ? "semua-status" : filterStatus;
    link.href = url;
    link.download = `rekap-oplab_${praktikumTerpilihLabel}_${statusPart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader onRefresh={loadRekap} />
      <AdminTabs />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Unduh Hasil Praktikum</h1>
              <p className="mt-1 text-sm text-slate-500">
                Ekspor seluruh rekapitulasi data mahasiswa yang mencakup durasi pengerjaan, status,
                dan riwayat pelanggaran ke dalam format spreadsheet CSV.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={rekap.length === 0}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Unduh File CSV (.csv)
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
            <select
              value={filterPraktikum}
              onChange={(e) => setFilterPraktikum(e.target.value)}
              className="input-field sm:w-64"
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
              className="input-field sm:w-56"
            >
              <option value="semua">Semua Status</option>
              <option value="mengerjakan">Sedang Mengerjakan</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                <th className="w-12 px-4 py-4 font-semibold text-center">No</th>
                <th className="px-5 py-4 font-semibold">NIM</th>
                <th className="px-5 py-4 font-semibold">Nama Mahasiswa</th>
                <th className="px-5 py-4 font-semibold">Praktikum</th>
                <th className="px-5 py-4 font-semibold">Waktu Mulai</th>
                <th className="px-5 py-4 font-semibold">Pelanggaran</th>
                <th className="px-5 py-4 font-semibold">Durasi</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : rekap.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Belum ada data peserta untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                rekap.map((item, index) => (
                  <tr key={item.id_peserta} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-mono text-xs text-slate-400 text-center">{index + 1}</td>
                    <td className="px-5 py-4 font-mono text-slate-600">{item.nim}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{item.nama}</td>
                    <td className="max-w-[220px] truncate px-5 py-4 text-slate-600" title={item.praktikum}>
                      {item.praktikum}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {formatWaktuMulai(item.waktu_mulai)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-mono font-bold ${
                          item.jumlah_pelanggaran > 0 ? "text-amber-600" : "text-slate-300"
                        }`}
                      >
                        {item.jumlah_pelanggaran} Kali
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {formatDurasi(item.durasi_detik)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md px-2 py-1 font-mono text-[11px] font-bold ${
                          item.status === "selesai"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-500"
                        }`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
