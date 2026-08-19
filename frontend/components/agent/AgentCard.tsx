import React from 'react';
import Link from 'next/link';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
import { StarRating } from '@/components/ui/StarRating';
import styles from './AgentCard.module.css';

import { BrandedAvatar } from '@/components/ui/BrandedAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface AgentCardProps {
  agentId: number | string;
  name: string;
  agency: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  activeListings?: number;
  respondRate?: number;
  lastSeenAt?: string | null;
  verificationTier?: 'none' | 'local' | 'international';
  onContact?: () => void;
  compact?: boolean;
}

export function AgentCard({
  agentId,
  name,
  agency,
  imageUrl,
  rating,
  reviews,
  activeListings,
  respondRate,
  lastSeenAt,
  verificationTier = 'none',
  onContact,
  compact = false
}: AgentCardProps) {
  const { t } = useLanguageStore();
  const avatarSrc = imageUrl && !imageUrl.includes('placeholder') ? imageUrl : null;

  const online = isOnline(lastSeenAt);
  const lastSeen = lastSeenText(lastSeenAt);
  const statusText = t(lastSeen.key, lastSeen.params);

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <BrandedAvatar src={avatarSrc} name={name} className={styles.avatar} />
          <div
            className={`${styles.onlineDot} ${online ? styles.onlineDotOnline : styles.onlineDotOffline}`}
            title={statusText}
          />
        </div>
        <div className={styles.info}>
          <Link href={`/agent/${agentId}`} className={styles.nameLink}>
            <h3 className={`${styles.name} ${styles.nameClickable}`}>
              <span className={styles.nameText}>{name.trim()}</span>
              <VerifiedBadge tier={verificationTier} />
            </h3>
          </Link>
          <p className={styles.agency}>{agency}</p>

          <p className={`${styles.onlineStatus} ${styles.onlineStatusText} ${online ? styles.onlineStatusOnline : styles.onlineStatusOffline}`}>
            {statusText}
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {reviews > 0 ? (
              <StarRating rating={rating} size={14} />
            ) : (
              <span className={styles.newRating}>{t('agent_new')}</span>
            )}
          </span>
          <span className={styles.statLabel}>{reviews} {t('agent_reviews')}</span>
        </div>
        {activeListings !== undefined && (
          <div className={styles.statItem}>
            <span className={styles.statValue}>{activeListings}</span>
            <span className={styles.statLabel}>{t('agent_listings')}</span>
          </div>
        )}
        {respondRate != null && (
          <div className={styles.statItem}>
            <span className={styles.statValue}>{respondRate}%</span>
            <span className={styles.statLabel}>{t('agent_response')}</span>
          </div>
        )}
      </div>

      {!compact && onContact && (
        <button className={styles.contactBtn} onClick={onContact}>
          {t('contact_agent')}
        </button>
      )}
    </div>
  );
}
