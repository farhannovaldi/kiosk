# **SPESIFIKASI KEBUTUHAN**  **FUNGSIONAL (FRS)**

## 

## **A. MODUL FRONTEND KIOSK (Sisi Warga)**

*Antarmuka layar sentuh yang digunakan langsung oleh masyarakat.*

### **1\. Halaman Utama (Home Screen)**

**FR-K-01: Navigasi Menu Utama**

* **Deskripsi:** Menampilkan 3 (tiga) tombol menu utama dengan ikon besar dan teks yang jelas.  
* **Input:** Sentuhan jari pada tombol.  
* **Proses:** Sistem mengarahkan user ke halaman sub-menu yang sesuai.  
* **Elemen:**  
  1. Tombol "Ambil Antrean".  
  2. Tombol "Informasi Persyaratan".  
  3. Tombol "Survei Kepuasan".  
* **Behavior:** Tidak ada *timeout* (layar selalu menyala menampilkan menu ini).

---

### **2\. Fitur Ambil Antrean (Queue Ticket)**

**FR-K-02: Pemilihan Layanan**

* **Pre-condition:** User menekan tombol "Ambil Antrean".  
* **Tampilan:** Daftar kategori layanan (Contoh: "A \- Pelayanan KTP/KK", "B \- Pelayanan Umum", "C \- Legalisir"). Data diambil dari tabel services.  
* **Input:** User memilih salah satu kategori.

**FR-K-03: Generasi & Cetak Nomor (Ticket Printing)**

* **Proses:**  
  * Sistem mengecek nomor terakhir untuk layanan tersebut di database pada tanggal hari ini.  
  * Sistem melakukan *increment* (+1) nomor urut.  
  * Sistem menyimpan data ke tabel queues dengan status waiting.  
  * Sistem mengirim perintah *Raw Print* ke Thermal Printer.  
* **Output Fisik:** Struk kertas berisi:  
  * Logo Kecamatan (Header).  
  * Nomor Antrean (Font Besar, misal: A-012).  
  * Nama Layanan.  
  * Tanggal & Jam (WIB).  
  * Jumlah antrean yang sedang menunggu (opsional, agar warga tahu estimasi).  
* **Post-condition:** Tampil pesan di layar "Silakan Ambil Tiket Anda", lalu kembali ke Home Screen otomatis dalam 5 detik.

---

### **3\. Fitur Cek Persyaratan (Requirements Info)**

**FR-K-04: Katalog Persyaratan**

* **Pre-condition:** User menekan tombol "Informasi Persyaratan".  
* **Tampilan:** List/Grid tombol judul persyaratan (Contoh: "KTP Baru", "Akte Kelahiran", "Surat Pindah").  
* **Data Source:** Mengambil data aktif dari tabel requirements.

**FR-K-05: Detail Persyaratan**

* **Input:** User memilih salah satu judul.  
* **Tampilan:** Halaman detail yang berisi teks daftar syarat (Bulleted list) yang mudah dibaca.  
* **Navigasi:** Harus ada tombol "KEMBALI" yang besar di bagian bawah untuk balik ke daftar judul atau Home.

---

### **4\. Fitur Survei Kepuasan (Satisfaction Survey)**

**FR-K-06: Input Rating (Emoji)**

* **Pre-condition:** User menekan tombol "Survei Kepuasan".  
* **Tampilan:** Pertanyaan "Bagaimana pelayanan kami?" dan 4 Ikon Emoji:  
  1. Sangat Puas (Hijau/Senyum Lebar).  
  2. Puas (Biru/Senyum).  
  3. Cukup (Kuning/Datar).  
  4. Kurang (Merah/Sedih).  
* **Input:** User menekan salah satu ikon.

**FR-K-07: Penyimpanan Survei**

* **Proses:** Sistem menyimpan pilihan rating, tanggal, dan jam ke tabel surveys.  
* **Output:** Tampil pesan "Terima Kasih atas Masukan Anda\!", lalu kembali ke Home Screen otomatis dalam 3 detik.

---

## **B. MODUL STAFF DASHBOARD (Sisi Petugas Loket)**

*Aplikasi web berbasis desktop yang dibuka di komputer/laptop petugas.*

### **1\. Manajemen Antrean (Queue Operation)**

**FR-S-01: Tampilan Dashboard Real-time**

* **Deskripsi:** Petugas melihat status antrean terkini.  
* **Elemen:**  
  * **Nomor Dipanggil:** Nomor besar yang sedang dilayani saat ini.  
  * **Sisa Antrean:** Jumlah antrean status waiting yang sesuai dengan filter loket petugas.  
  * **Riwayat Singkat:** 5 nomor terakhir yang sudah selesai.

