import React from 'react';
import Link from 'next/link';
import { Check, Star, Globe } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { mediaUrl } from '@/lib/api';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
import styles from './AgentCard.module.css';

import { ProtectedImage } from '@/components/ui/ProtectedImage';

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
          {verificationTier === 'local' && (
            <div className={styles.verifiedBadge}>
              <Check size={12} strokeWidth={3} />
            </div>
          )}
          {verificationTier === 'international' && (
            <div className={styles.internationalBadge}>
              <Globe size={12} strokeWidth={3} />
            </div>
          )}
          <div
            className={styles.onlineDot}
            style={{
              background: online ? '#22c55e' : '#9ca3af',
              boxShadow: online ? '0 0 0 2px #fff, 0 0 6px #22c55e' : 'none',
            }}
            title={statusText}
          />
        </div>
        <div className={styles.info}>
          <Link href={`/agent/${agentId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 className={styles.name} style={{ cursor: 'pointer' }}>{name}</h3>
          </Link>
          <p className={styles.agency}>{agency}</p>
          <p className={styles.onlineStatus} style={{ color: online ? '#22c55e' : '#9ca3af', fontSize: '0.75rem', margin: '2px 0 0' }}>
            {statusText}
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            <Star size={12} fill="#D4A574" color="#D4A574" style={{ marginRight: 2 }} />
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
