'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { SearchHero } from "@/components/search/SearchHero";
import { PropertyCard } from "@/components/property/PropertyCard";
import { AgentCard } from "@/components/agent/AgentCard";
import styles from "./page.module.css";
import { apiRequest, mediaUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

import { useLanguageStore } from "@/lib/store/useLanguageStore";

import { useScrollRestoration } from "@/lib/useScrollRestoration";

import { isOnline } from "@/lib/timeAgo";

const LOCATIONS = ['Nicosia', 'Kyrenia', 'Famagusta', 'Lefke', 'Güzelyurt'];

interface PropertyData {
  upfront_rent_months?: number;
  deposit_months?: number;
  commission_months?: number;
  id: string | number;
  title: string;
  location: string;
  price: number;
  house_type: string;
  photos?: Array<{ url: string }>;
  agent_average_rating?: number;
  agent?: { name: string; avatar_url?: string; verification_tier?: 'none' | 'local' | 'international' };
}

interface AgentData {
  id: number;
  name: string;
  avatar_url?: string;
  verification_tier?: 'none' | 'local' | 'international';
  average_rating?: number;
  total_reviews?: number;
  active_listings?: number;
  respond_rate?: number;
  last_seen_at?: string | null;
}

export default function HomePage() {
  const { t } = useLanguageStore();
  const [featuredProperties, setFeaturedProperties] = useState<PropertyData[]>([]);
  const [topAgents, setTopAgents] = useState<AgentData[]>([]);
  const [locationCounts, setLocationCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useScrollRestoration();

  useEffect(() => {
    let propertiesLoaded = false;
    let agentsLoaded = false;

    const checkLoading = () => {
      if (propertiesLoaded && agentsLoaded) {
        setIsLoading(false);
      }
    };

    apiRequest("/listings", { auth: false })
      .then((data) => {
        setFeaturedProperties(data.items || []);
        propertiesLoaded = true;
        checkLoading();
      })
      .catch((err) => {
        console.error(err);
        propertiesLoaded = true;
        checkLoading();
      });

    apiRequest("/agents", { auth: false })
      .then((data) => {
        // Filter out Demo Agent and placeholder/test agents
        const filteredAgents = (data || []).filter((agent: AgentData) => agent.name !== 'Demo Agent' && agent.name !== 'Unverified Agent');

        // Sort by online status (online first)
        filteredAgents.sort((a: AgentData, b: AgentData) => {
          const aOnline = isOnline(a.last_seen_at);
          const bOnline = isOnline(b.last_seen_at);
          if (aOnline && !bOnline) return -1;
          if (!aOnline && bOnline) return 1;
          return 0;
        });

        setTopAgents(filteredAgents);
        agentsLoaded = true;
        checkLoading();
      })
      .catch((err) => {
        console.error(err);
        agentsLoaded = true;
        checkLoading();
      });

    apiRequest("/listings/location-counts", { auth: false })
      .then((data) => {
        const counts: Record<string, number> = {};
        (data || []).forEach((row: { location: string; count: number }) => {
          const loc = (row.location || '').trim().toLowerCase();
          if (loc) counts[loc] = row.count;
        });
        setLocationCounts(counts);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className={styles.page}>
      <SearchHero />

      <main className={`${styles.container} ${styles.section}`}>
        {/* Recently Added Section */}
        <motion.section 
          className={`${styles.section} section`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('recently_added')}</h2>
              <p className={styles.sectionSubtitle}>{t('recently_added_sub')}</p>
            </div>
            <Link href="/search?sort=newest" className={styles.viewAll}>
              {t('view_all')} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.grid}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <Skeleton width="100%" height={200} className={styles.skeletonRadius} />
                  <Skeleton width="80%" height={24} />
                  <Skeleton width="50%" height={20} />
                  <Skeleton width="100%" height={40} className={styles.skeletonAutoMargin} />
                </div>
              ))
            ) : (
              featuredProperties.slice(0, 8).map((prop) => (
                <PropertyCard
                  key={prop.id}
                  id={prop.id.toString()}
                  title={prop.title}
                  location={prop.location}
                  price={prop.price}
                  currency="£"
                  type={prop.house_type || 'Unknown'}
                  bedrooms={parseInt(prop.house_type?.split('+')[0]) || 1}
                  bathrooms={1}
                  images={prop.photos?.length && prop.photos.length > 0 ? prop.photos.map((p: { url: string }) => mediaUrl(p.url) || '') : ['/images/listing-placeholder.svg']}
                  upfrontMonths={prop.upfront_rent_months}
                  depositMonths={prop.deposit_months}
                  commissionMonths={prop.commission_months}
                  agentRating={prop.agent_average_rating}
                  agentName={prop.agent?.name || 'Agent'}
                  agentAvatar={prop.agent?.avatar_url ? mediaUrl(prop.agent.avatar_url) : undefined}
                  verificationTier={prop.agent?.verification_tier}
                />
              ))
            )}
          </div>
        </motion.section>

        {/* Browse by Location Section (desktop only) */}
        <motion.section
          className={`${styles.locationsSection} section`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('browse_by_location')}</h2>
              <p className={styles.sectionSubtitle}>{t('browse_location_sub')}</p>
            </div>
          </div>
          <div className={styles.universityGrid}>
            {LOCATIONS.map((loc) => {
              const count = locationCounts[loc.toLowerCase()] || 0;
              return (
                <Link key={loc} href={`/search?location=${encodeURIComponent(loc)}`} className={styles.uniCard}>
                  <h3>{loc}</h3>
                  <p>{count} {t('properties')}</p>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* Top Agents Section */}
        <motion.section 
          className={`${styles.section} section`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('top_agents')}</h2>
              <p className={styles.sectionSubtitle}>{t('top_agents_sub')}</p>
            </div>
            <Link href="/agents" className={styles.viewAll}>
              {t('view_all')} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.agentsGrid}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.agentSkeleton}>
                  <div className={styles.agentSkeletonHeader}>
                    <Skeleton circle width={50} height={50} />
                    <div className={styles.agentSkeletonLines}>
                      <Skeleton width="60%" height={20} />
                      <Skeleton width="40%" height={16} />
                    </div>
                  </div>
                  <Skeleton width="100%" height={60} className={styles.skeletonTopMargin} />
                </div>
              ))
            ) : (
              topAgents.slice(0, 8).map((agent, idx) => (
                <AgentCard 
                  key={idx} 
                  agentId={agent.id}
                  name={agent.name}
                  agency={t('independent_agent')}
                  imageUrl={agent.avatar_url ? mediaUrl(agent.avatar_url) || '' : ''}
                  rating={agent.average_rating ? Number(agent.average_rating.toFixed(1)) : 0}
                  reviews={agent.total_reviews || 0}
                  activeListings={agent.active_listings || 0}
                  respondRate={agent.respond_rate}
                  lastSeenAt={agent.last_seen_at}
                  verificationTier={agent.verification_tier}
                  compact
                />
              ))
            )}
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section 
          className={styles.howItWorks}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.container}>
            <h2 className={`${styles.sectionTitle} ${styles.textCenter}`}>{t('how_it_works')}</h2>
            <p className={`${styles.sectionSubtitle} ${styles.textCenter} ${styles.subtitleCentered}`}>
              {t('how_sub')}
            </p>
            <div className={styles.stepsGrid}>
              <div className={styles.step}>
                <PremiumIcon icon={Search} size={32} colorVariant="primary" />
                <h3 className={styles.stepTitle}>{t('step1_title')}</h3>
                <p className={styles.textMuted}>{t('step1_desc')}</p>
              </div>
              <div className={styles.step}>
                <PremiumIcon icon={Users} size={32} colorVariant="accent" />
                <h3 className={styles.stepTitle}>{t('step2_title')}</h3>
                <p className={styles.textMuted}>{t('step2_desc')}</p>
              </div>
              <div className={styles.step}>
                <PremiumIcon icon={ShieldCheck} size={32} colorVariant="success" />
                <h3 className={styles.stepTitle}>{t('step3_title')}</h3>
                <p className={styles.textMuted}>{t('step3_desc')}</p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