**FR-S-02: Panggil Antrean (Call Logic)**

* **Input:** Tombol "Panggil Selanjutnya" (Call Next).  
* **Logic:**  
  1. Query mencari data queues dengan status waiting.  
  2. Filter berdasarkan service\_id yang ditugaskan ke loket ini (Lihat FR-S-05).  
  3. Urutkan berdasarkan created\_at (FIFO \- First In First Out).  
  4. Update status menjadi called.  
  5. Trigger suara panggilan (Voice Announcer).

**FR-S-03: Aksi Layanan (Serve Actions)**

* **Input:** Petugas memiliki 3 opsi tombol setelah memanggil:  
  1. **Mulai Layani:** Mengubah status jadi serving. Timer durasi pelayanan dimulai.  
  2. **Panggil Ulang (Recall):** Membunyikan kembali suara panggilan (limit 3x).  
  3. **Lewati (Skip):** Jika warga tidak datang. Mengubah status jadi skipped. Nomor antrean dilempar dari daftar aktif.

**FR-S-04: Selesaikan Layanan (Complete)**

* **Input:** Tombol "Selesai".  
* **Logic:** Mengubah status jadi completed. Mencatat waktu selesai (untuk menghitung rata-rata durasi pelayanan). Layar dashboard siap memanggil nomor baru.

### **2\. Konfigurasi Loket (Counter Config)**

**FR-S-05: Pengalihan Loket (Service Switching)**

* **Deskripsi:** Fitur untuk menentukan loket ini melayani apa saja.  
* **Tampilan:** Checkbox list berisi semua jenis layanan (KTP, Umum, Legalisir).  
* **Skenario:**  
  * Jika Loket 1 hanya mencentang "KTP", tombol "Panggil" hanya menarik antrean KTP.  
  * Jika Loket 1 mencentang "KTP" \+ "Umum", tombol "Panggil" menarik antrean gabungan berdasarkan waktu kedatangan tercepat.  
* **Penyimpanan:** Disimpan di tabel counters kolom assigned\_services.

---

## **C. MODUL ADMIN (Back Office)**

*Panel khusus Kepala Seksi atau Admin IT untuk pengaturan data.*

### **1\. Manajemen Data Master (CMS)**

**FR-A-01: CRUD Persyaratan**

* Admin dapat menambah, mengedit, dan menghapus data persyaratan yang tampil di Kiosk.  
* Field: Judul, Isi Konten, Status (Aktif/Nonaktif).

**FR-A-02: Reset Antrean Manual**

* Tombol darurat "Reset Antrean Hari Ini". Digunakan jika terjadi kesalahan sistem fatal, mengembalikan counter nomor ke 0\.

### **2\. Pelaporan (Reporting)**

**FR-A-03: Laporan Statistik Antrean**

* Filter: Harian / Bulanan.  
* Data: Total Pengunjung, Rata-rata Waktu Tunggu, Jumlah Skipped.  
* Action: Export to Excel/PDF.

**FR-A-04: Laporan Kepuasan Masyarakat**

* Menampilkan grafik pie chart persentase kepuasan (Berapa % Sangat Puas vs Kurang Puas).

---

## **D. NON-FUNCTIONAL REQUIREMENTS (Spesifikasi Teknis)**

1. **Platform:**  
   * Backend: Laravel 10/11 (PHP 8.2+).  
   * Frontend Kiosk: Next.js (React) atau Blade Template dengan Fullscreen Browser Mode.  
   * Database: MySQL / MariaDB.  
2. **Konektivitas:** Local Area Network (LAN) via kabel UTP atau WiFi stabil.  
3. **Hardware Interface:**  
   * Kompatibel dengan Thermal Printer 80mm/58mm (ESC/POS Command).  
   * Resolusi Layar Kiosk: 1080p (Rekomendasi) atau 1366x768 (Minimal).  
4. **Keamanan:**  
   * Login Petugas/Admin menggunakan Username & Password terenkripsi (Bcrypt).  
   * Proteksi CSRF pada setiap form input.

---

### **Catatan Penting untuk Developer:**

Dokumen FRS ini adalah **kontrak fitur**. Fokuskan pengembangan pada:

1. **Logic Antrean (FR-S-02):** Pastikan query whereIn untuk *Service Switching* berjalan lancar agar antrean tidak macet.  
2. **Stabilitas Printer (FR-K-03):** Gunakan library yang handal (seperti mike42/escpos-php untuk backend printing atau RawBT untuk client-side printing) agar struk keluar cepat.