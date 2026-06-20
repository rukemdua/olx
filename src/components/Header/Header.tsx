"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();

  // Daftar halaman di mana kita ingin menyembunyikan navigasi kategori
  const hideCategoryNavPaths = ['/profile', '/jual', '/login', '/daftar', '/bantuan', '/tentang', '/search'];
  const isItemPage = pathname?.startsWith('/item/');
  const shouldHideCategoryNav = hideCategoryNavPaths.includes(pathname || '') || isItemPage;

  return (
    <header className={styles.header}>

      {/* Top Bar */}
      <div className={styles.topBar}>
        <Link href="/bantuan" className={styles.topBarLink}>Bantuan</Link>
        <Link href="/tentang" className={styles.topBarLink}>Tentang OLX</Link>
        <Link href="/daftar" className={styles.topBarLink}>Daftar</Link>
      </div>

      {/* Main Nav */}
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>OLX</span>
          <span className={styles.logoDot}></span>
        </Link>

        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Cari Mobil, Motor, Properti, dan lainnya"
            className={styles.searchInput}
            aria-label="Cari iklan"
          />
          <button className={styles.searchButton} aria-label="Cari">🔍</button>
        </div>

        {/* User Actions */}
        <div className={styles.actions}>
          <Link href="/profile" className={styles.profileBtn} title="Profil Saya">
            👤 <span>Profil</span>
          </Link>
          <Link href="/login" className={styles.loginButton}>Masuk</Link>
          <Link href="/jual" className={styles.sellButton}>
            <span className={styles.plusIcon}>+</span> Jual
          </Link>
        </div>
      </div>

      {/* Categories Sub-nav */}
      {!shouldHideCategoryNav && (
        <nav className={styles.categoriesNav} aria-label="Kategori utama">
          <div className={styles.container}>
            <Link href="/mobil">Mobil Bekas</Link>
            <Link href="/motor">Motor Bekas</Link>
            <Link href="/properti">Properti</Link>
            <Link href="/elektronik">Elektronik</Link>
            <Link href="/jasa">Jasa & Lowongan</Link>
            <Link href="/hobi">Hobi & Olahraga</Link>
            <Link href="/kategori">Semua Kategori</Link>
          </div>
        </nav>
      )}

    </header>
  );
}
