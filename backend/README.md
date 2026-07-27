# OPLab Backend

Backend TypeScript + Express untuk OPLab. Saat ini hanya mencakup:
- Endpoint autentikasi admin: `POST /api/admin/login`
- Health check: `GET /api/health`

## Menjalankan

1. Salin `.env.example` menjadi `.env`, sesuaikan kredensial database MySQL.
2. Pastikan database `oplab_db` sudah dibuat dari `database.sql` dan admin
   sudah di-seed dari `database/seeders/seed_admin.sql`.
3. Install dependency:
   ```bash
   npm install
   ```
4. Jalankan mode development:
   ```bash
   npm run dev
   ```
   Server berjalan di `http://localhost:4000`.

## Menambah admin baru

```bash
npm run hash -- <password_baru>
```
Salin hash yang dihasilkan ke query `INSERT INTO admins (...)`.
