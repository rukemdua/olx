import styles from './page.module.css';

export const metadata = {
  title: 'Tentang Kami - OLX Clone',
  description: 'Informasi tentang platform marketplace kami.',
};

export default function TentangPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Menghubungkan Pembeli dan Penjual di Seluruh Indonesia</h1>
        <p className={styles.subtitle}>
          Kami adalah platform marketplace terdepan yang memudahkan Anda untuk menjual barang bekas yang tidak terpakai atau menemukan penawaran terbaik di sekitar Anda.
        </p>
      </header>

      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.heading}>Misi Kami</h2>
          <p className={styles.text}>
            Misi kami adalah menciptakan ekosistem perdagangan barang bekas yang aman, cepat, dan transparan. Kami percaya bahwa setiap barang memiliki cerita dan nilai kedua. Dengan memperpanjang siklus hidup barang, kita bersama-seama berkontribusi pada lingkungan yang lebih berkelanjutan (Go Green).
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Mengapa Memilih Kami?</h2>
          <p className={styles.text}>
            Dilengkapi dengan teknologi pencarian berbasis AI dan fitur moderasi gambar canggih, kami memastikan bahwa pengalaman Anda di platform kami adalah yang terbaik. Tidak ada spam, transaksi lebih aman, dan pencarian hyper-local yang akurat.
          </p>
          
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>5M+</div>
              <div className={styles.statLabel}>Pengguna Aktif</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>10M+</div>
              <div className={styles.statLabel}>Iklan Tayang</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>500+</div>
              <div className={styles.statLabel}>Kota Tercakup</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
