import styles from './page.module.css';
import Link from 'next/link';

export const metadata = {
  title: 'Pusat Bantuan - OLX Clone',
  description: 'Pusat bantuan dan tanya jawab.',
};

export default function BantuanPage() {
  const faqs = [
    { q: 'Bagaimana cara pasang iklan?', a: 'Klik tombol "+ Jual" di bagian kanan atas layar. Isi formulir dengan detail barang Anda, unggah foto, dan klik "Tayangkan Iklan".' },
    { q: 'Apakah pasang iklan berbayar?', a: 'Memasang iklan standar adalah gratis. Anda hanya akan dikenakan biaya jika menggunakan fitur Premium seperti Sundul Iklan.' },
    { q: 'Bagaimana cara bertransaksi dengan aman?', a: 'Selalu gunakan fitur chat bawaan kami. Kami sangat menyarankan Anda untuk bertemu fisik (COD) dan mengecek kondisi barang secara langsung sebelum melakukan pembayaran. Hindari mentransfer uang di muka kepada orang yang tidak dikenal.' },
    { q: 'Bagaimana jika saya menemukan iklan penipuan?', a: 'Anda dapat menekan tombol "Laporkan Iklan" di bagian bawah halaman detail produk. Tim moderator kami akan segera menindaklanjutinya.' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Pusat Bantuan</h1>
        <p className={styles.subtitle}>Ada yang bisa kami bantu hari ini?</p>
        <div className={styles.searchBox}>
          <input type="text" className={styles.searchInput} placeholder="Ketik topik bantuan..." />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Pertanyaan yang Sering Diajukan (FAQ)</h2>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>{faq.q}</h3>
              <p className={styles.faqAnswer}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Butuh Bantuan Lebih Lanjut?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Jika Anda tidak menemukan jawaban dari pertanyaan Anda di atas, silakan hubungi tim dukungan pelanggan kami.
        </p>
        <Link href="#" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'underline' }}>
          Hubungi Customer Service
        </Link>
      </div>
    </div>
  );
}
