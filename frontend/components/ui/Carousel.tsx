'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import type { SwiperOptions } from 'swiper/types';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import styles from './Carousel.module.css';

export interface CarouselProps {
  items: React.ReactNode[];
  className?: string;
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  navigation?: boolean;
  pagination?: boolean;
  breakpoints?: SwiperOptions['breakpoints'];
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  className,
  slidesPerView = 1,
  spaceBetween = 16,
  navigation = true,
  pagination = true,
  breakpoints
}) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerView}
        navigation={navigation}
        pagination={pagination ? { clickable: true } : false}
        breakpoints={breakpoints}
        className={styles.swiper}
      >
        {items.map((item, index) => (
          <SwiperSlide key={index} className={styles.slide}>
            {item}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
