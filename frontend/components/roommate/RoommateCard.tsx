'use client';

import React from 'react';
import { MessageCircle, Heart } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import styles from './RoommateCard.module.css';

interface RoommateCardProps {
  name: string;
  age: number;
  occupation: string;
  imageUrl: string;
  matchScore: number;
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
  matchScore,
  sharedInterests,
  budget,
  profileType = 'roommate',
  houseType,
  nationality,
  location,
  gender
}: RoommateCardProps) {
  const { openChat } = useChatStore();

  return (
    <div className={styles.card}>
      <div className={styles.photoWrap}>
        {imageUrl ? (
          <ProtectedImage src={imageUrl} fallbackSrc={imageUrl} alt={name} className={styles.photo} />
        ) : (
          <div className={`${styles.photo} ${styles.photoFallback}`}>
            <span className={styles.photoIcon}>{profileType === 'housemate' ? '🛏️' : '🛋️'}</span>
          </div>
        )}
        <div className={styles.overlay} />
        <div className={styles.matchPill}>{matchScore}% Match</div>
        <div className={`${styles.typePill} ${profileType === 'housemate' ? styles.typeHousemate : styles.typeRoommate}`}>
          {profileType === 'housemate' ? '🏠 Housemate' : '🤝 Roommate'}
        </div>
        <div className={styles.pricePill}>{budget} / mo</div>
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
          {houseType && <span className={`${styles.tag} ${styles.tagGold}`}>{houseType} flat</span>}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={() => openChat({ id: name, name: name, avatarUrl: imageUrl })}
          >
            <MessageCircle size={16} style={{ marginRight: 6 }} />
            Message
          </button>
          <button className={styles.btnSecondary} aria-label="Save">
            <Heart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
