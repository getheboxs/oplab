import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ override: true });

const { Pool } = pg;

// Supabase PostgreSQL Configuration
const rawHost = process.env.SUPABASE_HOST || process.env.DB_HOST;
const DB_HOST =
  !rawHost || rawHost === "localhost" || rawHost === "127.0.0.1"
    ? "db.vzfbknfyhxcmlmfanosi.supabase.co"
    : rawHost;

const rawPort = Number(process.env.DB_PORT || 5432);
const DB_PORT = rawPort === 3306 ? 5432 : rawPort;

const rawDb = process.env.DB_NAME;
const DB_NAME = !rawDb || rawDb === "oplab_db" ? "postgres" : rawDb;

const rawUser = process.env.DB_USER;
const DB_USER = !rawUser || rawUser === "root" ? "postgres" : rawUser;

const rawPassword = process.env.DB_PASSWORD;
const DB_PASSWORD = !rawPassword || rawPassword === "root" ? "w4aEUzVZQRWarkxe" : rawPassword;

export interface QueryMeta {
  rowCount: number;
  insertId: number;
  affectedRows: number;
}

// PostgreSQL Connection Pool for Supabase
let pgPool: pg.Pool | null = null;
let isPgConnected = false;

try {
  pgPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pgPool.on("error", (err) => {
    console.warn("[OPLab PostgreSQL] Unexpected error on idle client:", err.message);
  });

  // Verify connection immediately
  pgPool
    .query("SELECT NOW() as current_time")
    .then((res) => {
      isPgConnected = true;
      console.log("[OPLab PostgreSQL] Connected to Supabase successfully at:", res.rows[0]?.current_time);
    })
    .catch((err) => {
      console.warn("[OPLab PostgreSQL] Initial connection test failed, using fallback store:", err.message);
    });
} catch (err: any) {
  console.warn("[OPLab PostgreSQL] Pool initialization error:", err.message);
  pgPool = null;
}

// In-Memory Database Store as fallback if Supabase tables are not yet created or offline
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
      jadwal_mulai: new Date(Date.now() - 3600000).toISOString(),
      jadwal_berakhir: new Date(Date.now() + 86400000 * 365).toISOString(),
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

