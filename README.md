# Antrian Kiosk

Monorepo sistem antrian layanan publik berbasis Laravel 11 (API) dan Next.js (web app).

## Ringkasan Fitur Saat Ini

### Kiosk Publik
- Ambil antrean layanan.
- Alur Visitor Token (warga baru dan warga lama):
  - Resolusi warga dengan token atau NIK.
  - Registrasi warga baru bila belum ada.
  - Cetak tiket antrean dan kartu/member token (dual print).
- Kamera kiosk untuk bukti hadir saat cetak antrean (face capture).
- Halaman persyaratan layanan.
- Survei kepuasan.
- Cek status dokumen (scan token atau input NIK).

### Staff Loket
- Operasional antrean real-time per loket:
  - Panggil selanjutnya.
  - Panggil antrean tertentu.
  - Recall.
  - Start layanan.
  - Skip.
  - Complete.
- Guard antrean aktif agar aksi saling konsisten.
- Modul Buku Ekspedisi Digital Dokumen:
  - Input status dokumen.
  - Sinkron otomatis dari antrean aktif (NIK, nama, jenis dokumen dari layanan).
  - Pemisahan daftar berdasarkan status: Diproses, Siap Diambil, Riwayat Sudah Diambil.
  - Status Sudah Diambil bersifat final (tidak bisa diubah lagi).
- Menampilkan bukti hadir (foto) pada antrean aktif.

### Display Publik
- Board antrean per loket secara real-time (polling API).
- Pengumuman suara saat nomor dipanggil.

### Admin
- Kelola layanan (CRUD).
- Kelola loket (CRUD + aktif/nonaktif).
- Kelola persyaratan (CRUD, rich text editor).
- Reset antrean harian.
- Laporan antrean dan survei.
- Export laporan Excel (PhpSpreadsheet).

## Struktur Monorepo

- apps/web: Frontend Next.js (kiosk, staff, admin, display).
- services/api: Backend Laravel API.

## Teknologi

- Backend: Laravel 11, Sanctum.
- Frontend: Next.js App Router, React, Tailwind CSS.
- Printing: mike42/escpos-php.
- Excel export: phpoffice/phpspreadsheet.
- QR token: qrcode.

## Prasyarat

- PHP 8.2+
- Composer
- Node.js 20+
- MySQL/MariaDB

## Setup dan Menjalankan

### 1) Backend API (Laravel)

1. Masuk ke backend:
   - cd services/api
2. Buat file env:
   - cp .env.example .env
3. Atur konfigurasi database di .env.
4. Generate key, migrasi, dan seed:
   - php artisan key:generate
   - php artisan migrate --seed
5. Buat symbolic link storage (wajib untuk face capture):
   - php artisan storage:link
6. Jalankan API:
   - php artisan serve

API default: http://localhost:8000

### 2) Frontend Web (Next.js)

1. Dari root project:
   - npm install
2. Jika dibutuhkan, salin env frontend:
   - cp apps/web/.env.local.example apps/web/.env.local
3. Jalankan frontend:
   - npm run dev:web

Atau jalankan frontend + backend sekaligus dari root:
   - npm run dev

Web default: http://localhost:3000

## Akun Seed Default

- Admin: admin@local.test / password
- Staff: staff@local.test / password

## Endpoint API Utama

Base URL: http://localhost:8000/api

### Public
- POST /login
- POST /register
- GET /services
- GET /requirements
- GET /requirements/{id}
- GET /display-board
- POST /visitors/resolve
- POST /document-status/check
- POST /queues
- POST /surveys

### Protected (Sanctum)
- POST /logout
- GET /user

#### Staff / Operasional
- POST /queues/call-next
- POST /queues/{id}/call
- POST /queues/{id}/start
- POST /queues/{id}/recall
- POST /queues/{id}/skip
- POST /queues/{id}/complete
- GET /dashboard?counter_id={id}

#### Dokumen
- GET /document-logs
- POST /document-logs
- PATCH /document-logs/{id}

#### Admin
- POST /admin/queues/reset
- GET /counters
- POST /counters
- PATCH /counters/{id}
- DELETE /counters/{id}
- POST /services
- PATCH /services/{id}
- DELETE /services/{id}
- POST /requirements
- PATCH /requirements/{id}
- DELETE /requirements/{id}
- GET /reports/queues
- GET /reports/surveys
- GET /reports/export-excel

## Catatan Operasional

- Konfigurasi printer thermal ada di file env backend (services/api/.env).
- Face capture disimpan di storage/public, pastikan storage link aktif.
- Dokumentasi kebutuhan awal tetap tersedia di Sergai_KiosK_FRS.md.
