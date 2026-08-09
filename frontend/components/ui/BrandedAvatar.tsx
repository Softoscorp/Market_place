'use client';

import React from 'react';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { Logo } from '@/components/layout/Logo';
import { mediaUrl } from '@/lib/api';
import styles from './BrandedAvatar.module.css';

type BrandedAvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function BrandedAvatar({ src, name, size = 64, className, style }: BrandedAvatarProps) {
  const imageUrl = src
    ? src.startsWith('http')
      ? src
      : mediaUrl(src) || null
    : null;

  if (imageUrl) {
    return (
      <ProtectedImage
        src={imageUrl}
        fallbackSrc={imageUrl}
        alt={name}
        className={className}
        style={style}
      />
    );
  }

  return (
    <div
      className={`${styles.fallback} ${className || ''}`}
      style={{ width: size, height: size, ...style }}
      aria-label={name}
      role="img"
    >
      <Logo height={Math.round(size * 0.42)} />
    </div>
  );
}
