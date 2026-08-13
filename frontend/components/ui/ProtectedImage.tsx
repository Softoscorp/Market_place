'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import styles from './ProtectedImage.module.css';

interface ProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ProtectedImage({ src, alt, fallbackSrc, className, onError, ...props }: ProtectedImageProps) {
  // Track which src caused an error — when src prop changes this won't match,
  // so the new src is shown automatically without any state reset needed.
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  // Derive the displayed src purely from props + error state. No refs, no effects.
  const displaySrc = (!src || errorSrc === src) && fallbackSrc ? fallbackSrc : src;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && errorSrc !== src) {
      setErrorSrc(src);
    }
    if (onError) onError(e);
  };

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={displaySrc}
      alt={alt}
      className={clsx(styles.protectedImage, className)}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onError={handleError}
      {...props}
    />
  );
}
