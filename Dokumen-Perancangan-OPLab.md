# Dokumen Perancangan Aplikasi
## Online Programming Lab (OPLab)

---

## 1. Deskripsi Umum

Aplikasi Praktikum Online (OPLab) merupakan sistem berbasis web yang dirancang untuk mendukung pelaksanaan praktikum pemrograman JavaScript dan TypeScript secara daring. Sistem terdiri dari dua bagian utama, yaitu **Backend Admin** dan **Frontend Mahasiswa**. Backend digunakan oleh dosen atau laboran untuk mengelola kegiatan praktikum, sedangkan frontend digunakan mahasiswa untuk mengerjakan praktikum tanpa harus memiliki akun.

---

## 2. Teknologi yang Digunakan

| Komponen | Teknologi |
|---|---|
| Bahasa Backend | TypeScript (Node.js) |
| Database | MySQL |
| Frontend (Admin & Mahasiswa) | React + React Router |
| Editor Kode | Monaco Editor |
| Styling | Tailwind CSS |

**Keamanan (deteksi & pencatatan):**
- Fullscreen API
- Page Visibility API
- Window Focus API
- Clipboard Event Listener
- Keyboard Shortcut Listener

Catatan: Backend dan frontend menggunakan bahasa yang sama (TypeScript) sehingga tidak diperlukan jembatan API lintas bahasa. Monaco Editor dipilih karena familiar bagi mahasiswa pengguna VSCode dan memiliki dukungan native untuk TypeScript IntelliSense/type-checking.

---

## 3. Modul Backend (Admin)

### 3.1 Login Admin
- Login menggunakan akun admin.
- Dashboard menampilkan statistik praktikum yang sedang berlangsung.

### 3.2 Manajemen Praktikum

Admin dapat membuat kegiatan praktikum dengan informasi:
- Judul praktikum
- Mata kuliah
- Deskripsi
- Bahasa pemrograman (JavaScript atau TypeScript)
- Tingkat kesulitan
- Instruksi pengerjaan
- Starter Code (opsional)
- Contoh Input dan Output
- Timer pengerjaan (menit)
- Kode akses praktikum (dibuat otomatis atau manual)
- Status Aktif/Nonaktif
- Jadwal mulai dan berakhir

Hanya satu praktikum yang dapat diaktifkan pada waktu tertentu.

### 3.3 Monitoring Praktikum

Admin dapat melihat secara real-time:
- Daftar mahasiswa yang telah masuk (per attempt/`id_peserta`)
- NIM
- Nama
- Waktu mulai
- Waktu selesai
- Durasi pengerjaan
- Status (Sedang Mengerjakan / Selesai)
- Jumlah pelanggaran
- Riwayat pelanggaran selama pengerjaan
- Riwayat seluruh attempt per NIM (karena satu NIM dapat memiliki banyak attempt)

### 3.4 Riwayat Pelanggaran

Setiap aktivitas yang terdeteksi sebagai pelanggaran akan **dicatat** (bukan diblokir), seperti:
- Keluar dari mode fullscreen
- Berpindah tab/browser
- Membuka aplikasi lain / kehilangan fokus halaman
- Percobaan copy/paste/cut/drag-drop/klik kanan
- Percobaan membuka DevTools

Admin dapat melihat waktu terjadinya setiap pelanggaran beserta jumlah totalnya per attempt.

### 3.5 Ekspor Data

Admin dapat mengunduh hasil praktikum dalam format CSV atau Excel yang berisi:
- ID Peserta
- NIM
- Nama
- Praktikum
- Waktu mulai
- Waktu selesai
- Durasi
- Jumlah pelanggaran
- Status penyelesaian

---

## 4. Modul Frontend (Mahasiswa)

Mahasiswa **tidak perlu login**. Setiap kali mengakses atau mengulang praktikum, sistem menganggapnya sebagai attempt/sesi baru dengan `id_peserta` baru.

### Alur Penggunaan

1. Mahasiswa membuka halaman praktikum.
2. Sistem memeriksa apakah jadwal berakhir praktikum sudah terlampaui:
   - Jika **sudah terlampaui** → mahasiswa **tidak dapat mengakses** praktikum (baik untuk pertama kali maupun untuk mencoba ulang), dan ditampilkan pesan bahwa praktikum sudah ditutup.
   - Jika **belum terlampaui** → mahasiswa dapat melanjutkan ke langkah berikutnya.
