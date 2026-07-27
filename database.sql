-- =========================================================
-- Database: Online Programming Lab (OPLab)
-- Deskripsi: Skema database sesuai Dokumen Perancangan OPLab
-- =========================================================

CREATE DATABASE IF NOT EXISTS oplab_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE oplab_db;

-- =========================================================
-- Tabel: admins
-- Data akun admin/dosen/laboran
-- =========================================================
CREATE TABLE admins (
    id_admin       INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nama_lengkap   VARCHAR(100) NOT NULL,
    email          VARCHAR(100) UNIQUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- Tabel: praktikum
-- Data kegiatan praktikum
-- =========================================================
CREATE TABLE praktikum (
    id_praktikum      INT AUTO_INCREMENT PRIMARY KEY,
    id_admin          INT NOT NULL,
    judul             VARCHAR(150) NOT NULL,
    mata_kuliah       VARCHAR(100) NOT NULL,
    deskripsi         TEXT,
    bahasa            ENUM('javascript', 'typescript') NOT NULL,
    tingkat_kesulitan ENUM('mudah', 'sedang', 'sulit') DEFAULT 'sedang',
    instruksi         TEXT NOT NULL,
    starter_code      TEXT,
    contoh_input      TEXT,
    contoh_output     TEXT,
    durasi_menit      INT NOT NULL,
    kode_akses        VARCHAR(20) NOT NULL UNIQUE,
    status            ENUM('aktif', 'nonaktif') DEFAULT 'nonaktif',
    jadwal_mulai      DATETIME NOT NULL,
    jadwal_berakhir   DATETIME NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_praktikum_admin
        FOREIGN KEY (id_admin) REFERENCES admins(id_admin)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_jadwal CHECK (jadwal_berakhir > jadwal_mulai)
) ENGINE=InnoDB;

-- =========================================================
-- Tabel: peserta
-- Setiap baris merepresentasikan satu attempt/sesi akses praktikum.
-- NIM boleh duplikat antar baris (antar attempt maupun antar mahasiswa).
-- =========================================================
CREATE TABLE peserta (
    id_peserta     INT AUTO_INCREMENT PRIMARY KEY,
    id_praktikum   INT NOT NULL,
    nim            VARCHAR(30) NOT NULL,
    nama           VARCHAR(100) NOT NULL,
    waktu_mulai    DATETIME NOT NULL,
    waktu_selesai  DATETIME NULL,
    status         ENUM('mengerjakan', 'selesai') DEFAULT 'mengerjakan',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_peserta_praktikum
        FOREIGN KEY (id_praktikum) REFERENCES praktikum(id_praktikum)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_peserta_nim (nim),
    INDEX idx_peserta_praktikum (id_praktikum)
) ENGINE=InnoDB;

-- =========================================================
-- Tabel: submission
-- Satu peserta (satu id_peserta) memiliki tepat satu submission,
-- bersifat final dan tidak berubah setelah tersimpan.
-- =========================================================
CREATE TABLE submission (
    id_submission   INT AUTO_INCREMENT PRIMARY KEY,
    id_peserta      INT NOT NULL UNIQUE,
    kode_program    LONGTEXT NOT NULL,
    waktu_submit    DATETIME NOT NULL,
    durasi_pengerjaan_detik INT,
    submit_type     ENUM('manual', 'auto') DEFAULT 'manual',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_submission_peserta
        FOREIGN KEY (id_peserta) REFERENCES peserta(id_peserta)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- Tabel: violation_log
-- Mencatat khusus pelanggaran yang terdeteksi selama attempt berlangsung.
-- =========================================================
CREATE TABLE violation_log (
    id_violation   INT AUTO_INCREMENT PRIMARY KEY,
    id_peserta     INT NOT NULL,
    jenis_pelanggaran ENUM(
        'keluar_fullscreen',
        'copy',
        'paste',
        'cut',
        'drag_drop',
        'klik_kanan',
        'devtools_attempt',
        'pindah_tab',
        'kehilangan_fokus'
    ) NOT NULL,
    keterangan     VARCHAR(255),
    waktu_terjadi  DATETIME NOT NULL,

    CONSTRAINT fk_violation_peserta
        FOREIGN KEY (id_peserta) REFERENCES peserta(id_peserta)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_violation_peserta (id_peserta)
) ENGINE=InnoDB;

-- =========================================================
-- Tabel: activity_log
-- Mencatat seluruh aktivitas non-pelanggaran (mulai, auto-save, submit, dll).
-- =========================================================
CREATE TABLE activity_log (
    id_activity    INT AUTO_INCREMENT PRIMARY KEY,
    id_peserta     INT NOT NULL,
    jenis_aktivitas ENUM(
        'mulai_praktikum',
        'auto_save',
        'run_code',
        'submit',
        'auto_submit'
    ) NOT NULL,
    keterangan     VARCHAR(255),
    waktu_terjadi  DATETIME NOT NULL,

    CONSTRAINT fk_activity_peserta
        FOREIGN KEY (id_peserta) REFERENCES peserta(id_peserta)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_activity_peserta (id_peserta)
) ENGINE=InnoDB;
