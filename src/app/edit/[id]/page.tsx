"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '@/app/jual/Jual.module.css'; // Reusing Jual CSS
import { Save, Image as ImageIcon, MapPin, Tag } from 'lucide-react';
import MapPicker from '@/components/MapPicker';

export default function EditAdPage() {
  const params = useParams();
  const id = params?.id;

  // Simulate fetching data
  const [formData, setFormData] = useState({
    title: 'Loading...',
    category: '',
    price: '',
    condition: 'Bekas',
    description: 'Loading...',
    location: 'Loading...',
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.200000, 106.816666]); // Default Jakarta
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

    // --- Format 1: Google Maps Shortlink (maps.app.goo.gl or goo.gl/maps) ---
    if (raw.includes('maps.app.goo.gl') || raw.includes('goo.gl/maps')) {
      setCoordError('⏳ Sedang mengekstrak koordinat dari link...');
      try {
        const extractUrl = raw.match(/https?:\/\/[^\s]+/)?.[0] || raw;
        const res = await fetch('/api/expand-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: extractUrl })
        });
        const data = await res.json();
        if (data.expandedUrl) {
          raw = data.expandedUrl; // Replace raw with the expanded URL
          setCoordError('');
        } else {
          setCoordError('Gagal membaca link Google Maps. Pastikan link valid.');
          return;
        }
      } catch (e) {
        setCoordError('Terjadi kesalahan saat memproses link.');
        return;
      }
    }

    // --- Format 2: Google Maps URL containing @lat,lng,zoom or ?q=lat,lng ---
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

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setFormData({
        title: 'Honda Brio E Satya 2020 Mulus',
        category: 'Mobil',
        price: '145000000',
        condition: 'Bekas',
        description: 'Jual cepat BU. Kondisi sangat terawat, servis rutin bengkel resmi. Pajak hidup sampai bulan depan. Bonus karpet dasar dan talang air.',
        location: 'Jakarta Selatan',
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Edit Iklan Anda</h1>
          <p className={styles.pageSubtitle}>Ubah detail atau perbarui foto iklan untuk ID: {id}</p>
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
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
            <div className={styles.charCount}>{formData.description.length}/4000</div>
          </div>
        </div>

        {/* 4. Foto (Pre-filled mockup) */}
        <div className={styles.formCard}>
          <div className={styles.sectionTitle}>
            <ImageIcon className={styles.sectionIcon} size={22} color="var(--color-primary-teal)" /> Foto Barang
          </div>
          
          <div className={styles.tips}>
            <div className={styles.tipsTitle}>💡 Tips</div>
            <ul className={styles.tipsList}>
              <li>Upload foto terang dari berbagai sudut</li>
              <li>Hindari foto *screenshot* atau ber-watermark</li>
            </ul>
          </div>

          <div className={styles.photoGrid}>
            <div className={`${styles.photoSlot} ${styles.main}`} style={{backgroundImage: 'url(https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'}}>
              <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</span>
            </div>
            <div className={styles.photoSlot}>
              <span className={styles.photoIcon}>+</span>
              Tambah
            </div>
            <div className={styles.photoSlot}>
              <span className={styles.photoIcon}>+</span>
              Tambah
            </div>
            <div className={styles.photoSlot}>
              <span className={styles.photoIcon}>+</span>
              Tambah
            </div>
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
                setPinCoords(null);
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
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>Lokasi Saat Ini</span>
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
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.draftButton}>Batalkan Edit</button>
          <button className={styles.submitButton}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={20} /> Simpan Perubahan
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
