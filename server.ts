import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Praktikum, Peserta, Submission, ViolationLog, ActivityLog } from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Middleware to parse incoming JSON
app.use(express.json());

// Initialize Local JSON Database
interface DatabaseSchema {
  praktikum: Praktikum[];
  peserta: Peserta[];
  submissions: Submission[];
  violation_logs: ViolationLog[];
  activity_logs: ActivityLog[];
}

function getInitialDatabase(): DatabaseSchema {
  const mockPraktikum: Praktikum = {
    id: "sample-id-1",
    judul: "Praktikum 1: Manipulasi Array dan Perhitungan Statistik",
    mataKuliah: "Pemrograman Web Lanjut",
    deskripsi: "Mahasiswa diminta membuat fungsi hitungStatistik(array) yang menerima sebuah array berisi angka, kemudian mengembalikan object berisi nilai rata-rata, nilai maksimum, dan nilai minimum.",
    bahasa: "javascript",
    tingkatKesulitan: "pemula",
    instruksi: "1. Jangan menggunakan library luar.\n2. Fungsi harus mengembalikan object dengan key: 'rataRata', 'max', dan 'min'.\n3. Ujilah fungsi Anda dengan beberapa array masukan.\n4. Sistem memantau aktivitas tab Anda. Fokus penuh pada tab editor.",
    starterCode: `// Tuliskan fungsi hitungStatistik di sini
function hitungStatistik(angkaArray) {
  if (!Array.isArray(angkaArray) || angkaArray.length === 0) {
    return { rataRata: 0, max: 0, min: 0 };
  }
  
  const total = angkaArray.reduce((acc, curr) => acc + curr, 0);
  const rataRata = total / angkaArray.length;
  const max = Math.max(...angkaArray);
  const min = Math.min(...angkaArray);
  
  return {
    rataRata,
    max,
    min
  };
}

// Jalankan uji coba
const dataUji = [10, 25, 4, 89, 32];
console.log("Hasil Statistik:", hitungStatistik(dataUji));
`,
    contohInput: "[10, 25, 4, 89, 32]",
    contohOutput: "Hasil Statistik: { rataRata: 32, max: 89, min: 4 }",
    timer: 45,
    accessCode: "LAB-JS101",
    isActive: true,
    jadwalMulai: new Date().toISOString(),
    jadwalBerakhir: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
  };

  const mockPeserta1: Peserta = {
    id: "p-mock-1",
    nim: "2209106001",
    nama: "Budi Santoso",
    praktikumId: "sample-id-1",
    waktuMulai: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    waktuSelesai: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    durasi: 1200, // 20 mins
    status: "selesai",
    jumlahPelanggaran: 2
  };

  const mockPeserta2: Peserta = {
    id: "p-mock-2",
    nim: "2209106042",
    nama: "Siti Rahmawati",
    praktikumId: "sample-id-1",
    waktuMulai: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    waktuSelesai: null,
    durasi: 900, // 15 mins active
    status: "sedang_mengerjakan",
    jumlahPelanggaran: 0
  };

  const mockSub1: Submission = {
    id: "sub-mock-1",
    pesertaId: "p-mock-1",
    praktikumId: "sample-id-1",
    kode: `function hitungStatistik(angkaArray) {
  if (!angkaArray || angkaArray.length === 0) return { rataRata: 0, max: 0, min: 0 };
  const total = angkaArray.reduce((s, n) => s + n, 0);
  return {
    rataRata: total / angkaArray.length,
    max: Math.max(...angkaArray),
    min: Math.min(...angkaArray)
  };
}
console.log("Hasil Statistik:", hitungStatistik([10, 25, 4, 89, 32]));`,
    output: "Hasil Statistik: { rataRata: 32, max: 89, min: 4 }",
    status: "submitted",
    submittedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  };

  const mockSub2: Submission = {
    id: "sub-mock-2",
    pesertaId: "p-mock-2",
    praktikumId: "sample-id-1",
    kode: `// Sedang dikerjakan oleh Siti...\nfunction hitungStatistik(angkaArray) {\n  // Mengumpulkan data\n}`,
    output: "...",
    status: "draft",
    submittedAt: null
  };

  const mockVio1: ViolationLog = {
    id: "v-mock-1",
    pesertaId: "p-mock-1",
    jenis: "switch_tab",
    waktu: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    deskripsi: "Membuka tab pencarian Google Chrome"
  };

  const mockVio2: ViolationLog = {
    id: "v-mock-2",
    pesertaId: "p-mock-1",
    jenis: "exit_fullscreen",
    waktu: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    deskripsi: "Keluar dari mode fullscreen wajib"
  };

  return {
    praktikum: [mockPraktikum],
    peserta: [mockPeserta1, mockPeserta2],
    submissions: [mockSub1, mockSub2],
    violation_logs: [mockVio1, mockVio2],
    activity_logs: []
  };
}

