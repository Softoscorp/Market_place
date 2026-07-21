import React from 'react';
import Link from 'next/link';
import { Check, Star } from 'lucide-react';
import styles from './AgentCard.module.css';

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
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={name} className={styles.avatar} />
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
          <span className={styles.statLabel}>{reviews} Reviews</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{activeListings}</span>
          <span className={styles.statLabel}>Listings</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>100%</span>
          <span className={styles.statLabel}>Response</span>
        </div>
      </div>

      <button className={styles.contactBtn} onClick={onContact}>
        Contact Agent
      </button>
    </div>
  );
}
