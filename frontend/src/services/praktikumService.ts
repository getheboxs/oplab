import { API_BASE_URL } from "./authService";

export type BahasaPemrograman = "javascript" | "typescript";
export type TingkatKesulitan = "mudah" | "sedang" | "sulit";
export type StatusPraktikum = "aktif" | "nonaktif";

export interface Praktikum {
  id_praktikum: number;
  id_admin: number;
  judul: string;
  mata_kuliah: string;
  deskripsi: string | null;
  bahasa: BahasaPemrograman;
  tingkat_kesulitan: TingkatKesulitan;
  instruksi: string;
  starter_code: string | null;
  contoh_input: string | null;
  contoh_output: string | null;
  durasi_menit: number;
  kode_akses: string;
  status: StatusPraktikum;
  jadwal_mulai: string;
  jadwal_berakhir: string;
  created_at: string;
  updated_at: string;
}

export interface PraktikumFormValues {
  judul: string;
  mata_kuliah: string;
  deskripsi: string;
  bahasa: BahasaPemrograman;
  tingkat_kesulitan: TingkatKesulitan;
  instruksi: string;
  starter_code: string;
  contoh_input: string;
  contoh_output: string;
  durasi_menit: number;
  kode_akses: string;
  status: StatusPraktikum;
  jadwal_mulai: string;
  jadwal_berakhir: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? "Terjadi kesalahan pada server.");
  }
  return data as T;
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchPraktikumList(token: string): Promise<Praktikum[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/praktikum`, {
    headers: authHeaders(token),
  });
  return handleResponse<Praktikum[]>(res);
}

export async function createPraktikum(
  token: string,
  values: PraktikumFormValues
): Promise<Praktikum> {
  const res = await fetch(`${API_BASE_URL}/api/admin/praktikum`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(values),
  });
  return handleResponse<Praktikum>(res);
}

export async function updatePraktikum(
  token: string,
  id: number,
  values: PraktikumFormValues
): Promise<Praktikum> {
  const res = await fetch(`${API_BASE_URL}/api/admin/praktikum/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(values),
  });
  return handleResponse<Praktikum>(res);
}

export async function updatePraktikumStatus(
  token: string,
  id: number,
  status: StatusPraktikum
): Promise<Praktikum> {
  const res = await fetch(`${API_BASE_URL}/api/admin/praktikum/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  return handleResponse<Praktikum>(res);
}

export async function deletePraktikum(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/praktikum/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return handleResponse<void>(res);
}
