'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Heart, MapPin, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './PropertyCard.module.css';

export interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  currency?: string;
  images: string[];
  type: string; // e.g. "2+1"
  sizeSqf?: number; // Kept as optional but unused to avoid TS errors from callers
  bedrooms: number;
  bathrooms: number;
  walkingDistanceMins?: number;
  moveInCost?: number; // Kept for backwards compatibility
  upfrontMonths?: number;
  depositMonths?: number;
  commissionMonths?: number;
  agentName: string;
  agentAvatar?: string;
  agentRating?: number;
  verificationTier?: 'none' | 'local' | 'international';
  isSaved?: boolean;
  onSaveToggle?: (id: string) => void;
  className?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  id,
  title,
  location,
  price,
  currency = '£',
  images,
  type,
  bedrooms,
  bathrooms,
  walkingDistanceMins,
  moveInCost,
  upfrontMonths,
  depositMonths,
  commissionMonths,
  agentName,
  agentAvatar,
  agentRating,
  verificationTier = 'none',
  isSaved = false,
  onSaveToggle,
  className
}) => {
  const [saved, setSaved] = useState(isSaved);
  const t = useLanguageStore((s) => s.t);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    if (onSaveToggle) {
      onSaveToggle(id);
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(price).replace('£', currency);

  const calculatedMoveInCost = (upfrontMonths !== undefined && depositMonths !== undefined && commissionMonths !== undefined)
    ? price * (upfrontMonths + depositMonths + commissionMonths)
    : (moveInCost || price * 3);

  const formattedMoveInCost = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(calculatedMoveInCost).replace('£', currency);

  return (
    <Link href={`/property/${id}`} className={clsx(styles.card, className)}>
      <div className={styles.hero}>
        <ProtectedImage
          src={images[0] || '/images/listing-placeholder.svg'}
          alt={title}
          className={styles.image}
        />
        <div className={styles.scrim} />

        <div className={styles.topBar}>
          <div className={styles.badges}>
            <Badge variant="accent">{type}</Badge>
          </div>
          <button
            className={clsx(styles.saveButton, saved && styles.saved)}
            onClick={handleSave}
            aria-label={saved ? t('prop_remove_saved') : t('prop_save_property')}
          >
            <Heart size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.pricePill}>
          <span className={styles.priceAmount}>{formattedPrice}</span>
          <span className={styles.pricePer}>{t('per_month')}</span>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.infoRow}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.side}>
            <div className={styles.loc}>
              <MapPin size={13} aria-hidden="true" />
              <span>{location}</span>
            </div>
            {walkingDistanceMins && (
              <div className={styles.campus}>
                <GraduationCap size={13} aria-hidden="true" />
                <span>{t('prop_to_uni').replace('{mins}', String(walkingDistanceMins))}</span>
              </div>
            )}
            <div className={styles.rooms}>
              {t('prop_beds_baths').replace('{bedrooms}', String(bedrooms)).replace('{bathrooms}', String(bathrooms))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.agent}>
          <Avatar src={agentAvatar} fallback={agentName} size="sm" />
          <span className={styles.agentName}>{agentName}<VerifiedBadge tier={verificationTier} size="sm" /></span>
          {agentRating && agentRating > 0 ? (
            <StarRating rating={agentRating} size={13} showText />
          ) : null}
        </div>
        <div className={styles.term}>
          <span className={styles.termLabel}>{t('prop_move_in')}</span>
          <span className={styles.termValue}>{formattedMoveInCost}</span>
        </div>
      </div>
    </Link>
  );
};
