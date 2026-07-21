'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import styles from './Navbar.module.css';

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
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
          <Link href="/search" className={styles.link}>Properties <ChevronDown size={14} /></Link>
          <div className={styles.dropdown}>
            <Link href="/search?type=Studio" className={styles.dropdownItem}>Studios</Link>
            <Link href="/search?type=1%2B1" className={styles.dropdownItem}>1+1 Apartments</Link>
            <Link href="/search?type=2%2B1" className={styles.dropdownItem}>2+1 Apartments</Link>
            <Link href="/search" className={styles.dropdownItem}>All Properties</Link>
          </div>
        </div>

        <div className={styles.navItem}>
          <Link href="/agents" className={styles.link}>Agents <ChevronDown size={14} /></Link>
          <div className={styles.dropdown}>
            <Link href="/agents" className={styles.dropdownItem}>Browse Agents</Link>
            <Link href="/agents?filter=top" className={styles.dropdownItem}>Top Rated</Link>
            <Link href="/agents?filter=verified" className={styles.dropdownItem}>Verified Agencies</Link>
          </div>
        </div>

        <div className={styles.navItem}>
          <Link href="/roommates" className={styles.link}>Roommates <ChevronDown size={14} /></Link>
          <div className={styles.dropdown}>
            <Link href="/roommates" className={styles.dropdownItem}>Find a Roommate</Link>
            <Link href="/profile" className={styles.dropdownItem}>Roommate Settings</Link>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {mounted && isAuthenticated ? (
          <Link href="/profile" className={styles.loginBtn}>
            <User size={16} /> Profile
          </Link>
        ) : (
          <>
            <Link href="/login" className={styles.link} style={{ marginRight: '1rem', fontWeight: 500 }}>Log in</Link>
            <Link href="/signup" className={styles.loginBtn}>Sign Up</Link>
          </>
        )}
        
        {mounted && isAuthenticated && user?.role === 'agent' && (
          <Link href="/post-listing" className={styles.postBtn}>Post Listing</Link>
        )}
        {mounted && isAuthenticated && (user?.role === 'admin' || user?.role === 'customer_care') && (
          <Link href="/admin" className={styles.postBtn} style={{ backgroundColor: '#111' }}>Dashboard</Link>
        )}
      </div>
    </nav>
  );
}
