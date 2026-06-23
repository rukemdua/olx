'use client';

import { useState, useRef } from 'react';
import styles from './Profile.module.css';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { compressImage } from '@/utils/imageCompress';

type AdImage = { url: string };

type Ad = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  created_at: string;
  address?: string | null;
  ad_images?: AdImage[];
};

type ProfileProps = {
  profileData: {
    id: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  myAds: Ad[];
};

const formatRupiah = (number: number) => {
  if (typeof number !== 'number') return String(number);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

import { deleteAdAction } from './actions';

export default function ProfileClient({ profileData, myAds }: ProfileProps) {
  const [activeTab, setActiveTab] = useState('iklan');
  const tabContentRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Profile form state
  const [fullName, setFullName] = useState(profileData.full_name || '');
  const [phone, setPhone] = useState(profileData.phone || '');
  const [avatarPreview, setAvatarPreview] = useState(profileData.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Ads state — local list so deletes reflect instantly
  const [ads, setAds] = useState<Ad[]>(myAds);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      // Switch to settings tab automatically if they change from top avatar
      if (activeTab !== 'pengaturan') {
        handleTabChange('pengaturan');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      let finalAvatarUrl = avatarPreview;

      // Jika ada file avatar baru, upload dulu
      if (avatarFile) {
        setMessage('Mengunggah foto profil...');
        const compressedFile = await compressImage(avatarFile, {
          maxDimension: 800,
          quality: 0.8,
          maxSizeKB: 500,
        });

        const fileName = `avatars/${profileData.id}/${Date.now()}.webp`;

        const { error: uploadError } = await supabase.storage
          .from('ad_images')
          .upload(fileName, compressedFile, { contentType: 'image/webp' });

        if (uploadError) throw new Error('Gagal mengunggah avatar: ' + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
          .from('ad_images')
          .getPublicUrl(fileName);

        finalAvatarUrl = publicUrl;
      }

      setMessage('Menyimpan profil...');
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone, avatar_url: finalAvatarUrl === '' ? null : finalAvatarUrl })
        .eq('id', profileData.id);

      if (error) throw new Error(error.message);

      setMessage('Profil berhasil diperbarui!');
      setAvatarFile(null); // Reset file
      
      // Optionally trigger router refresh if needed
      // window.location.reload();
    } catch (err: any) {
      setMessage('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteError('');
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
    setDeleteError('');
  };

  const handleDeleteAd = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    setDeleteError('');

    const res = await deleteAdAction(deleteTargetId);
    
    setIsDeleting(false);

    if (!res.success) {
      setDeleteError('Gagal menghapus: ' + res.error);
    } else {
      setAds(prev => prev.filter(a => a.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const favoriteAds: Ad[] = [];
  const joinDate = new Date(profileData.created_at).toLocaleDateString('id-ID', { year: 'numeric' });
  const avatarUrlDisplay =
    avatarPreview ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=00b56a&color=fff`;

  return (
    <div className={styles.container}>

      {/* ===== Delete Confirmation Modal ===== */}
      {deleteTargetId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3 className={styles.modalTitle}>Hapus Iklan?</h3>
            <p className={styles.modalText}>
              Tindakan ini tidak dapat dibatalkan. Iklan dan semua fotonya akan dihapus secara permanen.
            </p>
            {deleteError && <div className={styles.deleteError}>{deleteError}</div>}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={cancelDelete} disabled={isDeleting}>
                Batal
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleDeleteAd} disabled={isDeleting}>
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== User Info Card ===== */}
      <div className={styles.profileCard}>
        <input type="file" ref={avatarInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        
        <div className={styles.avatarWrapper} onClick={() => avatarInputRef.current?.click()} style={{ cursor: 'pointer' }} title="Ubah Foto Profil">
          <img src={avatarUrlDisplay} alt="User Avatar" className={styles.avatar} />
          <div className={styles.avatarOverlay}>
            <span>Ubah</span>
          </div>
        </div>
        <div className={styles.userInfo}>
          <h1 className={styles.userName}>{profileData.full_name || 'Pengguna'}</h1>
          <div className={styles.userDetails}>
            <span className={styles.detailItem}>🗓️ Bergabung sejak {joinDate}</span>
          </div>
        </div>
        <button type="button" className={styles.editButton} onClick={() => handleTabChange('pengaturan')}>
          Edit Profil
        </button>
      </div>

      {/* ===== Tabs ===== */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabHeader} role="tablist">
          {(['iklan', 'favorit', 'pengaturan'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
              onPointerDown={() => handleTabChange(tab)}
            >
              {tab === 'iklan' && `Iklan Saya (${ads.length})`}
              {tab === 'favorit' && `Favorit (${favoriteAds.length})`}
              {tab === 'pengaturan' && 'Pengaturan Akun'}
            </button>
          ))}
        </div>

        <div className={styles.tabContent} ref={tabContentRef}>

          {/* ── Tab: Iklan Saya ── */}
          {activeTab === 'iklan' && (
            <div>
              {ads.length > 0 ? (
                <div className={styles.adList}>
                  {ads.map(item => {
                    const thumb =
                      item.ad_images && item.ad_images.length > 0
                        ? item.ad_images[0].url
                        : 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80';
                    return (
                      <div key={item.id} className={styles.adListItem}>
                        <img src={thumb} alt={item.title} className={styles.adListThumb} />
                        <div className={styles.adListInfo}>
                          <p className={styles.adListTitle}>{item.title}</p>
                          <p className={styles.adListPrice}>{formatRupiah(item.price)}</p>
                          <p className={styles.adListMeta}>
                            {item.category} · {item.condition} · {new Date(item.created_at).toLocaleDateString('id-ID')}
                          </p>
                          <span className={`${styles.statusBadge} ${item.status === 'active' ? styles.statusActive : styles.statusOff}`}>
                            {item.status === 'active' ? '🟢 Aktif' : '⚫ Nonaktif'}
                          </span>
                        </div>
                        <div className={styles.adListActions}>
                          <Link href={`/profile/edit/${item.id}`} className={styles.editAdBtn}>
                            ✏️ Edit
                          </Link>
                          <button
                            type="button"
                            className={styles.deleteAdBtn}
                            onClick={() => confirmDelete(item.id)}
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📦</div>
                  <h3 className={styles.emptyStateTitle}>Belum ada iklan</h3>
                  <p>Anda belum memasang iklan apapun.</p>
                  <Link href="/jual" style={{ marginTop: 16, display: 'inline-block', padding: '10px 24px', backgroundColor: 'var(--color-primary-teal)', color: 'white', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>
                    + Pasang Iklan
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Favorit ── */}
          {activeTab === 'favorit' && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>⏳</div>
              <h3 className={styles.emptyStateTitle}>Segera Hadir</h3>
              <p>Fitur favorit sedang dalam pengembangan.</p>
            </div>
          )}

          {/* ── Tab: Pengaturan ── */}
          {activeTab === 'pengaturan' && (
            <div className={styles.settingsForm}>
              <form onSubmit={handleSaveProfile}>
                {message && (
                  <div style={{
                    padding: '12px', marginBottom: '20px', borderRadius: '8px',
                    backgroundColor: message.includes('Gagal') ? '#ffebee' : '#e8f5e9',
                    color: message.includes('Gagal') ? '#c62828' : '#2e7d32',
                    fontSize: 14, fontWeight: 500
                  }}>
                    {message}
                  </div>
                )}
                
                <div className={styles.formGroup} style={{ marginBottom: 24 }}>
                  <label className={styles.label}>Foto Profil</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={avatarUrlDisplay} alt="Avatar Preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e0e0' }} />
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className={styles.editButton} style={{ margin: 0 }}>
                      Pilih Foto Baru
                    </button>
                    {avatarFile && <span style={{ fontSize: 13, color: '#e53935', fontWeight: 600 }}>Belum disimpan*</span>}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>Nama Lengkap</label>
                  <input type="text" id="name" value={fullName} onChange={e => setFullName(e.target.value)} className={styles.input} required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>Nomor Telepon</label>
                  <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className={styles.input} placeholder="08123456789" />
                </div>
                <button type="submit" className={styles.saveButton} disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
