import React from 'react';
import Link from 'next/link';
import { Check, Star } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { mediaUrl } from '@/lib/api';
import styles from './AgentCard.module.css';

import { ProtectedImage } from '@/components/ui/ProtectedImage';

interface AgentCardProps {
  agentId: number | string;
  name: string;
  agency: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  activeListings: number;
  isVerified?: boolean;
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
  isVerified = true,
  onContact
}: AgentCardProps) {
  const { t } = useLanguageStore();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&bold=true`;
  const avatarSrc = imageUrl && !imageUrl.includes('placeholder')
    ? (mediaUrl(imageUrl) || defaultAvatar)
    : defaultAvatar;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <ProtectedImage src={avatarSrc} fallbackSrc={defaultAvatar} alt={name} className={styles.avatar} />
          {isVerified && (
            <div className={styles.verifiedBadge}>
              <Check size={12} strokeWidth={3} />
            </div>
          )}
        </div>
        <div className={styles.info}>
          <Link href={`/agent/${agentId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 className={styles.name} style={{ cursor: 'pointer' }}>{name}</h3>
          </Link>
          <p className={styles.agency}>{agency}</p>
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
        <div className={styles.statItem}>
          <span className={styles.statValue}>{activeListings}</span>
          <span className={styles.statLabel}>{t('agent_listings')}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>100%</span>
          <span className={styles.statLabel}>{t('agent_response')}</span>
        </div>
      </div>

      <button className={styles.contactBtn} onClick={onContact}>
        {t('contact_agent')}
      </button>
    </div>
  );
}
