import { API_BASE_URL } from "./authService";

export type BahasaPemrograman = "javascript" | "typescript";
export type TingkatKesulitan = "mudah" | "sedang" | "sulit";

export interface PraktikumAktif {
  id_praktikum: number;
  judul: string;
  mata_kuliah: string;
  deskripsi: string | null;
  instruksi: string;
  starter_code: string | null;
  contoh_input: string | null;
  contoh_output: string | null;
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

export async function recordViolation(idPeserta: number, jenisPelanggaran: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/public/peserta/${idPeserta}/violation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jenis_pelanggaran: jenisPelanggaran }),
    });
  } catch {
    // pencatatan pelanggaran bersifat best-effort; abaikan bila gagal terkirim
  }
}

export async function submitPraktikum(
  idPeserta: number,
  kodeProgram: string,
  submitType: "manual" | "auto"
): Promise<{ waktu_submit: string }> {
  const res = await fetch(`${API_BASE_URL}/api/public/peserta/${idPeserta}/submission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kode_program: kodeProgram, submit_type: submitType }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "Gagal mengirim praktikum.");
  }
  return data;
}
