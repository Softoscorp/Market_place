'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PremiumIcon } from './PremiumIcon';
import styles from './BackButton.module.css';

export function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    router.back();
  };

  return (
    <button onClick={handleBack} className={styles.button} aria-label={label}>
      <PremiumIcon icon={ArrowLeft} size={16} colorVariant="primary" containerSize={32} />
      <span>{label}</span>
    </button>
  );
}
