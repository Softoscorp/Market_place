'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, User, ChevronDown, Globe, Heart, Menu, X, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from './Navbar.module.css';

export function Navbar() {
  const { user, isAuthenticated, validateToken } = useAuthStore();
  const { lang, setLang, t } = useLanguageStore();
  const { conversations, fetchConversations } = useChatStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    validateToken();
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, [validateToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      // Poll conversations every 15 seconds for global badge
      const interval = setInterval(fetchConversations, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchConversations]);

  const unreadCount = Object.values(conversations).reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);


  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logo}>
          <PremiumIcon icon={Home} size={18} colorVariant="accent" />
          House Agent
        </Link>

        <div className={styles.links}>
          <div className={styles.navItem}>
            <Link href="/search" className={styles.link}>{t('nav_properties')} <ChevronDown size={14} /></Link>
            <div className={styles.dropdown}>
              <Link href="/search?type=1%2B0" className={styles.dropdownItem}>{t('nav_studios')}</Link>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Link href="/saved" className={styles.link} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 500 }}>
              <Heart size={16} /> <span className={styles.hideOnMobile}>{t('nav_saved') || 'Saved'}</span>
            </Link>
            {/* Messages Icon with Badge */}
            <Link href="/profile?tab=messages" className={styles.link} style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title={t('tab_messages')}>
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span className={styles.notifBadge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <Link href="/profile" className={styles.loginBtn}>
              <User size={16} /> <span className={styles.hideOnMobile}>{user?.name || t('nav_profile')}</span>
            </Link>
          </div>
        ) : (
          <>
            <Link href="/login" className={styles.link} style={{ marginRight: 'var(--space-4)', fontWeight: 500 }}>{t('nav_login')}</Link>
            <Link href="/signup" className={styles.loginBtn}>{t('nav_signup')}</Link>
          </>
        )}

        {mounted && isAuthenticated && user?.role === 'agent' && (
          <Link href="/post-listing" className={styles.postBtn}>{t('nav_post_listing')}</Link>
        )}
        {mounted && isAuthenticated && (user?.role === 'admin' || user?.role === 'customer_care') && (
          <Link href="/admin" className={styles.postBtn} style={{ backgroundColor: 'var(--text-primary)' }}>{t('nav_dashboard')}</Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button 
        className={styles.mobileMenuBtn} 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileLinks}>
            <Link href="/search" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>{t('nav_properties')}</Link>
            <Link href="/agents" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>{t('nav_agents')}</Link>
            <Link href="/roommates" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>{t('nav_roommates')}</Link>
            
<div className={styles.mobileDivider} />

            <button
              className={styles.mobileActionBtn}
              onClick={() => {
                setLang(lang === 'en' ? 'tr' : 'en');
                setMobileMenuOpen(false);
              }}
            >
              <Globe size={18} /> {lang === 'en' ? 'Türkçe' : 'English'}
            </button>
            
            <div className={styles.mobileDivider} />
            
            {mounted && isAuthenticated ? (
              <>
                <Link href="/saved" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                  <Heart size={18} /> {t('nav_saved') || 'Saved Properties'}
                </Link>
                <Link href="/profile?tab=messages" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)} style={{ position: 'relative' }}>
                  <MessageSquare size={18} />
                  {t('tab_messages')}
                  {unreadCount > 0 && (
                    <span className={styles.notifBadge} style={{ position: 'static', marginLeft: 'var(--space-1)' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                  <User size={18} /> {user?.name || t('nav_profile')}
                </Link>
                {user?.role === 'agent' && (
                  <Link href="/post-listing" className={styles.mobileLink} style={{ color: 'var(--accent)' }} onClick={() => setMobileMenuOpen(false)}>
                    {t('nav_post_listing')}
                  </Link>
                )}
                {(user?.role === 'admin' || user?.role === 'customer_care') && (
                  <Link href="/admin" className={styles.mobileLink} style={{ color: 'var(--accent)' }} onClick={() => setMobileMenuOpen(false)}>
                    {t('nav_dashboard')}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/login" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>{t('nav_login')}</Link>
                <Link href="/signup" className={styles.mobileLink} style={{ color: 'var(--accent)' }} onClick={() => setMobileMenuOpen(false)}>{t('nav_signup')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
    </>  
  );
}
