'use client';

import React from 'react';
import { MessageCircle, Heart, BedDouble, Sofa } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import styles from './RoommateListRow.module.css';

interface RoommateListRowProps {
  name: string;
  age: number;
  gender?: string;
  occupation: string;
  imageUrl: string;
  matchScore: number;
  sharedInterests: string[];
  budget: string;
  profileType?: string;
  houseType?: string;
  nationality?: string;
  location?: string;
}

export function RoommateListRow({
  name,
  age,
  gender,
  occupation,
  imageUrl,
  matchScore,
  sharedInterests,
  budget,
  profileType = 'roommate',
  houseType,
  nationality,
  location,
}: RoommateListRowProps) {
  const { openChat } = useChatStore();

  const detail = [age > 0 ? `${age}` : '', gender, occupation]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={styles.row}>
      <div className={styles.thumb}>
        {imageUrl ? (
          <ProtectedImage src={imageUrl} fallbackSrc={imageUrl} alt={name} className={styles.thumbImg} />
        ) : (
          <div className={`${styles.thumbImg} ${styles.thumbFallback}`}>
            {profileType === 'housemate' ? <BedDouble size={26} /> : <Sofa size={26} />}
          </div>
        )}
        <span className={`${styles.typePill} ${profileType === 'housemate' ? styles.typeHousemate : styles.typeRoommate}`}>
          {profileType === 'housemate' ? 'Housemate' : 'Roommate'}
        </span>
      </div>

      <div className={styles.info}>
        <div className={styles.rowTop}>
          <div className={styles.who}>
            <span className={styles.name}>
              {name}
              {age > 0 && `, ${age}`}
            </span>
            {gender && <small className={styles.gender}> · {gender}</small>}
            <small className={styles.sub}>{detail.split(' · ').slice(0, 2).join(' · ')}</small>
            {location && <small className={styles.sub}>{location}</small>}
          </div>
          <span className={styles.match}>{matchScore}%</span>
        </div>

        <p className={styles.desc}>
          {occupation}
          {nationality ? ` · ${nationality}` : ''}
        </p>

        <div className={styles.rowBottom}>
          <div className={styles.tags}>
            {sharedInterests.slice(0, 2).map((interest, idx) => (
              <span key={idx} className={styles.tag}>
                {interest}
              </span>
            ))}
            {houseType && <span className={`${styles.tag} ${styles.tagGold}`}>{houseType}</span>}
          </div>
          <span className={styles.budget}>{budget}</span>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnSecondary}
            aria-label="Save"
          >
            <Heart size={15} />
          </button>
          <button
            className={styles.btnPrimary}
            onClick={() => openChat({ id: name, name: name, avatarUrl: imageUrl })}
          >
            <MessageCircle size={15} style={{ marginRight: 5 }} />
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
