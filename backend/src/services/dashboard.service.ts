import {
  countMahasiswaAktif,
  countSelesaiSubmit,
  countTotalPeserta,
  countPesertaDenganPelanggaran,
  avgDurasiSelesaiDetik,
  findPelanggaranTerbaru,
} from "../models/dashboard.model.js";
import { findActivePraktikum } from "../models/praktikum.model.js";

export interface DashboardSummary {
  mahasiswaAktif: number;
  selesaiSubmit: number;
  tingkatPelanggaranPersen: number;
  durasiRataRataMenit: number;
  pelanggaranTerbaru: {
    id: number;
    nim: string;
    nama: string;
    jenisPelanggaran: string;
    waktuTerjadi: string;
  }[];
  sesiAktif: {
    id_praktikum: number;
    judul: string;
    mata_kuliah: string;
    kode_akses: string;
    durasi_menit: number;
    deskripsi: string | null;
    bahasa: string;
  } | null;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    mahasiswaAktif,
    selesaiSubmit,
    totalPeserta,
    pesertaDenganPelanggaran,
    rataRataDetik,
    pelanggaranTerbaruRows,
    praktikumAktif,
  ] = await Promise.all([
    countMahasiswaAktif(),
    countSelesaiSubmit(),
    countTotalPeserta(),
    countPesertaDenganPelanggaran(),
    avgDurasiSelesaiDetik(),
    findPelanggaranTerbaru(20),
    findActivePraktikum(),
  ]);

  const tingkatPelanggaranPersen =
    totalPeserta > 0 ? Math.round((pesertaDenganPelanggaran / totalPeserta) * 100) : 0;

  const durasiRataRataMenit = rataRataDetik ? Math.round(rataRataDetik / 60) : 0;

  return {
    mahasiswaAktif,
    selesaiSubmit,
    tingkatPelanggaranPersen,
    durasiRataRataMenit,
    pelanggaranTerbaru: pelanggaranTerbaruRows.map((row) => ({
      id: row.id_violation,
      nim: row.nim,
      nama: row.nama,
      jenisPelanggaran: row.jenis_pelanggaran,
      waktuTerjadi: row.waktu_terjadi,
    })),
    sesiAktif: praktikumAktif
      ? {
          id_praktikum: praktikumAktif.id_praktikum,
          judul: praktikumAktif.judul,
          mata_kuliah: praktikumAktif.mata_kuliah,
          kode_akses: praktikumAktif.kode_akses,
          durasi_menit: praktikumAktif.durasi_menit,
          deskripsi: praktikumAktif.deskripsi,
          bahasa: praktikumAktif.bahasa,
        }
      : null,
  };
}