// Safe Read / Write
function readDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const init = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2), "utf-8");
      return init;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading db.json, returning mock data:", error);
    return getInitialDatabase();
  }
}

function writeDB(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to db.json:", error);
  }
}

// --- API ENDPOINTS ---

// Admin Login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@oplab.id" && password === "admin123") {
    res.json({ success: true, token: "admin-jwt-token-oplab-2026" });
  } else {
    res.status(401).json({ success: false, message: "Email atau password admin salah!" });
  }
});

// GET all praktikum
app.get("/api/praktikum", (req, res) => {
  const db = readDB();
  res.json(db.praktikum);
});

// GET current active praktikum
app.get("/api/praktikum/active", (req, res) => {
  const db = readDB();
  const active = db.praktikum.find((p) => p.isActive);
  res.json(active || null);
});

// POST create praktikum
app.post("/api/praktikum", (req, res) => {
  const db = readDB();
  const newPraktikum: Praktikum = {
    id: "p-" + Math.random().toString(36).substr(2, 9),
    ...req.body,
    accessCode: req.body.accessCode || "LAB-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
    isActive: req.body.isActive || false
  };

  // If set to active, make all other labs inactive
  if (newPraktikum.isActive) {
    db.praktikum = db.praktikum.map((p) => ({ ...p, isActive: false }));
  }

  db.praktikum.push(newPraktikum);
  writeDB(db);
  res.json({ success: true, praktikum: newPraktikum });
});

// PUT update praktikum
app.put("/api/praktikum/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const index = db.praktikum.findIndex((p) => p.id === id);

  if (index !== -1) {
    const updated = { ...db.praktikum[index], ...req.body };
    
    // If setting active, reset others
    if (req.body.isActive === true) {
      db.praktikum = db.praktikum.map((p) => {
        if (p.id === id) return updated;
        return { ...p, isActive: false };
      });
    } else {
      db.praktikum[index] = updated;
    }

    writeDB(db);
    res.json({ success: true, praktikum: updated });
  } else {
    res.status(404).json({ success: false, message: "Praktikum tidak ditemukan" });
  }
});

// DELETE praktikum
app.delete("/api/praktikum/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const filtered = db.praktikum.filter((p) => p.id !== id);
  if (filtered.length !== db.praktikum.length) {
    db.praktikum = filtered;
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: "Praktikum tidak ditemukan" });
  }
});

// POST import praktikum
app.post("/api/praktikum/import", (req, res) => {
  try {
    const db = readDB();
    const list: Partial<Praktikum>[] = Array.isArray(req.body) ? req.body : [req.body];
    const imported: Praktikum[] = [];

    list.forEach((item) => {
      const newP: Praktikum = {
        id: "p-" + Math.random().toString(36).substr(2, 9),
        judul: item.judul || "Praktikum Tanpa Judul",
        mataKuliah: item.mataKuliah || "Mata Kuliah Umum",
        deskripsi: item.deskripsi || "",
        bahasa: item.bahasa || "javascript",
        tingkatKesulitan: item.tingkatKesulitan || "pemula",
        instruksi: item.instruksi || "",
        starterCode: item.starterCode || "",
        contohInput: item.contohInput || "",
        contohOutput: item.contohOutput || "",
        timer: Number(item.timer) || 30,
        accessCode: item.accessCode || "LAB-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
        isActive: false,
        jadwalMulai: item.jadwalMulai || new Date().toISOString(),
        jadwalBerakhir: item.jadwalBerakhir || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      };
      db.praktikum.push(newP);
      imported.push(newP);
    });

    writeDB(db);
    res.json({ success: true, imported });
  } catch (error) {
    res.status(500).json({ success: false, message: "Format JSON impor tidak valid!" });
  }
});

