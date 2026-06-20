import styles from './Category.module.css';
import AdCard from '@/components/AdCard/AdCard';
import { notFound } from 'next/navigation';

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = await params;
  const category = resolvedParams.category;

  const validCategories = ['mobil', 'motor', 'properti', 'elektronik', 'jasa', 'hobi', 'kategori'];

  if (!validCategories.includes(category.toLowerCase())) {
    notFound();
  }

  // Capitalize category name for display
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  // Dummy recommendations
  const products = [
    { id: '201', title: `Item ${categoryName} 1 Terbaik`, price: 'Rp 15.000.000', location: 'Jakarta', time: 'Hari ini', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&q=80' },
    { id: '202', title: `Item ${categoryName} 2 Mulus`, price: 'Rp 25.000.000', location: 'Bandung', time: 'Kemarin', imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&q=80', featured: true },
    { id: '203', title: `Item ${categoryName} 3 Jarang Pakai`, price: 'Rp 5.000.000', location: 'Surabaya', time: '2 hari lalu', imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&q=80' },
    { id: '204', title: `Item ${categoryName} 4 Nego`, price: 'Rp 1.500.000', location: 'Yogyakarta', time: 'Hari ini', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80' },
  ];

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Kategori: {categoryName}</h1>
          <p className={styles.subtitle}>Menampilkan {products.length} iklan terbaru di kategori ini</p>
        </div>

        <div className={styles.content}>
          {/* Sidebar Filter (Dummy) */}
          <aside className={styles.sidebar}>
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Kategori</h3>
              <ul className={styles.filterList}>
                <li>Semua Kategori</li>
                <li className={styles.active}>{categoryName}</li>
              </ul>
            </div>
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Harga</h3>
              <div className={styles.priceInputs}>
                <input type="number" placeholder="Min" className={styles.input} />
                <span>-</span>
                <input type="number" placeholder="Max" className={styles.input} />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className={styles.productGrid}>
            {products.map((item) => (
              <AdCard 
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                location={item.location}
                time={item.time}
                imageUrl={item.imageUrl}
                featured={item.featured}
              />
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
