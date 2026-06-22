'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/components/Auth/Auth.module.css';
import { createClient } from '@/utils/supabase/client';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Email ini sudah terdaftar. Silakan login.'
        : `Gagal mendaftar: ${error.message}`
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.authCard}>
          <div className={styles.header}>
            <div style={{ fontSize: '64px', textAlign: 'center', marginBottom: '16px' }}>🎉</div>
            <h1 className={styles.title}>Pendaftaran Berhasil!</h1>
            <p className={styles.subtitle}>
              Kami telah mengirimkan email konfirmasi ke <strong>{email}</strong>.
              Silakan cek inbox Anda dan klik tautan verifikasi untuk mengaktifkan akun.
            </p>
          </div>
          <Link href="/login">
            <button className={styles.submitButton}>Pergi ke Halaman Login</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Daftar Akun</h1>
          <p className={styles.subtitle}>Bergabunglah dengan jutaan pengguna lainnya</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#c53030', fontSize: '14px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Nama Lengkap</label>
            <input
              type="text"
              id="name"
              placeholder="Masukkan nama lengkap"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              placeholder="Masukkan email Anda"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              placeholder="Buat password (min. 6 karakter)"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? '⏳ Sedang mendaftar...' : 'Daftar'}
          </button>
        </form>

        <div className={styles.footer}>
          Sudah punya akun?{' '}
          <Link href="/login" className={styles.link}>
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
