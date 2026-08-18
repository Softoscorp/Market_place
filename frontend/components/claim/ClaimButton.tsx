'use client';

import React, { useState } from 'react';
import { CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { claimTarget } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './ClaimButton.module.css';

export type ClaimVariant = 'primary' | 'secondary' | 'subtle' | 'ghost';

interface ClaimButtonProps {
  targetType: 'listing' | 'roommate';
  targetId: number | string;
  variant?: ClaimVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  onClaimed?: () => void;
}

export function ClaimButton({
  targetType,
  targetId,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  disabled,
  onClaimed,
}: ClaimButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const t = useLanguageStore((s) => s.t);
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (claiming || disabled) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setClaiming(true);
    try {
      await claimTarget(targetType, Number(targetId));
      if (onClaimed) onClaimed();
    } catch (err) {
      // Item was claimed by someone else, or claim blocked (limits / trust).
      const detail =
        err && typeof err === 'object' && 'detail' in err
          ? String((err as { detail?: unknown }).detail)
          : '';
      if (detail === 'claim_requires_verification') {
        alert(t('claim_requires_verification'));
      } else if (detail === 'claim_limit_reached') {
        alert(t('claim_limit_reached'));
      } else if (detail === 'You cannot claim your own item') {
        alert(t('claim_own_item'));
      } else {
        alert(detail || t('claim_error'));
      }
      if (onClaimed) onClaimed();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <button
      type="button"
      className={clsx(
        styles.claimButton,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className
      )}
      onClick={handleClaim}
      disabled={claiming || disabled}
    >
      {claiming ? (
        <Loader2 size={16} className={styles.spinner} aria-hidden="true" />
      ) : (
        <CheckCircle2 size={16} aria-hidden="true" />
      )}
      {claiming ? t('claim_processing') : t('claim_btn')}
    </button>
  );
}

interface ClaimedBadgeProps {
  byMe?: boolean;
  claimerName?: string | null;
  className?: string;
}

export function ClaimedBadge({ byMe, claimerName, className }: ClaimedBadgeProps) {
  const t = useLanguageStore((s) => s.t);
  return (
    <div className={clsx(styles.claimedBadge, byMe ? styles.claimedByMe : '', className)}>
      <Lock size={14} aria-hidden="true" />
      {byMe
        ? t('claim_status_you')
        : t('claim_status_other').replace('{name}', claimerName || t('claim_anonymous'))}
    </div>
  );
}