import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { rateAgent, rateApartment } from '@/lib/api';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './ReviewForm.module.css';

interface ReviewFormProps {
  targetId: number;
  type: 'agent' | 'apartment';
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReviewForm({ targetId, type, onSuccess, onCancel }: ReviewFormProps) {
  const t = useLanguageStore((s) => s.t);
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      setError(t('rf_select_rating'));
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
      setError(error.message || t('rf_failed_submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3 className={styles.title}>{t('rf_write_review')}</h3>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setStars(star)}
            onMouseEnter={() => setHoverStars(star)}
            onMouseLeave={() => setHoverStars(0)}
            aria-label={t('ac_rate_star').replace('{star}', String(star)).replace('{plural}', star === 1 ? '' : 's')}
            className={styles.starBtn}
          >
            <Star
              size={24}
              fill={(hoverStars || stars) >= star ? 'var(--warning)' : 'none'}
              color={(hoverStars || stars) >= star ? 'var(--warning)' : 'var(--border)'}
            />
          </button>
        ))}
      </div>

      <div className={styles.commentWrap}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('rf_placeholder')}
          className={styles.commentInput}
        />
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {t('auth_cancel')}
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('ac_submitting') : t('rf_submit_review')}
        </Button>
      </div>
    </form>
  );
}