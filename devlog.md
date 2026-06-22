# Development Log: OLX-like Marketplace

Dokumen ini digunakan untuk mencatat progres, pembaruan fitur, perbaikan bug, dan perubahan signifikan selama siklus pengembangan aplikasi.

### Format Pengisian:
```
## [YYYY-MM-DD] - [Fase / Topik Pekerjaan]
- **Fitur / Modul:** [Nama modul atau komponen yang dikerjakan]
- **Deskripsi:** [Penjelasan rinci mengenai apa yang diimplementasikan, diperbaiki, atau diubah]
- **Status:** [Selesai / Sedang Berjalan / Tertunda]
- **Catatan Teknis / Kendala:** [Detail teknis tambahan, library yang ditambahkan, atau masalah yang ditemui]
```

---

## 2026-06-18 - Fase 1: Perencanaan & Persiapan
- **Fitur / Modul:** Inisialisasi Dokumen Proyek
- **Deskripsi:** Membuat dokumen pedoman utama proyek termasuk Product Requirements Document (PRD.md), rute pengembangan (devplan.md), dan log pengembangan (devlog.md).
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Dokumen berhasil disusun sebagai dasar untuk langkah setup proyek dan arsitektur selanjutnya.

## 2026-06-18 - Fase 1: Perencanaan & Persiapan
- **Fitur / Modul:** Deep Analysis & Pembaruan PRD
- **Deskripsi:** Melakukan analisis mendalam dan merombak struktur PRD. Menambahkan standar panduan UI/UX (Premium & Dynamic), Arsitektur Teknis & SEO (Next.js & SSR), serta Keamanan (AI Moderation & Fraud Detection).
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Menetapkan standar aplikasi dengan performa tinggi (Core Web Vitals) dan keamanan tinggi untuk menekan angka fraud.

## 2026-06-20 - Fase 3: Pengembangan Core Frontend
- **Fitur / Modul:** Integrasi Supabase & Pasang Iklan
- **Deskripsi:** Menghubungkan form Pasang Iklan (`/jual`) ke database Supabase, termasuk upload foto ke Supabase Storage (`ad_images`) dan penyimpanan koordinat lokasi Google Maps. Pembuatan notifikasi sukses modal murni CSS.
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Harus mengatur Row Level Security (RLS) di Supabase Storage agar publik bisa insert gambar.

## 2026-06-20 - Fase 4: Pencarian & Eksplorasi
- **Fitur / Modul:** Beranda Dinamis (Server-Side Rendering)
- **Deskripsi:** Mengubah halaman beranda (`/page.tsx`) menjadi Async Server Component yang menarik data iklan secara real-time dari Supabase, memformat harga Rupiah, dan menghitung waktu tayang relatif.
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Implementasi Next.js SSR dengan `@supabase/ssr` untuk kecepatan loading tanpa indikator spinner.

## 2026-06-20 - Fase 4: Pencarian & Eksplorasi
- **Fitur / Modul:** Halaman Detail Iklan Dinamis (`/item/[id]`)
- **Deskripsi:** Mengambil data spesifik iklan, profil penjual, dan koleksi foto menggunakan ID dari URL. Menambahkan komponen Galeri Foto interaktif dan Embed Peta Lokasi.
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Menggunakan OpenStreetMap untuk peta tanpa API Key. Memisahkan query Profil dari Iklan untuk menghindari error relasi *foreign key* (PGRST200).

---

## 2026-06-22 - Fase 3: Pengembangan Core Frontend
- **Fitur / Modul:** Halaman Profil & Dashboard Manajemen Iklan (`/profile`)
- **Deskripsi:** Merombak halaman `/profile` dari data statis menjadi Server Component yang terhubung dengan Supabase Auth. Menambahkan proteksi rute (redirect ke `/login` jika belum login). Tab "Iklan Saya" kini menampilkan iklan asli milik user. Tab "Pengaturan Akun" kini bisa menyimpan perubahan Nama dan Nomor Telepon langsung ke tabel `profiles` di Supabase.
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Memisahkan Server Component (`page.tsx`) dan Client Component (`ProfileClient.tsx`) agar proteksi auth berjalan di sisi server namun interaktivitas tab tetap berjalan di sisi klien.

