"use client";

import React, { useState, useRef } from 'react';
import styles from './Jual.module.css';
import { ImageIcon, Tag, X, Camera } from 'lucide-react';
import MapPicker from '@/components/MapPicker';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.200000, 106.816666]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [address, setAddress] = useState('');
  const [searchError, setSearchError] = useState('');
  const [coordInput, setCoordInput] = useState('');
  const [coordError, setCoordError] = useState('');
  const [parsedInfo, setParsedInfo] = useState<{lat: number, lng: number} | null>(null);
  const [mapTab, setMapTab] = useState<'search' | 'coord'>('search');
  const [pinCoords, setPinCoords] = useState<[number, number] | null>(null);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSearchError('');
    
    try {
      // 1. Initial Search
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Indonesia')}&limit=5`);
      let data = await res.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        // 2. Fallback Search Logic
        // If query has commas, drop the first part (e.g., "Jalan Mawar, Sleman" -> "Sleman")
        // If space separated, drop first word (e.g., "Desa Sukamaju Tegal" -> "Sukamaju Tegal")
        let fallbackQuery = '';
        if (searchQuery.includes(',')) {
          fallbackQuery = searchQuery.split(',').slice(1).join(',').trim();
        } else {
          const words = searchQuery.split(' ');
          if (words.length > 1) {
            fallbackQuery = words.slice(1).join(' ').trim();
          }
        }

        if (fallbackQuery) {
          res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery + ', Indonesia')}&limit=5`);
          data = await res.json();
          if (data && data.length > 0) {
            setSearchResults(data);
            setSearchError('Lokasi spesifik tidak ditemukan. Berikut hasil untuk area yang lebih luas.');
          } else {
            setSearchError('Lokasi sama sekali tidak ditemukan. Coba ketik nama Kota atau Kabupaten saja.');
          }
        } else {
          setSearchError('Lokasi tidak ditemukan. Coba ketik nama Kota atau Kabupaten saja.');
        }
      }
    } catch (error) {
      console.error(error);
      setSearchError('Gagal mencari lokasi. Periksa koneksi internet Anda.');
    } finally {
      setIsSearching(false);
    }
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPhotos(prev => {
      const combined = [...prev, ...newPreviews];
      return combined.slice(0, MAX_PHOTOS);
    });
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const openFilePicker = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    fileInputRef.current?.click();
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
                    <button
                      className={styles.removePhotoBtn}
                      onClick={(e) => { e.stopPropagation(); removePhoto(slot); }}
                      title="Hapus foto"
                    >
                      <X size={14} />
                    </button>
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
                🔍 Cari Nama Lokasi
              </button>
              <button
                onClick={() => setMapTab('coord')}
                style={{ flex: 1, padding: '9px 0', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: mapTab === 'coord' ? 'var(--color-primary-teal)' : 'white', color: mapTab === 'coord' ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s', borderLeft: '1px solid var(--color-border)' }}
              >
                📌 Masukkan Koordinat
              </button>
            </div>

            {/* Tab: Search by name */}
            {mapTab === 'search' && (
              <div style={{ position: 'relative', marginBottom: searchError ? '4px' : '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className={styles.input} 
                    style={{ flex: 1, margin: 0 }}
                    placeholder="Cari Desa, Kecamatan, Kabupaten, atau Kota..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchLocation();
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => { e.preventDefault(); handleSearchLocation(); }}
                    disabled={isSearching}
                    style={{ padding: '0 20px', backgroundColor: 'var(--color-primary-teal)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: isSearching ? 'not-allowed' : 'pointer', opacity: isSearching ? 0.7 : 1, whiteSpace: 'nowrap' }}
                  >
                    {isSearching ? 'Mencari...' : 'Cari'}
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '250px', overflowY: 'auto' }}>
                    {searchResults.map((res, i) => {
                      const nameParts = res.display_name.split(', ');
                      const mainName = nameParts[0];
                      const detailName = nameParts.slice(1).join(', ');
                      return (
                        <div 
                          key={i}
                          style={{ padding: '12px', borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid var(--color-light-gray)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
                          onClick={() => { setMapCenter([parseFloat(res.lat), parseFloat(res.lon)]); setSearchResults([]); setSearchError(''); setSearchQuery(mainName); }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-light-gray)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-main)' }}>{mainName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{detailName}</div>
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
                  💡 <strong>Cara mendapatkan koordinat dari Google Maps:</strong><br/>
                  Klik kanan pada titik di Google Maps → Klik angka koordinat yang muncul → Paste di sini.<br/>
                  Anda juga bisa paste link Google Maps lengkap.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className={styles.input} 
                    style={{ flex: 1, margin: 0, fontFamily: 'monospace' }}
                    placeholder="Contoh: -6.200000, 106.816666"
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

            <MapPicker 
              centerPoint={mapCenter}
              externalPin={pinCoords}
              onLocationSelect={async (lat, lng) => {
                setPinCoords(null); // reset external pin when user clicks map
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
        <div className={styles.actions}>
          <button className={styles.draftButton}>Simpan Draft</button>
          <button className={styles.submitButton}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Tayangkan Iklan Sekarang
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