3. Mahasiswa memasukkan:
   - Kode Praktikum
   - NIM
   - Nama Lengkap
4. Sistem melakukan validasi kode akses. NIM ganda **diperbolehkan** (tidak ada validasi keunikan NIM).
5. Setelah valid, sistem membuat baris `peserta` baru dengan `id_peserta` unik, mencatat `waktu_mulai` ke server, dan praktikum dimulai.
6. Mahasiswa mengerjakan praktikum hingga submit, atau hingga waktu habis (auto-submit).
7. Setelah submission tersimpan, mahasiswa **dikembalikan ke halaman depan**. Data yang sudah tersimpan bersifat **final dan tidak berubah**.
8. Jika mahasiswa ingin mencoba lagi (dan jadwal praktikum belum berakhir), mahasiswa mengulang dari langkah 1 — proses ini akan membentuk `id_peserta` dan submission baru, tanpa memengaruhi submission sebelumnya.
9. Jika terjadi refresh atau browser crash sebelum sempat submit, sesi attempt tersebut hilang (tidak tersimpan), dan mahasiswa harus mengulang dari langkah 1, tetap tunduk pada pengecekan jadwal di langkah 2.

---

## 5. Halaman Editor Kode

Editor menggunakan **Monaco Editor**, mendukung:
- Syntax Highlight
- Auto Indentation
- Auto Complete
- Line Number
- Dark dan Light Theme

Fitur editor:
- Menjalankan kode secara langsung.
- Menampilkan hasil output.
- Menampilkan pesan error.
- Reset ke starter code.
- Submit hasil praktikum.

### Alur Eksekusi Kode

1. Mahasiswa menulis kode di Monaco Editor.
2. Jika bahasa praktikum adalah **TypeScript** → kode ditranspile terlebih dahulu ke JavaScript menggunakan TypeScript Compiler (berjalan di sisi browser).
3. Jika bahasa praktikum adalah **JavaScript** → kode langsung masuk ke tahap eksekusi tanpa proses transpile.
4. Kode (hasil transpile atau JS asli) dijalankan di dalam **Web Worker**, terisolasi dari main thread, agar tidak membekukan (freeze) halaman browser.
5. Web Worker diberi batas waktu (timeout); jika kode mengalami infinite loop atau berjalan terlalu lama, worker dihentikan (`terminate()`) secara otomatis.
6. Hasil output/error dikirim kembali ke main thread melalui `postMessage` untuk ditampilkan di panel output.

---

## 6. Sistem Timer

- Saat mahasiswa memulai praktikum, `waktu_mulai` dikirim dan disimpan ke server (bukan hanya di client).
- Selama pengerjaan, timer yang tampil di client berfungsi sebagai indikator visual (UX) saja.
- Saat waktu habis:
  - Editor terkunci.
  - Jawaban otomatis disimpan (auto-submit).
  - Status berubah menjadi selesai.
- Saat mahasiswa melakukan submit (baik manual maupun auto-submit), server menghitung selisih `waktu_submit − waktu_mulai` dan mencocokkannya dengan durasi yang seharusnya. Jika ditemukan anomali (misalnya durasi jauh melebihi timer tanpa auto-submit tercatat), hal ini dapat ditandai sebagai indikator tambahan pada laporan admin.

---

## 7. Sistem Keamanan (Deteksi & Pencatatan)

Prinsip utama: sistem ini **tidak memblokir** aksi mahasiswa, melainkan **mendeteksi dan mencatat** aktivitas yang dianggap pelanggaran ke dalam `violation_log`.

### Fullscreen
- Praktikum dimulai dalam mode Fullscreen API.
- Jika mahasiswa keluar dari fullscreen → dicatat sebagai pelanggaran.

### Copy Paste
Aksi berikut tetap dapat dilakukan mahasiswa, namun terdeteksi dan dicatat:
- Copy
- Paste
- Cut
- Drag and Drop
- Klik kanan

### Developer Tools
Percobaan membuka DevTools melalui kombinasi tombol berikut terdeteksi dan dicatat:
- F12
- Ctrl+Shift+I
- Ctrl+Shift+C
- Ctrl+Shift+J
- Ctrl+U
- Ctrl+S
- Ctrl+P

