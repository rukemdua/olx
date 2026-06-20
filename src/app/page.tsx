import Link from 'next/link';
import styles from './page.module.css';
import AdCard from '@/components/AdCard/AdCard';
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon';
import { Car, Bike, Home as HomeIcon, Smartphone, Briefcase, Dumbbell, LayoutGrid } from 'lucide-react';

export default function Home() {
  const categories = [
    { id: '1', title: 'Mobil', href: '/mobil', icon: <Car /> },
    { id: '2', title: 'Motor', href: '/motor', icon: <Bike /> },
    { id: '3', title: 'Properti', href: '/properti', icon: <HomeIcon /> },
    { id: '4', title: 'Handphone', href: '/elektronik', icon: <Smartphone /> },
    { id: '5', title: 'Jasa & Kerja', href: '/jasa', icon: <Briefcase /> },
    { id: '6', title: 'Olahraga', href: '/hobi', icon: <Dumbbell /> },
    { id: '7', title: 'Lainnya', href: '/kategori', icon: <LayoutGrid /> },
  ];

  const recommendations = [
    { id: '101', title: 'Honda Brio E Satya 2020 Mulus', price: 'Rp 145.000.000', location: 'Jakarta Selatan', time: 'Hari ini', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&q=80', featured: true },
    { id: '102', title: 'iPhone 13 Pro Max 256GB ex iBox', price: 'Rp 14.500.000', location: 'Surabaya', time: 'Kemarin', imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&q=80' },
    { id: '103', title: 'Rumah Minimalis Modern di Bintaro', price: 'Rp 1.250.000.000', location: 'Tangerang Selatan', time: '2 hari lalu', imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80', featured: true },
    { id: '104', title: 'Yamaha NMAX Connected 2022', price: 'Rp 28.500.000', location: 'Bandung', time: 'Hari ini', imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&q=80' },
    { id: '105', title: 'MacBook Pro M1 2020 8/256', price: 'Rp 11.000.000', location: 'Yogyakarta', time: '3 hari lalu', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80' },
    { id: '106', title: 'Sofa Minimalis L Shape', price: 'Rp 3.500.000', location: 'Jakarta Barat', time: 'Hari ini', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80' },
    { id: '107', title: 'Sony A7III Body Only', price: 'Rp 21.000.000', location: 'Jakarta Pusat', time: '1 jam lalu', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80', featured: true },
    { id: '108', title: 'Sepeda Lipat Brompton M6L', price: 'Rp 25.000.000', location: 'Bali', time: 'Kemarin', imageUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500&q=80' },
  ];

  return (
    <div className={styles.main}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>⚡ Platform Jual Beli Terpercaya</div>
          <h1 className={styles.heroTitle}>
            Jual & Beli<br />
            Lebih <span>Mudah</span> dari Sebelumnya
          </h1>
          <p className={styles.heroSubtitle}>
            Temukan jutaan barang bekas berkualitas di sekitarmu. Proses cepat, aman, dan terpercaya.
          </p>

          <div className={styles.heroSearch}>
            <input
              type="text"
              className={styles.heroSearchInput}
              placeholder="Cari mobil, motor, handphone, dan lainnya..."
              aria-label="Cari iklan"
            />
            <button className={styles.heroSearchBtn} aria-label="Cari">🔍</button>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>5 Juta+</span>
              <span className={styles.heroStatLabel}>Iklan Aktif</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>2 Juta+</span>
              <span className={styles.heroStatLabel}>Pengguna</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>500+</span>
              <span className={styles.heroStatLabel}>Kota</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Telusuri Kategori</h2>
            <Link href="/kategori" className={styles.sectionLink}>Lihat Semua →</Link>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <CategoryIcon key={cat.id} title={cat.title} href={cat.href} icon={cat.icon} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMO BANNER ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.promoBanner}>
            <div className={styles.promoContent}>
              <div className={styles.promoTag}>✨ Promo Terbatas</div>
              <h2 className={styles.promoTitle}>Pasang Iklan Gratis,<br />Jual Lebih Cepat!</h2>
              <p className={styles.promoSubtitle}>Ratusan pembeli menunggu iklan Anda setiap harinya.</p>
              <Link href="/jual" className={styles.promoBtn}>
                + Pasang Iklan Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECOMMENDATIONS ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Rekomendasi Terbaru</h2>
            <Link href="/kategori" className={styles.sectionLink}>Lihat Semua →</Link>
          </div>
          <div className={styles.productGrid}>
            {recommendations.map((item) => (
              <AdCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                location={item.location}
                time={item.time}
                imageUrl={item.imageUrl}
                featured={item.featured}
              />
            ))}
          </div>
          <div className={styles.loadMoreContainer}>
            <button className={styles.loadMoreBtn}>Muat Lebih Banyak</button>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.trustSection}>
            <div className={styles.trustGrid}>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>🔒</div>
                <div>
                  <div className={styles.trustTitle}>Transaksi Aman</div>
                  <div className={styles.trustDesc}>Kami menyarankan metode pertemuan tatap muka (COD) agar Anda dapat memeriksa barang langsung sebelum membayar.</div>
                </div>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>⚡</div>
                <div>
                  <div className={styles.trustTitle}>Jual Lebih Cepat</div>
                  <div className={styles.trustDesc}>Iklan Anda menjangkau jutaan pembeli aktif di seluruh Indonesia setiap hari.</div>
                </div>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>🤝</div>
                <div>
                  <div className={styles.trustTitle}>Komunitas Terpercaya</div>
                  <div className={styles.trustDesc}>Bergabung bersama lebih dari 2 juta penjual dan pembeli terpercaya di platform kami.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
