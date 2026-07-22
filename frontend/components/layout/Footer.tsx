'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Search, Users, User } from 'lucide-react';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './Footer.module.css';

export function Footer() {
  const { t } = useLanguageStore();

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.content}>
          <div className={styles.column}>
            <h3 className={styles.title}>
              <PremiumIcon icon={Home} size={20} colorVariant="accent" />
              House Agent
            </h3>
            <p style={{ color: '#8B97A8', fontSize: '0.875rem', lineHeight: 1.5 }}>
              {t('footer_tagline')}
            </p>
          </div>
          <div className={styles.column}>
            <h4 style={{ color: '#E2E8F0', margin: 0 }}>{t('footer_explore')}</h4>
            <Link href="/search?location=Kyrenia" className={styles.link}>{t('footer_prop_kyrenia')}</Link>
            <Link href="/search?location=Famagusta" className={styles.link}>{t('footer_prop_famagusta')}</Link>
            <Link href="/search?type=Studio" className={styles.link}>{t('footer_student_dorms')}</Link>
          </div>
          <div className={styles.column}>
            <h4 style={{ color: '#E2E8F0', margin: 0 }}>{t('footer_company')}</h4>
            <Link href="/about" className={styles.link}>{t('footer_about')}</Link>
            <Link href="/contact" className={styles.link}>{t('footer_contact')}</Link>
            <Link href="/terms" className={styles.link}>{t('footer_terms')}</Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <div className={styles.bottomBar}>
        <Link href="/" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
          <Home size={24} />
          <span>{t('tab_home')}</span>
        </Link>
        <Link href="/search" className={styles.tabBtn}>
          <Search size={24} />
          <span>{t('tab_search')}</span>
        </Link>
        <Link href="/roommates" className={styles.tabBtn}>
          <Users size={24} />
          <span>{t('tab_matches')}</span>
        </Link>
        <Link href="/profile" className={styles.tabBtn}>
          <User size={24} />
          <span>{t('tab_profile')}</span>
        </Link>
      </div>
    </>
  );
}
