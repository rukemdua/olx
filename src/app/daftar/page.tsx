import Link from 'next/link';
import styles from '@/components/Auth/Auth.module.css';

export default function RegisterPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Daftar Akun</h1>
          <p className={styles.subtitle}>Bergabunglah dengan jutaan pengguna lainnya</p>
        </div>

        <form>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Nama Lengkap</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Masukkan nama lengkap" 
              className={styles.input} 
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email atau No. Handphone</label>
            <input 
              type="text" 
              id="email" 
              placeholder="Masukkan email / no. handphone" 
              className={styles.input} 
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Buat password" 
              className={styles.input} 
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirm-password" className={styles.label}>Konfirmasi Password</label>
            <input 
              type="password" 
              id="confirm-password" 
              placeholder="Ulangi password" 
              className={styles.input} 
              required
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Daftar
          </button>
        </form>

        <div className={styles.footer}>
          Sudah punya akun? 
          <Link href="/login" className={styles.link}>
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
