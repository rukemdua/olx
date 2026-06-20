import Link from 'next/link';
import styles from './CategoryIcon.module.css';

interface CategoryIconProps {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function CategoryIcon({ title, href, icon }: CategoryIconProps) {
  return (
    <Link href={href} className={`${styles.category} hover-lift`}>
      <div className={styles.iconWrapper}>
        <div className={styles.iconContainer}>
          {icon}
        </div>
      </div>
      <span className={styles.title}>{title}</span>
    </Link>
  );
}
