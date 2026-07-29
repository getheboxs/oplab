export interface Peserta {
  id_peserta: number;
  id_praktikum: number;
  nim: string;
  nama: string;
  waktu_mulai: string;
  waktu_selesai: string | null;
  status: "mengerjakan" | "selesai";
}

export interface PraktikumPublic {
  id_praktikum: number;
  judul: string;
  mata_kuliah: string;
  deskripsi: string | null;
  instruksi: string;
  starter_code: string | null;
  contoh_input: string | null;
  contoh_output: string | null;
  bahasa: "javascript" | "typescript";
  tingkat_kesulitan: "mudah" | "sedang" | "sulit";
  durasi_menit: number;
  kode_akses: string;
  jadwal_berakhir: string;
}
