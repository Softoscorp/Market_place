import React from 'react';
import { clsx } from 'clsx';
import { Badge } from './Badge';
import styles from './MoveInBadge.module.css';

export interface MoveInBadgeProps {
  cost: number;
  className?: string;
}

export const MoveInBadge: React.FC<MoveInBadgeProps> = ({ cost, className }) => {
  // Determine variant based on cost brackets
  // Example thresholds, adjust as needed
  let variant: 'success' | 'warning' | 'danger' = 'success';
  let label = 'Affordable';

  if (cost > 3000) {
    variant = 'danger';
    label = 'High Cost';
  } else if (cost > 1500) {
    variant = 'warning';
    label = 'Standard';
  }

  // Format currency
  const formattedCost = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(cost);

  return (
    <div className={clsx(styles.wrapper, className)}>
      <Badge variant={variant} className={styles.badge}>
        <span className={styles.dot} />
        {label} Move-in
      </Badge>
      <span className={styles.cost}>{formattedCost}</span>
    </div>
  );
};
