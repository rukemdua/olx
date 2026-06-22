"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // ── Effect 1: Inisialisasi user + subscribe Realtime (hanya sekali) ──
  useEffect(() => {
    let subscriptionChannel: any = null;

    const fetchUnreadCount = async (userId: string, source: string) => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId);
        
      console.log(`[Header] 🔄 fetchUnreadCount dari ${source}. Hasil count: ${count}, Error:`, error);
      
      // Jangan set ke 0 jika sebelumnya ada nilai dan ini bukan inisialisasi,
      // kecuali kita yakin datanya memang 0 (bukan karena network error)
      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    const initHeader = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      setUser(session.user);
      await fetchUnreadCount(userId, 'initHeader');

      // Subscribe sekali — jangan re-subscribe tiap navigasi
      const channel = supabase.channel('header_notif')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const newMsg = payload.new as any;
          console.log('[Header] 📩 Realtime INSERT masuk:', newMsg);
          if (newMsg.sender_id !== userId) {
            if (window.location.pathname !== '/chat') {
              console.log('[Header] ➕ Menambah badge +1');
              setUnreadCount(prev => prev + 1);
            }
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
          console.log('[Header] ✏️ Realtime UPDATE masuk:', payload.new);
          // Re-fetch dari DB saat ada pesan yang di-mark read
          fetchUnreadCount(userId, 'realtime UPDATE');
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Header] ✅ Notifikasi realtime aktif');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('[Header] ⚠️ Realtime belum aktif — aktifkan di Supabase Dashboard');
          }
        });

      subscriptionChannel = channel;
    };

    initHeader();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Header] 🔐 Auth state changed:', event);
        setUser(session?.user || null);
        if (session?.user) {
          fetchUnreadCount(session.user.id, 'authListener');
        } else {
          setUnreadCount(0);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      if (subscriptionChannel) supabase.removeChannel(subscriptionChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hanya sekali saat mount — JANGAN tambah deps lain

  // ── Effect 2: Re-fetch count saat user navigasi antar halaman ──
  useEffect(() => {
    // Saat navigasi, selalu re-fetch count terbaru dari DB
    const refetchAfterChat = async (source: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', session.user.id);
        
      console.log(`[Header] 🔄 refetchAfterChat dari ${source}. Hasil count: ${count}, Error:`, error);
      
      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    console.log('[Header] 🧭 Pathname berubah menjadi:', pathname);
    refetchAfterChat('Effect 2 (pathname changed)');

    // Listen for custom event that messages were read
    const handleMessagesRead = () => {
      console.log('[Header] 📢 CustomEvent messages_read diterima');
      refetchAfterChat('CustomEvent messages_read');
    };
    window.addEventListener('messages_read', handleMessagesRead);

    return () => {
      window.removeEventListener('messages_read', handleMessagesRead);
    };
  }, [pathname, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Daftar halaman di mana kita ingin menyembunyikan navigasi kategori
  const hideCategoryNavPaths = ['/profile', '/jual', '/login', '/daftar', '/bantuan', '/tentang', '/search'];
  const isItemPage = pathname?.startsWith('/item/');
  const shouldHideCategoryNav = hideCategoryNavPaths.includes(pathname || '') || isItemPage;

  return (
    <header className={styles.header}>

      {/* Top Bar */}
      <div className={styles.topBar}>
        <Link href="/bantuan" className={styles.topBarLink}>Bantuan</Link>
        <Link href="/tentang" className={styles.topBarLink}>Tentang Toko Mantan</Link>
        {!user && <Link href="/daftar" className={styles.topBarLink}>Daftar</Link>}
      </div>

      {/* Main Nav */}
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Toko Mantan</span>
          <span className={styles.logoDot}></span>
        </Link>

        {/* Search Bar */}
        <form 
          className={styles.searchWrapper} 
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            } else {
              router.push('/search');
            }
          }}
        >
          <input
            type="text"
            placeholder="Cari Mobil, Motor, Properti, dan lainnya"
            className={styles.searchInput}
            aria-label="Cari iklan"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchButton} aria-label="Cari">🔍</button>
        </form>

        {/* User Actions */}
        <div className={styles.actions}>
          {user ? (
            <>
              <Link href="/chat" className={styles.profileBtn} style={{position: 'relative'}} title="Pesan Saya">
                💬 <span className={styles.hideOnMobileText}>Pesan</span>
                {unreadCount > 0 && (
                  <span className={styles.badge}>
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/profile" className={styles.profileBtn} title="Profil Saya">
                👤 <span className={`${styles.truncateName} ${styles.hideOnMobileText}`}>{user.user_metadata?.full_name?.split(' ')[0] || 'Profil'}</span>
              </Link>
              <button onClick={handleLogout} className={styles.logoutButton} title="Keluar">
                Keluar
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.loginButton}>Masuk</Link>
          )}
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
