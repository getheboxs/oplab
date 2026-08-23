import { pool } from "../config/db.js";

interface CountRow {
  total: number;
}
interface AvgRow {
  rata_rata_detik: number | null;
}
export interface PelanggaranTerbaruRow {
  id_violation: number;
  nim: string;
  nama: string;
  jenis_pelanggaran: string;
  waktu_terjadi: string;
}

export async function countMahasiswaAktif(): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    "SELECT COUNT(*) AS total FROM peserta WHERE status = 'mengerjakan'"
  );
  return Number(rows[0]?.total ?? 0);
}

export async function countSelesaiSubmit(): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    "SELECT COUNT(*) AS total FROM peserta WHERE status = 'selesai'"
  );
  return Number(rows[0]?.total ?? 0);
}

export async function countTotalPeserta(): Promise<number> {
  const [rows] = await pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM peserta");
  return Number(rows[0]?.total ?? 0);
}

export async function countPesertaDenganPelanggaran(): Promise<number> {
  const [rows] = await pool.query<CountRow[]>(
    "SELECT COUNT(DISTINCT id_peserta) AS total FROM violation_log"
  );
  return Number(rows[0]?.total ?? 0);
}

export async function avgDurasiSelesaiDetik(): Promise<number> {
  const [rows] = await pool.query<AvgRow[]>(
    `SELECT AVG(s.durasi_pengerjaan_detik) AS rata_rata_detik
     FROM submission s
     INNER JOIN peserta p ON p.id_peserta = s.id_peserta
     WHERE p.status = 'selesai' AND s.durasi_pengerjaan_detik IS NOT NULL`
  );
  return Number(rows[0]?.rata_rata_detik ?? 0);
}

export async function findPelanggaranTerbaru(limit: number): Promise<PelanggaranTerbaruRow[]> {
  const [rows] = await pool.query<PelanggaranTerbaruRow[]>(
    `SELECT vl.id_violation, p.nim, p.nama, vl.jenis_pelanggaran, vl.waktu_terjadi
     FROM violation_log vl
     INNER JOIN peserta p ON p.id_peserta = vl.id_peserta
     ORDER BY vl.waktu_terjadi DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}
