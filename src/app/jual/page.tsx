"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Jual.module.css';
import { ImageIcon, Tag, X, Camera } from 'lucide-react';
import MapPicker from '@/components/MapPicker';
import { createClient } from '@/utils/supabase/client';
import { compressImage, formatFileSize } from '@/utils/imageCompress';

const MAX_PHOTOS = 5;

export default function PasangIklanPage() {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Mobil',
    price: '',
    condition: 'Bekas',
    description: '',
    location: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);

  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.200000, 106.816666]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [address, setAddress] = useState('');
  const [searchError, setSearchError] = useState('');
  const [coordInput, setCoordInput] = useState('');
  const [coordError, setCoordError] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [parsedInfo, setParsedInfo] = useState<{lat: number, lng: number} | null>(null);
  const [mapTab, setMapTab] = useState<'search' | 'coord' | 'link'>('search');
  const [pinCoords, setPinCoords] = useState<[number, number] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocationTypeLabel = (type: string, classType: string) => {
    const typeMap: Record<string, string> = {
      city: '🏙️ Kota', town: '🏘️ Kota Kecil', village: '🏡 Desa/Kelurahan',
      suburb: '🏘️ Kecamatan', neighbourhood: '📍 Kelurahan', municipality: '🏛️ Kabupaten',
      administrative: '📋 Wilayah', county: '🗺️ Kabupaten', state: '🗺️ Provinsi',
      district: '📍 Kecamatan', quarter: '📍 Kelurahan', hamlet: '🏡 Dusun',
      locality: '📍 Lokasi', highway: '🛣️ Jalan', road: '🛣️ Jalan',
      mall: '🏬 Mall', commercial: '🏪 Area Komersial', industrial: '🏭 Kawasan Industri',
      airport: '✈️ Bandara', station: '🚉 Stasiun', hospital: '🏥 Rumah Sakit',
      school: '🏫 Sekolah', university: '🎓 Universitas',
    };
    return typeMap[type] || typeMap[classType] || '📍 Lokasi';
  };

  const fetchLocationSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    setIsSearching(true);
    setSearchError('');
    try {
      // Cari dengan parameter Indonesia-specific
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&addressdetails=1&limit=10&accept-language=id`;
      let res = await fetch(url, { headers: { 'Accept-Language': 'id' } });
      let data = await res.json();

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        // Fallback: tambahkan kata 'Indonesia' untuk hasil lebih luas
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Indonesia')}&addressdetails=1&limit=10&accept-language=id`;
        res = await fetch(fallbackUrl, { headers: { 'Accept-Language': 'id' } });
        data = await res.json();
        if (data && data.length > 0) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
          setSearchError('Lokasi tidak ditemukan. Coba nama Desa, Kecamatan, atau Kota.');
        }
      }
    } catch {
      setSearchError('Gagal mencari. Periksa koneksi internet Anda.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setSearchError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchLocationSuggestions(value);
      }, 400);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchLocation = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await fetchLocationSuggestions(searchQuery);
  };

  const handleCoordInput = async () => {
    setCoordError('');
    setParsedInfo(null);
    setPinCoords(null); // reset old pin first
    let raw = coordInput.trim();
    if (!raw) { setCoordError('Masukkan koordinat terlebih dahulu.'); return; }
    
    let lat: number | null = null;
    let lng: number | null = null;

    // Normalize: replace unicode minus/dash variants with standard minus
    raw = raw.replace(/[\u2212\u2013\u2014\u2010]/g, '-');
    // Normalize: replace non-breaking spaces and other whitespace
    raw = raw.replace(/\u00a0/g, ' ');
    // Normalize: handle Indonesian locale decimal commas (e.g., "-6,227772, 106,964177" -> "-6.227772, 106.964177")
    // This replaces any comma that is strictly between two numbers with a dot.
    raw = raw.replace(/(\d),(\d)/g, '$1.$2');

    // --- Format 1: Google Maps URL containing @lat,lng,zoom or ?q=lat,lng ---
    const urlAtMatch = raw.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const urlQMatch = raw.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const mapsGooMatch = raw.match(/maps\.google\.[a-z]+\/\?.*?[?&ll=|@](-?\d+\.?\d*),(-?\d+\.?\d*)/);

    if (urlAtMatch) {
      lat = parseFloat(urlAtMatch[1]);
      lng = parseFloat(urlAtMatch[2]);
    } else if (urlQMatch) {
      lat = parseFloat(urlQMatch[1]);
      lng = parseFloat(urlQMatch[2]);
    } else if (mapsGooMatch) {
      lat = parseFloat(mapsGooMatch[1]);
      lng = parseFloat(mapsGooMatch[2]);
    } else {
      // --- Format 2: DMS (Degrees Minutes Seconds) e.g. "6°12'0\"S 106°49'0\"E" ---
      const dmsMatch = raw.match(/(\d+)[°]\s*(\d+)[\'′]\s*(\d+(?:\.\d+)?)[\"″]?\s*([NS])[,\s]+(\d+)[°]\s*(\d+)[\'′]\s*(\d+(?:\.\d+)?)[\"″]?\s*([EW])/i);
      if (dmsMatch) {
        lat = (parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600) * (dmsMatch[4].toUpperCase() === 'S' ? -1 : 1);
        lng = (parseFloat(dmsMatch[5]) + parseFloat(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600) * (dmsMatch[8].toUpperCase() === 'W' ? -1 : 1);
      } else {
        // --- Format 3: Plain decimal "lat, lng" ---
        // Handle both "." and "," as decimal separator
        // First try splitting by comma (most common from Google Maps right-click)
        const commaSplit = raw.split(',').map(s => s.trim()).filter(Boolean);
        if (commaSplit.length === 2) {
          lat = parseFloat(commaSplit[0]);
          lng = parseFloat(commaSplit[1]);
        } else {
          // Try splitting by space or semicolon
          const spaceSplit = raw.split(/[\s;]+/).filter(Boolean);
          if (spaceSplit.length >= 2) {
            lat = parseFloat(spaceSplit[0]);
            lng = parseFloat(spaceSplit[1]);
          }
        }
      }
    }

    // Validate parsed values
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      setCoordError(`Format tidak dikenali. Coba: -6.200000, 106.816666 atau paste link Google Maps.`);
      return;
    }

    // Auto-swap if lat/lng appear to be reversed (Indonesia: lat -11 to 6, lng 95 to 141)
    if (Math.abs(lng) <= 90 && Math.abs(lat) > 90) {
      [lat, lng] = [lng, lat];
    }

    // Final validation
    if (lat < -90 || lat > 90) {
      setCoordError(`Nilai Latitude (${lat.toFixed(4)}) tidak valid. Harus antara -90 dan 90.`);
      return;
    }
    if (lng < -180 || lng > 180) {
      setCoordError(`Nilai Longitude (${lng.toFixed(4)}) tidak valid. Harus antara -180 dan 180.`);
      return;
    }

    // Show parsed info to user for verification
    setParsedInfo({ lat, lng });
    setPinCoords([lat, lng]);
    setMapCenter([lat, lng]);
    const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setFormData(prev => ({ ...prev, location: coordStr }));
    setAddress('⏳ Mengambil alamat...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const poi = a.amenity || a.building || a.shop || a.office || a.leisure || a.tourism || a.historic || a.mall || a.commercial;
        const roadAndNum = [a.road || a.pedestrian || a.footway, a.house_number].filter(Boolean).join(' ');
        
        const parts = [
          poi,
          roadAndNum,
          a.village || a.suburb || a.neighbourhood,
          a.county || a.city_district,
          a.city || a.town || a.municipality,
          a.state,
          a.postcode
        ].filter(Boolean);
        
        // Remove duplicates (sometimes village and county are the same in OSM)
        const uniqueParts = parts.filter((item, pos) => parts.indexOf(item) === pos);
        
        let finalAddress = uniqueParts.join(', ');
        // Mimic Google Maps formatting
        finalAddress = finalAddress.replace(/Jalan /gi, 'Jl. ');
        
        setAddress(finalAddress || data?.display_name || 'Alamat tidak ditemukan');
      } else {
        setAddress(data?.display_name || 'Alamat tidak ditemukan');
      }
    } catch {
      setAddress('Gagal mengambil alamat');
    }
  };

  const handleLinkInput = async () => {
    setLinkError('');
    setParsedInfo(null);
    setPinCoords(null);
    let raw = linkInput.trim();
    if (!raw) { setLinkError('Masukkan link Google Maps terlebih dahulu.'); return; }

    let extractUrl = raw.match(/https?:\/\/[^\s]+/)?.[0] || raw;
    let finalUrl = extractUrl;

    // Jika itu shortlink, expand dulu
    if (extractUrl.includes('maps.app.goo.gl') || extractUrl.includes('goo.gl/maps')) {
      setLinkError('⏳ Sedang mengekstrak koordinat dari link...');
      try {
        const res = await fetch('/api/expand-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: extractUrl })
        });
        const data = await res.json();
        if (data.expandedUrl) {
          finalUrl = data.expandedUrl;
          setLinkError('');
        } else {
          setLinkError('Gagal membaca link Google Maps. Pastikan link valid.');
          return;
        }
      } catch (e) {
        setLinkError('Terjadi kesalahan saat memproses link.');
        return;
      }
    }

    // Parse URL yang sudah terekspansi (atau seluruh HTML body jika redirect gagal)
    let lat: number | null = null;
    let lng: number | null = null;

    const urlAtMatch = finalUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const urlQMatch = finalUrl.match(/[?&amp;]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const urlLlMatch = finalUrl.match(/[?&amp;]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const centerMatch = finalUrl.match(/center=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    const searchMatch = finalUrl.match(/search\/(-?\d+\.?\d*)[,](?:%20|\+|\s)*(-?\d+\.?\d*)/);

    if (urlAtMatch) {
      lat = parseFloat(urlAtMatch[1]);
      lng = parseFloat(urlAtMatch[2]);
    } else if (urlQMatch) {
      lat = parseFloat(urlQMatch[1]);
      lng = parseFloat(urlQMatch[2]);
    } else if (urlLlMatch) {
      lat = parseFloat(urlLlMatch[1]);
      lng = parseFloat(urlLlMatch[2]);
    } else if (centerMatch) {
      lat = parseFloat(centerMatch[1]);
      lng = parseFloat(centerMatch[2]);
    } else if (searchMatch) {
      lat = parseFloat(searchMatch[1]);
      lng = parseFloat(searchMatch[2]);
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      setLinkError(`Tidak dapat menemukan koordinat dari link tersebut.`);
      return;
    }

    // Final validation
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLinkError(`Titik koordinat tidak valid.`);
      return;
    }

    setParsedInfo({ lat, lng });
    setPinCoords([lat, lng]);
    setMapCenter([lat, lng]);
    const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setFormData(prev => ({ ...prev, location: coordStr }));
    setAddress('⏳ Mengambil alamat...');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const poi = a.amenity || a.building || a.shop || a.office || a.leisure || a.tourism || a.historic || a.mall || a.commercial;
        const roadAndNum = [a.road || a.pedestrian || a.footway, a.house_number].filter(Boolean).join(' ');
        
        const parts = [
          poi,
          roadAndNum,
          a.village || a.suburb || a.neighbourhood,
          a.county || a.city_district,
          a.city || a.town || a.municipality,
          a.state,
          a.postcode
        ].filter(Boolean);
        
        const uniqueParts = parts.filter((item, pos) => parts.indexOf(item) === pos);
        let finalAddress = uniqueParts.join(', ');
        finalAddress = finalAddress.replace(/Jalan /gi, 'Jl. ');
        
        setAddress(finalAddress || data?.display_name || 'Alamat tidak ditemukan');
      } else {
        setAddress(data?.display_name || 'Alamat tidak ditemukan');
      }
    } catch {
      setAddress('Gagal mengambil alamat');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    
    setPhotos(prev => [...prev, ...newPreviews].slice(0, MAX_PHOTOS));
    setPhotoFiles(prev => [...prev, ...files].slice(0, MAX_PHOTOS));
    
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const setAsMainPhoto = (index: number) => {
    if (index === 0 || !photos[index]) return;
    
    // Swap photo at index with photo at 0
    setPhotos(prev => {
      const newArr = [...prev];
      const temp = newArr[0];
      newArr[0] = newArr[index];
      newArr[index] = temp;
      return newArr;
    });
    
    setPhotoFiles(prev => {
      const newArr = [...prev];
      const temp = newArr[0];
      newArr[0] = newArr[index];
      newArr[index] = temp;
      return newArr;
    });
  };

  const openFilePicker = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!user) {
      setSubmitError('Anda harus login terlebih dahulu.');
      return;
    }
    if (!formData.title || !formData.price || !formData.description) {
      setSubmitError('Harap isi Judul, Harga, dan Deskripsi.');
      return;
    }
    if (!formData.location || !parsedInfo) {
      setSubmitError('Harap pilih lokasi barang Anda.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 1. Insert Ad to get ID
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseInt(formData.price.replace(/\D/g, '') || '0'),
          category: formData.category,
          condition: formData.condition,
          location: formData.location, // e.g. "-6.20,106.81"
          latitude: parsedInfo.lat,
          longitude: parsedInfo.lng,
          address: address !== '⏳ Mengambil alamat...' ? address : null,
          status: 'active'
        })
        .select()
        .single();

      if (adError) throw new Error(adError.message);
      
      const adId = adData.id;

      // 2. Kompres & Upload Images
      const imageUrls: string[] = [];
      for (let i = 0; i < photoFiles.length; i++) {
        const originalFile = photoFiles[i];
        setUploadProgress(`⏳ Mengompresi foto ${i + 1}/${photoFiles.length} (${formatFileSize(originalFile.size)})...`);

        // Kompres & konversi ke WebP
        const compressedFile = await compressImage(originalFile, {
          maxDimension: 1280,
          quality: 0.82,
          maxSizeKB: 800,
        });

        const ratio = ((1 - compressedFile.size / originalFile.size) * 100).toFixed(0);
        setUploadProgress(`⬆️ Mengupload foto ${i + 1}/${photoFiles.length} (${formatFileSize(originalFile.size)} → ${formatFileSize(compressedFile.size)}, hemat ${ratio}%)...`);

        const fileName = `${adId}/${Date.now()}-${i}.webp`;

        const { error: uploadError } = await supabase.storage
          .from('ad_images')
          .upload(fileName, compressedFile, { contentType: 'image/webp' });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('ad_images')
          .getPublicUrl(fileName);
        
        imageUrls.push(publicUrl);
      }

      // 3. Insert Image URLs
      if (imageUrls.length > 0) {
        const imageInserts = imageUrls.map(url => ({ ad_id: adId, url }));
        await supabase.from('ad_images').insert(imageInserts);
      }

      setUploadProgress('');

      // 4. Success -> Redirect
      setShowSuccessModal(true);

    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan saat menyimpan iklan.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Pasang Iklan Baru</h1>
          <p className={styles.pageSubtitle}>Isi detail barang Anda agar cepat laku terjual</p>
        </div>

        {/* 1. Kategori & Judul */}
        <div className={styles.formCard}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📝</span> Info Utama
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Judul Iklan <span className={styles.required}>*</span></label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Contoh: Honda Brio E Satya 2020 Mulus"
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            <div className={styles.charCount}>{formData.title.length}/70</div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Kategori <span className={styles.required}>*</span></label>
            <select 
              className={styles.select} 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="Mobil">Mobil Bekas</option>
              <option value="Motor">Motor Bekas</option>
              <option value="Properti">Properti</option>
              <option value="Elektronik">Elektronik & Gadget</option>
              <option value="Jasa">Jasa & Lowongan</option>
              <option value="Hobi">Hobi & Olahraga</option>
            </select>
          </div>
        </div>

        {/* 2. Harga & Kondisi */}
        <div className={styles.formCard}>
          <div className={styles.sectionTitle}>
            <Tag className={styles.sectionIcon} size={22} color="var(--color-primary-teal)" /> Harga & Kondisi
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Harga <span className={styles.required}>*</span></label>
            <div className={styles.priceWrapper}>
              <span className={styles.pricePrefix}>Rp</span>
              <input 
                type="number" 
                className={`${styles.input} ${styles.priceInput}`} 
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Kondisi</label>
            <div className={styles.conditionGroup}>
              <input type="radio" id="cond-new" name="condition" className={styles.conditionOption} checked={formData.condition === 'Baru'} onChange={() => setFormData({...formData, condition: 'Baru'})} />
              <label htmlFor="cond-new" className={styles.conditionLabel}>Baru</label>
              
              <input type="radio" id="cond-used" name="condition" className={styles.conditionOption} checked={formData.condition === 'Bekas'} onChange={() => setFormData({...formData, condition: 'Bekas'})} />
              <label htmlFor="cond-used" className={styles.conditionLabel}>Bekas</label>
            </div>
          </div>
        </div>

        {/* 3. Deskripsi */}
        <div className={styles.formCard}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Deskripsi <span className={styles.required}>*</span></label>
            <textarea 
              className={styles.textarea} 
              placeholder="Ceritakan kondisi barang Anda secara detail (Contoh: Tangan pertama, pajak hidup, bonus aksesoris...)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
            <div className={styles.charCount}>{formData.description.length}/4000</div>
          </div>
        </div>

        {/* 4. Foto */}
        <div className={styles.formCard}>
          <div className={styles.sectionTitle}>
            <ImageIcon className={styles.sectionIcon} size={22} color="var(--color-primary-teal)" /> Foto Barang
          </div>
          
          <div className={styles.tips}>
            <div className={styles.tipsTitle}>💡 Tips Foto yang Baik</div>
            <ul className={styles.tipsList}>
              <li>📸 Gunakan foto asli dengan pencahayaan yang terang</li>
              <li>🖼️ Foto pertama akan menjadi foto utama yang dilihat pembeli</li>
              <li>🚫 Hindari foto ber-watermark atau hasil screenshot</li>
              <li>📐 Maksimal {MAX_PHOTOS} foto, format JPG/PNG/WEBP</li>
            </ul>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />

          <div className={styles.photoArea}>
            {/* Kiri: Slot Foto Utama */}
            <div
              className={`${styles.photoSlot} ${styles.mainSlot}`}
              onClick={() => openFilePicker(0)}
              style={photos[0] ? {
                backgroundImage: `url(${photos[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: 'none',
              } : {}}
            >
              {photos[0] ? (
                <button
                  className={styles.removePhotoBtn}
                  onClick={(e) => { e.stopPropagation(); removePhoto(0); }}
                  title="Hapus foto"
                >
                  <X size={14} />
                </button>
              ) : (
                <>
                  <Camera size={40} strokeWidth={1.5} />
                  <span style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px' }}>Foto Utama</span>
                  <span style={{ fontSize: '11px' }}>Klik untuk unggah</span>
                </>
              )}
            </div>

            {/* Kanan: 4 Thumbnail 2x2 */}
            <div className={styles.photoThumbs}>
              {[1, 2, 3, 4].map((slot) => (
                <div
                  key={slot}
                  className={styles.photoSlot}
                  onClick={() => openFilePicker(slot)}
                  style={photos[slot] ? {
                    backgroundImage: `url(${photos[slot]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: 'none',
                  } : {}}
                >
                  {photos[slot] ? (
                    <>
                      <button
                        className={styles.removePhotoBtn}
                        onClick={(e) => { e.stopPropagation(); removePhoto(slot); }}
                        title="Hapus foto"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAsMainPhoto(slot); }}
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                          whiteSpace: 'nowrap'
                        }}
                        title="Jadikan foto utama"
                      >
                        🌟 Jadikan Utama
                      </button>
                    </>
                  ) : (
                    <>
                      <Camera size={20} strokeWidth={1.5} />
                      <span style={{ fontSize: '10px', marginTop: '4px' }}>Tambah</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '10px', textAlign: 'right' }}>
            {photos.length}/{MAX_PHOTOS} foto
          </div>
        </div>

        {/* 5. Lokasi */}
        <div className={styles.formCard}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📍</span> Lokasi Anda
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Pilih Lokasi Pertemuan / Penjualan <span className={styles.required}>*</span></label>
            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                onClick={() => setMapTab('search')}
                style={{ flex: 1, padding: '9px 0', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: mapTab === 'search' ? 'var(--color-primary-teal)' : 'white', color: mapTab === 'search' ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s' }}
              >
                🔍 Nama
              </button>
              <button
                onClick={() => setMapTab('coord')}
                style={{ flex: 1, padding: '9px 0', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: mapTab === 'coord' ? 'var(--color-primary-teal)' : 'white', color: mapTab === 'coord' ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s', borderLeft: '1px solid var(--color-border)' }}
              >
                📌 Koordinat
              </button>
              <button
                onClick={() => setMapTab('link')}
                style={{ flex: 1, padding: '9px 0', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: mapTab === 'link' ? 'var(--color-primary-teal)' : 'white', color: mapTab === 'link' ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s', borderLeft: '1px solid var(--color-border)' }}
              >
                🔗 Link Maps
              </button>
            </div>

            {/* Tab: Search by name - Autocomplete */}
            {mapTab === 'search' && (
              <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: searchError ? '4px' : '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input 
                      type="text" 
                      className={styles.input} 
                      style={{ width: '100%', margin: 0, paddingRight: isSearching ? '36px' : '12px' }}
                      placeholder="Ketik nama Desa, Kecamatan, Kota, Landmark..."
                      value={searchQuery}
                      onChange={(e) => handleSearchQueryChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleSearchLocation(); }
                        if (e.key === 'Escape') { setSearchResults([]); }
                      }}
                      autoComplete="off"
                    />
                    {isSearching && (
                      <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', animation: 'spin 1s linear infinite' }}>⏳</div>
                    )}
                    {searchQuery && !isSearching && (
                      <button
                        onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchError(''); }}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}
                      >×</button>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleSearchLocation(); }}
                    disabled={isSearching}
                    style={{ padding: '0 18px', backgroundColor: 'var(--color-primary-teal)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: isSearching ? 'not-allowed' : 'pointer', opacity: isSearching ? 0.7 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    Cari
                  </button>
                </div>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '10px', marginTop: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '320px', overflowY: 'auto' }}>
                    <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {searchResults.length} lokasi ditemukan
                    </div>
                    {searchResults.map((res, i) => {
                      const addr = res.address || {};
                      const mainName = addr.amenity || addr.tourism || addr.leisure || addr.shop || addr.building || addr.road || addr.village || addr.suburb || addr.town || addr.city || addr.municipality || res.display_name.split(', ')[0];
                      const area = [addr.suburb || addr.village, addr.city_district || addr.county, addr.city || addr.town || addr.municipality, addr.state].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
                      const typeLabel = getLocationTypeLabel(res.type, res.class);
                      return (
                        <div 
                          key={i}
                          style={{ padding: '10px 14px', borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid #f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px', transition: 'background 0.15s' }}
                          onClick={() => {
                            const lat = parseFloat(res.lat);
                            const lon = parseFloat(res.lon);
                            setMapCenter([lat, lon]);
                            setPinCoords([lat, lon]);
                            setParsedInfo({ lat, lng: lon });
                            const coordStr = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                            setFormData(prev => ({ ...prev, location: coordStr }));
                            setAddress(res.display_name);
                            setSearchResults([]);
                            setSearchError('');
                            setSearchQuery(mainName);
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          <div style={{ fontSize: '20px', marginTop: '1px', flexShrink: 0 }}>📍</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-primary-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mainName}</div>
                            {area && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{area}</div>}
                            <div style={{ fontSize: '11px', marginTop: '4px', display: 'inline-block', backgroundColor: '#eef9f4', color: 'var(--color-primary-teal)', padding: '1px 7px', borderRadius: '20px', fontWeight: 600 }}>{typeLabel}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {searchError && mapTab === 'search' && (
              <div style={{ color: '#d9534f', fontSize: '13px', marginBottom: '12px', padding: '0 4px' }}>
                * {searchError}
              </div>
            )}

            {/* Tab: Input coordinate */}
            {mapTab === 'coord' && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', lineHeight: '1.5', padding: '8px 10px', backgroundColor: '#fff8e1', borderRadius: '6px', borderLeft: '3px solid #fbc02d' }}>
                  💡 <strong>Format:</strong> -6.200000, 106.816666
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className={styles.input} 
                    style={{ flex: 1, margin: 0, fontFamily: 'monospace' }}
                    placeholder="-6.200000, 106.816666"
                    value={coordInput}
                    onChange={(e) => { setCoordInput(e.target.value); setCoordError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCoordInput(); } }}
                  />
                  <button 
                    onClick={(e) => { e.preventDefault(); handleCoordInput(); }}
                    style={{ padding: '0 20px', backgroundColor: '#ea4335', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    📌 Tandai
                  </button>
                </div>
                {coordError && (
                  <div style={{ color: '#d9534f', fontSize: '13px', marginTop: '6px', padding: '0 4px' }}>
                    ⚠️ {coordError}
                  </div>
                )}
                {parsedInfo && !coordError && (
                  <div style={{ color: 'var(--color-primary-teal)', fontSize: '12px', marginTop: '6px', padding: '0 4px', fontWeight: 600 }}>
                    ✓ Berhasil membaca: Lat {parsedInfo.lat.toFixed(6)}, Lng {parsedInfo.lng.toFixed(6)}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Input Link Maps */}
            {mapTab === 'link' && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', lineHeight: '1.5', padding: '8px 10px', backgroundColor: '#fff8e1', borderRadius: '6px', borderLeft: '3px solid #fbc02d' }}>
                  💡 <strong>Cara:</strong> Buka Google Maps → Pilih Lokasi → Klik Bagikan / Share → Salin Tautan → Paste di sini.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className={styles.input} 
                    style={{ flex: 1, margin: 0 }}
                    placeholder="https://maps.app.goo.gl/..."
                    value={linkInput}
                    onChange={(e) => { setLinkInput(e.target.value); setLinkError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLinkInput(); } }}
                  />
                  <button 
                    onClick={(e) => { e.preventDefault(); handleLinkInput(); }}
                    style={{ padding: '0 20px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    🔗 Ekstrak
                  </button>
                </div>
                {linkError && (
                  <div style={{ color: '#d9534f', fontSize: '13px', marginTop: '6px', padding: '0 4px' }}>
                    ⚠️ {linkError}
                  </div>
                )}
                {parsedInfo && !linkError && (
                  <div style={{ color: 'var(--color-primary-teal)', fontSize: '12px', marginTop: '6px', padding: '0 4px', fontWeight: 600 }}>
                    ✓ Berhasil mengekstrak lokasi
                  </div>
                )}
              </div>
            )}

            <MapPicker 
              centerPoint={mapCenter}
              externalPin={pinCoords}
              onLocationSelect={async (lat, lng) => {
                setPinCoords(null); // reset external pin when user clicks map
                setParsedInfo({ lat, lng }); // Menyimpan lat lng untuk keperluan insert database
                const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setFormData(prev => ({ ...prev, location: coordStr }));
                setAddress('⏳ Mengambil alamat...');
                try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
                  const data = await res.json();
                  if (data && data.address) {
                    const a = data.address;
                    const poi = a.amenity || a.building || a.shop || a.office || a.leisure || a.tourism || a.historic || a.mall || a.commercial;
                    const roadAndNum = [a.road || a.pedestrian || a.footway, a.house_number].filter(Boolean).join(' ');
                    
                    const parts = [
                      poi,
                      roadAndNum,
                      a.village || a.suburb || a.neighbourhood,
                      a.county || a.city_district,
                      a.city || a.town || a.municipality,
                      a.state,
                      a.postcode
                    ].filter(Boolean);
                    
                    const uniqueParts = parts.filter((item, pos) => parts.indexOf(item) === pos);
                    let finalAddress = uniqueParts.join(', ');
                    finalAddress = finalAddress.replace(/Jalan /gi, 'Jl. ');
                    
                    setAddress(finalAddress || data?.display_name || 'Alamat tidak ditemukan');
                  } else {
                    setAddress(data?.display_name || 'Alamat tidak ditemukan');
                  }
                } catch (e) {
                  setAddress('Gagal mengambil alamat');
                }
              }} 
            />
            {formData.location && (
              <div style={{ marginTop: '10px', border: '1px solid #dadce0', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                {/* Header bar like Google Maps */}
                <div style={{ backgroundColor: '#ea4335', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="20" viewBox="0 0 24 34" fill="white">
                    <path d="M12 0C7.06 0 3 4.06 3 9c0 6.75 9 17 9 17s9-10.25 9-17C21 4.06 16.94 0 12 0z"/>
                    <circle cx="12" cy="9" r="4" fill="rgba(255,255,255,0.4)"/>
                  </svg>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>Lokasi Terpilih</span>
                </div>
                {/* Address content */}
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: '1.5', fontWeight: 500 }}>
                    {address === '⏳ Mengambil alamat...' ? (
                      <span style={{ color: '#888', fontStyle: 'italic' }}>⏳ Mengambil alamat...</span>
                    ) : address}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#70757a', fontFamily: 'monospace' }}>🌐 {formData.location}</div>
                    <a 
                      href={`https://www.google.com/maps?q=${formData.location}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#1a73e8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Buka Google Maps ↗
                    </a>
                  </div>
                </div>
              </div>
            )}
            <div className={styles.inputHint}>Membantu pembeli terdekat menemukan barang Anda.</div>
          </div>
        </div>

        {/* Actions */}
        {submitError && (
          <div style={{ color: '#d9534f', backgroundColor: '#fdf3f2', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #f5c2c7' }}>
            ⚠️ {submitError}
          </div>
        )}
        
        {uploadProgress && (
          <div style={{ backgroundColor: '#eef9f4', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #a3e4d7', color: 'var(--color-primary-teal)', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>
            {uploadProgress}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.draftButton} disabled={isSubmitting}>Simpan Draft</button>
          <button className={styles.submitButton} onClick={handleSubmit} disabled={isSubmitting}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {isSubmitting ? '⏳ Sedang Diproses...' : 'Tayangkan Iklan Sekarang'}
            </span>
          </button>
        </div>

      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className={styles.modalTitle}>Iklan Berhasil Ditayangkan!</h2>
            <p className={styles.modalText}>
              Bagus sekali! Iklan Anda sekarang sudah aktif dan dapat dilihat oleh ribuan pembeli potensial di seluruh Indonesia.
            </p>
            <button 
              className={styles.modalButton}
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
