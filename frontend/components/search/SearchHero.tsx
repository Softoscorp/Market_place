'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './SearchHero.module.css';

import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

const CITY_CHIPS = ['Nicosia', 'Kyrenia', 'Famagusta', 'Lefke', 'Guzelyurt'];

export function SearchHero() {
  const [query, setQuery] = useState('');
  const { t } = useLanguageStore();
  const router = useRouter();

  const handleSearch = (value?: string) => {
    const q = (value ?? query).trim();
    if (q) {
      router.push(`/search?location=${encodeURIComponent(q)}`);
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h1 className={styles.title}>
            {t('hero_title_pre')} <em>{t('hero_title_em')}</em> {t('hero_title_post')}
          </h1>
          <p className={styles.subtitle}>{t('hero_subtitle')}</p>

          <div className={styles.searchContainer}>
            <div className={styles.inputWrapper}>
              <Search size={18} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                className={styles.input}
                placeholder={t('hero_search_placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button className={styles.actionButton} onClick={() => handleSearch()}>{t('hero_search_btn')}</button>
            </div>
          </div>

          <div className={styles.chips}>
            {CITY_CHIPS.map((city, idx) => (
              <button
                key={city}
                className={`${styles.chip} ${idx === 0 ? styles.chipOn : ''}`}
                onClick={() => handleSearch(city)}
              >
                {city}
              </button>
            ))}
          </div>
        </motion.div>

        <div className={styles.heroImage}>
          <img
            src="/images/kyrenia-aerial.jpg"
            alt="Aerial view of North Cyprus"
            width={640}
            height={480}
          />
        </div>
      </div>
    </section>
  );
}
