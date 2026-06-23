# Development Plan: OLX-like Marketplace

Dokumen ini menguraikan fase-fase pembangunan platform marketplace (C2C & B2C) berdasarkan Product Requirements Document (PRD).

## Fase 1: Perencanaan, Desain & Setup Lingkungan (Minggu 1-2)
- [ ] Finalisasi dokumen kebutuhan (PRD, Development Plan, Skema Database).
- [ ] Setup repository (Git) dan struktur proyek (Frontend & Backend).
- [ ] Desain UI/UX (Wireframing, Mockup, Prototyping) mencakup responsive web dan mobile app.
- [ ] Setup infrastruktur dasar (Server development, Database Relasional, Redis).

## Fase 2: Pengembangan Core Backend & Database (Minggu 3-4)
- [ ] Pembuatan skema database dan migrasi.
- [ ] Pengembangan API Autentikasi & Manajemen Pengguna (Register, Login, Verifikasi OTP, Profil).
- [ ] Pengembangan API Manajemen Kategori (Hierarki kategori dinamis).
- [ ] Pengembangan API Iklan/Ads (CRUD Iklan).
- [ ] Integrasi layanan Cloud Storage untuk kompresi dan manajemen file gambar/video (Mendukung hingga 20 gambar/iklan).

## Fase 3: Pengembangan Core Frontend (Minggu 5-6)
- [x] Implementasi layout dasar aplikasi (Navbar, Footer, Sidebar).
- [x] Integrasi flow Autentikasi (Halaman Login, Register, Lupa Password, OTP).
- [x] Halaman Profil Pengguna dan Dashboard Manajemen Iklan.
- [x] Halaman Pemasangan Iklan (Form spesifik kategori yang dinamis dan geo-tagging pintar).

## Fase 4: Pencarian, Eksplorasi & Sistem Komunikasi (Minggu 7-8)
- [x] Implementasi sistem pencarian (Hyper-local search), filter, dan sorting.
- [x] Halaman Detail Iklan (Menampilkan informasi lengkap barang dan info penjual).
- [ ] (Opsional) Integrasi Elasticsearch untuk pencarian pintar dan typo tolerance.
- [x] Fitur Chat In-App secara real-time (Mendukung smart replies, indikator status/read receipts).

## Fase 5: Monetisasi, Keamanan & Layanan Tambahan (Minggu 9-10)
- [ ] Integrasi Payment Gateway untuk fitur layanan berbayar (Highlight / Sundul Iklan, Label Urgensi).
- [ ] Implementasi sistem verifikasi pengguna lanjutan untuk Trust & Safety (Upload KTP -> Badge Verified).
- [ ] Optimasi keamanan (Rate-limiting, Fraud detection di sistem chat).
- [ ] Implementasi Push Notifications (FCM/APNs) untuk pembaruan status dan pesan baru.

## Fase 6: Pengujian (QA) & Bug Fixing (Minggu 11)
- [ ] Pengujian fungsi kritis (Unit Testing dan Integration Testing).
- [ ] User Acceptance Testing (UAT).
- [ ] Load testing untuk mensimulasikan high concurrency (Traffic tinggi).
- [ ] Perbaikan bug dan finalisasi performa visual (Optimasi aset gambar format WebP, caching).

## Fase 7: Deployment & Peluncuran (Minggu 12)
- [x] Setup environment produksi (Vercel + Supabase, Domain beta aktif).
- [x] Setup pipeline CI/CD: GitHub → Vercel auto-deploy pada setiap push ke branch `main`.
- [x] Deployment Frontend ke Vercel berhasil. URL live: https://olx-beta-woad.vercel.app/
- [x] Peluncuran platform versi beta.
- [ ] Pemantauan/monitoring metrik kesuksesan (MAU, Ad Liquidity, dll).
