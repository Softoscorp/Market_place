'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, User, ChevronDown, Globe } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from './Navbar.module.css';

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { lang, setLang, t } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        <PremiumIcon icon={Home} size={18} colorVariant="accent" />
        House Agent
      </Link>

      <div className={styles.links}>
        <div className={styles.navItem}>
          <Link href="/search" className={styles.link}>{t('nav_properties')} <ChevronDown size={14} /></Link>
          <div className={styles.dropdown}>
            <Link href="/search?type=Studio" className={styles.dropdownItem}>{t('nav_studios')}</Link>
            <Link href="/search?type=1%2B1" className={styles.dropdownItem}>{t('nav_1plus1')}</Link>
            <Link href="/search?type=2%2B1" className={styles.dropdownItem}>{t('nav_2plus1')}</Link>
            <Link href="/search" className={styles.dropdownItem}>{t('nav_all_properties')}</Link>
          </div>
        </div>

        <div className={styles.navItem}>
          <Link href="/agents" className={styles.link}>{t('nav_agents')} <ChevronDown size={14} /></Link>
          <div className={styles.dropdown}>
            <Link href="/agents" className={styles.dropdownItem}>{t('nav_browse_agents')}</Link>
            <Link href="/agents?filter=top" className={styles.dropdownItem}>{t('nav_top_rated')}</Link>
            <Link href="/agents?filter=verified" className={styles.dropdownItem}>{t('nav_verified_agencies')}</Link>
          </div>
        </div>

        <div className={styles.navItem}>
          <Link href="/roommates" className={styles.link}>{t('nav_roommates')} <ChevronDown size={14} /></Link>
          <div className={styles.dropdown}>
            <Link href="/roommates" className={styles.dropdownItem}>{t('nav_find_roommate')}</Link>
            <Link href="/profile" className={styles.dropdownItem}>{t('nav_roommate_settings')}</Link>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {/* Language toggle */}
        {mounted && (
          <button
            className={styles.langToggle}
            onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
            aria-label="Toggle language"
          >
            <Globe size={14} />
            {lang === 'en' ? 'TR' : 'EN'}
          </button>
        )}

        {mounted && isAuthenticated ? (
          <Link href="/profile" className={styles.loginBtn}>
            <User size={16} /> {t('nav_profile')}
          </Link>
        ) : (
          <>
            <Link href="/login" className={styles.link} style={{ marginRight: '1rem', fontWeight: 500 }}>{t('nav_login')}</Link>
            <Link href="/signup" className={styles.loginBtn}>{t('nav_signup')}</Link>
          </>
        )}

        {mounted && isAuthenticated && user?.role === 'agent' && (
          <Link href="/post-listing" className={styles.postBtn}>{t('nav_post_listing')}</Link>
        )}
        {mounted && isAuthenticated && (user?.role === 'admin' || user?.role === 'customer_care') && (
          <Link href="/admin" className={styles.postBtn} style={{ backgroundColor: '#111' }}>{t('nav_dashboard')}</Link>
        )}
      </div>
    </nav>
  );
}
