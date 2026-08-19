import React from 'react';
import { clsx } from 'clsx';
import { Star, StarHalf } from 'lucide-react';
import styles from './StarRating.module.css';

export interface StarRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  max?: number;
  size?: number;
  showText?: boolean;
}

export const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  ({ className, rating, max = 5, size = 16, showText = false, ...props }, ref) => {
    const rounded = Math.round(rating * 2) / 2;
    return (
      <div ref={ref} className={clsx(styles.wrapper, className)} {...props}>
        <div className={styles.stars} aria-hidden="true">
          {Array.from({ length: max }).map((_, i) => {
            const full = i + 1 <= Math.floor(rounded);
            const half = !full && i + 0.5 <= rounded;
            return half ? (
              <StarHalf
                key={i}
                size={size}
                className={clsx(styles.star, styles.filled)}
              />
            ) : (
              <Star
                key={i}
                size={size}
                className={clsx(styles.star, full ? styles.filled : styles.empty)}
              />
            );
          })}
        </div>
        {showText && <span className={styles.text}>{rounded.toFixed(1)}</span>}
      </div>
    );
  }
);

StarRating.displayName = 'StarRating';
