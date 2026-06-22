import styles from './Category.module.css';
import AdCard from '@/components/AdCard/AdCard';
import { notFound } from 'next/navigation';
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

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = await params;
  const category = resolvedParams.category;

  const validCategories = ['mobil', 'motor', 'properti', 'elektronik', 'jasa', 'hobi', 'kategori'];

  if (!validCategories.includes(category.toLowerCase())) {
    notFound();
  }

  // Capitalize category name for display
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  const supabase = await createClient();
  
  let query = supabase
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
    .order('created_at', { ascending: false });

  // Jika URL bukan /kategori (semua kategori), maka filter berdasarkan kategori
  if (category.toLowerCase() !== 'kategori') {
    query = query.ilike('category', `%${category}%`);
  }

  const { data: ads, error } = await query;

  const products = (ads || []).map(ad => {
    let imageUrl = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&q=80';
    if (ad.ad_images && ad.ad_images.length > 0) {
      imageUrl = ad.ad_images[0].url;
    }

    let shortLocation = ad.address || 'Indonesia';
    if (shortLocation.includes(',')) {
      const parts = shortLocation.split(',').map(s => s.trim());
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

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Kategori: {categoryName}</h1>
          <p className={styles.subtitle}>Menampilkan {products.length} iklan terbaru di kategori ini</p>
        </div>

        <div className={styles.content}>
          {/* Sidebar Filter (Dummy) */}
          <aside className={styles.sidebar}>
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Kategori</h3>
              <ul className={styles.filterList}>
                <li>Semua Kategori</li>
                <li className={styles.active}>{categoryName}</li>
              </ul>
            </div>
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Harga</h3>
              <div className={styles.priceInputs}>
                <input type="number" placeholder="Min" className={styles.input} />
                <span>-</span>
                <input type="number" placeholder="Max" className={styles.input} />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className={styles.productGrid}>
            {products.length > 0 ? (
              products.map((item) => (
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
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '8px' }}>Belum ada iklan</h3>
                <p style={{ fontSize: '14px' }}>Belum ada barang yang dijual di kategori ini.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
