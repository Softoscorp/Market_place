'use client';

import React from 'react';
import { MessageCircle, Heart, Home, Users, BedDouble, Sofa } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import styles from './RoommateCard.module.css';

interface RoommateCardProps {
  name: string;
  age: number;
  occupation: string;
  imageUrl: string;
  sharedInterests: string[];
  budget: string;
  profileType?: string;
  houseType?: string;
  nationality?: string;
  location?: string;
  gender?: string;
}

export function RoommateCard({
  name,
  age,
  occupation,
  imageUrl,
  sharedInterests,
  budget,
  profileType = 'roommate',
  houseType,
  nationality,
  location,
  gender
}: RoommateCardProps) {
  const { openChat } = useChatStore();
  const t = useLanguageStore((s) => s.t);

  return (
    <div className={styles.card}>
      <div className={styles.photoWrap}>
        {imageUrl ? (
          <ProtectedImage src={imageUrl} fallbackSrc={imageUrl} alt={name} className={styles.photo} />
        ) : (
          <div className={`${styles.photo} ${styles.photoFallback}`}>
            <span className={styles.photoIcon}>
              {profileType === 'housemate' ? <BedDouble size={42} /> : <Sofa size={42} />}
            </span>
          </div>
        )}
        <div className={styles.overlay} />
        <div className={`${styles.typePill} ${profileType === 'housemate' ? styles.typeHousemate : styles.typeRoommate}`}>
          {profileType === 'housemate' ? <Home size={12} className={styles.typeIcon} /> : <Users size={12} className={styles.typeIcon} />}
          {profileType === 'housemate' ? t('rc_housemate') : t('rc_roommate')}
        </div>
        <div className={styles.pricePill}>{budget} {t('per_month')}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          <h3 className={styles.name}>
            {name}
            {age > 0 && `, ${age}`}
            {gender && <small> · {gender}</small>}
          </h3>
          {location && <span className={styles.location}>{location}</span>}
        </div>

        <p className={styles.details}>
          {occupation}
          {nationality ? ` · ${nationality}` : ''}
        </p>

        <div className={styles.tags}>
          {sharedInterests.map((interest, idx) => (
            <span key={idx} className={styles.tag}>
              {interest}
            </span>
          ))}
          {houseType && <span className={`${styles.tag} ${styles.tagGold}`}>{t('rc_flat').replace('{type}', houseType)}</span>}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={() => openChat({ id: name, name: name, avatarUrl: imageUrl })}
          >
            <MessageCircle size={16} className={styles.messageIcon} />
            {t('rc_message')}
          </button>
          <button className={styles.btnSecondary} aria-label={t('rc_save')}>
            <Heart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
