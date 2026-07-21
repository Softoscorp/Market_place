'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoommateCard } from '@/components/roommate/RoommateCard';
import { Search, MapPin, DollarSign, User } from 'lucide-react';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from './RoommatesPage.module.css';
import { apiRequest, mediaUrl } from '@/lib/api';

interface Roommate {
  id: number;
  budget: number;
  occupation: string;
  habits: string[];
  profile_type?: string;
  house_type?: string;
  nationality?: string;
  user: {
    name: string;
    avatarUrl?: string;
    gender?: string;
  };
}

export default function RoommatesPage() {
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // New state for prioritized matching
  const [filters, setFilters] = useState({
    location: '',
    maxPrice: '',
    gender: 'Any',
    profileType: 'Any',
  });

  useEffect(() => {
    // We fetch roommates. In a real app we'd pass filters to the backend.
    apiRequest('/roommates', { auth: false })
      .then(data => setRoommates(data || []))
      .catch(console.error);
  }, []);

  if (!mounted) return null;



  const filteredRoommates = roommates.filter((rm: Roommate) => {
    if (filters.gender !== 'Any' && rm.user?.gender !== filters.gender) return false;
    if (filters.maxPrice && rm.budget > parseFloat(filters.maxPrice)) return false;
    if (filters.profileType !== 'Any' && rm.profile_type !== filters.profileType) return false;
    return true;
  });

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className={styles.header}>
        <h1 className={styles.title}>Find Your Perfect Roommate</h1>
        <p className={styles.subtitle}>
          Connect with verified students and professionals in North Cyprus looking to share a home.
        </p>
      </header>

      <div className={styles.actionSection}>
        <div className={styles.searchBar}>
          <PremiumIcon icon={Search} size={16} colorVariant="primary" containerSize={28} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by university, location, or interests..." 
            className={styles.searchInput}
          />
        </div>
        <button 
          className={styles.matchBtn}
          onClick={() => setShowMatchForm(!showMatchForm)}
        >
          {showMatchForm ? 'Hide Match Filters' : 'Match Filters'}
        </button>
      </div>

      <div className={styles.content}>
        <AnimatePresence>
          {showMatchForm && (
            <motion.div 
              className={styles.filterWrapper}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className={styles.filterGrid}>
                <div className={styles.filterGroup}>
                  <label><PremiumIcon icon={MapPin} size={12} colorVariant="accent" containerSize={20} /> Priority 1: Location</label>
                  <select 
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  >
                    <option value="">Any City</option>
                    <option value="Famagusta">Famagusta (EMU)</option>
                    <option value="Nicosia">Nicosia (CIU/NEU)</option>
                    <option value="Kyrenia">Kyrenia (GAU)</option>
                  </select>
                </div>
                
                <div className={styles.filterGroup}>
                  <label><PremiumIcon icon={DollarSign} size={12} colorVariant="success" containerSize={20} /> Priority 2: Max Budget (£)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 350"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label><PremiumIcon icon={User} size={12} colorVariant="primary" containerSize={20} /> Priority 3: Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({...filters, gender: e.target.value})}
                  >
                    <option value="Any">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label><PremiumIcon icon={User} size={12} colorVariant="accent" containerSize={20} /> Profile Type</label>
                  <select
                    value={filters.profileType}
                    onChange={(e) => setFilters({...filters, profileType: e.target.value})}
                  >
                    <option value="Any">Any</option>
                    <option value="roommate">🤝 Roommate (shared room)</option>
                    <option value="housemate">🏠 Housemate (own room, shared flat)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className={styles.resultsSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h2 className={styles.resultsTitle}>
            {showMatchForm ? 'Your Top Matches' : 'Recent Profiles'}
          </h2>
          <div className={styles.grid}>
            {filteredRoommates.map(roommate => (
              <RoommateCard
                key={roommate.id}
                name={roommate.user?.name || 'User'}
                age={20}
                occupation={roommate.occupation}
                imageUrl={mediaUrl(roommate.user?.avatarUrl) || ''}
                matchScore={85}
                sharedInterests={roommate.habits?.slice(0, 3) || []}
                budget={`£${roommate.budget}`}
                profileType={roommate.profile_type || 'roommate'}
                houseType={roommate.house_type}
                nationality={roommate.nationality}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
