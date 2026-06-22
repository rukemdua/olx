import styles from './page.module.css';
import AdCard from '@/components/AdCard/AdCard';
import SearchSidebarClient from './SearchSidebarClient';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

function formatRupiah(number: number) {
  if (typeof number !== 'number') return number;
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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  
  // Extract query parameters safely
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const category = typeof resolvedParams.category === 'string' ? resolvedParams.category : '';
  const minPrice = typeof resolvedParams.minPrice === 'string' ? resolvedParams.minPrice : '';
  const maxPrice = typeof resolvedParams.maxPrice === 'string' ? resolvedParams.maxPrice : '';
  const condition = typeof resolvedParams.condition === 'string' ? resolvedParams.condition : '';
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'terbaru';

  const supabase = await createClient();

  // Start building the query
  let supabaseQuery = supabase
    .from('ads')
    .select('*, ad_images(url)');

  // Urutkan berdasarkan
  if (sort === 'termurah') {
    supabaseQuery = supabaseQuery.order('price', { ascending: true });
  } else if (sort === 'termahal') {
    supabaseQuery = supabaseQuery.order('price', { ascending: false });
  } else {
    // Default: terbaru
    supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
  }

  // Apply filters if they exist
  if (query) {
    // using ilike for basic case-insensitive text search in title
    supabaseQuery = supabaseQuery.ilike('title', `%${query}%`);
  }
  
  if (category && category !== 'Semua Kategori') {
    // Exact match for category
    supabaseQuery = supabaseQuery.eq('category', category);
  }

  if (minPrice) {
    supabaseQuery = supabaseQuery.gte('price', parseInt(minPrice, 10));
  }

  if (maxPrice) {
    supabaseQuery = supabaseQuery.lte('price', parseInt(maxPrice, 10));
  }

  if (condition) {
    supabaseQuery = supabaseQuery.eq('condition', condition);
  }

  // Execute query
  const { data: results, error } = await supabaseQuery;

  if (error) {
    console.error("Supabase Error (Search):", error);
  }

  const ads = results || [];

  return (
    <div className={styles.container}>
      {/* Sidebar Filter - Client Component */}
      <SearchSidebarClient 
        initialCategory={category}
        initialMinPrice={minPrice}
        initialMaxPrice={maxPrice}
        initialCondition={condition}
        initialSort={sort}
        currentQuery={query}
      />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.searchHeader}>
          <h1 className={styles.searchTitle}>
            {query ? `Hasil pencarian untuk "${query}"` : 'Semua Iklan'}
          </h1>
          <p className={styles.searchCount}>
            Menampilkan {ads.length} iklan di Indonesia
          </p>
        </div>

        <div className={styles.productGrid}>
          {ads.length > 0 ? (
            ads.map((item: any) => {
              const firstImage = item.ad_images && item.ad_images.length > 0 
                ? item.ad_images[0].url 
                : 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=500&q=80';
              
              // Handle lokasi pendek
              const fullLocation = item.address || item.location || 'Indonesia';
              let shortLocation = fullLocation;
              if (shortLocation.includes(',')) {
                const parts = shortLocation.split(',').map((s: string) => s.trim());
                shortLocation = parts.length > 2 ? `${parts[parts.length - 2]}` : parts[parts.length - 1];
              }

              return (
                <AdCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={formatRupiah(item.price)}
                  location={shortLocation}
                  time={getTimeAgo(item.created_at)}
                  imageUrl={firstImage}
                />
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-white)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px' }}>Yah, iklan tidak ditemukan</h3>
              <p>Coba gunakan kata kunci lain atau kurangi filter pencarian Anda.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
