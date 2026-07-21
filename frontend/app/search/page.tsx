'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { FilterPanel } from '@/components/search/FilterPanel';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { apiRequest } from '@/lib/api';
import styles from './page.module.css';

interface Property {
  id: string | number;
  title: string;
  location: string;
  price: number;
  house_type: string;
  photos?: Array<{ url: string }>;
  agent_average_rating?: number;
  agent?: { name: string; avatarUrl?: string; is_verified?: boolean };
}

function SearchResults() {
  const { t } = useLanguageStore();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recommended');

  useEffect(() => {
    const params = new URLSearchParams();
    const type = searchParams.get('type');
    const q = searchParams.get('q');
    if (type) params.set('house_type', type);
    if (q) params.set('q', q);
    if (sort && sort !== 'recommended') params.set('sort', sort);

    apiRequest(`/listings?${params.toString()}`, { auth: false })
      .then((data) => setProperties(data.items || []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
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
          <aside className={styles.sidebar}>
            <FilterPanel />
          </aside>

          <div className={styles.results}>
            {loading ? (
              <div className={styles.emptyState}>
                <p>{t('loading')}</p>
              </div>
            ) : properties.length === 0 ? (
              <div className={styles.emptyState}>
                <Home size={48} strokeWidth={1.2} />
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
                    images={prop.photos?.map((p) => p.url) || []}
                    agentRating={prop.agent_average_rating}
                    agentName={prop.agent?.name || 'Agent'}
                    agentAvatar={prop.agent?.avatarUrl}
                    isVerified={prop.agent?.is_verified}
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
