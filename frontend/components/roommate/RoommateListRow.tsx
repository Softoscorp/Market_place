'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Heart, BedDouble, Sofa } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { ClaimButton } from '@/components/claim/ClaimButton';
import styles from './RoommateListRow.module.css';

interface RoommateListRowProps {
  id: number;
  name: string;
  age: number;
  gender?: string;
  occupation: string;
  imageUrl: string;
  photos?: string[];
  sharedInterests: string[];
  budget: string;
  profileType?: string;
  houseType?: string;
  nationality?: string;
  location?: string;
  onClaimed?: (id: number) => void;
}

export function RoommateListRow({
  id,
  name,
  age,
  gender,
  occupation,
  imageUrl,
  photos,
  sharedInterests,
  budget,
  profileType = 'roommate',
  houseType,
  nationality,
  location,
  onClaimed,
}: RoommateListRowProps) {
  const { openChat } = useChatStore();
  const t = useLanguageStore((s) => s.t);
  const [slide, setSlide] = useState(0);

  const slides = (photos && photos.length > 0 ? photos : [imageUrl]).filter(Boolean);
  const detail = [age > 0 ? `${age}` : '', gender, occupation]
    .filter(Boolean)
    .join(' · ');

  const prev = () => setSlide((s) => (s - 1 + slides.length) % slides.length);
  const next = () => setSlide((s) => (s + 1) % slides.length);

  return (
    <div className={styles.row}>
      <div className={styles.thumb}>
        {slides.length > 0 ? (
          <ProtectedImage src={slides[slide]} fallbackSrc={slides[slide]} alt={name} className={styles.thumbImg} />
        ) : (
          <div className={`${styles.thumbImg} ${styles.thumbFallback}`}>
            {profileType === 'housemate' ? <BedDouble size={26} /> : <Sofa size={26} />}
          </div>
        )}
        <span className={`${styles.typePill} ${profileType === 'housemate' ? styles.typeHousemate : styles.typeRoommate}`}>
          {profileType === 'housemate' ? t('rc_housemate') : t('rc_roommate')}
        </span>
        {slides.length > 1 && (
          <>
            <button className={`${styles.arrow} ${styles.arrowPrev}`} onClick={prev} aria-label={t('rc_prev_photo')}>
              <ChevronLeft size={12} />
            </button>
            <button className={`${styles.arrow} ${styles.arrowNext}`} onClick={next} aria-label={t('rc_next_photo')}>
              <ChevronRight size={12} />
            </button>
            <span className={styles.slideCount}>{slide + 1}/{slides.length}</span>
          </>
        )}
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
            aria-label={t('rc_save')}
          >
            <Heart size={15} />
          </button>
          {onClaimed && (
            <ClaimButton
              targetType="roommate"
              targetId={id}
              variant="secondary"
              size="sm"
              onClaimed={() => onClaimed(id)}
            />
          )}
          <button
            className={styles.btnPrimary}
            onClick={() => openChat({ id: name, name: name, avatarUrl: imageUrl })}
          >
            <MessageCircle size={15} className={styles.messageIcon} />
            {t('rc_message')}
          </button>
        </div>
      </div>
    </div>
  );
}