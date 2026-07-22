'use client';

import React, { useState } from 'react';

interface ProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ProtectedImage({ src, alt, fallbackSrc, className, style, onError, ...props }: ProtectedImageProps) {
  // Track which src caused an error — when src prop changes this won't match,
  // so the new src is shown automatically without any state reset needed.
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  // Derive the displayed src purely from props + error state. No refs, no effects.
  const displaySrc = errorSrc === src && fallbackSrc ? fallbackSrc : src;

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
      className={className}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        pointerEvents: 'auto',
        ...style,
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onError={handleError}
      {...props}
    />
  );
}
