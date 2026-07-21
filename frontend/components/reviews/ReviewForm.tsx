import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { rateAgent, rateApartment } from '@/lib/api';

interface ReviewFormProps {
  targetId: number;
  type: 'agent' | 'apartment';
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReviewForm({ targetId, type, onSuccess, onCancel }: ReviewFormProps) {
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      setError('Please select a star rating.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      if (type === 'agent') {
        await rateAgent(targetId, stars, comment);
      } else {
        await rateApartment(targetId, stars, comment);
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Write a Review</h3>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
      
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setStars(star)}
            onMouseEnter={() => setHoverStars(star)}
            onMouseLeave={() => setHoverStars(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Star
              size={24}
              fill={(hoverStars || stars) >= star ? '#f59e0b' : 'none'}
              color={(hoverStars || stars) >= star ? '#f59e0b' : '#d1d5db'}
            />
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your review (optional)..."
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', minHeight: '80px' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}
