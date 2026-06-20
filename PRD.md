# Product Requirements Document (PRD): OLX-like Marketplace (C2C & B2C)

## 1. Pendahuluan

### 1.1 Tujuan Dokumen
Dokumen ini menguraikan spesifikasi, fitur, arsitektur sistem, dan panduan desain UI/UX untuk platform iklan baris (classified ads) yang terinspirasi dari **OLX.com**. Dokumen ini digunakan sebagai panduan komprehensif bagi tim produk, desain, dan pengembangan teknis selama siklus hidup pembuatan aplikasi.

### 1.2 Visi Produk
Menciptakan ekosistem pasar digital (marketplace) lokal yang berfokus pada pengalaman pengguna yang **premium, dinamis, dan ultra-cepat**. Menghubungkan pembeli dan penjual secara hiper-lokal untuk melakukan transaksi barang bekas, kendaraan, properti, lowongan kerja, dan jasa dengan sistem keamanan dan moderasi pintar.

### 1.3 Target Pengguna
*   **Penjual Pribadi (C2C):** Individu yang ingin menjual barang bekas secara instan dari smartphone mereka.
*   **Pembeli:** Pencari barang bekas/baru di lokasi terdekat dengan fokus pada harga kompetitif.
*   **Penjual Profesional/Bisnis (B2C):** Dealer mobil, agen properti, atau UMKM dengan fitur manajemen inventaris yang mumpuni.

---

## 2. Desain UI/UX & Estetika (Visual Excellence)
> [!IMPORTANT]
> Aplikasi harus menghindari desain generik dan standar. Fokus utama pada visual yang premium, estetika modern, dan interaksi yang hidup.

### 2.1 Filosofi Desain
*   **Premium & Clean:** Tata letak yang luas dengan pemanfaatan *white space* secara optimal. Elemen UI tidak saling berdesakan.
*   **Dynamic & Interactive:** Setiap interaksi pengguna (hover, klik, scroll) harus memberikan umpan balik visual yang halus. Aplikasi harus terasa "hidup".

### 2.2 Panduan Visual
*   **Warna:** Menghindari warna primer standar (merah bata atau biru biasa). Menggunakan palet *HSL-tailored* yang harmonis (misal: warna aksen *vibrant indigo* atau *teal* dengan gradasi halus). Mendukung **Dark Mode** secara *native* dan elegan (menggunakan nuansa *dark grey/slate*, bukan sekadar hitam murni).
*   **Tipografi:** Menggunakan font modern dari Google Fonts seperti **Inter**, **Outfit**, atau **Plus Jakarta Sans** untuk tingkat keterbacaan tinggi dan kesan aplikasi modern.
*   **Komponen UI:** Pemanfaatan *Glassmorphism* ringan (efek tembus pandang/blur) pada elemen mengambang seperti navigasi bawah (bottom bar) atau sticky header. Sudut elemen (border-radius) yang konsisten (misal: 12px atau 16px).

### 2.3 Micro-Animations & Interaksi
*   **Skeleton Loading:** Tidak menggunakan *spinner* biasa. Halaman yang sedang dimuat harus menampilkan animasi *skeleton/shimmer* yang transisinya halus ke konten asli.
*   **Hover & Transitions:** Efek terangkat (*lift effect*) dan bayangan dinamis saat kursor berada di atas kartu produk.
*   **Micro-interactions:** Animasi kecil saat menyukai produk (ikon hati/wishlist), mengirim pesan, atau perpindahan antar tab (sliding effect).

---

## 3. Fitur Utama (Core Features)

### 3.1 Manajemen Pengguna & Autentikasi
*   **Pendaftaran & Login:** Social Login (Google, Facebook, Apple) dan verifikasi OTP (WhatsApp/SMS).
*   **Profil Interaktif:** Halaman profil publik yang menampilkan reputasi, statistik performa (waktu balas pesan), dan *infinite scroll* untuk daftar iklan aktif.

### 3.2 Pemasangan Iklan Pintar (Smart Ad Posting)
*   **Kategorisasi Dinamis:** Kolom spesifikasi otomatis beradaptasi (Contoh: Mobil memunculkan opsi KM dan Transmisi).
*   **Media Teroptimasi:** Unggah batch hingga 20 foto. Aplikasi otomatis mengubah format gambar menjadi WebP/AVIF di background untuk menjaga kualitas namun ukuran sangat kecil.
*   **Geo-Tagging Akurat:** Penentuan lokasi penjualan presisi tinggi dengan integrasi Maps API.

### 3.3 Pencarian dan Eksplorasi (Search & Discovery)
*   **Pencarian Berbasis Lokasi (Hyper-local):** Prioritas menampilkan barang dalam radius 5-10km dari pengguna.
*   **Rekomendasi Berbasis AI:** Menyarankan produk berdasarkan riwayat pencarian pengguna (Behavioral tracking).
*   **Typo-Tolerant Search:** Jika pengguna mengetik "Mbil Bekas", sistem tetap menampilkan "Mobil Bekas".

