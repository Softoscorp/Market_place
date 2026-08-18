'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Heart, Home, Users, BedDouble, Sofa } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { ClaimButton } from '@/components/claim/ClaimButton';
import styles from './RoommateCard.module.css';

interface RoommateCardProps {
  id: number;
  name: string;
  age: number;
  occupation: string;
  imageUrl: string;
  photos?: string[];
  sharedInterests: string[];
  budget: string;
  profileType?: string;
  houseType?: string;
  nationality?: string;
  location?: string;
  gender?: string;
  onClaimed?: (id: number) => void;
}

export function RoommateCard({
  id,
  name,
  age,
  occupation,
  imageUrl,
  photos,
  sharedInterests,
  budget,
  profileType = 'roommate',
  houseType,
  nationality,
  location,
  gender,
  onClaimed
}: RoommateCardProps) {
  const { openChat } = useChatStore();
  const t = useLanguageStore((s) => s.t);
  const [slide, setSlide] = useState(0);

  const slides = (photos && photos.length > 0 ? photos : [imageUrl]).filter(Boolean);
  const slideLabel = slides.length > 1 ? `${slide + 1} / ${slides.length}` : '';

  const prev = () => setSlide((s) => (s - 1 + slides.length) % slides.length);
  const next = () => setSlide((s) => (s + 1) % slides.length);

  return (
    <div className={styles.card}>
      <div className={styles.slider}>
        {slides.length > 0 ? (
          <ProtectedImage src={slides[slide]} fallbackSrc={slides[slide]} alt={name} className={styles.photo} />
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

        {slides.length > 1 && (
          <>
            <button className={`${styles.arrow} ${styles.arrowPrev}`} onClick={prev} aria-label={t('rc_prev_photo')}>
              <ChevronLeft size={16} />
            </button>
            <button className={`${styles.arrow} ${styles.arrowNext}`} onClick={next} aria-label={t('rc_next_photo')}>
              <ChevronRight size={16} />
            </button>
            <div className={styles.dots}>
              {slides.map((_, i) => (
                <span key={i} className={`${styles.dot} ${i === slide ? styles.dotOn : ''}`} onClick={() => setSlide(i)} />
              ))}
            </div>
            <span className={styles.slideCount}>{slideLabel}</span>
          </>
        )}
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
          {onClaimed && (
            <ClaimButton
              targetType="roommate"
              targetId={id}
              variant="secondary"
              size="sm"
              onClaimed={() => onClaimed(id)}
            />
          )}
          <button className={styles.btnSecondary} aria-label={t('rc_save')}>
            <Heart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}