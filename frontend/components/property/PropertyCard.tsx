'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Heart, MapPin, Ruler, Bed, Bath, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
// Removed Carousel to allow Link clicks to propagate properly
import { MoveInBadge } from '@/components/ui/MoveInBadge';
import { StarRating } from '@/components/ui/StarRating';
import { Avatar } from '@/components/ui/Avatar';
import styles from './PropertyCard.module.css';

export interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  currency?: string;
  images: string[];
  type: string; // e.g. "2+1"
  sizeSqf: number;
  bedrooms: number;
  bathrooms: number;
  walkingDistanceMins?: number;
  moveInCost: number;
  agentName: string;
  agentAvatar?: string;
  agentRating?: number;
  isVerified?: boolean;
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
  sizeSqf,
  bedrooms,
  bathrooms,
  walkingDistanceMins,
  moveInCost,
  agentName,
  agentAvatar,
  agentRating = 4.5,
  isVerified = false,
  isSaved = false,
  onSaveToggle,
  className
}) => {
  const [saved, setSaved] = useState(isSaved);
  
  // Deterministic random FOMO data based on ID for demo purposes
  const getFomoData = (id: string) => {
    const numId = parseInt(id) || Math.floor(Math.random() * 100);
    const count = Math.floor(numId % 5) + 2; // Returns 2-6
    const isWatching = numId % 2 === 0;
    return isWatching 
      ? `🔥 ${count} people are watching this`
      : `💬 ${count} people contacted agent`;
  };
  const fomoMessage = getFomoData(id);

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

  return (
    <Link href={`/property/${id}`} className={clsx(styles.card, className)}>
      <div className={styles.gallery}>
        <div className={styles.badges}>
          <Badge variant="accent">{type}</Badge>
          {isVerified && <Badge variant="verified">Verified</Badge>}
        </div>
        
        <button 
          className={clsx(styles.saveButton, saved && styles.saved)}
          onClick={handleSave}
          aria-label={saved ? "Remove from saved" : "Save property"}
        >
          <PremiumIcon icon={Heart} size={18} colorVariant="glass" />
        </button>

        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img 
            src={images[0] || '/images/placeholder-studio.jpg'} 
            alt={title} 
            className={styles.image}
          />
        </div>

        <div className={styles.fomoBadge}>
          {fomoMessage}
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
          <div className={styles.detailItem}>
            <Ruler size={16} />
            <span>{sizeSqf} sqft</span>
          </div>
          {walkingDistanceMins && (
            <div className={styles.detailItem}>
              <Clock size={16} />
              <span>{walkingDistanceMins}m to uni</span>
            </div>
          )}
        </div>

        <div className={styles.moveInBadge}>
          <MoveInBadge cost={moveInCost} />
        </div>

        <div className={styles.footer}>
          <div className={styles.agent}>
            <Avatar src={agentAvatar} fallback={agentName} size="sm" />
            <span>{agentName}</span>
          </div>
          <StarRating rating={agentRating} size={14} showText />
        </div>
      </div>
    </Link>
  );
};
