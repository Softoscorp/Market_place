'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RoommateCard } from '@/components/roommate/RoommateCard';
import { RoommateListRow } from '@/components/roommate/RoommateListRow';
import { PostRoommateForm } from '@/components/roommate/PostRoommateForm';
import { Plus, Home, Users, Search, X, SlidersHorizontal } from 'lucide-react';
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
  photos?: string[] | null;
  user: {
    name: string;
    avatar_url?: string;
    gender?: string;
  };
}

const BUDGET_MIN = 0;
const BUDGET_MAX = 2000;
export default function RoommatesPage() {
  const { t } = useLanguageStore();
  const [showPostForm, setShowPostForm] = useState(false);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'housemate' | 'roommate'>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('');
  const [budgetMin, setBudgetMin] = useState<number>(BUDGET_MIN);
  const [budgetMax, setBudgetMax] = useState<number>(BUDGET_MAX);
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
    if (rm.budget < budgetMin || rm.budget > budgetMax) return false;
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
    (schoolFilter ? 1 : 0) + (budgetMin > BUDGET_MIN || budgetMax < BUDGET_MAX ? 1 : 0);

  const toggleChip = (type: 'all' | 'housemate' | 'roommate') => {
    setTypeFilter(typeFilter === type ? 'all' : type);
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setSchoolFilter('');
    setBudgetMin(BUDGET_MIN);
    setBudgetMax(BUDGET_MAX);
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
          {t('rm_post_ad')}
        </button>
      </header>

      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder={t('rm_search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.searchClear} onClick={() => setSearchQuery('')} aria-label={t('rm_clear_search')}>
              <X size={15} />
            </button>
          )}
        </div>
        <button
          className={styles.filterBtn}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <SlidersHorizontal size={16} />
          {t('rm_filter')}
          {activeFilterCount > 0 && (
            <span className={styles.filterDot}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {filterOpen && (
        <div className={styles.filterSheet}>
          <div className={styles.filterSheetHead}>
            <h3>{t('show_filters')}</h3>
            <button className={styles.resetBtn} onClick={clearFilters}>{t('rm_reset')}</button>
          </div>

          <div className={styles.filterGroup}>
            <label>{t('rm_type')}</label>
            <div className={styles.seg}>
              <button className={typeFilter === 'all' ? styles.segOn : ''} onClick={() => toggleChip('all')}>{t('rm_all')}</button>
              <button className={typeFilter === 'housemate' ? styles.segOn : ''} onClick={() => toggleChip('housemate')}>{t('prf_type_housemate')}</button>
              <button className={typeFilter === 'roommate' ? styles.segOn : ''} onClick={() => toggleChip('roommate')}>{t('prf_type_roommate')}</button>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>{t('rm_area_school')}</label>
            <select
              className={styles.schoolSelect}
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
            >
              <option value="">{t('rm_all_areas')}</option>
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
            <label>{t('rm_budget')}</label>
            <div className={styles.budgetRow}>
              <div className={styles.budgetField}>
                <span className={styles.budgetPrefix}>£</span>
                <input
                  type="number"
                  min={BUDGET_MIN}
                  max={BUDGET_MAX}
                  step={50}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Math.max(BUDGET_MIN, Math.min(Number(e.target.value) || 0, budgetMax)))}
                  placeholder={t('rm_budget_min')}
                />
              </div>
              <span className={styles.budgetDash}>–</span>
              <div className={styles.budgetField}>
                <span className={styles.budgetPrefix}>£</span>
                <input
                  type="number"
                  min={BUDGET_MIN}
                  max={BUDGET_MAX}
                  step={50}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Math.max(budgetMin, Math.min(Number(e.target.value) || 0, BUDGET_MAX)))}
                  placeholder={t('rm_budget_max')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.chips}>
        <span className={`${styles.chip} ${typeFilter === 'all' ? styles.chipActive : ''}`} onClick={() => toggleChip('all')}>
          {t('rm_all')}
        </span>
        <span className={`${styles.chip} ${typeFilter === 'housemate' ? styles.chipActive : ''}`} onClick={() => toggleChip('housemate')}>
          <Home size={14} className={styles.chipIcon} />
          {t('rm_housemates')}
        </span>
        <span className={`${styles.chip} ${typeFilter === 'roommate' ? styles.chipActive : ''}`} onClick={() => toggleChip('roommate')}>
          <Users size={14} className={styles.chipIcon} />
          {t('rm_roommates')}
        </span>
      </div>

      <div className={styles.resultsSection}>
        <h2 className={styles.resultsTitle}>
          {filteredRoommates.length} {typeFilter === 'housemate' ? (filteredRoommates.length === 1 ? t('rm_result_housemate') : t('rm_result_housemates')) : typeFilter === 'roommate' ? (filteredRoommates.length === 1 ? t('rm_result_roommate') : t('rm_result_roommates')) : (filteredRoommates.length === 1 ? t('rm_result_profile') : t('rm_result_profiles'))}
        </h2>
        {filteredRoommates.length === 0 ? (
          <p className={styles.empty}>
            {t('rm_no_results')}
          </p>
        ) : (
          <>
            <div className={styles.grid}>
              {filteredRoommates.map(roommate => (
                <RoommateCard
                  key={roommate.id}
                  name={roommate.name || roommate.user?.name || t('common_user')}
                  age={roommate.age || 0}
                  gender={roommate.gender || roommate.user?.gender}
                  occupation={roommate.occupation || (roommate.university ? t('rm_student').replace('{uni}', roommate.university) : t('rm_tenant'))}
                  imageUrl={mediaUrl(roommate.avatar_url) || ''}
                  photos={(roommate.photos || []).map((p) => mediaUrl(p)).filter((u): u is string => Boolean(u))}
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
                  name={roommate.name || roommate.user?.name || t('common_user')}
                  age={roommate.age || 0}
                  gender={roommate.gender || roommate.user?.gender}
                  occupation={roommate.occupation || (roommate.university ? t('rm_student').replace('{uni}', roommate.university) : t('rm_tenant'))}
                  imageUrl={mediaUrl(roommate.avatar_url) || ''}
                  photos={(roommate.photos || []).map((p) => mediaUrl(p)).filter((u): u is string => Boolean(u))}
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