### 3.4 Sistem Komunikasi & Negosiasi
*   **Real-time Chat:** Pengalaman seperti WhatsApp.
*   **Smart Replies:** Saran balasan otomatis ("Barang masih?", "Bisa nego?", "Lokasi COD dimana?").
*   **Share Attachment:** Pengguna dapat membagikan lokasi GPS (*Share Loc*) atau gambar tambahan via chat.

### 3.5 Layanan Bernilai Tambah (Monetisasi)
*   **Ad Boosting (Sundul Iklan):** Berbagai paket visibilitas (Top Listing 3 hari, 7 hari).
*   **Badge Premium:** "Urgent Sale (BU)", "Harga Turun".

---

## 4. Arsitektur Teknis & SEO

### 4.1 Teknologi Frontend (SEO-First)
> [!TIP]
> Mengingat tingginya persaingan keyword, SEO harus dibangun di dalam arsitektur dasar, bukan sebagai fitur tambahan (afterthought).

*   **Framework:** **Next.js** (React) untuk web app guna mendukung Server-Side Rendering (SSR). Hal ini memastikan bot mesin pencari (Googlebot) dapat membaca konten iklan dengan mudah.
*   **Meta Tags Dinamis:** Tiap URL halaman iklan akan men-generate `<title>` dan `<meta description>` dinamis (Contoh: "Jual Honda Brio 2020 Bekas Murah di Jakarta Selatan - [Nama App]").
*   **Semantic HTML:** Penggunaan hierarki `<h1>`, `<h2>`, `<article>`, dan JSON-LD (Schema Markup) untuk produk agar muncul *rich snippets* di Google.

### 4.2 Arsitektur Backend & Database
*   **Arsitektur:** Mengadopsi **Modular Monolith** untuk kecepatan rilis awal, dengan pemisahan domain logis (Auth, Ads, Chat, Payment) agar mudah di-*scale* menjadi *Microservices* ke depannya.
*   **Database Relasional (PostgreSQL):** Menyimpan data transaksional, user, dan skema pembayaran yang ketat.
*   **Database Pencarian (Elasticsearch/Meilisearch):** Menangani *full-text search* super cepat, *faceted filtering* (filter kompleks), dan geospasial query.
*   **Caching (Redis):** Menyimpan data sesi, *rate-limiting*, dan menyajikan *homepage* serta katalog populer tanpa harus *query* ulang ke database utama setiap saat.

---

## 5. Keamanan, Trust, dan Moderasi (Trust & Safety)

> [!CAUTION]
> Marketplace adalah target utama penipu (scammers). Fitur di bawah ini mutlak diperlukan untuk menjaga kepercayaan pengguna.

*   **AI Image Moderation:** Pemeriksaan otomatis saat user mengunggah foto. Menolak foto berunsur pornografi, kekerasan, atau foto yang mengandung teks/nomor HP secara eksplisit (mencegah bypass chat aplikasi).
*   **Chat Fraud Detection:** Algoritma yang mendeteksi pola percakapan penipuan (misal: meminta transfer langsung ke rekening mencurigakan, mengirim tautan/link phishing) dan memunculkan *Warning Banner* di layar chat pembeli.
*   **Sistem Verifikasi (KYC):** Badge *Verified User* dengan mengunggah foto KTP dan verifikasi biometrik wajah (Liveness Check).

---

## 6. Alur Pengguna (User Flow)

### 6.1 Alur Penemuan & Transaksi
1.  **Homepage:** Pengguna membuka aplikasi. UI memuat *skeleton state* kurang dari 1 detik.
2.  **Eksplorasi:** Scroll mulus melihat produk dengan *hover effect* menarik. Algoritma menampilkan produk terdekat.
3.  **Detail Produk:** Gambar dimuat seketika (WebP). Pengguna melihat informasi *Verified* dari penjual.
4.  **Negosiasi:** Mengklik tombol CTA (Call to Action) chat yang sangat jelas. Pesan dikirim real-time dengan status *read-receipts*.
5.  **Penyelesaian:** Penjual menyetujui, menandai item sebagai "Terjual", yang otomatis menghapusnya dari peredaran pencarian aktif.

---

## 7. Metrik Kesuksesan (KPIs & Telemetry)

Selain metrik bisnis standar, kita memonitor metrik performa aplikasi:
*   **Core Web Vitals:** LCP (Largest Contentful Paint) di bawah 2.5 detik, FID (First Input Delay) mendekati nol, dan tanpa pergeseran layout (CLS < 0.1).
*   **Ad Liquidity:** % barang terjual dalam 14 hari pertama.
*   **Chat Conversion Rate:** Rasio jumlah pengunjung *Ad Detail* yang melakukan inisiasi chat.
*   **Fraud Rate:** Jumlah laporan penipuan berbanding dengan total transaksi yang berhasil diproses per bulan (harus ditekan seminimal mungkin).
