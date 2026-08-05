'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Heart, MapPin, Bed, Bath, Clock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
// Removed Carousel to allow Link clicks to propagate properly
import { MoveInBadge } from '@/components/ui/MoveInBadge';
import { StarRating } from '@/components/ui/StarRating';
import { Avatar } from '@/components/ui/Avatar';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
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

  // Calculate move in cost dynamically if terms are provided
  const calculatedMoveInCost = (upfrontMonths !== undefined && depositMonths !== undefined && commissionMonths !== undefined) 
    ? price * (upfrontMonths + depositMonths + commissionMonths)
    : (moveInCost || price * 3);

  const formattedMoveInCost = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(calculatedMoveInCost).replace('£', currency);

  const termsString = (upfrontMonths !== undefined && depositMonths !== undefined && commissionMonths !== undefined) 
    ? `${upfrontMonths}+${depositMonths}+${commissionMonths}`
    : '1+1+1';

  return (
    <Link href={`/property/${id}`} className={clsx(styles.card, className)}>
      <div className={styles.gallery}>
        <div className={styles.badges}>
          <Badge variant="accent">{type}</Badge>
          {verificationTier === 'local' && <Badge variant="verified">Local Verified</Badge>}
          {verificationTier === 'international' && <Badge variant="verified" style={{ background: '#f59e0b', color: '#fff', borderColor: '#f59e0b' }}>Int. Verified</Badge>}
        </div>
        
        <button 
          className={clsx(styles.saveButton, saved && styles.saved)}
          onClick={handleSave}
          aria-label={saved ? "Remove from saved" : "Save property"}
        >
          <PremiumIcon icon={Heart} size={18} colorVariant="glass" />
        </button>

        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ProtectedImage 
            src={images[0] || '/images/placeholder-studio.jpg'} 
            alt={title} 
            className={styles.image}
          />
        </div>


      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.location}>
              <PremiumIcon icon={MapPin} size={12} containerSize={24} colorVariant="primary" />
              <span>{location}</span>
            </div>
          </div>
          <div className={styles.price}>{formattedPrice}/mo</div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <Bed size={16} />
            <span>{bedrooms} Beds</span>
          </div>
          <div className={styles.detailItem}>
            <Bath size={16} />
            <span>{bathrooms} Baths</span>
          </div>

          {walkingDistanceMins && (
            <div className={styles.detailItem}>
              <Clock size={16} />
              <span>{walkingDistanceMins}m to uni</span>
            </div>
          )}
        </div>

        <div className={styles.moveInBadge}>
          <MoveInBadge cost={calculatedMoveInCost} />
          {(upfrontMonths !== undefined || moveInCost) && (
            <span className={styles.termsText} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem', textAlign: 'center' }}>
              Terms: {termsString}
            </span>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.agent}>
            <Avatar src={agentAvatar} fallback={agentName} size="sm" />
            <span>{agentName}</span>
          </div>
          {agentRating && agentRating > 0 ? (
            <StarRating rating={agentRating} size={14} showText />
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>New Agent</span>
          )}
        </div>
      </div>
    </Link>
  );
};
