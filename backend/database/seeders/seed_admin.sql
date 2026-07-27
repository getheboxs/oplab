-- =========================================================
-- Seed: Admin default OPLab
-- Username : admin
-- Password : admin123  (tersimpan dalam bentuk bcrypt hash)
--
-- Hash di bawah ini dihasilkan dari bcrypt (10 salt rounds)
-- terhadap teks "admin123". Untuk membuat admin lain dengan
-- password berbeda, jalankan di folder backend/:
--   npm run hash -- <password_baru>
-- lalu ganti nilai password_hash pada query di bawah.
-- =========================================================

USE oplab_db;

INSERT INTO admins (username, password_hash, nama_lengkap, email)
VALUES (
    'admin',
    '$2a$10$RUnHhk6HksWLZ0HxFHh38Ojo.8OIUDda/Jf7QsRCzWwzXGAq61xnm',
    'Administrator OPLab',
    'admin@oplab.local'
)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    nama_lengkap  = VALUES(nama_lengkap);
