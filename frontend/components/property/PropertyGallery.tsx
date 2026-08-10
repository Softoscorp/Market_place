'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './PropertyGallery.module.css';

export interface PropertyGalleryProps {
  images: string[];
  title?: string;
  className?: string;
}

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({
  images,
  title = 'Property image',
  className
}) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const t = useLanguageStore((s) => s.t);

  if (!images || images.length === 0) {
    return (
      <div className={clsx(styles.galleryContainer, className)}>
        <div className={styles.mainSwiper}>
          <div className={styles.mainSlide}>
            <span>{t('pg_no_images')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.galleryContainer, className)}>
      <Swiper
        style={{
          '--swiper-navigation-color': 'var(--accent)',
          '--swiper-pagination-color': 'var(--accent)',
        } as React.CSSProperties}
        spaceBetween={10}
        navigation={true}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        modules={[FreeMode, Navigation, Thumbs, Pagination]}
        className={styles.mainSwiper}
      >
        {images.map((src, index) => (
          <SwiperSlide key={index} className={styles.mainSlide}>
            <ProtectedImage 
              src={src} 
              alt={t('pg_image_alt').replace('{title}', title).replace('{n}', String(index + 1))} 
              className={styles.mainImage} 
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {images.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className={styles.thumbSwiper}
          breakpoints={{
            320: { slidesPerView: 3 },
            640: { slidesPerView: 4 },
            1024: { slidesPerView: 5 },
          }}
        >
          {images.map((src, index) => (
            <SwiperSlide key={index} className={styles.thumbSlide}>
              <ProtectedImage 
                src={src} 
                alt={t('pg_thumb_alt').replace('{title}', title).replace('{n}', String(index + 1))} 
                className={styles.thumbImage} 
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};
