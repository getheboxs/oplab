import { API_BASE_URL } from "./authService";

export interface PelanggaranTerbaru {
  id: number;
  nim: string;
  nama: string;
  jenisPelanggaran: string;
  waktuTerjadi: string;
}

export interface SesiAktif {
  id_praktikum: number;
  judul: string;
  mata_kuliah: string;
  kode_akses: string;
  durasi_menit: number;
  deskripsi: string | null;
  bahasa: string;
}

export interface DashboardSummary {
  mahasiswaAktif: number;
  selesaiSubmit: number;
  tingkatPelanggaranPersen: number;
  durasiRataRataMenit: number;
  pelanggaranTerbaru: PelanggaranTerbaru[];
  sesiAktif: SesiAktif | null;
}

export async function fetchDashboardSummary(token: string): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/api/admin/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "Gagal memuat ringkasan statistik.");
  }
  return data as DashboardSummary;
}
