import React from 'react';
import Link from 'next/link';
import { Check, Star, Globe } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { mediaUrl } from '@/lib/api';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
import styles from './AgentCard.module.css';

import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { Tooltip } from '@/components/ui/Tooltip';

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
  onContact
}: AgentCardProps) {
  const { t } = useLanguageStore();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&bold=true`;
  const avatarSrc = imageUrl && !imageUrl.includes('placeholder')
    ? (mediaUrl(imageUrl) || defaultAvatar)
    : defaultAvatar;

  const online = isOnline(lastSeenAt);
  const statusText = lastSeenText(lastSeenAt);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <ProtectedImage src={avatarSrc} fallbackSrc={defaultAvatar} alt={name} className={styles.avatar} />
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
            <h3 className={styles.name} style={{ cursor: 'pointer' }}>{name}</h3>
          </Link>
          <p className={styles.agency}>{agency}</p>
          
          {verificationTier === 'local' && (
            <div className={`${styles.tierBadge} ${styles.tier1Badge}`}>
              <Check size={14} strokeWidth={2.5} aria-hidden="true" />
              <span>Verified</span>
            </div>
          )}
          {verificationTier === 'international' && (
            <div className={`${styles.tierBadge} ${styles.tier2Badge}`}>
              <Check size={14} strokeWidth={2.5} aria-hidden="true" />
              <span>Verified</span>
            </div>
          )}
          {(!verificationTier || verificationTier === 'none') && (
            <Tooltip content="You can still rent through them but it will be at your own risk." position="bottom">
              <div className={`${styles.tierBadge} ${styles.tierNoneBadge}`}>
                <span>Not Verified Yet</span>
              </div>
            </Tooltip>
          )}
          
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

      <button className={styles.contactBtn} onClick={onContact}>
        {t('contact_agent')}
      </button>
    </div>
  );
}
