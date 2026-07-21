'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import styles from './page.module.css';
import { getSavedProperties, mediaUrl } from '@/lib/api';

export interface SavedProperty {
  id: string | number;
  title: string;
  location: string;
  price: number;
  house_type: string;
  photos?: Array<{ url: string }>;
  agent_average_rating?: number;
  agent?: {
    name: string;
    avatarUrl?: string;
    is_verified?: boolean;
  };
}

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<'properties' | 'roommates'>('properties');
  
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedProperties()
      .then(data => {
        setSavedProperties(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);


  return (
    <div className={styles.container}>
      <BackButton />
      <div className={styles.header}>
        <h1 className={styles.title}>Your Wishlist</h1>
        <p className={styles.subtitle}>Manage your saved properties and favorite roommate profiles</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'properties' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Properties ({savedProperties.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'roommates' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('roommates')}
        >
          Roommates (0)
        </button>
      </div>

      {activeTab === 'properties' && (
        <>
          {loading ? (
            <div className="section text-center">Loading your saved properties...</div>
          ) : savedProperties.length > 0 ? (
            <div className={styles.grid}>
              {savedProperties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  id={prop.id.toString()}
                  title={prop.title}
                  location={prop.location}
                  price={prop.price}
                  currency="£"
                  type={prop.house_type}
                  bedrooms={parseInt(prop.house_type.split('+')[0]) || 1}
                  bathrooms={1}
                  images={prop.photos && prop.photos.length > 0 ? prop.photos.map((p) => mediaUrl(p.url) || '') : ['/images/placeholder-studio.jpg']}
                  sizeSqf={75}
                  moveInCost={prop.price * 3}
                  agentRating={prop.agent_average_rating || 5.0}
                  agentName={prop.agent?.name || 'Agent'}
                  agentAvatar={prop.agent?.avatarUrl ? mediaUrl(prop.agent.avatarUrl) : undefined}
                  isVerified={prop.agent?.is_verified}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Heart size={48} className={styles.emptyStateIcon} />
              <h2 className={styles.emptyStateTitle}>No saved properties yet</h2>
              <p className={styles.emptyStateDesc}>
                Browse properties and click the heart icon to save your favorites here for easy access later.
              </p>
              <Link href="/search">
                <Button variant="primary" size="lg">
                  <Search size={18} style={{ marginRight: '0.5rem' }} /> Explore Properties
                </Button>
              </Link>
            </div>
          )}
        </>
      )}

      {activeTab === 'roommates' && (
        <>
          <div className={styles.emptyState}>
            <Heart size={48} className={styles.emptyStateIcon} />
            <h2 className={styles.emptyStateTitle}>No saved roommates yet</h2>
            <p className={styles.emptyStateDesc}>
              Looking for someone to share with? Browse roommate profiles and save potential matches here.
            </p>
            <Link href="/roommates">
              <Button variant="primary" size="lg">
                <Search size={18} style={{ marginRight: '0.5rem' }} /> Find Roommates
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