## 2026-06-22 - Fase 4: Pencarian & Eksplorasi
- **Fitur / Modul:** Sistem Pencarian & Filter Dinamis (`/search`)
- **Deskripsi:** Merombak halaman `/search` menjadi Server Component dengan query builder Supabase yang dinamis. Pencarian kata kunci menggunakan `.ilike()` pada kolom `title`. Filter kategori, rentang harga (min/max), dan kondisi barang (Baru/Bekas) sudah aktif. Bar pencarian di Header kini berfungsi dan mengarahkan ke `/search?q=...`. Halaman `/search` di mobile kini memiliki tombol toggle filter yang bisa dibuka/tutup.
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Menggunakan komponen `SearchSidebarClient.tsx` terpisah untuk mengelola state filter dan memanipulasi URL parameter (`router.push`) agar Server Component dapat menarik ulang data tanpa full page reload.

## 2026-06-22 - Fase 4: Pencarian & Eksplorasi (UI Polish)
- **Fitur / Modul:** Galeri Foto Premium (`ImageGallery`) & Responsivitas Mobile Detail Iklan
- **Deskripsi:** Memperbarui komponen `ImageGallery` agar lebih menyerupai OLX asli: latar hitam, `object-fit: contain`, tombol panah navigasi. Di tampilan mobile: panah disembunyikan, diganti dengan gesture swipe (touch events), thumbnail strip disembunyikan, dan digantikan oleh **dot pagination indicator** yang bergerak saat foto diganti. Layout halaman detail iklan di mobile juga diubah menggunakan teknik CSS `display: contents` + `order` agar harga/judul/lokasi tampil langsung di bawah galeri foto tanpa mengubah layout desktop sama sekali.
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Menggunakan `display: contents` pada `.leftCol` dan `.rightCol` di media query mobile — teknik ini membuat kedua elemen "transparan" secara layout sehingga anak-anaknya dapat diurutkan ulang dengan property `order` seolah mereka adalah saudara langsung di container.

---

## 2026-06-22 - Fase 3: Pengembangan Core Frontend
- **Fitur / Modul:** Edit & Hapus Iklan (`/profile` + `/profile/edit/[id]`)
- **Deskripsi:** Menambahkan fitur manajemen iklan lengkap dari tab "Iklan Saya" di halaman profil. Tab kini menampilkan list card per iklan (thumbnail, judul, harga, kategori, kondisi, tanggal, status badge) dengan dua tombol aksi: **✏️ Edit** dan **🗑️ Hapus**. Tombol Hapus memunculkan modal konfirmasi animasi sebelum menghapus iklan beserta foto-fotonya dari Supabase Storage dan tabel `ad_images`. Tombol Edit mengarahkan ke halaman `/profile/edit/[id]` yang berisi form pre-filled (judul, kategori, harga, kondisi, deskripsi) dengan manajemen foto: lihat foto existing, hapus foto existing, tambah foto baru. Setelah simpan, redirect kembali ke `/profile`.
- **Status:** Selesai
- **Catatan Teknis / Kendala:** (1) Next.js 16 memerlukan `params` di-`await` sebagai Promise sebelum diakses (`const { id } = await params`). (2) Deletion dari storage dibuat non-fatal agar update teks tetap berhasil meski ada batasan RLS policy di Supabase Storage.

## 2026-06-22 - Fase 4: Pencarian & Eksplorasi
- **Fitur / Modul:** Sorting di Pencarian (`/search`)
- **Deskripsi:** Menambahkan fitur urutkan (Sorting) pada halaman pencarian di bagian Sidebar. Pengguna kini dapat mengurutkan hasil pencarian berdasarkan: Terbaru (default), Harga Termurah, dan Harga Termahal. Parameter ini disambungkan dengan query Supabase menggunakan metode `.order()`.
- **Status:** Selesai
- **Catatan Teknis / Kendala:** Memanfaatkan State lokal di `SearchSidebarClient.tsx` dan meneruskan parameter URL `sort` ke Server Component `page.tsx` tanpa masalah.

---

## Sesi Berikutnya — Yang Perlu Dikerjakan
1. **Chat Fungsional** — Halaman `/chat` masih UI statis, belum terhubung ke Supabase Realtime untuk berkirim pesan sungguhan antara penjual dan pembeli.
