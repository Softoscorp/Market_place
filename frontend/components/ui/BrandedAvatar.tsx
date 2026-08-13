'use client';

import React, { useState } from 'react';
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
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

export function BrandedAvatar({ src, name, size = 64, className }: BrandedAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = src
    ? src.startsWith('http')
      ? src
      : mediaUrl(src) || null
    : null;

  if (imageUrl && !imageFailed) {
    return (
      <ProtectedImage
        src={imageUrl}
        fallbackSrc={imageUrl}
        alt={name}
        className={className}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${styles.fallback} ${styles.sized} ${className || ''}`}
      style={{ '--avatar-size': `${size}px`, '--avatar-font-size': `${Math.round(size * 0.38)}px` } as React.CSSProperties}
      aria-label={name}
      role="img"
    >
      <span className={styles.initials}>
        {initialsOf(name)}
      </span>
    </div>
  );
}
