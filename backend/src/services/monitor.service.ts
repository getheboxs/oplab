import { AppError } from "../utils/AppError.js";
import {
  findMonitorList,
  findMonitorDetail,
  findSubmissionByPeserta,
  findViolationsByPeserta,
  type MonitorFilter,
} from "../models/monitor.model.js";

function computeDurasiDetik(waktuMulai: string, waktuSelesai: string | null): number {
  const mulai = new Date(waktuMulai).getTime();
  const akhir = waktuSelesai ? new Date(waktuSelesai).getTime() : Date.now();
  return Math.max(0, Math.round((akhir - mulai) / 1000));
}

export async function getMonitorList(filter: MonitorFilter) {
  const rows = await findMonitorList(filter);
  return rows.map((row) => ({
    id_peserta: row.id_peserta,
    nim: row.nim,
    nama: row.nama,
    status: row.status,
    praktikum: row.praktikum_judul,
    id_praktikum: row.id_praktikum,
    waktu_mulai: row.waktu_mulai,
    total_pelanggaran: row.total_pelanggaran,
    durasi_detik: computeDurasiDetik(row.waktu_mulai, row.waktu_selesai),
    update_terakhir: row.kode_updated_at ?? row.waktu_mulai,
  }));
}

export async function getMonitorDetail(idPeserta: number) {
  const peserta = await findMonitorDetail(idPeserta);
  if (!peserta) throw new AppError("Peserta tidak ditemukan.", 404);

  const [submission, violations] = await Promise.all([
    findSubmissionByPeserta(idPeserta),
    findViolationsByPeserta(idPeserta),
  ]);

  const kodeTampil = submission?.kode_program ?? peserta.kode_terkini ?? "";
  const durasiDetik =
    peserta.status === "selesai" && submission?.durasi_pengerjaan_detik != null
      ? submission.durasi_pengerjaan_detik
      : computeDurasiDetik(peserta.waktu_mulai, peserta.waktu_selesai);

  return {
    id_peserta: peserta.id_peserta,
    nim: peserta.nim,
    nama: peserta.nama,
    status: peserta.status,
    praktikum: peserta.praktikum_judul,
    bahasa: peserta.bahasa,
    kode: kodeTampil,
    output_terakhir: peserta.output_terakhir,
    total_pelanggaran: peserta.total_pelanggaran,
    durasi_detik: durasiDetik,
    violations: violations.map((v) => ({
      id: v.id_violation,
      jenis_pelanggaran: v.jenis_pelanggaran,
      waktu_terjadi: v.waktu_terjadi,
    })),
  };
}
