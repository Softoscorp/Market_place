'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Users, MessageSquare, User } from 'lucide-react';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import styles from './Footer.module.css';

export function Footer() {
  const { t } = useLanguageStore();
  const pathname = usePathname();
  const { conversations } = useChatStore();
  const { isAuthenticated } = useAuthStore();

  const unreadCount = Object.values(conversations).reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.content}>
          <div className={styles.column}>
            <h3 className={styles.title}>
              <PremiumIcon icon={Home} size={20} colorVariant="accent" />
              House Agent
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
              {t('footer_tagline')}
            </p>
          </div>
          <div className={styles.column}>
            <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{t('footer_company')}</h4>
            <Link href="/about" className={styles.link}>{t('footer_about')}</Link>
            <Link href="/contact" className={styles.link}>{t('footer_contact')}</Link>
            <Link href="/terms" className={styles.link}>{t('footer_terms')}</Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <div className={styles.bottomBar}>
        <Link href="/" className={`${styles.tabBtn} ${isActive('/') ? styles.tabBtnActive : ''}`}>
          <Home size={24} />
          <span>{t('tab_home')}</span>
        </Link>
        <Link href="/search" className={`${styles.tabBtn} ${isActive('/search') ? styles.tabBtnActive : ''}`}>
          <Search size={24} />
          <span>{t('tab_search')}</span>
        </Link>
        <Link href="/roommates" className={`${styles.tabBtn} ${isActive('/roommates') ? styles.tabBtnActive : ''}`}>
          <Users size={24} />
          <span>{t('tab_matches')}</span>
        </Link>

        {/* Messages tab with live unread badge */}
        <Link href="/messages" className={`${styles.tabBtn} ${isActive('/messages') ? styles.tabBtnActive : ''}`} style={{ position: 'relative' }}>
          <MessageSquare size={24} />
          {isAuthenticated && unreadCount > 0 && (
            <span className={styles.tabBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span>{t('tab_messages')}</span>
        </Link>

        <Link href="/profile" className={`${styles.tabBtn} ${isActive('/profile') ? styles.tabBtnActive : ''}`}>
          <User size={24} />
          <span>{t('tab_profile')}</span>
        </Link>
      </div>
    </>
  );
}
