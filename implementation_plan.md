# Implementasi Kloning UI/UX OLX.co.id

## Deskripsi Tujuan
Tujuan dari fase ini adalah untuk melakukan setup arsitektur frontend dan mulai mengkloning antarmuka (UI) dari OLX.co.id berdasarkan hasil analisis desain dan pedoman *Visual Excellence* yang tertera pada `PRD.md`. 

Berdasarkan analisis visual dari `olx.co.id`, UI memiliki karakteristik:
1. **Header & Navigasi**: Logo utama, input lokasi, input pencarian *full-text*, navigasi login/daftar, dan tombol "+ Jual" yang prominen.
2. **Kategori (Grid)**: Ikon-ikon minimalis berbentuk sirkular untuk berbagai kategori (Mobil, Motor, Properti, dll).
3. **Card Produk**: Desain kartu dengan bayangan halus, menampilkan *thumbnail*, label/badge (seperti "Super Dealer"), judul, harga tebal, lokasi, dan ikon *wishlist* (hati).
4. **Halaman Detail**: Layout dua kolom (Media & Deskripsi di kiri, CTA/Harga/Profil Penjual di kanan).
5. **Skema Warna**: Warna utama gelap (Dark Blue/Teal) dengan aksen mencolok (Hijau Teal/Biru) untuk *Call to Action* (CTA).

## User Review Required

> [!IMPORTANT]
> **Tech Stack Frontend:** 
> Sesuai dengan `PRD.md` dan kebutuhan SEO, kita akan menggunakan **Next.js (App Router)**. 
> Untuk *styling*, sistem secara standar merekomendasikan **Vanilla CSS (CSS Modules)** untuk fleksibilitas maksimal, tanpa menggunakan TailwindCSS (kecuali Anda secara eksplisit memintanya). 
> **Apakah Anda setuju menggunakan Next.js dengan Vanilla CSS / CSS Modules untuk styling?** Atau Anda ingin menggunakan TailwindCSS?

## Open Questions
1. Apakah kita ingin langsung mengambil placeholder gambar aset (seperti ikon kategori) dari *dummy image/generate AI*, atau Anda sudah memiliki aset sendiri?
2. Pada iterasi pertama ini, saya mengusulkan untuk membangun **Homepage** dan **Halaman Detail Iklan** terlebih dahulu sebagai representasi utama. Apakah urutan ini disetujui?

---

## Proposed Changes

Kita akan memulai dengan inisialisasi Next.js dan pembuatan struktur komponen dasar.

### Setup Proyek
- Menjalankan `npx create-next-app@latest ./` di direktori root dengan konfigurasi: App Router (Yes), TypeScript (Yes), ESLint (Yes), Tailwind (No - kecuali diminta), `src/` directory (Yes).

### Konfigurasi Desain Sistem (Vanilla CSS)
#### [NEW] `src/app/globals.css`
- Mendefinisikan variabel warna CSS (CSS Custom Properties) berdasarkan palet OLX (Deep Blue `#002f34`, Teal `#00b56a`, Blue `#3a77ff`, Light Gray `#f2f4f5`).
- Setup *base styling* typography (menggunakan Google Font - Inter).
- Menyiapkan *utility classes* untuk animasi/micro-interaction (hover lift, skeleton loading).

### Komponen Reusable (UI)
#### [NEW] `src/components/Header/Header.tsx` & `Header.module.css`
- Navbar utama dengan logo, *search bar*, filter lokasi, tombol "Login", dan tombol "+ JUAL".
#### [NEW] `src/components/Footer/Footer.tsx` & `Footer.module.css`
- Tautan navigasi bawah, hak cipta, dan logo sekunder.
#### [NEW] `src/components/AdCard/AdCard.tsx` & `AdCard.module.css`
- Kartu produk untuk menampilkan gambar, harga, deskripsi singkat, lokasi, dan tombol wishlist.
#### [NEW] `src/components/CategoryIcon/CategoryIcon.tsx`
- Komponen ikon melingkar untuk daftar kategori di Homepage.

### Kloning Halaman (Pages)
#### [MODIFY] `src/app/page.tsx` & `page.module.css`
- Kloning Homepage OLX: Menggabungkan `Header`, Carousel Promo, Daftar Kategori, dan Grid "Rekomendasi Terbaru" yang memuat `AdCard`.
#### [NEW] `src/app/item/[id]/page.tsx` & `Detail.module.css`
- Kloning Halaman Detail OLX: Layout dua kolom. Kiri untuk Galeri Gambar & Deskripsi. Kanan untuk Harga, Tombol Chat/Telepon, dan Profil Singkat Penjual.

---

## Verification Plan

### Manual Verification
1. Menjalankan server *development* secara lokal (`npm run dev`).
2. Melakukan inspeksi visual di browser (localhost:3000) untuk memastikan Homepage dan Halaman Detail memiliki tata letak (*layout*) yang identik atau sangat mirip dengan desain referensi OLX.
3. Memastikan *micro-interactions* (seperti efek hover pada *AdCard*) berfungsi dan terasa mulus.
4. Mengecek ke-responsifan (Mobile & Desktop view).
