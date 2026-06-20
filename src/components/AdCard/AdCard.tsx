import Link from 'next/link';
import styles from './AdCard.module.css';

interface AdCardProps {
  id: string;
  title: string;
  price: string;
  location: string;
  time: string;
  imageUrl: string;
  featured?: boolean;
}

export default function AdCard({ id, title, price, location, time, imageUrl, featured }: AdCardProps) {
  return (
    <Link href={`/item/${id}`} className={`${styles.card} hover-lift`}>
      <div className={styles.imageContainer}>
        <div className={styles.imageWrapper}>
          <img src={imageUrl} alt={title} className={styles.image} />
        </div>
        {featured && <span className={styles.featuredBadge}>HIGHLIGHT</span>}
        <button className={styles.wishlistBtn} aria-label="Add to wishlist">
          ♡
        </button>
      </div>
      <div className={styles.content}>
        <h3 className={styles.price}>{price}</h3>
        <p className={styles.title} title={title}>{title}</p>
        <div className={styles.footer}>
          <span className={styles.location}>{location}</span>
          <span className={styles.time}>{time}</span>
        </div>
      </div>
    </Link>
  );
}
