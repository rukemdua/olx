import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.illustration}>🕵️‍♂️</div>
      <h2 className={styles.title}>Oops! Halaman Tidak Ditemukan</h2>
      <p className={styles.subtitle}>
        Sepertinya barang yang Anda cari sudah laku terjual, atau URL yang Anda masukkan salah. Jangan khawatir, masih banyak penawaran menarik lainnya!
      </p>
      <Link href="/" className={styles.button}>
        Kembali ke Beranda
      </Link>
    </div>
  );
}
