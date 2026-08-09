'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RoommateCard } from '@/components/roommate/RoommateCard';
import { PostRoommateForm } from '@/components/roommate/PostRoommateForm';
import { Plus, Home, Users, Banknote } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './RoommatesPage.module.css';
import { apiRequest, mediaUrl } from '@/lib/api';

interface Roommate {
  id: number;
  name?: string;
  age?: number;
  gender?: string;
  budget: number;
  occupation: string;
  university?: string | null;
  habits: string[];
  profile_type?: string;
  house_type?: string | null;
  nationality?: string | null;
  looking_for_city?: string[];
  avatar_url?: string | null;
  user: {
    name: string;
    avatar_url?: string;
    gender?: string;
  };
}

const CITY_CHIPS = ['Famagusta (EMU)', 'Nicosia (CIU/NEU)', 'Kyrenia (GAU)'];

const BUDGET_RANGES = [
  { label: 'Under £300', min: 0, max: 299 },
  { label: '£300 – £500', min: 300, max: 500 },
  { label: '£500+', min: 501, max: Infinity },
];

export default function RoommatesPage() {
  const { t } = useLanguageStore();
  const [showPostForm, setShowPostForm] = useState(false);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'housemate' | 'roommate'>('all');
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [budgetRange, setBudgetRange] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const loadRoommates = () => {
    apiRequest('/roommates', { auth: false })
      .then(data => setRoommates(data || []))
      .catch(console.error);
  };

  useEffect(() => {
    loadRoommates();
  }, []);

  if (!mounted) return null;

  const filteredRoommates = roommates.filter((rm: Roommate) => {
    if (typeFilter !== 'all' && (rm.profile_type || 'roommate') !== typeFilter) return false;
    if (cityFilter && !(rm.looking_for_city || []).some(c => c.includes(cityFilter))) return false;
    if (budgetRange !== null) {
      const range = BUDGET_RANGES[budgetRange];
      if (rm.budget < range.min || rm.budget > range.max) return false;
    }
    return true;
  });

  const toggleChip = (type: 'all' | 'housemate' | 'roommate') => {
    setTypeFilter(typeFilter === type ? 'all' : type);
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className={styles.hero}>
        <div>
          <h1 className={styles.title}>{t('roommates_title')}</h1>
          <p className={styles.subtitle}>{t('roommates_sub')}</p>
        </div>
        <button className={styles.postBtn} onClick={() => setShowPostForm(true)}>
          <Plus size={18} />
          Post a Housemate Ad
        </button>
      </header>

      <div className={styles.chips}>
        <span className={`${styles.chip} ${typeFilter === 'all' ? styles.chipActive : ''}`} onClick={() => toggleChip('all')}>
          All
        </span>
        <span className={`${styles.chip} ${typeFilter === 'housemate' ? styles.chipActive : ''}`} onClick={() => toggleChip('housemate')}>
          <Home size={14} style={{ marginRight: 6 }} />
          Housemates
        </span>
        <span className={`${styles.chip} ${typeFilter === 'roommate' ? styles.chipActive : ''}`} onClick={() => toggleChip('roommate')}>
          <Users size={14} style={{ marginRight: 6 }} />
          Roommates
        </span>
        {CITY_CHIPS.map((city) => {
          const key = city.split(' ')[0];
          return (
            <span
              key={city}
              className={`${styles.chip} ${cityFilter === key ? styles.chipActive : ''}`}
              onClick={() => setCityFilter(cityFilter === key ? null : key)}
            >
              {key}
            </span>
          );
        })}
        {BUDGET_RANGES.map((range, idx) => (
          <span
            key={range.label}
            className={`${styles.chip} ${budgetRange === idx ? styles.chipActive : ''}`}
            onClick={() => setBudgetRange(budgetRange === idx ? null : idx)}
          >
            <Banknote size={14} style={{ marginRight: 6 }} />
            {range.label}
          </span>
        ))}
      </div>

      <div className={styles.resultsSection}>
        <h2 className={styles.resultsTitle}>
          {filteredRoommates.length} {typeFilter === 'housemate' ? 'housemate' : typeFilter === 'roommate' ? 'roommate' : 'profile'}{filteredRoommates.length === 1 ? '' : 's'}
        </h2>
        {filteredRoommates.length === 0 ? (
          <p className={styles.empty}>
            No profiles match those filters yet. Be the first to post a room.
          </p>
        ) : (
          <div className={styles.grid}>
            {filteredRoommates.map(roommate => (
              <RoommateCard
                key={roommate.id}
                name={roommate.name || roommate.user?.name || 'User'}
                age={roommate.age || 0}
                gender={roommate.gender || roommate.user?.gender}
                occupation={roommate.occupation || (roommate.university ? `${roommate.university} student` : 'Tenant')}
                imageUrl={mediaUrl(roommate.avatar_url) || mediaUrl(roommate.user?.avatar_url) || ''}
                matchScore={85}
                sharedInterests={roommate.habits?.slice(0, 3) || []}
                budget={`£${roommate.budget}`}
                profileType={roommate.profile_type || 'roommate'}
                houseType={roommate.house_type || undefined}
                nationality={roommate.nationality || undefined}
                location={(roommate.looking_for_city || []).slice(0, 2).join(', ')}
              />
            ))}
          </div>
        )}
      </div>

      {showPostForm && (
        <PostRoommateForm
          onClose={() => setShowPostForm(false)}
          onPosted={() => {
            setShowPostForm(false);
            loadRoommates();
          }}
        />
      )}
    </motion.div>
  );
}
