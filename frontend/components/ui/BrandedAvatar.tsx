'use client';

import React from 'react';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { mediaUrl } from '@/lib/api';
import styles from './BrandedAvatar.module.css';

type BrandedAvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase());
  return words.slice(0, 2).join('');
}

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
      <span className={styles.initials} style={{ fontSize: Math.round(size * 0.38) }}>
        {initialsOf(name)}
      </span>
    </div>
  );
}
