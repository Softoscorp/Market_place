import React from 'react';
import Link from 'next/link';
import { Home, Search, Users, User } from 'lucide-react';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from './Footer.module.css';

export function Footer() {
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
              The premier housing platform for North Cyprus. Find homes, connect with verified agents, and discover roommates.
            </p>
          </div>
          <div className={styles.column}>
            <h4 style={{ color: '#E2E8F0', margin: 0 }}>Explore</h4>
            <Link href="/search" className={styles.link}>Properties in Kyrenia</Link>
            <Link href="/search" className={styles.link}>Properties in Famagusta</Link>
            <Link href="/search" className={styles.link}>Student Dorms</Link>
          </div>
          <div className={styles.column}>
            <h4 style={{ color: '#E2E8F0', margin: 0 }}>Company</h4>
            <Link href="/about" className={styles.link}>About Us</Link>
            <Link href="/contact" className={styles.link}>Contact</Link>
            <Link href="/terms" className={styles.link}>Terms & Privacy</Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <div className={styles.bottomBar}>
        <Link href="/" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link href="/search" className={styles.tabBtn}>
          <Search size={24} />
          <span>Search</span>
        </Link>
        <Link href="/roommates" className={styles.tabBtn}>
          <Users size={24} />
          <span>Matches</span>
        </Link>
        <Link href="/profile" className={styles.tabBtn}>
          <User size={24} />
          <span>Profile</span>
        </Link>
      </div>
    </>
  );
}
