import styles from './Detail.module.css';

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  // Dummy data
  const item = {
    id: id,
    title: 'Honda Brio E Satya 2020 Mulus',
    price: 'Rp 145.000.000',
    location: 'Jakarta Selatan, DKI Jakarta',
    time: 'Hari ini',
    description: 'Dijual Honda Brio E Satya 2020 Manual.\n\nKondisi mulus terawat, service record bengkel resmi Honda.\nPajak panjang sampai bulan 10 tahun 2026.\nSurat-surat lengkap (BPKB, STNK, Faktur).\nBebas tabrak dan bebas banjir.\n\nMinat serius silahkan chat atau hubungi via telepon. Harga masih bisa nego tipis di tempat.',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
    ],
    seller: {
      name: 'Budi Santoso',
      memberSince: 'Maret 2020',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80'
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        {/* Left Column - Media & Description */}
        <div className={styles.leftCol}>
          <div className={styles.galleryCard}>
            <div className={styles.mainImageWrapper}>
              <img src={item.images[0]} alt={item.title} className={styles.mainImage} />
            </div>
            <div className={styles.thumbnailList}>
              {item.images.map((img, index) => (
                <div key={index} className={styles.thumbnailWrapper}>
                  <img src={img} alt={`Thumbnail ${index + 1}`} className={styles.thumbnail} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.detailsCard}>
            <h2 className={styles.sectionTitle}>Deskripsi</h2>
            <div className={styles.description}>
              {item.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Price, CTA, Profile */}
        <div className={styles.rightCol}>
          <div className={styles.priceCard}>
            <h1 className={styles.price}>{item.price}</h1>
            <h2 className={styles.title}>{item.title}</h2>
            <div className={styles.locationTime}>
              <span>{item.location}</span>
              <span>{item.time}</span>
            </div>
          </div>

          <div className={styles.sellerCard}>
            <h3 className={styles.sectionTitle}>Profil Penjual</h3>
            <div className={styles.sellerInfo}>
              <img src={item.seller.avatar} alt={item.seller.name} className={styles.sellerAvatar} />
              <div>
                <h4 className={styles.sellerName}>{item.seller.name}</h4>
                <p className={styles.sellerMemberSince}>Anggota sejak {item.seller.memberSince}</p>
              </div>
            </div>
            <button className={styles.chatBtn}>Chat dengan Penjual</button>
            <button className={styles.callBtn}>Tampilkan Nomor</button>
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
