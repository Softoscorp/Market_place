'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { MoveInBadge } from '@/components/ui/MoveInBadge';
import styles from './MoveInCalculator.module.css';

export interface MoveInCalculatorProps {
  rent: number;
  deposit: number;
  commission: number;
  advanceMonths: number;
  currency?: string;
  className?: string;
}

export const MoveInCalculator: React.FC<MoveInCalculatorProps> = ({
  rent,
  deposit,
  commission,
  advanceMonths,
  currency = '£',
  className
}) => {
  const advanceTotal = rent * advanceMonths;
  const totalMoveIn = advanceTotal + deposit + commission;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount).replace('£', currency);
  };

  return (
    <div className={clsx(styles.container, className)}>
      <h3 className={styles.title}>Move-in Breakdown</h3>
      
      <div className={styles.breakdown}>
        <div className={styles.item}>
          <div className={styles.itemLabel}>
            <span>Rent ({advanceMonths} month{advanceMonths > 1 ? 's' : ''} advance)</span>
            <Tooltip content={`Monthly rent is ${formatMoney(rent)}. You pay ${advanceMonths} month(s) upfront.`}>
              <Info size={14} className={styles.infoIcon} />
            </Tooltip>
          </div>
          <span className={styles.itemValue}>{formatMoney(advanceTotal)}</span>
        </div>
        
        <div className={styles.item}>
          <div className={styles.itemLabel}>
            <span>Deposit</span>
            <Tooltip content="Refundable deposit held by the landlord.">
              <Info size={14} className={styles.infoIcon} />
            </Tooltip>
          </div>
          <span className={styles.itemValue}>{formatMoney(deposit)}</span>
        </div>
        
        <div className={styles.item}>
          <div className={styles.itemLabel}>
            <span>Agency Commission</span>
            <Tooltip content="One-time fee for the real estate agency.">
              <Info size={14} className={styles.infoIcon} />
            </Tooltip>
          </div>
          <span className={styles.itemValue}>{formatMoney(commission)}</span>
        </div>
      </div>

      <div className={styles.totalSection}>
        <span className={styles.totalLabel}>Total Move-in</span>
        <MoveInBadge cost={totalMoveIn} />
      </div>
    </div>
  );
};
