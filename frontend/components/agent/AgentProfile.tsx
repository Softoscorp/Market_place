'use client';

import React, { useState } from 'react';
import { Check, Star, Phone, Mail, MapPin, MessageSquareHeart } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from './AgentProfile.module.css';

interface AgentProfileProps {
  name: string;
  agency: string;
  imageUrl: string;
  bio: string;
  rating: number;
  reviews: number;
  activeListings: number;
  experienceYears: number;
  isVerified?: boolean;
}

export function AgentProfile({
  name,
  agency,
  imageUrl,
  bio,
  rating,
  reviews,
  activeListings,
  experienceYears,
  isVerified = true
}: AgentProfileProps) {
  const { openChat } = useChatStore();
  const [isRatingMode, setIsRatingMode] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRateSubmit = () => {
    if (selectedRating === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHasRated(true);
      setIsRatingMode(false);
    }, 1000);
  };

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <img src={imageUrl} alt={name} className={styles.avatar} />
          {isVerified && (
            <div className={styles.verifiedBadge}>
              <Check size={16} strokeWidth={3} />
            </div>
          )}
        </div>
        
        <div className={styles.info}>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.agency}>
            <PremiumIcon icon={MapPin} size={14} colorVariant="primary" containerSize={24} /> {agency}
          </p>
          <p className={styles.bio}>{bio}</p>
          
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {rating} <Star size={16} fill="#D4A574" color="#D4A574" />
              </span>
              <span className={styles.statLabel}>{reviews} Reviews</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{activeListings}</span>
              <span className={styles.statLabel}>Active Listings</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{experienceYears} yrs</span>
              <span className={styles.statLabel}>Experience</span>
            </div>
          </div>
        </div>
        
        <div className={styles.contactActions}>
          <button className={styles.btnPrimary}>
            <PremiumIcon icon={Phone} size={16} colorVariant="success" containerSize={28} /> Call Agent
          </button>
          <button 
            className={styles.btnSecondary}
            onClick={() => openChat({ id: name, name: name, avatarUrl: imageUrl })}
          >
            <PremiumIcon icon={Mail} size={16} colorVariant="primary" containerSize={28} /> Send Message
          </button>
          <button 
            className={styles.btnRate}
            onClick={() => setIsRatingMode(!isRatingMode)}
            disabled={hasRated}
          >
            <PremiumIcon icon={MessageSquareHeart} size={16} colorVariant="accent" containerSize={28} /> {hasRated ? 'Rated!' : 'Rate Agent'}
          </button>
        </div>

        {isRatingMode && !hasRated && (
          <div className={styles.ratingSection}>
            <h3 className={styles.ratingTitle}>Rate {name}</h3>
            <div className={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`${styles.starBtn} ${(hoveredStar || selectedRating) >= star ? styles.starActive : ''}`}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedRating(star)}
                >
                  <Star size={24} fill={(hoveredStar || selectedRating) >= star ? '#D4A574' : 'transparent'} color="#D4A574" />
                </button>
              ))}
            </div>
            <button 
              className={styles.submitRatingBtn} 
              disabled={selectedRating === 0 || isSubmitting}
              onClick={handleRateSubmit}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>About {name}</h2>
        <p style={{ color: '#8B97A8', lineHeight: 1.6 }}>
          As a top-rated agent specializing in student and professional housing across North Cyprus, I prioritize finding the perfect match for your lifestyle and budget. Whether you're looking for a quiet studio in Nicosia or a vibrant shared apartment in Kyrenia, I have the local expertise to guide you.
        </p>
      </div>

    </div>
  );
}
