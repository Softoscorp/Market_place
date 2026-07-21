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
    return <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No reviews yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {reviews.map((review) => (
        <div key={review.id} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={review.stars >= star ? '#f59e0b' : 'none'}
                  color={review.stars >= star ? '#f59e0b' : '#d1d5db'}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
