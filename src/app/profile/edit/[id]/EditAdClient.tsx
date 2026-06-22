'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './EditAd.module.css';
import { createClient } from '@/utils/supabase/client';
import { deleteAdImageAction } from './actions';

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

  // Existing photos — track which ones to delete
  const [existingPhotos, setExistingPhotos] = useState<AdImage[]>(ad.ad_images || []);
  const [photosToDelete, setPhotosToDelete] = useState<AdImage[]>([]);

  // New photos to upload
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const totalPhotos = existingPhotos.length + newPhotoFiles.length;

  const handleRemoveExisting = (photo: AdImage) => {
    setExistingPhotos(prev => prev.filter(p => p.url !== photo.url));
    setPhotosToDelete(prev => [...prev, photo]);
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowed = 5 - totalPhotos;
    if (allowed <= 0) return;
    const picked = files.slice(0, allowed);
    setNewPhotoFiles(prev => [...prev, ...picked]);
    setNewPhotoPreviews(prev => [...prev, ...picked.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleRemoveNew = (index: number) => {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
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
        const res = await deleteAdImageAction(photo.url, ad.id);
        if (!res.success) {
          throw new Error(`Gagal menghapus foto: ${res.error}`);
        }
      }

      // 3. Upload foto baru
      for (let i = 0; i < newPhotoFiles.length; i++) {
        const file = newPhotoFiles[i];
        const ext = file.name.split('.').pop();
        const fileName = `${ad.id}/${Date.now()}-edit-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('ad_images')
          .upload(fileName, file);

        if (uploadError) throw new Error('Gagal mengunggah foto baru: ' + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
          .from('ad_images')
          .getPublicUrl(fileName);

        const { error: insertErr } = await supabase.from('ad_images').insert({ ad_id: ad.id, url: publicUrl });
        if (insertErr) throw new Error('Gagal menyimpan URL foto baru: ' + insertErr.message);
      }

      // 4. Sukses
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 1800);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan. Coba lagi.');
      setIsSubmitting(false);
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

            {existingPhotos.length > 0 && (
              <div className={styles.existingPhotos}>
                {existingPhotos.map(photo => (
                  <div key={photo.id} className={styles.existingPhotoItem}>
                    <img src={photo.url} alt="foto iklan" />
                    <button
                      type="button"
                      className={styles.removeExistingBtn}
                      onClick={() => handleRemoveExisting(photo)}
                      title="Hapus foto ini"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {newPhotoPreviews.length > 0 && (
              <div className={styles.newPhotoPreviews}>
                {newPhotoPreviews.map((src, i) => (
                  <div key={i} className={styles.newPhotoItem}>
                    <img src={src} alt={`preview ${i}`} />
                    <span className={styles.newBadge}>Baru</span>
                    <button
                      type="button"
                      className={styles.removeExistingBtn}
                      onClick={() => handleRemoveNew(i)}
                    >×</button>
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

          {/* Actions */}
          <div className={styles.submitRow}>
            <Link href="/profile" className={styles.cancelLink}>Batal</Link>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? '⏳ Menyimpan...' : '✅ Simpan Perubahan'}
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
