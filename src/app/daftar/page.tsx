'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/components/Auth/Auth.module.css';
import { createClient } from '@/utils/supabase/client';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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

        {/* Tombol Google */}
        <button
          id="btn-google-register"
          className={styles.socialButton}
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <span>⏳ Menghubungkan ke Google...</span>
          ) : (
            <>
              <GoogleIcon />
              <span>Daftar dengan Google</span>
            </>
          )}
        </button>

        <div className={styles.divider}>atau daftar dengan email</div>

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
