"use client";

import styles from './page.module.css';
import AdCard from '@/components/AdCard/AdCard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || 'Mobil';

  // Dummy data
  const results = [
    { id: '101', title: 'Honda Brio E Satya 2020 Mulus', price: 'Rp 145.000.000', location: 'Jakarta Selatan', time: 'Hari ini', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&q=80', featured: true },
    { id: '104', title: 'Toyota Avanza Veloz 2019', price: 'Rp 185.500.000', location: 'Bandung', time: 'Hari ini', imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&q=80' },
    { id: '109', title: 'Honda HR-V E CVT 2018', price: 'Rp 230.000.000', location: 'Surabaya', time: '2 hari lalu', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&q=80' },
  ];

  return (
    <div className={styles.container}>
      {/* Sidebar Filter */}
      <aside className={styles.sidebar}>
        <div className={styles.filterBox}>
          <h3 className={styles.filterTitle}>Filter Pencarian</h3>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Kategori</label>
            <select className={styles.filterInput}>
              <option>Semua Kategori</option>
              <option>Mobil</option>
              <option>Motor</option>
              <option>Properti</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Harga</label>
            <div className={styles.priceRange}>
              <input type="number" placeholder="Min" className={styles.priceInput} />
              <span>-</span>
              <input type="number" placeholder="Max" className={styles.priceInput} />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Kondisi</label>
            <label className={styles.filterCheck}>
              <input type="checkbox" /> Bekas
            </label>
            <label className={styles.filterCheck}>
              <input type="checkbox" /> Baru
            </label>
          </div>

          <button className={styles.applyBtn}>Terapkan Filter</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.searchHeader}>
          <h1 className={styles.searchTitle}>Hasil pencarian untuk "{query}"</h1>
          <p className={styles.searchCount}>Menampilkan {results.length} iklan di Indonesia</p>
        </div>

        <div className={styles.productGrid}>
          {results.map((item) => (
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
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
