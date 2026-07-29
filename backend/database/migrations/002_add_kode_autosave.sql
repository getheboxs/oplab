-- Migrasi: tambahkan kolom autosave kode & output untuk fitur Monitor Real-Time.
-- Jalankan file ini jika database oplab_db sudah pernah dibuat sebelumnya.

USE oplab_db;

ALTER TABLE peserta
  ADD COLUMN kode_terkini LONGTEXT NULL
    COMMENT 'Snapshot kode terakhir yang di-autosave dari sisi client untuk keperluan monitoring admin'
    AFTER status,
  ADD COLUMN output_terakhir LONGTEXT NULL
    COMMENT 'Snapshot hasil console output terakhir saat mahasiswa menjalankan kode'
    AFTER kode_terkini,
  ADD COLUMN kode_updated_at DATETIME NULL
    COMMENT 'Waktu snapshot autosave terakhir diterima'
    AFTER output_terakhir;
