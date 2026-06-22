import Link from 'next/link';
import styles from './page.module.css';
import AdCard from '@/components/AdCard/AdCard';
import CategoryIcon from '@/components/CategoryIcon/CategoryIcon';
import { Car, Bike, Home as HomeIcon, Smartphone, Briefcase, Dumbbell, LayoutGrid } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

function formatRupiah(number: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mnt lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 172800) return 'Kemarin';
  return `${Math.floor(seconds / 86400)} hari lalu`;
}

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch active ads ordered by newest
  const { data: ads, error } = await supabase
    .from('ads')
    .select(`
      id,
      title,
      price,
      address,
      created_at,
      ad_images ( url )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(12);

  const recommendations = (ads || []).map(ad => {
    // Determine image URL
    let imageUrl = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&q=80'; // Placeholder
    if (ad.ad_images && ad.ad_images.length > 0) {
      imageUrl = ad.ad_images[0].url;
    }

    // Ambil bagian alamat yang ringkas (misal 2 bagian terakhir jika koma)
    let shortLocation = ad.address || 'Indonesia';
    if (shortLocation.includes(',')) {
      const parts = shortLocation.split(',').map((s: string) => s.trim());
      shortLocation = parts.length > 2 ? `${parts[parts.length - 2]}` : parts[parts.length - 1];
    }

    return {
      id: ad.id,
      title: ad.title,
      price: formatRupiah(ad.price || 0),
      location: shortLocation,
      time: getTimeAgo(ad.created_at),
      imageUrl: imageUrl,
      featured: false
    };
  });

  const categories = [
    { id: '1', title: 'Mobil', href: '/mobil', icon: <Car /> },
    { id: '2', title: 'Motor', href: '/motor', icon: <Bike /> },
    { id: '3', title: 'Properti', href: '/properti', icon: <HomeIcon /> },
    { id: '4', title: 'Handphone', href: '/elektronik', icon: <Smartphone /> },
    { id: '5', title: 'Jasa & Kerja', href: '/jasa', icon: <Briefcase /> },
    { id: '6', title: 'Olahraga', href: '/hobi', icon: <Dumbbell /> },
    { id: '7', title: 'Lainnya', href: '/kategori', icon: <LayoutGrid /> },
  ];

  return (
    <div className={styles.main}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>💔 Buang Kenangan, Jadikan Cuan</div>
          <h1 className={styles.heroTitle}>
            Jual semua Barang dari Mantan, supaya<br />
            Lebih <span>Gampang</span> Move On!
          </h1>
          <p className={styles.heroSubtitle}>
            Temukan barang-barang bersejarah atau jual barang yang ada kenangan masa lalu dengan mantan yang bikin penuh kamar. Proses cepat, aman, dan cuan.
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
              <div className={styles.promoTag}>✨ Move On Terbatas</div>
              <h2 className={styles.promoTitle}>Pasang Iklan Gratis,<br />Lupakan Dia Lebih Cepat!</h2>
              <p className={styles.promoSubtitle}>Ratusan pembeli siap membeli barang penuh kenangan milikmu hari ini.</p>
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
          {recommendations.length > 0 ? (
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
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9f9f9', borderRadius: '12px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '8px' }}>Belum ada iklan</h3>
              <p style={{ fontSize: '14px' }}>Jadilah yang pertama memasang iklan di platform ini!</p>
            </div>
          )}
          {recommendations.length > 0 && (
            <div className={styles.loadMoreContainer}>
              <button className={styles.loadMoreBtn}>Muat Lebih Banyak</button>
            </div>
          )}
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
                  <div className={styles.trustTitle}>Komunitas Move On</div>
                  <div className={styles.trustDesc}>Bergabung bersama jutaan user yang sudah sukses move on dengan menjual barang mantannya di sini.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
