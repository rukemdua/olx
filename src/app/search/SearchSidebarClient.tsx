'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type SidebarProps = {
  initialCategory?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialCondition?: string;
  initialSort?: string;
  currentQuery?: string;
};

export default function SearchSidebarClient({
  initialCategory = '',
  initialMinPrice = '',
  initialMaxPrice = '',
  initialCondition = '',
  initialSort = 'terbaru',
  currentQuery = '',
}: SidebarProps) {
  const router = useRouter();

  // Local state for the form
  const [category, setCategory] = useState(initialCategory || 'Semua Kategori');
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [condition, setCondition] = useState(initialCondition);
  const [sort, setSort] = useState(initialSort);

  // Mobile toggle state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleApplyFilter = () => {
    const params = new URLSearchParams();

    if (currentQuery) {
      params.set('q', currentQuery);
    }
    if (category && category !== 'Semua Kategori') {
      params.set('category', category);
    }
    if (minPrice) {
      params.set('minPrice', minPrice);
    }
    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    }
    if (condition) {
      params.set('condition', condition);
    }
    if (sort && sort !== 'terbaru') {
      params.set('sort', sort);
    }

    // Close filter on mobile after apply
    setIsFilterOpen(false);

    router.push(`/search?${params.toString()}`);
  };

  const handleConditionToggle = (val: string) => {
    // If the same is clicked, toggle it off
    if (condition === val) {
      setCondition('');
    } else {
      setCondition(val);
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* Mobile Toggle Button */}
      <button 
        className={styles.mobileFilterToggle}
        onClick={() => setIsFilterOpen(!isFilterOpen)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filter Pencarian
        </span>
        <span style={{ fontSize: '12px' }}>{isFilterOpen ? 'Tutup ✖' : 'Buka ⬇'}</span>
      </button>

      <div className={`${styles.filterBox} ${isFilterOpen ? styles.filterBoxOpen : ''}`}>
        <div className={styles.filterHeaderDesktop}>
          <h3 className={styles.filterTitle}>Filter Pencarian</h3>
        </div>

        {/* Urutkan */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Urutkan</label>
          <select 
            className={styles.filterInput} 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="terbaru">Terbaru</option>
            <option value="termurah">Harga Termurah</option>
            <option value="termahal">Harga Termahal</option>
          </select>
        </div>

        {/* Kategori */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Kategori</label>
          <select 
            className={styles.filterInput} 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Semua Kategori">Semua Kategori</option>
            <option value="Mobil">Mobil Bekas</option>
            <option value="Motor">Motor Bekas</option>
            <option value="Properti">Properti</option>
            <option value="Elektronik">Elektronik & Gadget</option>
            <option value="Jasa">Jasa & Lowongan</option>
            <option value="Hobi">Hobi & Olahraga</option>
          </select>
        </div>

        {/* Harga */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Harga</label>
          <div className={styles.priceRange}>
            <input 
              type="number" 
              placeholder="Min" 
              className={styles.priceInput} 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span>-</span>
            <input 
              type="number" 
              placeholder="Max" 
              className={styles.priceInput} 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Kondisi */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Kondisi</label>
          <label className={styles.filterCheck}>
            <input 
              type="checkbox" 
              checked={condition === 'Bekas'}
              onChange={() => handleConditionToggle('Bekas')}
            /> 
            Bekas
          </label>
          <label className={styles.filterCheck}>
            <input 
              type="checkbox" 
              checked={condition === 'Baru'}
              onChange={() => handleConditionToggle('Baru')}
            /> 
            Baru
          </label>
        </div>

        <button className={styles.applyBtn} onClick={handleApplyFilter}>
          Terapkan Filter
        </button>
      </div>
    </aside>
  );
}
