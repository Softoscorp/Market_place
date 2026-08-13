'use client';

import React, { useState } from 'react';
import { Star, Phone, Mail, MapPin, MessageSquareHeart } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
import styles from './AgentProfile.module.css';

import { ProtectedImage } from '@/components/ui/ProtectedImage';

export interface AgentProfileProps {
  name: string;
  agency: string;
  imageUrl: string;
  bio: string;
  rating: number;
  reviews: number;
  activeListings: number;
  experienceYears: number;
  respondRate?: number;
  verificationTier?: 'none' | 'local' | 'international';
  lastSeenAt?: string | null;
}

export function AgentProfile({
  name,
  agency,
  imageUrl,
  bio,
  rating,
  reviews,
  activeListings,
  experienceYears,
  respondRate,
  verificationTier = 'none',
  lastSeenAt
}: AgentProfileProps) {
  const { openChat } = useChatStore();
  const t = useLanguageStore((s) => s.t);
  const [isRatingMode, setIsRatingMode] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRateSubmit = () => {
    if (selectedRating === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHasRated(true);
      setIsRatingMode(false);
    }, 1000);
  };

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <ProtectedImage src={imageUrl} alt={name} className={styles.avatar} />
        </div>
        
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h1 className={`${styles.name} ${styles.nameInline}`}>{name}<VerifiedBadge tier={verificationTier} /></h1>
            {lastSeenAt && (
              <span className={isOnline(lastSeenAt) ? styles.statusOnline : styles.statusOffline}>
                <span className={styles.statusDot} />
                {(() => { const ls = lastSeenText(lastSeenAt); return t(ls.key, ls.params); })()}
              </span>
            )}          </div>
          <p className={styles.agency}>
            <PremiumIcon icon={MapPin} size={14} colorVariant="primary" containerSize={24} /> {agency}
          </p>
          <p className={styles.bio}>{bio}</p>
          
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {rating} <Star size={16} fill="var(--warning)" color="var(--warning)" aria-hidden="true" />
              </span>
              <span className={styles.statLabel}>{reviews} {t('agent_reviews')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{activeListings}</span>
              <span className={styles.statLabel}>{t('ac_active_listings')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{experienceYears} {t('ac_years')}</span>
              <span className={styles.statLabel}>{t('ac_experience')}</span>
            </div>
            {respondRate !== undefined && (
              <div className={styles.statItem}>
                <span className={styles.statValue}>{respondRate}%</span>
                <span className={styles.statLabel}>{t('agent_response')}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.contactActions}>
          <button className={styles.btnPrimary}>
            <PremiumIcon icon={Phone} size={16} colorVariant="success" containerSize={28} /> {t('ac_call_agent')}
          </button>
          <button 
            className={styles.btnSecondary}
            onClick={() => openChat({ id: name, name: name, avatarUrl: imageUrl })}
          >
            <PremiumIcon icon={Mail} size={16} colorVariant="primary" containerSize={28} /> {t('ac_send_message')}
          </button>
          <button 
            className={styles.btnRate}
            onClick={() => setIsRatingMode(!isRatingMode)}
            disabled={hasRated}
          >
            <PremiumIcon icon={MessageSquareHeart} size={16} colorVariant="accent" containerSize={28} /> {hasRated ? t('ac_rated') : t('ac_rate_agent')}
          </button>
        </div>

        {isRatingMode && !hasRated && (
          <div className={styles.ratingSection}>
            <h3 className={styles.ratingTitle}>{t('ac_rate_title').replace('{name}', name)}</h3>
            <div className={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`${styles.starBtn} ${(hoveredStar || selectedRating) >= star ? styles.starActive : ''}`}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedRating(star)}
                  aria-label={t('ac_rate_star').replace('{star}', String(star)).replace('{plural}', star === 1 ? '' : 's')}
                >
                  <Star size={24} fill={(hoveredStar || selectedRating) >= star ? 'var(--warning)' : 'transparent'} color="var(--warning)" />
                </button>
              ))}
            </div>
            <button 
              className={styles.submitRatingBtn} 
              disabled={selectedRating === 0 || isSubmitting}
              onClick={handleRateSubmit}
            >
              {isSubmitting ? t('ac_submitting') : t('ac_submit_rating')}
            </button>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('ac_about').replace('{name}', name)}</h2>
        <p className={styles.aboutText}>
          {bio || t('ac_about_default')}
        </p>
      </div>

    </div>
  );
}
