# Antrian Kiosk

Monorepo untuk aplikasi kiosk antrean berbasis Laravel (backend API) dan Next.js (frontend).

## Struktur

- apps/web: Frontend Next.js (kiosk/staff/admin routes)
- services/api: Backend Laravel 11

## Prasyarat

- PHP 8.2+
- Composer
- Node.js 20+
- MySQL/MariaDB

## Menjalankan Backend (Laravel)

1. Masuk ke folder backend:

   cd services/api

2. Salin .env dan set konfigurasi database:

   cp .env.example .env

3. Generate app key, migrasi, dan seed data awal:

   php artisan key:generate
   php artisan migrate
   php artisan db:seed

4. Jalankan server:

   php artisan serve

## Menjalankan Frontend (Next.js)

1. Install dependencies (dari root):

   npm install

2. Salin env frontend jika perlu:

   cp apps/web/.env.local.example apps/web/.env.local

3. Jalankan dev server:

   npm run dev:web

Frontend akan hidup di http://localhost:3000

## Catatan

- API Laravel default di http://localhost:8000
- Integrasi API dan UI akan mengikuti FRS di Sergai_KiosK_FRS.md
- Akun awal: admin@local.test / password, staff@local.test / password
- Printing tiket menggunakan mike42/escpos-php. Atur ENV printer di services/api/.env

## API Awal (Laravel)

Base URL: http://localhost:8000/api

Auth:
- POST /login
- POST /logout
- POST /register

Kiosk:
- GET /services
- GET /requirements
- GET /requirements/{id}
- POST /queues
- POST /surveys

Staff:
- POST /queues/call-next
- POST /queues/{id}/start
- POST /queues/{id}/recall
- POST /queues/{id}/skip
- POST /queues/{id}/complete
- GET /dashboard?counter_id={id}

Admin:
- GET /counters
- POST /counters
- PATCH /counters/{id}
- POST /requirements
- PATCH /requirements/{id}
- DELETE /requirements/{id}
- POST /admin/queues/reset
- GET /reports/queues?period=daily|monthly&date=YYYY-MM-DD
- GET /reports/surveys
