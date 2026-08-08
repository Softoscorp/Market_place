import React from 'react';
import { clsx } from 'clsx';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './VerifiedBadge.module.css';

interface VerifiedBadgeProps {
  tier?: 'none' | 'local' | 'international' | null;
  size?: 'sm' | 'md';
  label?: boolean;
}

const WAVY_HOUSE_PATH =
  'M4 10.6 L12 3.4 L20 10.6 ' +
  'c-0.9 0.55 -0.9 1.18 0 1.733 ' +
  'c0.9 0.55 0.9 1.18 0 1.733 ' +
  'c-0.9 0.55 -0.9 1.18 0 1.733 ' +
  'c0.9 0.55 0.9 1.18 0 1.733 ' +
  'c-0.9 0.55 -0.9 1.18 0 1.733 ' +
  'c0.9 0.55 0.9 1.18 0 1.733 ' +
  'c-0.67 1.0 -2.0 1.0 -2.667 0 ' +
  'c-0.67 -1.0 -2.0 -1.0 -2.667 0 ' +
  'c-0.67 1.0 -2.0 1.0 -2.667 0 ' +
  'c-0.67 -1.0 -2.0 -1.0 -2.667 0 ' +
  'c-0.67 1.0 -2.0 1.0 -2.667 0 ' +
  'c-0.67 -1.0 -2.0 -1.0 -2.667 0 ' +
  'c-0.9 -0.55 -0.9 -1.18 0 -1.733 ' +
  'c0.9 -0.55 0.9 -1.18 0 -1.733 ' +
  'c-0.9 -0.55 -0.9 -1.18 0 -1.733 ' +
  'c0.9 -0.55 0.9 -1.18 0 -1.733 ' +
  'c-0.9 -0.55 -0.9 -1.18 0 -1.733 ' +
  'c0.9 -0.55 0.9 -1.18 0 -1.733 Z';

const HouseMark = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
  const check = size === 'sm'
    ? <polyline points="10 15.1 11.7 16.8 14.1 13.2" />
    : <polyline points="9.9 15.2 11.7 17 14.3 13" />;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.mark}>
      <path
        d={WAVY_HOUSE_PATH}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {check && (
        <polyline
          points={size === 'sm' ? '10 15.1 11.7 16.8 14.1 13.2' : '9.9 15.2 11.7 17 14.3 13'}
          fill="none"
          stroke="#fff"
          strokeWidth={size === 'sm' ? 2.2 : 2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
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
