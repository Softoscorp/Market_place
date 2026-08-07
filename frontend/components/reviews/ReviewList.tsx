import React from 'react';
import { Star } from 'lucide-react';

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
  if (!reviews || reviews.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No reviews yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {reviews.map((review) => (
        <div key={review.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={review.stars >= star ? 'var(--warning)' : 'none'}
                  color={review.stars >= star ? 'var(--warning)' : 'var(--border)'}
                />
              ))}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}