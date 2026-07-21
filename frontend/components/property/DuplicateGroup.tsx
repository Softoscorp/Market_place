'use client';

import React from 'react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import styles from './DuplicateGroup.module.css';

export interface DuplicateOffer {
  listingId: string;
  agentName: string;
  agentAvatar?: string;
  agentRating: number;
  isVerified: boolean;
  price: number;
  moveInCost: number;
  currency?: string;
}

export interface DuplicateGroupProps {
  propertyTitle: string;
  offers: DuplicateOffer[];
  className?: string;
}

export const DuplicateGroup: React.FC<DuplicateGroupProps> = ({
  propertyTitle,
  offers,
  className
}) => {
  const router = useRouter();

  if (!offers || offers.length === 0) return null;

  const formatMoney = (amount: number, currency: string = '£') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount).replace('£', currency);
  };

  // Sort offers by price (lowest first)
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Compare Agent Offers</h3>
          <p className={styles.subtitle}>{offers.length} agents are listing this property.</p>
        </div>
      </div>

      <div className={styles.list}>
        {sortedOffers.map((offer) => (
          <div key={offer.listingId} className={styles.item}>
            <div className={styles.agentInfo}>
              <Avatar src={offer.agentAvatar} fallback={offer.agentName} size="md" />
              <div className={styles.agentDetails}>
                <div className={styles.agentName}>
                  {offer.agentName}
                  {offer.isVerified && (
                    <Badge variant="verified" className={styles.verifiedBadge}>Verified</Badge>
                  )}
                </div>
                <StarRating rating={offer.agentRating} size={12} showText />
              </div>
            </div>

            <div className={styles.offerInfo}>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.price}>{formatMoney(offer.price, offer.currency)}/mo</div>
                <div className={styles.moveIn}>
                  Move-in: {formatMoney(offer.moveInCost, offer.currency)}
                </div>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                className={styles.actionButton}
                onClick={() => router.push(`/property/${offer.listingId}`)}
              >
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