// POST student join (NIM, Name, Access Code)
app.post("/api/peserta/join", (req, res) => {
  const { accessCode, nim, nama } = req.body;
  if (!accessCode || !nim || !nama) {
    return res.status(400).json({ success: false, message: "Lengkapi kode akses, NIM, dan Nama!" });
  }

  const db = readDB();
  const lab = db.praktikum.find((p) => p.isActive && p.accessCode.trim().toUpperCase() === accessCode.trim().toUpperCase());

  if (!lab) {
    return res.status(404).json({ success: false, message: "Kode akses salah atau praktikum sudah tidak aktif!" });
  }

  // Check if student already registered for this lab (Reconnect Feature to prevent progress loss!)
  let student = db.peserta.find((p) => p.praktikumId === lab.id && p.nim === nim);
  let submission = student ? db.submissions.find((s) => s.pesertaId === student!.id) : null;

  if (student) {
    // Reconnection logs
    const activity: ActivityLog = {
      id: "act-" + Math.random().toString(36).substr(2, 9),
      pesertaId: student.id,
      tipe: "reconnect",
      waktu: new Date().toISOString(),
      deskripsi: "Mahasiswa kembali terhubung ke sesi"
    };
    db.activity_logs.push(activity);
    writeDB(db);
    return res.json({ success: true, peserta: student, praktikum: lab, submission });
  }

  // Create new participant
  const newPesertaId = "peserta-" + Math.random().toString(36).substr(2, 9);
  student = {
    id: newPesertaId,
    nim,
    nama,
    praktikumId: lab.id,
    waktuMulai: new Date().toISOString(),
    waktuSelesai: null,
    durasi: 0,
    status: "sedang_mengerjakan",
    jumlahPelanggaran: 0
  };

  submission = {
    id: "sub-" + Math.random().toString(36).substr(2, 9),
    pesertaId: newPesertaId,
    praktikumId: lab.id,
    kode: lab.starterCode || "",
    output: "",
    status: "draft",
    submittedAt: null
  };

  const activity: ActivityLog = {
    id: "act-" + Math.random().toString(36).substr(2, 9),
    pesertaId: newPesertaId,
    tipe: "join",
    waktu: new Date().toISOString(),
    deskripsi: "Mahasiswa memulai praktikum"
  };

  db.peserta.push(student);
  db.submissions.push(submission);
  db.activity_logs.push(activity);
  
  writeDB(db);

  res.json({ success: true, peserta: student, praktikum: lab, submission });
});

// GET participant details
app.get("/api/peserta/:id", (req, res) => {
  const db = readDB();
  const student = db.peserta.find((p) => p.id === req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: "Peserta tidak ditemukan" });
  }
  const submission = db.submissions.find((s) => s.pesertaId === student.id);
  const violations = db.violation_logs.filter((v) => v.pesertaId === student.id);
  res.json({ peserta: student, submission, violations });
});

// POST student autosave code & tick duration
app.post("/api/peserta/:id/autosave", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { kode, output, secondsElapsed } = req.body;

  const studentIndex = db.peserta.findIndex((p) => p.id === id);
  if (studentIndex === -1) {
    return res.status(404).json({ success: false, message: "Peserta tidak ditemukan" });
  }

  const student = db.peserta[studentIndex];
  
  // Only update if student is currently active
  if (student.status === "sedang_mengerjakan") {
    if (typeof secondsElapsed === "number") {
      student.durasi = secondsElapsed;
    }

    const subIndex = db.submissions.findIndex((s) => s.pesertaId === id);
    if (subIndex !== -1) {
      if (typeof kode === "string") {
        db.submissions[subIndex].kode = kode;
      }
      if (typeof output === "string") {
        db.submissions[subIndex].output = output;
      }
    }
    
    writeDB(db);
  }

  res.json({ success: true });
});

