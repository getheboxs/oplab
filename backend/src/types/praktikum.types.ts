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

export interface PraktikumInput {
  judul: string;
  mata_kuliah: string;
  deskripsi?: string | null;
  bahasa: BahasaPemrograman;
  tingkat_kesulitan: TingkatKesulitan;
  instruksi: string;
  starter_code?: string | null;
  contoh_input?: string | null;
  contoh_output?: string | null;
  durasi_menit: number;
  kode_akses?: string | null;
  status?: StatusPraktikum;
  jadwal_mulai: string;
  jadwal_berakhir: string;
}
