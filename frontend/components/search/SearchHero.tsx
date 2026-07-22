'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from './SearchHero.module.css';

import { useLanguageStore } from '@/lib/store/useLanguageStore';

const SUGGESTIONS = [
  'Kyrenia Penthouse', 
  'Famagusta Student Housing', 
  'Nicosia Near University',
  'Iskele Sea View'
];

export function SearchHero() {
  const [query, setQuery] = useState('');
  const { t } = useLanguageStore();

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <motion.div 
          className={styles.content}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h1 className={styles.title}>{t('hero_title')}</h1>
          <p className={styles.subtitle}>
            {t('hero_subtitle')}
          </p>

          <div className={styles.searchContainer}>
            <motion.div 
              className={styles.inputWrapper}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <PremiumIcon icon={Search} size={20} colorVariant="primary" className={styles.searchIcon} containerSize={40} />
              <input
                type="text"
                className={styles.input}
                placeholder={t('hero_search_placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className={styles.actionButton}>{t('hero_search_btn')}</button>
            </motion.div>
          </div>

          <motion.div 
            className={styles.suggestions}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {SUGGESTIONS.map((suggestion) => (
              <motion.button 
                key={suggestion} 
                className={styles.suggestionBadge}
                onClick={() => setQuery(suggestion)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.imageContainer}
          initial={{ opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80" 
            alt="Luxury home in North Cyprus" 
            className={styles.heroImage}
          />
          <div className={styles.imageOverlay} />
        </motion.div>
      </div>
    </section>
  );
}
