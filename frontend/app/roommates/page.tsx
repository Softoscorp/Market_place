'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RoommateCard } from '@/components/roommate/RoommateCard';
import { RoommateListRow } from '@/components/roommate/RoommateListRow';
import { PostRoommateForm } from '@/components/roommate/PostRoommateForm';
import { Plus, Home, Users, Banknote, Search, X, SlidersHorizontal } from 'lucide-react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { UNIVERSITIES_BY_CITY } from '@/lib/universities';
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
  const [schoolFilter, setSchoolFilter] = useState<string>('');
  const [budgetRange, setBudgetRange] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);

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
    if (schoolFilter) {
      const areaMatch = (rm.looking_for_city || []).some(c => c.includes(schoolFilter));
      const uniMatch = (rm.university || '').includes(schoolFilter);
      if (!areaMatch && !uniMatch) return false;
    }
    if (budgetRange !== null) {
      const range = BUDGET_RANGES[budgetRange];
      if (rm.budget < range.min || rm.budget > range.max) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const haystack = [
        rm.name,
        rm.user?.name,
        rm.occupation,
        rm.university,
        rm.nationality,
        rm.looking_for_city?.join(' '),
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const activeFilterCount =
    (schoolFilter ? 1 : 0) + (budgetRange !== null ? 1 : 0);

  const toggleChip = (type: 'all' | 'housemate' | 'roommate') => {
    setTypeFilter(typeFilter === type ? 'all' : type);
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setSchoolFilter('');
    setBudgetRange(null);
    setSearchQuery('');
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

      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, area, school…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.searchClear} onClick={() => setSearchQuery('')} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>
        <button
          className={styles.filterBtn}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <SlidersHorizontal size={16} />
          Filter
          {activeFilterCount > 0 && (
            <span className={styles.filterDot}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {filterOpen && (
        <div className={styles.filterSheet}>
          <div className={styles.filterSheetHead}>
            <h3>Filters</h3>
            <button className={styles.resetBtn} onClick={clearFilters}>Reset</button>
          </div>

          <div className={styles.filterGroup}>
            <label>Type</label>
            <div className={styles.seg}>
              <button className={typeFilter === 'all' ? styles.segOn : ''} onClick={() => toggleChip('all')}>Any</button>
              <button className={typeFilter === 'housemate' ? styles.segOn : ''} onClick={() => toggleChip('housemate')}>Housemate</button>
              <button className={typeFilter === 'roommate' ? styles.segOn : ''} onClick={() => toggleChip('roommate')}>Roommate</button>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Area / School</label>
            <select
              className={styles.schoolSelect}
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
            >
              <option value="">All areas</option>
              {UNIVERSITIES_BY_CITY.map((group) => (
                <optgroup key={group.city} label={group.city}>
                  {group.schools.map((school) => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Budget</label>
            <div className={styles.seg}>
              {BUDGET_RANGES.map((range, idx) => (
                <button
                  key={range.label}
                  className={budgetRange === idx ? styles.segOn : ''}
                  onClick={() => setBudgetRange(budgetRange === idx ? null : idx)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
        <span className={`${styles.chip} ${budgetRange === 0 ? styles.chipActive : ''}`} onClick={() => setBudgetRange(budgetRange === 0 ? null : 0)}>
          <Banknote size={14} style={{ marginRight: 6 }} />
          {BUDGET_RANGES[0].label}
        </span>
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
          <>
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
            <div className={styles.mobileList}>
              {filteredRoommates.map(roommate => (
                <RoommateListRow
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
          </>
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
