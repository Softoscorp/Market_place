import React from 'react';
import { clsx } from 'clsx';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, circle, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          styles.skeleton,
          circle && styles.circle,
          styles.sized,
          className
        )}
        style={
          {
            ...(width != null && { '--skeleton-width': typeof width === 'number' ? `${width}px` : width }),
            ...(height != null && { '--skeleton-height': typeof height === 'number' ? `${height}px` : height }),
            ...style,
          } as React.CSSProperties
        }
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
