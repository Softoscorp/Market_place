import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
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
  const statusText = lastSeenText(lastSeenAt);

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <BrandedAvatar src={avatarSrc} name={name} className={styles.avatar} />
          <div
            className={styles.onlineDot}
            style={{
              background: online ? 'var(--success)' : 'var(--text-muted)',
              boxShadow: online ? '0 0 0 2px var(--bg-surface), 0 0 6px var(--success)' : 'none',
            }}
            title={statusText}
          />
        </div>
        <div className={styles.info}>
          <Link href={`/agent/${agentId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 className={styles.name} style={{ cursor: 'pointer' }}>
              <span className={styles.nameText}>{name}</span>
              <VerifiedBadge tier={verificationTier} />
            </h3>
          </Link>
          <p className={styles.agency}>{agency}</p>

          <p className={styles.onlineStatus} style={{ color: online ? 'var(--success)' : 'var(--text-muted)', fontSize: 'var(--text-xs)', margin: 'var(--space-2) 0 0' }}>
            {statusText}
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            <Star size={12} fill="var(--warning)" color="var(--warning)" aria-hidden="true" style={{ marginRight: 2 }} />
            {rating}
          </span>
          <span className={styles.statLabel}>{reviews} {t('agent_reviews')}</span>
        </div>
        {activeListings !== undefined && (
          <div className={styles.statItem}>
            <span className={styles.statValue}>{activeListings}</span>
            <span className={styles.statLabel}>{t('agent_listings')}</span>
          </div>
        )}
        {respondRate !== undefined && (
          <div className={styles.statItem}>
            <span className={styles.statValue}>{respondRate}%</span>
            <span className={styles.statLabel}>Respond Rate</span>
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