### Deteksi Pergantian Tab
Menggunakan Page Visibility API — saat tab berpindah, dicatat sebagai pelanggaran.

### Deteksi Kehilangan Fokus
Menggunakan Window Focus API — saat browser kehilangan fokus, dicatat sebagai pelanggaran.

### Auto Save
Kode disimpan otomatis secara berkala dan saat terjadi perubahan, untuk meminimalkan kehilangan data selama sesi attempt berlangsung (sebelum submit).

---

## 8. Dashboard Monitoring

Admin dapat melihat secara real-time:
- Jumlah peserta aktif (sedang mengerjakan)
- Jumlah peserta selesai
- Persentase penyelesaian
- Durasi rata-rata pengerjaan
- Mahasiswa yang masih mengerjakan
- Riwayat pelanggaran setiap attempt peserta
- Riwayat seluruh attempt per NIM

---

## 9. Struktur Data (Database MySQL)

### Tabel Utama

**`admins`**
- Data akun admin/dosen/laboran.

**`praktikum`**
- Data kegiatan praktikum: judul, mata kuliah, deskripsi, bahasa pemrograman, tingkat kesulitan, instruksi, starter code, contoh input/output, timer, kode akses, status, jadwal mulai & berakhir.

**`peserta`**
- `id_peserta` (Primary Key, unik, auto-generated) — identitas satu kali akses/attempt praktikum.
- `nim` — boleh duplikat antar baris (antar attempt maupun antar mahasiswa).
- `nama`
- `id_praktikum` (Foreign Key)
- `waktu_mulai`
- `waktu_selesai`
- `status` (Sedang Mengerjakan / Selesai)

**`submission`**
- `id_submission` (Primary Key)
- `id_peserta` (Foreign Key, unik — satu peserta/attempt memiliki tepat satu submission, bersifat final/tidak berubah setelah tersimpan)
- Kode hasil pengerjaan
- Waktu submit

**`violation_log`**
- Mencatat **khusus pelanggaran**: jenis pelanggaran, waktu terjadi, terhubung ke `id_peserta`.

**`activity_log`**
- Mencatat **seluruh aktivitas non-pelanggaran**: mulai praktikum, auto-save, submit, dsb., terhubung ke `id_peserta`.

### Relasi Antar Tabel

- Satu `praktikum` memiliki banyak `peserta` (banyak attempt dari berbagai mahasiswa).
- Satu NIM dapat memiliki banyak baris `peserta` (banyak attempt), masing-masing dengan `id_peserta` berbeda.
- Satu `peserta` (satu `id_peserta`) memiliki tepat satu `submission`, bersifat final.
- Satu `peserta` (satu `id_peserta`) memiliki banyak `violation_log`.
- Satu `peserta` (satu `id_peserta`) memiliki banyak `activity_log`.

---

## 10. Fitur Tambahan (Opsional)

- Dashboard statistik praktikum.
- Pencarian peserta (berdasarkan NIM atau nama).
- Filter berdasarkan praktikum.
- Countdown sebelum praktikum dimulai.
- Notifikasi ketika waktu hampir habis.
- Riwayat seluruh praktikum & seluruh attempt.
- Impor soal dari file JSON.
- Ekspor laporan CSV/Excel.
- Tampilan responsif untuk desktop, tablet, dan perangkat seluler.

---

## 11. Catatan Pengembangan

Aplikasi ini berfokus sebagai media pelaksanaan praktikum pemrograman secara daring dengan mekanisme monitoring aktivitas mahasiswa, tanpa melakukan penilaian otomatis terhadap hasil kode. Sistem mencatat identitas peserta per attempt, waktu pengerjaan, status penyelesaian, aktivitas selama pengerjaan, serta pelanggaran yang terdeteksi. Mahasiswa dapat mencoba praktikum berkali-kali (selama jadwal praktikum belum berakhir), namun setiap submission yang sudah tersimpan bersifat final dan tidak dapat diubah kembali. Seluruh data tersimpan di MySQL sehingga admin dapat memantau pelaksanaan praktikum secara real-time.

Mekanisme keamanan pada aplikasi ini bersifat **deteksi dan pencatatan**, bukan pencegahan mutlak — sehingga tidak boleh diklaim sebagai jaminan anti-kecurangan penuh, melainkan sebagai alat bantu pengawasan bagi dosen/laboran.
