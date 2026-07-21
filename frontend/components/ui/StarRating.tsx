import React from 'react';
import { clsx } from 'clsx';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

export interface StarRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  max?: number;
  size?: number;
  showText?: boolean;
}

export const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  ({ className, rating, max = 5, size = 16, showText = false, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx(styles.wrapper, className)} {...props}>
        <div className={styles.stars}>
          {Array.from({ length: max }).map((_, i) => (
            <Star
              key={i}
              size={size}
              className={clsx(
                styles.star,
                i < Math.round(rating) ? styles.filled : styles.empty
              )}
            />
          ))}
        </div>
        {showText && <span className={styles.text}>{rating.toFixed(1)}</span>}
      </div>
    );
  }
);

StarRating.displayName = 'StarRating';
