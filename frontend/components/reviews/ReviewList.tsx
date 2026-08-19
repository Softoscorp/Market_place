import React from 'react';
import { Star } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './ReviewList.module.css';

interface Review {
  id: number;
  stars: number;
  comment?: string;
  created_at: string;
}

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const t = useLanguageStore((s) => s.t);
  if (!reviews || reviews.length === 0) {
    return <p className={styles.empty}>{t('rl_no_reviews')}</p>;
  }

  return (
    <div className={styles.list}>
      {reviews.map((review) => (
        <div key={review.id} className={styles.item}>
          <div className={styles.header}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={review.stars >= star ? 'var(--warning)' : 'none'}
                  color={review.stars >= star ? 'var(--warning)' : 'var(--border)'}
                />
              ))}
            </div>
            <span className={styles.date}>
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          {review.comment && <p className={styles.comment}>{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}