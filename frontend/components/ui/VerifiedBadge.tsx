import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './VerifiedBadge.module.css';

interface VerifiedBadgeProps {
  tier?: 'none' | 'local' | 'international' | null;
  size?: 'sm' | 'md';
  label?: boolean;
}

export function VerifiedBadge({ tier = 'none', size = 'md', label = false }: VerifiedBadgeProps) {
  if (!tier || tier === 'none') return null;

  const isInternational = tier === 'international';
  const title = isInternational
    ? 'International verified agent'
    : 'Verified agent';

  const badge = (
    <span
      className={clsx(styles.badge, isInternational ? styles.international : styles.local, size === 'sm' && styles.sm)}
      role="img"
      aria-label={title}
    >
      <Check size={size === 'sm' ? 10 : 12} strokeWidth={3.5} aria-hidden="true" />
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
      <span className={clsx(styles.text, isInternational ? styles.textInt : styles.textLocal, size === 'sm' && styles.textSm)}>
        {isInternational ? 'Verified' : 'Verified'}
      </span>
    </span>
  );
}
