import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        <div className={styles.container}>

          {/* Brand Column */}
          <div className={styles.brand}>
            <div className={styles.logoRow}>
              <span className={styles.logoText}>OLX</span>
              <span className={styles.logoDot}></span>
            </div>
            <p className={styles.brandDesc}>
              Platform jual beli barang bekas terpercaya. Lebih dari 5 juta iklan aktif menunggu Anda.
            </p>
            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialIcon} aria-label="Facebook"><FaFacebook size={18} /></a>
              <a href="#" className={styles.socialIcon} aria-label="Twitter"><FaTwitter size={18} /></a>
              <a href="#" className={styles.socialIcon} aria-label="Instagram"><FaInstagram size={18} /></a>
              <a href="#" className={styles.socialIcon} aria-label="Youtube"><FaYoutube size={18} /></a>
            </div>
          </div>

          {/* Links */}
          <div className={styles.column}>
            <h3 className={styles.title}>Lokasi Populer</h3>
            <Link href="/lokasi/jakarta">Jakarta</Link>
            <Link href="/lokasi/bandung">Bandung</Link>
            <Link href="/lokasi/surabaya">Surabaya</Link>
            <Link href="/lokasi/yogyakarta">Yogyakarta</Link>
            <Link href="/lokasi/medan">Medan</Link>
          </div>

          <div className={styles.column}>
            <h3 className={styles.title}>Pencarian Populer</h3>
            <Link href="/mobil">Mobil Bekas</Link>
            <Link href="/motor">Motor Bekas</Link>
            <Link href="/properti">Rumah Dijual</Link>
            <Link href="/elektronik">Handphone</Link>
            <Link href="/hobi">Sepeda</Link>
          </div>

          <div className={styles.column}>
            <h3 className={styles.title}>Perusahaan</h3>
            <Link href="/tentang">Tentang OLX</Link>
            <Link href="/karir">Karir</Link>
            <Link href="/kontak">Hubungi Kami</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/sitemap">Sitemap</Link>
          </div>

          <div className={styles.column}>
            <h3 className={styles.title}>Bantuan</h3>
            <Link href="/bantuan">Pusat Bantuan</Link>
            <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            <Link href="/syarat-ketentuan">Syarat & Ketentuan</Link>
            <Link href="/keamanan">Tips Keamanan</Link>
          </div>

        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          <span className={styles.copyright}>© 2026 OLX Clone Indonesia. Hak Cipta Dilindungi.</span>
          <div className={styles.bottomLinks}>
            <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            <Link href="/syarat-ketentuan">Syarat & Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
