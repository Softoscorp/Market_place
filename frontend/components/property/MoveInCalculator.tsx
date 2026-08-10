'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { MoveInBadge } from '@/components/ui/MoveInBadge';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
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
  const t = useLanguageStore((s) => s.t);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount).replace('£', currency);
  };

  const monthsLabel = t('mic_rent_advance')
    .replace('{months}', String(advanceMonths))
    .replace('{plural}', advanceMonths > 1 ? 's' : '');

  return (
    <div className={clsx(styles.container, className)}>
      <h3 className={styles.title}>{t('mic_title')}</h3>
      
      <div className={styles.breakdown}>
        <div className={styles.item}>
          <div className={styles.itemLabel}>
            <span>{monthsLabel}</span>
            <Tooltip content={t('mic_rent_tooltip').replace('{rent}', formatMoney(rent)).replace('{months}', String(advanceMonths))}>
              <Info size={14} className={styles.infoIcon} aria-hidden="true" />
            </Tooltip>
          </div>
          <span className={styles.itemValue}>{formatMoney(advanceTotal)}</span>
        </div>
        
        <div className={styles.item}>
          <div className={styles.itemLabel}>
            <span>{t('mic_deposit')}</span>
            <Tooltip content={t('mic_deposit_tooltip')}>
              <Info size={14} className={styles.infoIcon} aria-hidden="true" />
            </Tooltip>
          </div>
          <span className={styles.itemValue}>{formatMoney(deposit)}</span>
        </div>
        
        <div className={styles.item}>
          <div className={styles.itemLabel}>
            <span>{t('mic_commission')}</span>
            <Tooltip content={t('mic_commission_tooltip')}>
              <Info size={14} className={styles.infoIcon} aria-hidden="true" />
            </Tooltip>
          </div>
          <span className={styles.itemValue}>{formatMoney(commission)}</span>
        </div>
      </div>

      <div className={styles.totalSection}>
        <span className={styles.totalLabel}>{t('mic_total')}</span>
        <MoveInBadge cost={totalMoveIn} className={styles.totalBadge} />
      </div>
    </div>
  );
};
