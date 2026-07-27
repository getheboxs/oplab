import { API_BASE_URL } from "./authService";

export interface RekapItem {
  id_peserta: number;
  nim: string;
  nama: string;
  praktikum: string;
  waktu_mulai: string;
  jumlah_pelanggaran: number;
  durasi_detik: number;
  status: "mengerjakan" | "selesai";
}

export interface RekapFilter {
  idPraktikum?: number;
  status?: "mengerjakan" | "selesai";
}

export async function fetchRekap(token: string, filter: RekapFilter): Promise<RekapItem[]> {
  const params = new URLSearchParams();
  if (filter.idPraktikum) params.set("id_praktikum", String(filter.idPraktikum));
  if (filter.status) params.set("status", filter.status);

  const res = await fetch(`${API_BASE_URL}/api/admin/rekap?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "Gagal memuat data rekapitulasi.");
  }
  return data as RekapItem[];
}
