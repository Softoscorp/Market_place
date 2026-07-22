'use client';

import React from 'react';

interface ProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ProtectedImage({ src, alt, className, style, ...props }: ProtectedImageProps) {
  return (
    <img
      src={src}
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
      {...props}
    />
  );
}