// POST student violation logging
app.post("/api/peserta/:id/violation", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { jenis, deskripsi } = req.body;

  const studentIndex = db.peserta.findIndex((p) => p.id === id);
  if (studentIndex === -1) {
    return res.status(404).json({ success: false, message: "Peserta tidak ditemukan" });
  }

  const student = db.peserta[studentIndex];
  if (student.status === "sedang_mengerjakan") {
    student.jumlahPelanggaran += 1;

    const violation: ViolationLog = {
      id: "v-" + Math.random().toString(36).substr(2, 9),
      pesertaId: id,
      jenis,
      waktu: new Date().toISOString(),
      deskripsi
    };

    db.violation_logs.push(violation);
    writeDB(db);
    res.json({ success: true, currentViolations: student.jumlahPelanggaran });
  } else {
    res.json({ success: true, message: "Sesi peserta sudah selesai, pelanggaran diabaikan" });
  }
});

// POST student final submission
app.post("/api/peserta/:id/submit", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { kode, output, secondsElapsed } = req.body;

  const studentIndex = db.peserta.findIndex((p) => p.id === id);
  if (studentIndex === -1) {
    return res.status(404).json({ success: false, message: "Peserta tidak ditemukan" });
  }

  const student = db.peserta[studentIndex];
  if (student.status === "sedang_mengerjakan") {
    student.status = "selesai";
    student.waktuSelesai = new Date().toISOString();
    if (typeof secondsElapsed === "number") {
      student.durasi = secondsElapsed;
    }

    const subIndex = db.submissions.findIndex((s) => s.pesertaId === id);
    if (subIndex !== -1) {
      if (typeof kode === "string") db.submissions[subIndex].kode = kode;
      if (typeof output === "string") db.submissions[subIndex].output = output;
      db.submissions[subIndex].status = "submitted";
      db.submissions[subIndex].submittedAt = new Date().toISOString();
    }

    const activity: ActivityLog = {
      id: "act-" + Math.random().toString(36).substr(2, 9),
      pesertaId: id,
      tipe: "submit",
      waktu: new Date().toISOString(),
      deskripsi: "Mahasiswa menyelesaikan dan mengirimkan hasil praktikum"
    };
    db.activity_logs.push(activity);

    writeDB(db);
    res.json({ success: true, student });
  } else {
    res.status(400).json({ success: false, message: "Sesi praktikum peserta ini sudah selesai sebelumnya!" });
  }
});

// GET admin monitoring data
app.get("/api/admin/monitoring", (req, res) => {
  const db = readDB();
  
  // Map participants with their corresponding practical session title, code submissions, and violation logs
  const monitoringData = db.peserta.map((p) => {
    const lab = db.praktikum.find((l) => l.id === p.praktikumId);
    const sub = db.submissions.find((s) => s.pesertaId === p.id);
    const violations = db.violation_logs.filter((v) => v.pesertaId === p.id);
    const activities = db.activity_logs.filter((a) => a.pesertaId === p.id);

    return {
      ...p,
      praktikumJudul: lab ? lab.judul : "Praktikum Tidak Diketahui",
      praktikumBahasa: lab ? lab.bahasa : "javascript",
      submission: sub || null,
      violations,
      activities
    };
  });

  // Calculate high-level statistics for current active view
  const activeStudentsCount = db.peserta.filter((p) => p.status === "sedang_mengerjakan").length;
  const completedStudentsCount = db.peserta.filter((p) => p.status === "selesai").length;
  
  const completedWithDurations = db.peserta.filter((p) => p.status === "selesai" && p.durasi > 0);
  const averageDuration = completedWithDurations.length > 0
    ? Math.round(completedWithDurations.reduce((acc, curr) => acc + curr.durasi, 0) / completedWithDurations.length / 60)
    : 0;

  const totalStudents = db.peserta.length;
  const violatedStudents = db.peserta.filter((p) => p.jumlahPelanggaran > 0).length;
  const violationRate = totalStudents > 0 ? Math.round((violatedStudents / totalStudents) * 100) : 0;

  res.json({
    students: monitoringData,
    stats: {
      activeStudentsCount,
      completedStudentsCount,
      averageDuration,
      violationRate
    }
  });
});

// --- VITE DEV / PROD SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
