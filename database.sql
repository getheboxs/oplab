-- =========================================================
-- Database: Online Programming Lab (OPLab)
-- Dialect: PostgreSQL / Supabase
-- =========================================================

-- Enable UUID extension (opsional jika dibutuhkan di masa mendatang)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. Tabel: admins
-- Data akun admin / dosen / laboran
-- =========================================================
CREATE TABLE IF NOT EXISTS admins (
    id_admin       SERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nama_lengkap   VARCHAR(100) NOT NULL,
    email          VARCHAR(100) UNIQUE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function & Trigger untuk auto-update updated_at pada tabel admins
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_column();

-- =========================================================
-- 2. Tabel: praktikum
-- Data kegiatan praktikum pemrograman
-- =========================================================
CREATE TABLE IF NOT EXISTS praktikum (
    id_praktikum      SERIAL PRIMARY KEY,
    id_admin          INT NOT NULL,
    judul             VARCHAR(150) NOT NULL,
    mata_kuliah       VARCHAR(100) NOT NULL,
    deskripsi         TEXT,
    bahasa            VARCHAR(20) NOT NULL CHECK (bahasa IN ('javascript', 'typescript')),
    tingkat_kesulitan VARCHAR(20) DEFAULT 'sedang' CHECK (tingkat_kesulitan IN ('mudah', 'sedang', 'sulit')),
    instruksi         TEXT NOT NULL,
    starter_code      TEXT,
    contoh_input      TEXT,
    contoh_output     TEXT,
    durasi_menit      INT NOT NULL,
    kode_akses        VARCHAR(20) NOT NULL UNIQUE,
    status            VARCHAR(20) DEFAULT 'nonaktif' CHECK (status IN ('aktif', 'nonaktif')),
    jadwal_mulai      TIMESTAMP WITH TIME ZONE NOT NULL,
    jadwal_berakhir   TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_praktikum_admin
        FOREIGN KEY (id_admin) REFERENCES admins(id_admin)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_jadwal CHECK (jadwal_berakhir > jadwal_mulai)
);

DROP TRIGGER IF EXISTS trg_praktikum_updated_at ON praktikum;
CREATE TRIGGER trg_praktikum_updated_at
    BEFORE UPDATE ON praktikum
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_column();

-- =========================================================
-- 3. Tabel: peserta
-- Setiap baris merepresentasikan satu sesi/attempt pengerjaan praktikum
-- =========================================================
CREATE TABLE IF NOT EXISTS peserta (
    id_peserta      SERIAL PRIMARY KEY,
    id_praktikum    INT NOT NULL,
    nim             VARCHAR(30) NOT NULL,
    nama            VARCHAR(100) NOT NULL,
    waktu_mulai     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_selesai   TIMESTAMP WITH TIME ZONE NULL,
    status          VARCHAR(20) DEFAULT 'mengerjakan' CHECK (status IN ('mengerjakan', 'selesai')),
    kode_terkini    TEXT NULL,
    output_terakhir TEXT NULL,
    kode_updated_at TIMESTAMP WITH TIME ZONE NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_peserta_praktikum
        FOREIGN KEY (id_praktikum) REFERENCES praktikum(id_praktikum)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_peserta_nim ON peserta (nim);
CREATE INDEX IF NOT EXISTS idx_peserta_praktikum ON peserta (id_praktikum);

-- =========================================================
-- 4. Tabel: submission
-- Menyimpan hasil submit final program dari peserta
-- =========================================================
CREATE TABLE IF NOT EXISTS submission (
    id_submission           SERIAL PRIMARY KEY,
    id_peserta              INT NOT NULL UNIQUE,
    kode_program            TEXT NOT NULL,
    waktu_submit            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    durasi_pengerjaan_detik INT,
    submit_type             VARCHAR(20) DEFAULT 'manual' CHECK (submit_type IN ('manual', 'auto')),
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_submission_peserta
        FOREIGN KEY (id_peserta) REFERENCES peserta(id_peserta)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================================================
-- 5. Tabel: violation_log
-- Mencatat seluruh pelanggaran safe mode mahasiswa
-- =========================================================
CREATE TABLE IF NOT EXISTS violation_log (
    id_violation      SERIAL PRIMARY KEY,
    id_peserta        INT NOT NULL,
    jenis_pelanggaran VARCHAR(50) NOT NULL CHECK (
        jenis_pelanggaran IN (
            'keluar_fullscreen',
            'copy',
            'paste',
            'cut',
            'drag_drop',
            'klik_kanan',
            'devtools_attempt',
            'pindah_tab',
            'kehilangan_fokus'
        )
    ),
    keterangan        VARCHAR(255),
    waktu_terjadi     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_violation_peserta
        FOREIGN KEY (id_peserta) REFERENCES peserta(id_peserta)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_violation_peserta ON violation_log (id_peserta);

-- =========================================================
-- 6. Tabel: activity_log
-- Mencatat event aktivitas non-pelanggaran (mulai, save, run, submit)
-- =========================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id_activity     SERIAL PRIMARY KEY,
    id_peserta      INT NOT NULL,
    jenis_aktivitas VARCHAR(50) NOT NULL CHECK (
        jenis_aktivitas IN (
            'mulai_praktikum',
            'auto_save',
            'run_code',
            'submit',
            'auto_submit'
        )
    ),
    keterangan      VARCHAR(255),
    waktu_terjadi   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_peserta
        FOREIGN KEY (id_peserta) REFERENCES peserta(id_peserta)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_peserta ON activity_log (id_peserta);

-- =========================================================
-- Data Awal (Seed Data)
-- Admin Default: username = admin, password = admin123
-- =========================================================
INSERT INTO admins (username, password_hash, nama_lengkap, email)
VALUES (
    'admin',
    '$2a$10$RUnHhk6HksWLZ0HxFHh38Ojo.8OIUDda/Jf7QsRCzWwzXGAq61xnm',
    'Administrator OPLab',
    'admin@oplab.local'
)
ON CONFLICT (username) DO NOTHING;

-- Contoh Praktikum Awal (Aktif)
INSERT INTO praktikum (
    id_admin, judul, mata_kuliah, deskripsi, bahasa, tingkat_kesulitan,
    instruksi, starter_code, contoh_input, contoh_output, durasi_menit,
    kode_akses, status, jadwal_mulai, jadwal_berakhir
)
VALUES (
    1,
    'Praktikum 1: Algoritma & Dasar Pemrograman',
    'Algoritma Pemrograman',
    'Pengenalan logika pemrograman, manipulasi array, dan fungsi di JavaScript/TypeScript.',
    'javascript',
    'mudah',
    'Tuliskan fungsi yang menerima array angka dan mengembalikan jumlah semua elemen genap di dalamnya.\n\nContoh:\nInput: [1, 2, 3, 4, 5, 6]\nOutput: 12',
    '// Fungsi untuk menghitung jumlah bilangan genap\nfunction hitungJumlahGenap(arr) {\n  let total = 0;\n  for (let num of arr) {\n    if (num % 2 === 0) {\n      total += num;\n    }\n  }\n  return total;\n}\n\n// Uji coba kode Anda\nconst data = [1, 2, 3, 4, 5, 6];\nconsole.log(''Input:'', data);\nconsole.log(''Jumlah genap:'', hitungJumlahGenap(data));',
    '[1, 2, 3, 4, 5, 6]',
    'Jumlah genap: 12',
    90,
    'OPLAB101',
    'aktif',
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP + INTERVAL '365 days'
)
ON CONFLICT (kode_akses) DO NOTHING;
