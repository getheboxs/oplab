import mysql, { Pool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// In-Memory Database Store as fallback when real MySQL database is not connected
interface AdminRecord {
  id_admin: number;
  username: string;
  password_hash: string;
  nama_lengkap: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

interface PraktikumRecord {
  id_praktikum: number;
  id_admin: number;
  judul: string;
  mata_kuliah: string;
  deskripsi: string | null;
  bahasa: "javascript" | "typescript";
  tingkat_kesulitan: "mudah" | "sedang" | "sulit";
  instruksi: string;
  starter_code: string | null;
  contoh_input: string | null;
  contoh_output: string | null;
  durasi_menit: number;
  kode_akses: string;
  status: "aktif" | "nonaktif";
  jadwal_mulai: string;
  jadwal_berakhir: string;
  created_at: string;
  updated_at: string;
}

interface PesertaRecord {
  id_peserta: number;
  id_praktikum: number;
  nim: string;
  nama: string;
  waktu_mulai: string;
  waktu_selesai: string | null;
  status: "mengerjakan" | "selesai";
  kode_terkini: string | null;
  output_terakhir: string | null;
  kode_updated_at: string | null;
  created_at: string;
}

interface SubmissionRecord {
  id_submission: number;
  id_peserta: number;
  kode_program: string;
  waktu_submit: string;
  durasi_pengerjaan_detik: number | null;
  submit_type: "manual" | "auto";
  created_at: string;
}

interface ViolationRecord {
  id_violation: number;
  id_peserta: number;
  jenis_pelanggaran: string;
  keterangan: string | null;
  waktu_terjadi: string;
}

interface ActivityRecord {
  id_activity: number;
  id_peserta: number;
  jenis_aktivitas: string;
  keterangan: string | null;
  waktu_terjadi: string;
}

const memoryStore = {
  admins: [
    {
      id_admin: 1,
      username: "admin",
      // Bcrypt hash for "admin123"
      password_hash: "$2a$10$RUnHhk6HksWLZ0HxFHh38Ojo.8OIUDda/Jf7QsRCzWwzXGAq61xnm",
      nama_lengkap: "Administrator OPLab",
      email: "admin@oplab.local",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ] as AdminRecord[],
  praktikum: [
    {
      id_praktikum: 1,
      id_admin: 1,
      judul: "Praktikum 1: Algoritma & Dasar Pemrograman",
      mata_kuliah: "Algoritma Pemrograman",
      deskripsi: "Pengenalan logika pemrograman, manipulasi array, dan fungsi di JavaScript/TypeScript.",
      bahasa: "javascript" as const,
      tingkat_kesulitan: "mudah" as const,
      instruksi:
        "Tuliskan fungsi yang menerima array angka dan mengembalikan jumlah semua elemen genap di dalamnya.\n\nContoh:\nInput: [1, 2, 3, 4, 5, 6]\nOutput: 12",
      starter_code:
        "// Fungsi untuk menghitung jumlah bilangan genap\nfunction hitungJumlahGenap(arr) {\n  let total = 0;\n  for (let num of arr) {\n    if (num % 2 === 0) {\n      total += num;\n    }\n  }\n  return total;\n}\n\n// Uji coba kode Anda\nconst data = [1, 2, 3, 4, 5, 6];\nconsole.log('Input:', data);\nconsole.log('Jumlah genap:', hitungJumlahGenap(data));",
      contoh_input: "[1, 2, 3, 4, 5, 6]",
      contoh_output: "Jumlah genap: 12",
      durasi_menit: 90,
      kode_akses: "OPLAB101",
      status: "aktif" as const,
      jadwal_mulai: new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace("T", " "),
      jadwal_berakhir: new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 19).replace("T", " "),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ] as PraktikumRecord[],
  peserta: [] as PesertaRecord[],
  submissions: [] as SubmissionRecord[],
  violations: [] as ViolationRecord[],
  activities: [] as ActivityRecord[],
  nextAdminId: 2,
  nextPraktikumId: 2,
  nextPesertaId: 1,
  nextSubmissionId: 1,
  nextViolationId: 1,
  nextActivityId: 1,
};

let realPool: Pool | null = null;
let useRealDb = false;

if (process.env.DB_HOST && process.env.DB_USER) {
  try {
    realPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "oplab_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000,
    });
  } catch (err) {
    console.warn("[OPLab DB] Could not initialize real MySQL pool. Using in-memory store.", err);
    realPool = null;
  }
}

async function executeInMemoryQuery(sql: string, params: any[] = []): Promise<any> {
  const cleanSql = sql.replace(/\s+/g, " ").trim();
  const lowerSql = cleanSql.toLowerCase();

  // 1. ADMINS
  if (lowerSql.includes("from admins where username = ? limit 1")) {
    const username = params[0];
    const admin = memoryStore.admins.find((a) => a.username === username);
    return [admin ? [admin] : [], []];
  }

  if (lowerSql.includes("from admins where username = ? and id_admin != ?")) {
    const [username, excludeId] = params;
    const exists = memoryStore.admins.some((a) => a.username === username && a.id_admin !== Number(excludeId));
    return [[{ total: exists ? 1 : 0 }], []];
  }

  if (lowerSql.includes("from admins where username = ?")) {
    const username = params[0];
    const exists = memoryStore.admins.some((a) => a.username === username);
    return [[{ total: exists ? 1 : 0 }], []];
  }

  if (lowerSql.includes("from admins where id_admin = ? limit 1")) {
    const id = Number(params[0]);
    const admin = memoryStore.admins.find((a) => a.id_admin === id);
    return [admin ? [admin] : [], []];
  }

  if (lowerSql.includes("from admins order by created_at desc")) {
    const rows = [...memoryStore.admins].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [rows, []];
  }

  if (lowerSql.includes("select count(*) as total from admins")) {
    return [[{ total: memoryStore.admins.length }], []];
  }

  if (lowerSql.startsWith("insert into admins")) {
    const [username, passwordHash, namaLengkap, email] = params;
    const newId = memoryStore.nextAdminId++;
    const now = new Date().toISOString();
    const newAdmin: AdminRecord = {
      id_admin: newId,
      username,
      password_hash: passwordHash,
      nama_lengkap: namaLengkap,
      email: email ?? null,
      created_at: now,
      updated_at: now,
    };
    memoryStore.admins.push(newAdmin);
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  if (lowerSql.startsWith("update admins set username = ?, nama_lengkap = ?, email = ? where id_admin = ?")) {
    const [username, namaLengkap, email, id] = params;
    const admin = memoryStore.admins.find((a) => a.id_admin === Number(id));
    if (admin) {
      admin.username = username;
      admin.nama_lengkap = namaLengkap;
      admin.email = email ?? null;
      admin.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: admin ? 1 : 0 }, []];
  }

  if (lowerSql.startsWith("update admins set password_hash = ? where id_admin = ?")) {
    const [passwordHash, id] = params;
    const admin = memoryStore.admins.find((a) => a.id_admin === Number(id));
    if (admin) {
      admin.password_hash = passwordHash;
      admin.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: admin ? 1 : 0 }, []];
  }

  if (lowerSql.startsWith("delete from admins where id_admin = ?")) {
    const id = Number(params[0]);
    const idx = memoryStore.admins.findIndex((a) => a.id_admin === id);
    if (idx !== -1) {
      memoryStore.admins.splice(idx, 1);
    }
    return [{ affectedRows: idx !== -1 ? 1 : 0 }, []];
  }

  // 2. PRAKTIKUM
  if (lowerSql.includes("from praktikum order by created_at desc")) {
    const rows = [...memoryStore.praktikum].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [rows, []];
  }

  if (lowerSql.includes("from praktikum where status = 'aktif' limit 1")) {
    const item = memoryStore.praktikum.find((p) => p.status === "aktif");
    return [item ? [item] : [], []];
  }

  if (lowerSql.includes("from praktikum where id_praktikum = ? limit 1")) {
    const id = Number(params[0]);
    const item = memoryStore.praktikum.find((p) => p.id_praktikum === id);
    return [item ? [item] : [], []];
  }

  if (lowerSql.includes("from praktikum where kode_akses = ? and id_praktikum != ?")) {
    const [kode, excludeId] = params;
    const exists = memoryStore.praktikum.some((p) => p.kode_akses.toLowerCase() === String(kode).toLowerCase() && p.id_praktikum !== Number(excludeId));
    return [[{ total: exists ? 1 : 0 }], []];
  }

  if (lowerSql.includes("from praktikum where kode_akses = ? limit 1") || lowerSql.includes("from praktikum where kode_akses = ?")) {
    const kode = String(params[0]);
    if (lowerSql.startsWith("select count(*)")) {
      const exists = memoryStore.praktikum.some((p) => p.kode_akses.toLowerCase() === kode.toLowerCase());
      return [[{ total: exists ? 1 : 0 }], []];
    }
    const item = memoryStore.praktikum.find((p) => p.kode_akses.toLowerCase() === kode.toLowerCase());
    return [item ? [item] : [], []];
  }

  if (lowerSql.startsWith("insert into praktikum")) {
    const [
      id_admin,
      judul,
      mata_kuliah,
      deskripsi,
      bahasa,
      tingkat_kesulitan,
      instruksi,
      starter_code,
      contoh_input,
      contoh_output,
      durasi_menit,
      kode_akses,
      status,
      jadwal_mulai,
      jadwal_berakhir,
    ] = params;

    const newId = memoryStore.nextPraktikumId++;
    const now = new Date().toISOString();
    const newPraktikum: PraktikumRecord = {
      id_praktikum: newId,
      id_admin: Number(id_admin),
      judul,
      mata_kuliah,
      deskripsi: deskripsi ?? null,
      bahasa,
      tingkat_kesulitan,
      instruksi,
      starter_code: starter_code ?? null,
      contoh_input: contoh_input ?? null,
      contoh_output: contoh_output ?? null,
      durasi_menit: Number(durasi_menit),
      kode_akses,
      status: status ?? "nonaktif",
      jadwal_mulai: String(jadwal_mulai),
      jadwal_berakhir: String(jadwal_berakhir),
      created_at: now,
      updated_at: now,
    };
    memoryStore.praktikum.push(newPraktikum);
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  if (lowerSql.startsWith("update praktikum set judul = ?") || lowerSql.startsWith("update praktikum set\n judul = ?")) {
    const [
      judul,
      mata_kuliah,
      deskripsi,
      bahasa,
      tingkat_kesulitan,
      instruksi,
      starter_code,
      contoh_input,
      contoh_output,
      durasi_menit,
      kode_akses,
      jadwal_mulai,
      jadwal_berakhir,
      id,
    ] = params;

    const item = memoryStore.praktikum.find((p) => p.id_praktikum === Number(id));
    if (item) {
      item.judul = judul;
      item.mata_kuliah = mata_kuliah;
      item.deskripsi = deskripsi ?? null;
      item.bahasa = bahasa;
      item.tingkat_kesulitan = tingkat_kesulitan;
      item.instruksi = instruksi;
      item.starter_code = starter_code ?? null;
      item.contoh_input = contoh_input ?? null;
      item.contoh_output = contoh_output ?? null;
      item.durasi_menit = Number(durasi_menit);
      item.kode_akses = kode_akses;
      item.jadwal_mulai = String(jadwal_mulai);
      item.jadwal_berakhir = String(jadwal_berakhir);
      item.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: item ? 1 : 0 }, []];
  }

  if (lowerSql.startsWith("update praktikum set status = ? where id_praktikum = ?")) {
    const [status, id] = params;
    const item = memoryStore.praktikum.find((p) => p.id_praktikum === Number(id));
    if (item) {
      item.status = status;
      item.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: item ? 1 : 0 }, []];
  }

  if (lowerSql.startsWith("update praktikum set status = 'nonaktif' where id_praktikum != ? and status = 'aktif'")) {
    const id = Number(params[0]);
    let count = 0;
    for (const p of memoryStore.praktikum) {
      if (p.id_praktikum !== id && p.status === "aktif") {
        p.status = "nonaktif";
        count++;
      }
    }
    return [{ affectedRows: count }, []];
  }

  if (lowerSql.includes("select count(*) as total from peserta where id_praktikum = ?")) {
    const id = Number(params[0]);
    const total = memoryStore.peserta.filter((p) => p.id_praktikum === id).length;
    return [[{ total }], []];
  }

  if (lowerSql.startsWith("delete from praktikum where id_praktikum = ?")) {
    const id = Number(params[0]);
    const idx = memoryStore.praktikum.findIndex((p) => p.id_praktikum === id);
    if (idx !== -1) {
      memoryStore.praktikum.splice(idx, 1);
    }
    return [{ affectedRows: idx !== -1 ? 1 : 0 }, []];
  }

  // 3. PESERTA & ACTIVITY & VIOLATION & SUBMISSION
  if (lowerSql.startsWith("insert into peserta")) {
    const [id_praktikum, nim, nama] = params;
    const newId = memoryStore.nextPesertaId++;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const newPeserta: PesertaRecord = {
      id_peserta: newId,
      id_praktikum: Number(id_praktikum),
      nim,
      nama,
      waktu_mulai: now,
      waktu_selesai: null,
      status: "mengerjakan",
      kode_terkini: null,
      output_terakhir: null,
      kode_updated_at: null,
      created_at: now,
    };
    memoryStore.peserta.push(newPeserta);
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  if (lowerSql.includes("from peserta where id_peserta = ? limit 1") || lowerSql.includes("from peserta where id_peserta = ?")) {
    const id = Number(params[0]);
    const item = memoryStore.peserta.find((p) => p.id_peserta === id);
    return [item ? [item] : [], []];
  }

  if (lowerSql.startsWith("update peserta set kode_terkini = ?, output_terakhir = ?, kode_updated_at = now() where id_peserta = ?")) {
    const [kode, output, id] = params;
    const p = memoryStore.peserta.find((x) => x.id_peserta === Number(id));
    if (p) {
      p.kode_terkini = kode;
      p.output_terakhir = output;
      p.kode_updated_at = new Date().toISOString().slice(0, 19).replace("T", " ");
    }
    return [{ affectedRows: p ? 1 : 0 }, []];
  }

  if (lowerSql.startsWith("update peserta set kode_terkini = ?, kode_updated_at = now() where id_peserta = ?")) {
    const [kode, id] = params;
    const p = memoryStore.peserta.find((x) => x.id_peserta === Number(id));
    if (p) {
      p.kode_terkini = kode;
      p.kode_updated_at = new Date().toISOString().slice(0, 19).replace("T", " ");
    }
    return [{ affectedRows: p ? 1 : 0 }, []];
  }

  if (lowerSql.startsWith("insert into violation_log")) {
    const [id_peserta, jenis_pelanggaran, keterangan] = params;
    const newId = memoryStore.nextViolationId++;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    memoryStore.violations.push({
      id_violation: newId,
      id_peserta: Number(id_peserta),
      jenis_pelanggaran,
      keterangan: keterangan ?? null,
      waktu_terjadi: now,
    });
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  if (lowerSql.startsWith("insert into activity_log")) {
    const [id_peserta, jenis_aktivitas, keterangan] = params;
    const newId = memoryStore.nextActivityId++;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    memoryStore.activities.push({
      id_activity: newId,
      id_peserta: Number(id_peserta),
      jenis_aktivitas,
      keterangan: keterangan ?? null,
      waktu_terjadi: now,
    });
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  if (lowerSql.startsWith("insert into submission")) {
    const [id_peserta, kode_program, durasi_pengerjaan_detik, submit_type] = params;
    const newId = memoryStore.nextSubmissionId++;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    memoryStore.submissions.push({
      id_submission: newId,
      id_peserta: Number(id_peserta),
      kode_program,
      waktu_submit: now,
      durasi_pengerjaan_detik: durasi_pengerjaan_detik !== undefined ? Number(durasi_pengerjaan_detik) : null,
      submit_type: submit_type ?? "manual",
      created_at: now,
    });
    return [{ insertId: newId, affectedRows: 1 }, []];
  }

  if (lowerSql.startsWith("update peserta set status = 'selesai', waktu_selesai = now() where id_peserta = ?")) {
    const id = Number(params[0]);
    const p = memoryStore.peserta.find((x) => x.id_peserta === id);
    if (p) {
      p.status = "selesai";
      p.waktu_selesai = new Date().toISOString().slice(0, 19).replace("T", " ");
    }
    return [{ affectedRows: p ? 1 : 0 }, []];
  }

  // 4. DASHBOARD STATS
  if (lowerSql.includes("from peserta where status = 'mengerjakan'")) {
    const total = memoryStore.peserta.filter((p) => p.status === "mengerjakan").length;
    return [[{ total }], []];
  }

  if (lowerSql.includes("from peserta where status = 'selesai'")) {
    const total = memoryStore.peserta.filter((p) => p.status === "selesai").length;
    return [[{ total }], []];
  }

  if (lowerSql.includes("select count(*) as total from peserta")) {
    return [[{ total: memoryStore.peserta.length }], []];
  }

  if (lowerSql.includes("select count(distinct id_peserta) as total from violation_log")) {
    const uniqueIds = new Set(memoryStore.violations.map((v) => v.id_peserta));
    return [[{ total: uniqueIds.size }], []];
  }

  if (lowerSql.includes("select avg(s.durasi_pengerjaan_detik) as rata_rata_detik from submission s")) {
    const validSubs = memoryStore.submissions.filter((s) => s.durasi_pengerjaan_detik !== null && s.durasi_pengerjaan_detik !== undefined);
    const avg = validSubs.length > 0 ? validSubs.reduce((acc, s) => acc + (s.durasi_pengerjaan_detik || 0), 0) / validSubs.length : 0;
    return [[{ rata_rata_detik: avg }], []];
  }

  if (lowerSql.includes("from violation_log vl inner join peserta p on p.id_peserta = vl.id_peserta order by vl.waktu_terjadi desc")) {
    const limit = typeof params[0] === "number" ? params[0] : 10;
    const sorted = [...memoryStore.violations].sort((a, b) => new Date(b.waktu_terjadi).getTime() - new Date(a.waktu_terjadi).getTime());
    const sliced = sorted.slice(0, limit);
    const rows = sliced.map((vl) => {
      const p = memoryStore.peserta.find((x) => x.id_peserta === vl.id_peserta);
      return {
        id_violation: vl.id_violation,
        nim: p?.nim ?? "-",
        nama: p?.nama ?? "-",
        jenis_pelanggaran: vl.jenis_pelanggaran,
        waktu_terjadi: vl.waktu_terjadi,
      };
    });
    return [rows, []];
  }

  // 5. MONITOR & DETAIL
  if (lowerSql.includes("from peserta p join praktikum pr on p.id_praktikum = pr.id_praktikum where p.id_peserta = ?")) {
    const id = Number(params[0]);
    const p = memoryStore.peserta.find((x) => x.id_peserta === id);
    if (!p) return [[], []];
    const pr = memoryStore.praktikum.find((x) => x.id_praktikum === p.id_praktikum);
    const total_pelanggaran = memoryStore.violations.filter((v) => v.id_peserta === id).length;
    const row = {
      id_peserta: p.id_peserta,
      nim: p.nim,
      nama: p.nama,
      status: p.status,
      waktu_mulai: p.waktu_mulai,
      waktu_selesai: p.waktu_selesai,
      praktikum_judul: pr?.judul ?? "-",
      bahasa: pr?.bahasa ?? "javascript",
      kode_terkini: p.kode_terkini,
      output_terakhir: p.output_terakhir,
      total_pelanggaran,
    };
    return [[row], []];
  }

  if (lowerSql.includes("from peserta p join praktikum pr on p.id_praktikum = pr.id_praktikum")) {
    let rows = memoryStore.peserta.map((p) => {
      const pr = memoryStore.praktikum.find((x) => x.id_praktikum === p.id_praktikum);
      const total_pelanggaran = memoryStore.violations.filter((v) => v.id_peserta === p.id_peserta).length;
      return {
        id_peserta: p.id_peserta,
        nim: p.nim,
        nama: p.nama,
        status: p.status,
        id_praktikum: p.id_praktikum,
        praktikum_judul: pr?.judul ?? "-",
        waktu_mulai: p.waktu_mulai,
        waktu_selesai: p.waktu_selesai,
        kode_updated_at: p.kode_updated_at,
        total_pelanggaran,
      };
    });

    // Handle filter params if any
    let paramIdx = 0;
    if (lowerSql.includes("(p.nama like ? or p.nim like ?)")) {
      const search = String(params[paramIdx] || "").replace(/%/g, "").toLowerCase();
      paramIdx += 2;
      rows = rows.filter((r) => r.nama.toLowerCase().includes(search) || r.nim.toLowerCase().includes(search));
    }
    if (lowerSql.includes("p.id_praktikum = ?")) {
      const pId = Number(params[paramIdx]);
      paramIdx++;
      rows = rows.filter((r) => r.id_praktikum === pId);
    }
    if (lowerSql.includes("p.status = ?")) {
      const status = params[paramIdx];
      paramIdx++;
      rows = rows.filter((r) => r.status === status);
    }

    rows.sort((a, b) => {
      const timeA = new Date(a.kode_updated_at || a.waktu_mulai).getTime();
      const timeB = new Date(b.kode_updated_at || b.waktu_mulai).getTime();
      return timeB - timeA;
    });

    return [rows, []];
  }

  if (lowerSql.includes("from submission where id_peserta = ? limit 1") || lowerSql.includes("from submission where id_peserta = ?")) {
    const id = Number(params[0]);
    const sub = memoryStore.submissions.find((s) => s.id_peserta === id);
    return [sub ? [sub] : [], []];
  }

  if (lowerSql.includes("from violation_log where id_peserta = ?")) {
    const id = Number(params[0]);
    const list = memoryStore.violations.filter((v) => v.id_peserta === id);
    list.sort((a, b) => new Date(b.waktu_terjadi).getTime() - new Date(a.waktu_terjadi).getTime());
    return [list, []];
  }

  // 6. REKAP
  if (lowerSql.includes("from peserta p inner join praktikum pr on pr.id_praktikum = p.id_praktikum")) {
    let rows = memoryStore.peserta.map((p) => {
      const pr = memoryStore.praktikum.find((x) => x.id_praktikum === p.id_praktikum);
      const sub = memoryStore.submissions.find((s) => s.id_peserta === p.id_peserta);
      const total_pelanggaran = memoryStore.violations.filter((v) => v.id_peserta === p.id_peserta).length;
      return {
        id_peserta: p.id_peserta,
        nim: p.nim,
        nama: p.nama,
        status: p.status,
        waktu_mulai: p.waktu_mulai,
        waktu_selesai: p.waktu_selesai,
        id_praktikum: p.id_praktikum,
        praktikum_judul: pr?.judul ?? "-",
        total_pelanggaran,
        durasi_pengerjaan_detik: sub?.durasi_pengerjaan_detik ?? null,
      };
    });

    let paramIdx = 0;
    if (lowerSql.includes("p.id_praktikum = ?")) {
      const pId = Number(params[paramIdx]);
      paramIdx++;
      rows = rows.filter((r) => r.id_praktikum === pId);
    }
    if (lowerSql.includes("p.status = ?")) {
      const status = params[paramIdx];
      paramIdx++;
      rows = rows.filter((r) => r.status === status);
    }

    rows.sort((a, b) => new Date(b.waktu_mulai).getTime() - new Date(a.waktu_mulai).getTime());
    return [rows, []];
  }

  // Default fallback
  console.warn("[OPLab In-Memory DB] Unhandled query:", sql, params);
  return [[], []];
}

export const pool = {
  query: async <T = any>(sql: string, params?: any): Promise<any> => {
    if (realPool && useRealDb) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        console.warn("[OPLab DB] Real MySQL query failed, falling back to in-memory store:", err);
      }
    }
    return executeInMemoryQuery(sql, params);
  },
  execute: async <T = any>(sql: string, params?: any): Promise<any> => {
    if (realPool && useRealDb) {
      try {
        return await realPool.execute(sql, params);
      } catch (err) {
        console.warn("[OPLab DB] Real MySQL execute failed, falling back to in-memory store:", err);
      }
    }
    return executeInMemoryQuery(sql, params);
  },
  getConnection: async (): Promise<any> => {
    if (realPool && useRealDb) {
      try {
        return await realPool.getConnection();
      } catch (err) {
        console.warn("[OPLab DB] Real MySQL getConnection failed:", err);
      }
    }
    return {
      query: (sql: string, params?: any) => executeInMemoryQuery(sql, params),
      execute: (sql: string, params?: any) => executeInMemoryQuery(sql, params),
      release: () => {},
    };
  },
} as unknown as Pool;