function convertQueryPlaceholders(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

async function executeInMemoryQuery(sql: string, params: any[] = []): Promise<[any[], QueryMeta]> {
  const cleanSql = sql.replace(/\s+/g, " ").trim();
  const lowerSql = cleanSql.toLowerCase();

  // 1. ADMINS
  if (lowerSql.includes("from admins where username = $1 limit 1") || lowerSql.includes("from admins where username = ? limit 1")) {
    const username = params[0];
    const admin = memoryStore.admins.find((a) => a.username === username);
    return [admin ? [admin] : [], { rowCount: admin ? 1 : 0, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from admins where username = $1 and id_admin != $2") || lowerSql.includes("from admins where username = ? and id_admin != ?")) {
    const [username, excludeId] = params;
    const exists = memoryStore.admins.some((a) => a.username === username && a.id_admin !== Number(excludeId));
    return [[{ total: exists ? 1 : 0 }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from admins where username = $1") || lowerSql.includes("from admins where username = ?")) {
    const username = params[0];
    const exists = memoryStore.admins.some((a) => a.username === username);
    return [[{ total: exists ? 1 : 0 }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from admins where id_admin = $1 limit 1") || lowerSql.includes("from admins where id_admin = ? limit 1")) {
    const id = Number(params[0]);
    const admin = memoryStore.admins.find((a) => a.id_admin === id);
    return [admin ? [admin] : [], { rowCount: admin ? 1 : 0, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from admins order by created_at desc")) {
    const rows = [...memoryStore.admins].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [rows, { rowCount: rows.length, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("select count(*) as total from admins")) {
    return [[{ total: memoryStore.admins.length }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
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
    return [[{ id_admin: newId }], { rowCount: 1, insertId: newId, affectedRows: 1 }];
  }

  if (lowerSql.startsWith("update admins set username =")) {
    const [username, namaLengkap, email, id] = params;
    const admin = memoryStore.admins.find((a) => a.id_admin === Number(id));
    if (admin) {
      admin.username = username;
      admin.nama_lengkap = namaLengkap;
      admin.email = email ?? null;
      admin.updated_at = new Date().toISOString();
    }
    return [[], { rowCount: admin ? 1 : 0, insertId: 0, affectedRows: admin ? 1 : 0 }];
  }

  if (lowerSql.startsWith("update admins set password_hash =")) {
    const [passwordHash, id] = params;
    const admin = memoryStore.admins.find((a) => a.id_admin === Number(id));
    if (admin) {
      admin.password_hash = passwordHash;
      admin.updated_at = new Date().toISOString();
    }
    return [[], { rowCount: admin ? 1 : 0, insertId: 0, affectedRows: admin ? 1 : 0 }];
  }

  if (lowerSql.startsWith("delete from admins where id_admin =")) {
    const id = Number(params[0]);
    const idx = memoryStore.admins.findIndex((a) => a.id_admin === id);
    if (idx !== -1) {
      memoryStore.admins.splice(idx, 1);
    }
    return [[], { rowCount: idx !== -1 ? 1 : 0, insertId: 0, affectedRows: idx !== -1 ? 1 : 0 }];
  }

  // 2. PRAKTIKUM
  if (lowerSql.includes("from praktikum order by created_at desc")) {
    const rows = [...memoryStore.praktikum].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [rows, { rowCount: rows.length, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from praktikum where status = 'aktif' limit 1")) {
    const item = memoryStore.praktikum.find((p) => p.status === "aktif");
    return [item ? [item] : [], { rowCount: item ? 1 : 0, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from praktikum where id_praktikum = $1 limit 1") || lowerSql.includes("from praktikum where id_praktikum = ? limit 1")) {
    const id = Number(params[0]);
    const item = memoryStore.praktikum.find((p) => p.id_praktikum === id);
    return [item ? [item] : [], { rowCount: item ? 1 : 0, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from praktikum where lower(kode_akses) = lower($1) and id_praktikum != $2") || lowerSql.includes("from praktikum where kode_akses = ? and id_praktikum != ?")) {
    const [kode, excludeId] = params;
    const exists = memoryStore.praktikum.some((p) => p.kode_akses.toLowerCase() === String(kode).toLowerCase() && p.id_praktikum !== Number(excludeId));
    return [[{ total: exists ? 1 : 0 }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from praktikum where lower(kode_akses) = lower($1)") || lowerSql.includes("from praktikum where kode_akses = ?") || lowerSql.includes("from praktikum where kode_akses = $1")) {
    const kode = String(params[0]);
    if (lowerSql.startsWith("select count(*)")) {
      const exists = memoryStore.praktikum.some((p) => p.kode_akses.toLowerCase() === kode.toLowerCase());
      return [[{ total: exists ? 1 : 0 }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
    }
    const item = memoryStore.praktikum.find((p) => p.kode_akses.toLowerCase() === kode.toLowerCase());
    return [item ? [item] : [], { rowCount: item ? 1 : 0, insertId: 0, affectedRows: 0 }];
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
    return [[{ id_praktikum: newId }], { rowCount: 1, insertId: newId, affectedRows: 1 }];
  }

  if (lowerSql.startsWith("update praktikum set")) {
    if (lowerSql.includes("status = $1 where id_praktikum = $2") || lowerSql.includes("status = ? where id_praktikum = ?")) {
      const [status, id] = params;
      const item = memoryStore.praktikum.find((p) => p.id_praktikum === Number(id));
      if (item) {
        item.status = status;
        item.updated_at = new Date().toISOString();
      }
      return [[], { rowCount: item ? 1 : 0, insertId: 0, affectedRows: item ? 1 : 0 }];
    }

    if (lowerSql.includes("status = 'nonaktif' where id_praktikum !=")) {
      const id = Number(params[0]);
      let count = 0;
      for (const p of memoryStore.praktikum) {
        if (p.id_praktikum !== id && p.status === "aktif") {
          p.status = "nonaktif";
          count++;
        }
      }
      return [[], { rowCount: count, insertId: 0, affectedRows: count }];
    }

    // Full update
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
    return [[], { rowCount: item ? 1 : 0, insertId: 0, affectedRows: item ? 1 : 0 }];
  }

  if (lowerSql.includes("select count(*) as total from peserta where id_praktikum =")) {
    const id = Number(params[0]);
    const total = memoryStore.peserta.filter((p) => p.id_praktikum === id).length;
    return [[{ total }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.startsWith("delete from praktikum where id_praktikum =")) {
    const id = Number(params[0]);
    const idx = memoryStore.praktikum.findIndex((p) => p.id_praktikum === id);
    if (idx !== -1) {
      memoryStore.praktikum.splice(idx, 1);
    }
    return [[], { rowCount: idx !== -1 ? 1 : 0, insertId: 0, affectedRows: idx !== -1 ? 1 : 0 }];
  }

  // 3. PESERTA & SUBMISSION & VIOLATION & ACTIVITY
  if (lowerSql.startsWith("insert into peserta")) {
    const [id_praktikum, nim, nama] = params;
    const newId = memoryStore.nextPesertaId++;
    const now = new Date().toISOString();
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
    return [[{ id_peserta: newId, waktu_mulai: now }], { rowCount: 1, insertId: newId, affectedRows: 1 }];
  }

  if (lowerSql.includes("from peserta where id_peserta = $1 limit 1") || lowerSql.includes("from peserta where id_peserta = ? limit 1") || lowerSql.includes("from peserta where id_peserta = $1") || lowerSql.includes("from peserta where id_peserta = ?")) {
    const id = Number(params[0]);
    const item = memoryStore.peserta.find((p) => p.id_peserta === id);
    return [item ? [item] : [], { rowCount: item ? 1 : 0, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.startsWith("update peserta set kode_terkini = $1, output_terakhir = $2") || lowerSql.startsWith("update peserta set kode_terkini = ?, output_terakhir = ?")) {
    const [kode, output, id] = params;
    const p = memoryStore.peserta.find((x) => x.id_peserta === Number(id));
    if (p) {
      p.kode_terkini = kode;
      p.output_terakhir = output;
      p.kode_updated_at = new Date().toISOString();
    }
    return [[], { rowCount: p ? 1 : 0, insertId: 0, affectedRows: p ? 1 : 0 }];
  }

  if (lowerSql.startsWith("update peserta set kode_terkini = $1") || lowerSql.startsWith("update peserta set kode_terkini = ?")) {
    const [kode, id] = params;
    const p = memoryStore.peserta.find((x) => x.id_peserta === Number(id));
    if (p) {
      p.kode_terkini = kode;
      p.kode_updated_at = new Date().toISOString();
    }
    return [[], { rowCount: p ? 1 : 0, insertId: 0, affectedRows: p ? 1 : 0 }];
  }

  if (lowerSql.startsWith("insert into violation_log")) {
    const [id_peserta, jenis_pelanggaran, keterangan] = params;
    const newId = memoryStore.nextViolationId++;
    const now = new Date().toISOString();
    memoryStore.violations.push({
      id_violation: newId,
      id_peserta: Number(id_peserta),
      jenis_pelanggaran,
      keterangan: keterangan ?? null,
      waktu_terjadi: now,
    });
    return [[{ id_violation: newId }], { rowCount: 1, insertId: newId, affectedRows: 1 }];
  }

  if (lowerSql.startsWith("insert into activity_log")) {
    const [id_peserta, jenis_aktivitas, keterangan] = params;
    const newId = memoryStore.nextActivityId++;
    const now = new Date().toISOString();
    memoryStore.activities.push({
      id_activity: newId,
      id_peserta: Number(id_peserta),
      jenis_aktivitas,
      keterangan: keterangan ?? null,
      waktu_terjadi: now,
    });
    return [[{ id_activity: newId }], { rowCount: 1, insertId: newId, affectedRows: 1 }];
  }

  if (lowerSql.startsWith("insert into submission")) {
    const [id_peserta, kode_program, durasi_pengerjaan_detik, submit_type] = params;
    const newId = memoryStore.nextSubmissionId++;
    const now = new Date().toISOString();
    memoryStore.submissions.push({
      id_submission: newId,
      id_peserta: Number(id_peserta),
      kode_program,
      waktu_submit: now,
      durasi_pengerjaan_detik: durasi_pengerjaan_detik !== undefined ? Number(durasi_pengerjaan_detik) : null,
      submit_type: submit_type ?? "manual",
      created_at: now,
    });
    return [[{ id_submission: newId }], { rowCount: 1, insertId: newId, affectedRows: 1 }];
  }

  if (lowerSql.startsWith("update peserta set status = 'selesai'")) {
    const id = Number(params[0]);
    const p = memoryStore.peserta.find((x) => x.id_peserta === id);
    if (p) {
      p.status = "selesai";
      p.waktu_selesai = new Date().toISOString();
    }
    return [[], { rowCount: p ? 1 : 0, insertId: 0, affectedRows: p ? 1 : 0 }];
  }

  // 4. DASHBOARD STATS
  if (lowerSql.includes("from peserta where status = 'mengerjakan'")) {
    const total = memoryStore.peserta.filter((p) => p.status === "mengerjakan").length;
    return [[{ total }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from peserta where status = 'selesai'")) {
    const total = memoryStore.peserta.filter((p) => p.status === "selesai").length;
    return [[{ total }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("select count(*) as total from peserta")) {
    return [[{ total: memoryStore.peserta.length }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("select count(distinct id_peserta) as total from violation_log")) {
    const uniqueIds = new Set(memoryStore.violations.map((v) => v.id_peserta));
    return [[{ total: uniqueIds.size }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("select avg(s.durasi_pengerjaan_detik) as rata_rata_detik from submission s")) {
    const validSubs = memoryStore.submissions.filter((s) => s.durasi_pengerjaan_detik !== null && s.durasi_pengerjaan_detik !== undefined);
    const avg = validSubs.length > 0 ? validSubs.reduce((acc, s) => acc + (s.durasi_pengerjaan_detik || 0), 0) / validSubs.length : 0;
    return [[{ rata_rata_detik: avg }], { rowCount: 1, insertId: 0, affectedRows: 0 }];
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
    return [rows, { rowCount: rows.length, insertId: 0, affectedRows: 0 }];
  }

  // 5. MONITOR & DETAIL
  if (lowerSql.includes("from peserta p join praktikum pr on p.id_praktikum = pr.id_praktikum where p.id_peserta =")) {
    const id = Number(params[0]);
    const p = memoryStore.peserta.find((x) => x.id_peserta === id);
    if (!p) return [[], { rowCount: 0, insertId: 0, affectedRows: 0 }];
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
    return [[row], { rowCount: 1, insertId: 0, affectedRows: 0 }];
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

    let paramIdx = 0;
    if (lowerSql.includes("p.nama ilike") || lowerSql.includes("p.nama like")) {
      const search = String(params[paramIdx] || "").replace(/%/g, "").toLowerCase();
      paramIdx += 2;
      rows = rows.filter((r) => r.nama.toLowerCase().includes(search) || r.nim.toLowerCase().includes(search));
    }
    if (lowerSql.includes("p.id_praktikum =")) {
      const pId = Number(params[paramIdx]);
      paramIdx++;
      rows = rows.filter((r) => r.id_praktikum === pId);
    }
    if (lowerSql.includes("p.status =")) {
      const status = params[paramIdx];
      paramIdx++;
      rows = rows.filter((r) => r.status === status);
    }

    rows.sort((a, b) => {
      const timeA = new Date(a.kode_updated_at || a.waktu_mulai).getTime();
      const timeB = new Date(b.kode_updated_at || b.waktu_mulai).getTime();
      return timeB - timeA;
    });

    return [rows, { rowCount: rows.length, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from submission where id_peserta =")) {
    const id = Number(params[0]);
    const sub = memoryStore.submissions.find((s) => s.id_peserta === id);
    return [sub ? [sub] : [], { rowCount: sub ? 1 : 0, insertId: 0, affectedRows: 0 }];
  }

  if (lowerSql.includes("from violation_log where id_peserta =")) {
    const id = Number(params[0]);
    const list = memoryStore.violations.filter((v) => v.id_peserta === id);
    list.sort((a, b) => new Date(b.waktu_terjadi).getTime() - new Date(a.waktu_terjadi).getTime());
    return [list, { rowCount: list.length, insertId: 0, affectedRows: 0 }];
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
    if (lowerSql.includes("p.id_praktikum =")) {
      const pId = Number(params[paramIdx]);
      paramIdx++;
      rows = rows.filter((r) => r.id_praktikum === pId);
    }
    if (lowerSql.includes("p.status =")) {
      const status = params[paramIdx];
      paramIdx++;
      rows = rows.filter((r) => r.status === status);
    }

    rows.sort((a, b) => new Date(b.waktu_mulai).getTime() - new Date(a.waktu_mulai).getTime());
    return [rows, { rowCount: rows.length, insertId: 0, affectedRows: 0 }];
  }

  return [[], { rowCount: 0, insertId: 0, affectedRows: 0 }];
}

export const pool = {
  query: async <T = any>(sql: string, params: any[] = []): Promise<[T, QueryMeta]> => {
    const convertedSql = sql.includes("?") ? convertQueryPlaceholders(sql) : sql;

    if (pgPool) {
      try {
        const result = await pgPool.query(convertedSql, params);
        const rows = result.rows as unknown as T;
        const insertId =
          result.rows[0]?.id_admin ||
          result.rows[0]?.id_praktikum ||
          result.rows[0]?.id_peserta ||
          result.rows[0]?.id_submission ||
          result.rows[0]?.id_violation ||
          result.rows[0]?.id_activity ||
          0;

        const meta: QueryMeta = {
          rowCount: result.rowCount || 0,
          insertId,
          affectedRows: result.rowCount || 0,
        };

        return [rows, meta];
      } catch (err: any) {
        console.warn("[OPLab PostgreSQL Query Failed, using fallback store]:", err.message);
      }
    }

    const [rows, meta] = await executeInMemoryQuery(convertedSql, params);
    return [rows as unknown as T, meta];
  },

  execute: async <T = any>(sql: string, params: any[] = []): Promise<[T, QueryMeta]> => {
    return pool.query<T>(sql, params);
  },

  getPool: () => pgPool,
};
