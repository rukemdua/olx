'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './EditAd.module.css';
import { createClient } from '@/utils/supabase/client';
import { deleteAdImageAction, reorderAdImagesAction } from './actions';
import { compressImage, formatFileSize } from '@/utils/imageCompress';

type AdImage = { id: string; url: string };

type Ad = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  description: string;
  address: string | null;
  ad_images: AdImage[];
};

type PhotoItem = 
  | { type: 'existing'; id: string; url: string; preview: string }
  | { type: 'new'; file: File; preview: string };

const CATEGORIES = ['Mobil', 'Motor', 'Properti', 'Elektronik', 'Jasa', 'Hobi'];

export default function EditAdClient({ ad }: { ad: Ad }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(ad.title);
  const [category, setCategory] = useState(ad.category);
  const [price, setPrice] = useState(String(ad.price));
  const [condition, setCondition] = useState(ad.condition);
  const [description, setDescription] = useState(ad.description);

  // Unified photos array
  const [photos, setPhotos] = useState<PhotoItem[]>(
    ad.ad_images.map(img => ({ type: 'existing', id: img.id, url: img.url, preview: img.url }))
  );
  // Track existing photos that need to be deleted from storage
  const [photosToDelete, setPhotosToDelete] = useState<PhotoItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const totalPhotos = photos.length;

  const handleRemovePhoto = (index: number) => {
    const photo = photos[index];
    if (photo.type === 'existing') {
      setPhotosToDelete(prev => [...prev, photo]);
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowed = 5 - totalPhotos;
    if (allowed <= 0) return;
    const picked = files.slice(0, allowed);
    
    const newItems: PhotoItem[] = picked.map(file => ({
      type: 'new',
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setPhotos(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const setAsMainPhoto = (index: number) => {
    if (index === 0 || !photos[index]) return;
    
    setPhotos(prev => {
      const newArr = [...prev];
      const temp = newArr[0];
      newArr[0] = newArr[index];
      newArr[index] = temp;
      return newArr;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !description.trim()) {
      setError('Harap isi Judul, Harga, dan Deskripsi.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Update ad record
      const { error: updateError } = await supabase
        .from('ads')
        .update({
          title: title.trim(),
          category,
          price: parseInt(price.replace(/\D/g, '') || '0'),
          condition,
          description: description.trim(),
        })
        .eq('id', ad.id);

      if (updateError) throw new Error(updateError.message);

      // 2. Hapus foto lama via Server Action (Bypass RLS)
      for (const photo of photosToDelete) {
        if (photo.type === 'existing') {
          const res = await deleteAdImageAction(photo.url, ad.id);
          if (!res.success) {
            throw new Error(`Gagal menghapus foto lama: ${res.error}`);
          }
        }
      }

      // 3. Upload foto baru & susun URL final sesuai urutan di UI
      const finalUrls: string[] = [];
      let newPhotoCount = 1;
      const totalNewPhotos = photos.filter(p => p.type === 'new').length;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.type === 'existing') {
          finalUrls.push(photo.url);
        } else {
          const originalFile = photo.file;
          setUploadProgress(`⏳ Mengompresi foto baru ${newPhotoCount}/${totalNewPhotos} (${formatFileSize(originalFile.size)})...`);

          const compressedFile = await compressImage(originalFile, {
            maxDimension: 1280,
            quality: 0.82,
            maxSizeKB: 800,
          });

          const ratio = ((1 - compressedFile.size / originalFile.size) * 100).toFixed(0);
          setUploadProgress(`⬆️ Mengupload foto baru ${newPhotoCount}/${totalNewPhotos} (${formatFileSize(originalFile.size)} → ${formatFileSize(compressedFile.size)}, hemat ${ratio}%)...`);

          const fileName = `${ad.id}/${Date.now()}-edit-${i}.webp`;

          const { error: uploadError } = await supabase.storage
            .from('ad_images')
            .upload(fileName, compressedFile, { contentType: 'image/webp' });

          if (uploadError) throw new Error('Gagal mengunggah foto baru: ' + uploadError.message);

          const { data: { publicUrl } } = supabase.storage
            .from('ad_images')
            .getPublicUrl(fileName);

          finalUrls.push(publicUrl);
          newPhotoCount++;
        }
      }

      // 4. Terapkan urutan baru di DB
      if (finalUrls.length > 0) {
        setUploadProgress(`🔄 Menyimpan urutan gambar utama...`);
        const reorderRes = await reorderAdImagesAction(ad.id, finalUrls);
        if (!reorderRes.success) throw new Error('Gagal mengurutkan foto: ' + reorderRes.error);
      }

      setUploadProgress('');

      // 5. Sukses
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 1800);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan. Coba lagi.');
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.container}>

        <div className={styles.pageHeader}>
          <Link href="/profile" className={styles.backLink}>← Kembali ke Profil</Link>
          <h1 className={styles.pageTitle}>Edit Iklan</h1>
          <p className={styles.pageSubtitle}>Perbarui informasi iklan Anda</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Info Utama */}
          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>📝 Info Utama</div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Judul Iklan <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={70}
                placeholder="Contoh: Honda Brio E Satya 2020 Mulus"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Kategori</label>
              <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Harga & Kondisi */}
          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>💰 Harga & Kondisi</div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Harga <span className={styles.required}>*</span></label>
              <div className={styles.priceWrapper}>
                <span className={styles.pricePrefix}>Rp</span>
                <input
                  type="number"
                  className={`${styles.input} ${styles.priceInput}`}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Kondisi</label>
              <div className={styles.conditionGroup}>
                <input type="radio" id="cond-baru" name="condition" className={styles.conditionOption}
                  checked={condition === 'Baru'} onChange={() => setCondition('Baru')} />
                <label htmlFor="cond-baru" className={styles.conditionLabel}>Baru</label>

                <input type="radio" id="cond-bekas" name="condition" className={styles.conditionOption}
                  checked={condition === 'Bekas'} onChange={() => setCondition('Bekas')} />
                <label htmlFor="cond-bekas" className={styles.conditionLabel}>Bekas</label>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>📄 Deskripsi</div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Deskripsi <span className={styles.required}>*</span></label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ceritakan kondisi barang Anda secara detail..."
                maxLength={4000}
              />
            </div>
          </div>

          {/* Foto */}
          <div className={styles.formCard}>
            <div className={styles.sectionTitle}>📸 Foto Iklan</div>

            {photos.length > 0 && (
              <div className={styles.unifiedPhotos}>
                {photos.map((photo, i) => (
                  <div key={i} className={styles.unifiedPhotoItem}>
                    <img src={photo.preview} alt={`foto iklan ${i}`} />
                    
                    {photo.type === 'new' && (
                      <span className={styles.newBadge}>Baru</span>
                    )}

                    {i === 0 && (
                      <span className={styles.mainBadge}>Gambar Utama</span>
                    )}
                    
                    <button
                      type="button"
                      className={styles.removeExistingBtn}
                      onClick={() => handleRemovePhoto(i)}
                      title="Hapus foto"
                    >
                      ×
                    </button>
                    
                    {i > 0 && (
                      <button
                        type="button"
                        className={styles.setMainBtn}
                        onClick={() => setAsMainPhoto(i)}
                        title="Jadikan foto utama"
                      >
                        🌟 Jadikan Utama
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleAddPhotos} />

            {totalPhotos < 5 && (
              <button type="button" className={styles.addPhotoBtn} onClick={() => fileInputRef.current?.click()}>
                <span style={{ fontSize: 22 }}>+</span>
                Tambah Foto ({totalPhotos}/5)
              </button>
            )}

            <div className={styles.photoCount}>{totalPhotos}/5 foto</div>
          </div>

          {/* Error */}
          {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

          {/* Progress */}
          {uploadProgress && (
            <div style={{ backgroundColor: '#eef9f4', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #a3e4d7', color: 'var(--color-primary-teal)', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>
              {uploadProgress}
            </div>
          )}

          {/* Actions */}
          <div className={styles.submitRow}>
            <Link href="/profile" className={styles.cancelLink}>Batal</Link>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? '⏳ Sedang Diproses...' : '✅ Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {showSuccess && (
        <div className={styles.successToast}>✅ Iklan berhasil diperbarui!</div>
      )}
    </div>
  );
}
