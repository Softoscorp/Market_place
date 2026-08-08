import React from 'react';
import { clsx } from 'clsx';
import styles from './MoveInBadge.module.css';

export interface MoveInBadgeProps {
  cost: number;
  className?: string;
}

export const MoveInBadge: React.FC<MoveInBadgeProps> = ({ cost, className }) => {
  const formattedCost = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(cost);

  return <span className={clsx(styles.wrapper, className)}>{formattedCost}</span>;
};
