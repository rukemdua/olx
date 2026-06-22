import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import styles from './Detail.module.css';
import ImageGallery from '@/components/ImageGallery/ImageGallery';
import { startChatAction } from './actions';

export const dynamic = 'force-dynamic';

function formatRupiah(number: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mnt lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 172800) return 'Kemarin';
  return `${Math.floor(seconds / 86400)} hari lalu`;
}

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch ad details and images
  const { data: ad, error } = await supabase
    .from('ads')
    .select(`
      *,
      ad_images ( url )
    `)
    .eq('id', id)
    .single();

  if (error || !ad) {
    console.error("Supabase Error (Ads):", error);
    notFound();
  }

  // Fetch seller profile separately to avoid foreign key inference errors
  const { data: sellerProfile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, created_at, phone')
    .eq('id', ad.user_id)
    .single();

  const images = ad.ad_images && ad.ad_images.length > 0 
    ? ad.ad_images.map((img: any) => img.url)
    : [];

  const sellerName = sellerProfile?.full_name || 'Pengguna OLX';
  const sellerAvatar = sellerProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=00b56a&color=fff`;
  const sellerPhone = sellerProfile?.phone;
  
  const memberSinceDate = new Date(sellerProfile?.created_at || new Date());
  const memberSince = memberSinceDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Buat lokasi pendek untuk di Price Card (atas)
  const fullLocation = ad.address || ad.location || 'Indonesia';
  let shortLocation = fullLocation;
  if (shortLocation.includes(',')) {
    const parts = shortLocation.split(',').map((s: string) => s.trim());
    shortLocation = parts.length > 2 ? `${parts[parts.length - 2]}` : parts[parts.length - 1];
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        {/* Left Column - Media & Description */}
        <div className={styles.leftCol}>
          <div className={styles.galleryCard}>
            <ImageGallery images={images} />
          </div>

          <div className={styles.detailsCard}>
            <h2 className={styles.sectionTitle}>Deskripsi</h2>
            <div className={styles.description}>
              {ad.description.split('\n').map((line: string, i: number) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          
          {ad.latitude && ad.longitude && (
            <div className={styles.detailsCard}>
              <h2 className={styles.sectionTitle}>Lokasi</h2>
              <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${ad.longitude - 0.005},${ad.latitude - 0.005},${ad.longitude + 0.005},${ad.latitude + 0.005}&layer=mapnik&marker=${ad.latitude},${ad.longitude}`}
                ></iframe>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0, flex: 1, minWidth: '200px', lineHeight: '1.4' }}>
                  📍 {fullLocation}
                </p>
                <a 
                  href={`https://www.google.com/maps?q=${ad.latitude},${ad.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.mapLink}
                  style={{ fontSize: '13px', color: '#1a73e8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', backgroundColor: '#e8f0fe', padding: '8px 14px', borderRadius: '8px', transition: 'background-color 0.2s' }}
                >
                  Buka Google Maps ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Price, CTA, Profile */}
        <div className={styles.rightCol}>
          <div className={styles.priceCard}>
            <h1 className={styles.price}>{formatRupiah(ad.price)}</h1>
            <h2 className={styles.title}>{ad.title}</h2>
            <div className={styles.locationTime} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }} title={fullLocation}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {shortLocation}
              </span>
              <span style={{ whiteSpace: 'nowrap', color: '#888' }}>{getTimeAgo(ad.created_at)}</span>
            </div>
          </div>

          <div className={styles.sellerCard}>
            <h3 className={styles.sectionTitle}>Profil Penjual</h3>
            <div className={styles.sellerInfo}>
              <img src={sellerAvatar} alt={sellerName} className={styles.sellerAvatar} />
              <div>
                <h4 className={styles.sellerName}>{sellerName}</h4>
                <p className={styles.sellerMemberSince}>Anggota sejak {memberSince}</p>
              </div>
            </div>
            
            {currentUser?.id === ad.user_id ? (
              <button className={styles.chatBtn} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                💬 Ini adalah iklan Anda
              </button>
            ) : (
              <form action={async () => {
                'use server';
                await startChatAction(ad.id, ad.user_id);
              }}>
                <button type="submit" className={styles.chatBtn}>💬 Chat dengan Penjual</button>
              </form>
            )}
            
            {sellerPhone ? (
              <a href={`tel:${sellerPhone}`} style={{ textDecoration: 'none' }}>
                <button className={styles.callBtn}>📞 Tampilkan Nomor</button>
              </a>
            ) : (
              <button className={styles.callBtn} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                Penjual Belum Memasukkan Nomor
              </button>
            )}
          </div>
          
          <div className={styles.safetyCard}>
            <h3 className={styles.safetyTitle}>Tips Aman Belanja</h3>
            <ul className={styles.safetyList}>
              <li>Gunakan fitur Chat untuk berkomunikasi.</li>
              <li>Selalu COD (Cash on Delivery) di tempat yang aman.</li>
              <li>Periksa barang dengan teliti sebelum membeli.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
