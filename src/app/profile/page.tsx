'use client';

import { useState, useRef } from 'react';
import styles from './Profile.module.css';
import AdCard from '@/components/AdCard/AdCard';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('iklan');
  const tabContentRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const myAds = [
    { id: '101', title: 'MacBook Pro M2 2022', price: 'Rp 18.500.000', location: 'Jakarta Selatan', time: 'Hari ini', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80', featured: true },
    { id: '102', title: 'Honda Vario 150 2019', price: 'Rp 15.000.000', location: 'Bandung', time: 'Kemarin', imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&q=80' },
  ];

  const favoriteAds = [
    { id: '201', title: 'Rumah Minimalis Modern', price: 'Rp 850.000.000', location: 'Depok', time: '3 hari lalu', imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&q=80' },
  ];

  return (
    <div className={styles.main}>
      <div className={styles.container}>

        {/* User Info Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrapper}>
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80"
              alt="User Avatar"
              className={styles.avatar}
            />
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>Budi Santoso</h1>
            <div className={styles.userDetails}>
              <span className={styles.detailItem}>📍 Jakarta, Indonesia</span>
              <span className={styles.detailItem}>🗓️ Bergabung sejak 2024</span>
              <span className={styles.detailItem}>⭐ 5.0 (12 Ulasan)</span>
            </div>
          </div>
          <button type="button" className={styles.editButton}>Edit Profil</button>
        </div>

        {/* Tabs Section */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabHeader} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'iklan'}
              className={`${styles.tabButton} ${activeTab === 'iklan' ? styles.active : ''}`}
              onPointerDown={() => handleTabChange('iklan')}
            >
              Iklan Saya ({myAds.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'favorit'}
              className={`${styles.tabButton} ${activeTab === 'favorit' ? styles.active : ''}`}
              onPointerDown={() => handleTabChange('favorit')}
            >
              Favorit ({favoriteAds.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pengaturan'}
              className={`${styles.tabButton} ${activeTab === 'pengaturan' ? styles.active : ''}`}
              onPointerDown={() => handleTabChange('pengaturan')}
            >
              Pengaturan Akun
            </button>
          </div>

          <div className={styles.tabContent} ref={tabContentRef}>
            {/* Tab: Iklan Saya */}
            {activeTab === 'iklan' && (
              <div className={styles.productGrid}>
                {myAds.map(item => (
                  <AdCard key={item.id} {...item} />
                ))}
              </div>
            )}

            {/* Tab: Favorit */}
            {activeTab === 'favorit' && (
              <div className={styles.productGrid}>
                {favoriteAds.length > 0 ? (
                  favoriteAds.map(item => (
                    <AdCard key={item.id} {...item} />
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>❤️</div>
                    <h3 className={styles.emptyStateTitle}>Belum ada favorit</h3>
                    <p>Anda belum menyimpan iklan apapun ke daftar favorit.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Pengaturan */}
            {activeTab === 'pengaturan' && (
              <div className={styles.settingsForm}>
                <form>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Nama Lengkap</label>
                    <input type="text" id="name" defaultValue="Budi Santoso" className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>Nomor Telepon</label>
                    <input type="tel" id="phone" defaultValue="+62 812-3456-7890" className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="location" className={styles.label}>Lokasi Default</label>
                    <input type="text" id="location" defaultValue="Jakarta" className={styles.input} />
                  </div>
                  <button type="button" className={styles.saveButton}>Simpan Perubahan</button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
