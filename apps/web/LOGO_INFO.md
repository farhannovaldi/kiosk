# LOGO SERDANG BEDAGAI

## Instruksi Penggantian Logo

Saat ini sistem menggunakan logo placeholder SVG generik di:
```
apps/web/public/Logo.png
```

### Untuk mengganti dengan logo resmi Kabupaten Serdang Bedagai:

1. **Simpan file logo** (format PNG atau SVG) dengan nama:
   - `logo.png` (untuk PNG) atau
   - `Logo.png` (untuk SVG)

2. **Letakkan file** di folder:
   ```
   apps/web/public/
   ```

3. **Ukuran yang direkomendasikan:**
   - Lebar: 200-400px
   - Tinggi: 240-480px
   - Rasio: Vertikal (portrait)
   - Format: PNG dengan background transparan atau SVG

4. **Jika menggunakan PNG**, edit file:
   ```
   apps/web/src/components/Header.tsx
   ```
   Ubah baris:
   ```tsx
   src="/Logo.png"
   ```
   Menjadi:
   ```tsx
   src="/logo.png"
   ```

Logo akan otomatis muncul di:
- ✅ Halaman Kiosk (semua sub-halaman)
- ✅ Dashboard Staff
- ✅ Dashboard Admin
- ✅ Header setiap halaman

---

## Palette Warna yang Digunakan

Berdasarkan logo Serdang Bedagai:

### Primary (Hijau)
- `brand-500`: #32cc4b (Hijau utama)
- `brand-600`: #24a839 (Hijau gelap)
- `brand-900`: #1a5726 (Hijau sangat gelap)

### Secondary (Emas/Kuning)
- `accent-400`: #fce041 (Emas terang)
- `accent-500`: #eac51c (Emas)

### Accent Colors
- `serdang-red`: #c12c2c (Merah)
- `serdang-blue`: #2c8ac1 (Biru)

Warna-warna ini sudah diterapkan di seluruh frontend untuk konsistensi visual.
