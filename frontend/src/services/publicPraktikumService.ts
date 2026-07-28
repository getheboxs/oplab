import { API_BASE_URL } from "./authService";

export type BahasaPemrograman = "javascript" | "typescript";
export type TingkatKesulitan = "mudah" | "sedang" | "sulit";

export interface PraktikumAktif {
  id_praktikum: number;
  judul: string;
  mata_kuliah: string;
  bahasa: BahasaPemrograman;
  tingkat_kesulitan: TingkatKesulitan;
  durasi_menit: number;
  kode_akses: string;
  jadwal_berakhir: string;
}

export interface RegisterPesertaInput {
  kode_akses: string;
  nim: string;
  nama: string;
}

export interface RegisterPesertaResult {
  id_peserta: number;
  waktu_mulai: string;
  praktikum: PraktikumAktif;
}

export async function fetchPraktikumAktif(): Promise<PraktikumAktif | null> {
  const res = await fetch(`${API_BASE_URL}/api/public/praktikum/aktif`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "Gagal memuat praktikum aktif.");
  }
  return data as PraktikumAktif | null;
}

export async function registerPeserta(
  input: RegisterPesertaInput
): Promise<RegisterPesertaResult> {
  const res = await fetch(`${API_BASE_URL}/api/public/peserta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "Gagal memulai praktikum.");
  }
  return data as RegisterPesertaResult;
}
