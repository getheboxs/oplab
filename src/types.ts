export interface Praktikum {
  id: string;
  judul: string;
  mataKuliah: string;
  deskripsi: string;
  bahasa: 'javascript' | 'typescript';
  tingkatKesulitan: 'pemula' | 'menengah' | 'mahir';
  instruksi: string;
  starterCode: string;
  contohInput: string;
  contohOutput: string;
  timer: number; // in minutes
  accessCode: string;
  isActive: boolean;
  jadwalMulai: string;
  jadwalBerakhir: string;
}

export interface Peserta {
  id: string;
  nim: string;
  nama: string;
  praktikumId: string;
  waktuMulai: string;
  waktuSelesai: string | null;
  durasi: number; // in seconds
  status: 'sedang_mengerjakan' | 'selesai';
  jumlahPelanggaran: number;
}

export interface Submission {
  id: string;
  pesertaId: string;
  praktikumId: string;
  kode: string;
  output: string;
  status: 'draft' | 'submitted';
  submittedAt: string | null;
}

export interface ViolationLog {
  id: string;
  pesertaId: string;
  jenis: 'exit_fullscreen' | 'switch_tab' | 'lose_focus' | 'blocked_key' | 'blocked_mouse';
  waktu: string;
  deskripsi: string;
}

export interface ActivityLog {
  id: string;
  pesertaId: string;
  tipe: string;
  waktu: string;
  deskripsi: string;
}

export interface AdminStats {
  activeStudentsCount: number;
  completedStudentsCount: number;
  averageDuration: number; // in minutes
  violationRate: number; // percentage of students with at least 1 violation
}
