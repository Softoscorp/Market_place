import React from 'react';
import { clsx } from 'clsx';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './VerifiedBadge.module.css';

interface VerifiedBadgeProps {
  tier?: 'none' | 'local' | 'international' | null;
  size?: 'sm' | 'md';
  label?: boolean;
}

const HouseMark = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
  const sw = size === 'sm' ? 3 : 2.6;
  const check = size === 'sm'
    ? <polyline points="10.2 12.4 11.6 13.8 14 11.4" />
    : <polyline points="10.1 12.4 11.6 13.9 14.2 11.2" />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
      {check}
    </svg>
  );
};

export function VerifiedBadge({ tier = 'none', size = 'md', label = false }: VerifiedBadgeProps) {
  const isNone = !tier || tier === 'none';
  const isInternational = tier === 'international';
  const title = isNone
    ? 'Agent — not verified yet'
    : isInternational
      ? 'International verified agent'
      : 'Verified agent';

  const badge = (
    <span
      className={clsx(
        styles.badge,
        isNone ? styles.none : isInternational ? styles.international : styles.local,
        size === 'sm' && styles.sm
      )}
      role="img"
      aria-label={title}
    >
      <HouseMark size={size} />
    </span>
  );

  if (!label) {
    return (
      <Tooltip content={title} position="top">
        {badge}
      </Tooltip>
    );
  }

  return (
    <span className={styles.withLabel}>
      {badge}
      <span className={clsx(styles.text, isNone ? styles.textNone : isInternational ? styles.textInt : styles.textLocal, size === 'sm' && styles.textSm)}>
        {isNone ? 'Agent' : 'Verified'}
      </span>
    </span>
  );
}
