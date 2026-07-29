import { API_BASE_URL } from "./authService";

export interface MonitorItem {
  id_peserta: number;
  nim: string;
  nama: string;
  status: "mengerjakan" | "selesai";
  praktikum: string;
  id_praktikum: number;
  waktu_mulai: string;
  total_pelanggaran: number;
  durasi_detik: number;
  update_terakhir: string;
}

export interface MonitorFilter {
  search?: string;
  idPraktikum?: number;
  status?: "mengerjakan" | "selesai";
}

export interface MonitorViolationItem {
  id: number;
  jenis_pelanggaran: string;
  waktu_terjadi: string;
}

export interface MonitorDetail {
  id_peserta: number;
  nim: string;
  nama: string;
  status: "mengerjakan" | "selesai";
  praktikum: string;
  bahasa: "javascript" | "typescript";
  kode: string;
  output_terakhir: string | null;
  total_pelanggaran: number;
  durasi_detik: number;
  violations: MonitorViolationItem[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Terjadi kesalahan pada server.");
  return data as T;
}

export async function fetchMonitorList(
  token: string,
  filter: MonitorFilter
): Promise<MonitorItem[]> {
  const params = new URLSearchParams();
  if (filter.search) params.set("search", filter.search);
  if (filter.idPraktikum) params.set("id_praktikum", String(filter.idPraktikum));
  if (filter.status) params.set("status", filter.status);

  const res = await fetch(`${API_BASE_URL}/api/admin/monitor?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<MonitorItem[]>(res);
}

export async function fetchMonitorDetail(token: string, id: number): Promise<MonitorDetail> {
  const res = await fetch(`${API_BASE_URL}/api/admin/monitor/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<MonitorDetail>(res);
}
