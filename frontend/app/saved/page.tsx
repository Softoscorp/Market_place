'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import styles from './page.module.css';
import { getSavedProperties, mediaUrl } from '@/lib/api';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

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
    avatar_url?: string;
    verification_tier?: 'none' | 'local' | 'international';
  };
  upfront_rent_months?: number;
  deposit_months?: number;
  commission_months?: number;
}

export default function SavedPage() {
  const t = useLanguageStore((s) => s.t);
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
        <h1 className={styles.title}>{t('saved_title')}</h1>
        <p className={styles.subtitle}>{t('saved_subtitle')}</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'properties' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          {t('saved_properties').replace('{count}', String(savedProperties.length))}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'roommates' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('roommates')}
        >
          {t('saved_roommates').replace('{count}', '0')}
        </button>
      </div>

      {activeTab === 'properties' && (
        <>
          {loading ? (
            <div className={`${styles.section} ${styles.textCenter}`}>{t('saved_loading')}</div>
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
                  type={prop.house_type || t('common_unknown')}
                  bedrooms={parseInt(prop.house_type?.split('+')[0]) || 1}
                  bathrooms={1}
                  images={prop.photos && prop.photos.length > 0 ? prop.photos.map((p) => mediaUrl(p.url) || '') : ['/images/listing-placeholder.svg']}
                  sizeSqf={75}
                  upfrontMonths={prop.upfront_rent_months}
                  depositMonths={prop.deposit_months}
                  commissionMonths={prop.commission_months}
                  agentRating={prop.agent_average_rating}
                  agentName={prop.agent?.name || t('common_agent')}
                  agentAvatar={prop.agent?.avatar_url ? mediaUrl(prop.agent.avatar_url) : undefined}
                  verificationTier={prop.agent?.verification_tier}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Heart size={48} className={styles.emptyStateIcon} />
              <h2 className={styles.emptyStateTitle}>{t('saved_no_props')}</h2>
              <p className={styles.emptyStateDesc}>
                {t('saved_no_props_sub')}
              </p>
              <Link href="/search">
                <Button variant="primary" size="lg">
                  <Search size={18} aria-hidden="true" className={styles.searchIcon} /> {t('saved_explore')}
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
            <h2 className={styles.emptyStateTitle}>{t('saved_no_roommates')}</h2>
            <p className={styles.emptyStateDesc}>
              {t('saved_no_roommates_sub')}
            </p>
            <Link href="/roommates">
              <Button variant="primary" size="lg">
                <Search size={18} aria-hidden="true" className={styles.searchIcon} /> {t('saved_find_roommates')}
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
