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
  nationality
}: RoommateCardProps) {
  const { openChat } = useChatStore();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarRing} style={{ transform: `rotate(${(matchScore / 100) * 360}deg)` }} />
          <ProtectedImage src={imageUrl} alt={name} className={styles.avatar} />
          <div className={styles.matchScoreBadge}>{matchScore}% Match</div>
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>{name}, {age}</h3>
          <p className={styles.details}>{occupation} • Budget: {budget}</p>
          <div className={styles.typeBadges}>
            <span className={`${styles.tag} ${profileType === 'housemate' ? styles.tagHousemate : styles.tagRoommate}`}>
              {profileType === 'housemate' ? '🏠 Housemate' : '🤝 Roommate'}
            </span>
            {houseType && <span className={styles.tag}>{houseType}</span>}
            {nationality && <span className={styles.tag}>🌍 {nationality}</span>}
          </div>
        </div>
      </div>

      <div className={styles.tags}>
        {sharedInterests.map((interest, idx) => (
          <span key={idx} className={`${styles.tag} ${styles.tagMatch}`}>
            {interest}
          </span>
        ))}
        <span className={styles.tag}>Non-smoker</span>
        <span className={styles.tag}>Early bird</span>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.btnPrimary}
          onClick={() => openChat({ id: name, name: name, avatarUrl: imageUrl })}
        >
          <MessageCircle size={16} style={{ marginRight: 4 }} />
          Message
        </button>
        <button className={styles.btnSecondary}>
          <Heart size={16} />
        </button>
      </div>
    </div>
  );
}
