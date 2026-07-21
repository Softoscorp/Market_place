import React from 'react';
import { clsx } from 'clsx';
import { User } from 'lucide-react';
import styles from './Avatar.module.css';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    return (
      <div
        ref={ref}
        className={clsx(styles.avatar, styles[`size-${size}`], className)}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.fallback}>
            {fallback ? (
              <span className={styles.fallbackText}>{fallback}</span>
            ) : (
              <User className={styles.icon} />
            )}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
