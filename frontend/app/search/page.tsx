'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, SlidersHorizontal } from 'lucide-react';
import { FilterPanel } from '@/components/search/FilterPanel';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { apiRequest, mediaUrl } from '@/lib/api';
import styles from './page.module.css';

interface Property {
  id: string | number;
  title: string;
  location: string;
  price: number;
  house_type: string;
  bedrooms?: number;
  bathrooms?: number;
  size_sqf?: number;
  photos?: Array<{ url: string }>;
  agent_average_rating?: number;
  agent?: { name: string; avatar_url?: string; verification_tier?: 'none' | 'local' | 'international' };
  upfront_rent_months?: number;
  deposit_months?: number;
  commission_months?: number;
}

function SearchResults() {
  const { t } = useLanguageStore();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    const type = (searchParams.get('house_type') || searchParams.get('type') || '').replace(/^Studio$/i, '1+0');
    const q = searchParams.get('q') || searchParams.get('keyword');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');

    if (type) params.set('house_type', type);
    if (q) params.set('keyword', q);
    if (location) params.set('location', location);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);

    ['furnished', 'generator', 'pool', 'gym', 'parking', 'pet_friendly'].forEach((amenity) => {
      if (searchParams.get(amenity) === 'true') {
        params.set(amenity, 'true');
      }
    });

    if (sort && sort !== 'recommended') params.set('sort', sort);

    let isMounted = true;
    apiRequest(`/listings?${params.toString()}`, { auth: false })
      .then((data) => {
        if (isMounted) setProperties(data.items || []);
      })
      .catch(() => {
        if (isMounted) setProperties([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [searchParams, sort]);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.searchHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className={`container ${styles.headerContent}`}>
          <h1 className={styles.title}>
            {t('search_results')} <span>({loading ? '...' : properties.length} {t('properties')})</span>
          </h1>
          <div className={styles.sortOptions}>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recommended">{t('recommended')}</option>
              <option value="price_asc">{t('price_low')}</option>
              <option value="price_desc">{t('price_high')}</option>
              <option value="newest">{t('newest')}</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.main
        className="container section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className={styles.content}>
          {showFilters && (
            <aside className={styles.sidebar}>
              <FilterPanel />
            </aside>
          )}

          <div className={styles.results}>
            <div className={styles.filterBar}>
              <button
                type="button"
                className={styles.filterToggle}
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                {showFilters ? t('hide_filters') : t('show_filters')}
              </button>
            </div>
            {loading ? (
              <div className={styles.emptyState}>
                <p>{t('loading')}</p>
              </div>
            ) : properties.length === 0 ? (
              <div className={styles.emptyState}>
                <Home size={48} strokeWidth={1.2} aria-hidden="true" />
                <h2>{t('no_properties')}</h2>
                <p>{t('no_properties_sub')}</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {properties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    id={String(prop.id)}
                    title={prop.title}
                    location={prop.location}
                    price={prop.price}
                    type={prop.house_type}
                    bedrooms={prop.bedrooms ?? 1}
                    bathrooms={prop.bathrooms ?? 1}
                    sizeSqf={prop.size_sqf ?? 0}
                    upfrontMonths={prop.upfront_rent_months}
                    depositMonths={prop.deposit_months}
                    commissionMonths={prop.commission_months}
                    images={prop.photos?.map((p) => mediaUrl(p.url) || '') || ['/images/placeholder-studio.jpg']}
                    agentRating={prop.agent_average_rating}
                    agentName={prop.agent?.name || 'Agent'}
                    agentAvatar={prop.agent?.avatar_url ? mediaUrl(prop.agent.avatar_url) : undefined}
                    verificationTier={prop.agent?.verification_tier}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
