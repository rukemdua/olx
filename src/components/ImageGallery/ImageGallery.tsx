"use client";

import { useState } from 'react';
import styles from './ImageGallery.module.css';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

export default function ImageGallery({ images }: { images: string[] }) {
  const safeImages = images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=800&q=80'];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Swipe logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left -> Next image
      setCurrentIndex((prev) => (prev + 1) % safeImages.length);
    }
    if (isRightSwipe) {
      // Swipe right -> Previous image
      setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % safeImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  return (
    <div className={styles.galleryContainer}>
      <div 
        className={styles.mainImageWrapper}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img src={safeImages[currentIndex]} alt={`Foto Utama ${currentIndex + 1}`} className={styles.mainImage} />
        
        {safeImages.length > 1 && (
          <>
            <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev} aria-label="Previous image">
              <ChevronLeft size={28} />
            </button>
            <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext} aria-label="Next image">
              <ChevronRight size={28} />
            </button>
            
            <div className={styles.imageCounter}>
              <Camera size={16} />
              <span>{currentIndex + 1} / {safeImages.length}</span>
            </div>
            
            {/* Pagination Dots (Mobile Only) */}
            <div className={styles.paginationDots}>
              {safeImages.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`${styles.dot} ${currentIndex === idx ? styles.dotActive : ''}`} 
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {safeImages.length > 1 && (
        <div className={styles.thumbnailList}>
          {safeImages.map((img, index) => (
            <div 
              key={index} 
              className={`${styles.thumbnailWrapper} ${currentIndex === index ? styles.active : ''}`}
              onClick={() => setCurrentIndex(index)}
            >
              <img src={img} alt={`Thumbnail ${index + 1}`} className={styles.thumbnail} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
