'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { apiRequest, mediaUrl } from '@/lib/api';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

import styles from './PropertyLinkCard.module.css';

const PROPERTY_LINK_RE = /(?:https?:\/\/[^\s]*)?\/property\/(\d+)/i;

interface ListingPreview {
  id: number;
  title: string;
  price: number;
  currency: string;
  location: string;
  photo_url?: string | null;
}

function ListingCard({ listingId, text }: { listingId: string; text: string }) {
  const { t } = useLanguageStore();
  const [listing, setListing] = useState<ListingPreview | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    apiRequest(`/listings/${listingId}`, { auth: false })
      .then((l) => {
        if (!active) return;
        const raw = l as Record<string, unknown>;
        const photos = Array.isArray(raw.photos) ? (raw.photos as Array<Record<string, unknown>>) : [];
        setListing({
          id: raw.id as number,
          title: raw.title as string,
          price: raw.price as number,
          currency: (raw.currency as string) || '£',
          location: raw.location as string,
          photo_url: (photos[0]?.url as string) || null,
        });
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => { active = false; };
  }, [listingId]);

  if (error) {
    return (
      <div className={styles.fallback}>
        <a href={`/property/${listingId}`} className={styles.fallbackLink}>
          {text}
        </a>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className={styles.loadingCard}>
        <div className={styles.thumbSkeleton} />
        <div className={styles.infoSkeleton}>
          <div className={styles.lineSkeleton} />
          <div className={styles.lineSkeletonShort} />
        </div>
      </div>
    );
  }

  return (
    <Link href={`/property/${listing.id}`} className={styles.card}>
      <div className={styles.thumb}>
        {listing.photo_url ? (
          <ProtectedImage
            src={mediaUrl(listing.photo_url) || ''}
            fallbackSrc={listing.photo_url}
            alt={listing.title}
            className={styles.thumbImg}
          />
        ) : (
          <div className={styles.thumbFallback}>
            <Building2 size={20} />
          </div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{listing.title}</div>
        <div className={styles.price}>
          {t('chat_listing_price').replace('{currency}', listing.currency).replace('{price}', String(listing.price))}
        </div>
        {listing.location && <div className={styles.location}>{listing.location}</div>}
        <span className={styles.viewBtn}>{t('chat_listing_view')}</span>
      </div>
    </Link>
  );
}

export function PropertyLinkCard({ text }: { text?: string | null }) {
  const match = text ? PROPERTY_LINK_RE.exec(text) : null;
  const listingId = match ? match[1] : null;

  if (!listingId) return null;

  return <ListingCard key={listingId} listingId={listingId} text={text || ''} />;
}