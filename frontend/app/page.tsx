'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { SearchHero } from "@/components/search/SearchHero";
import { PropertyCard } from "@/components/property/PropertyCard";
import { AgentCard } from "@/components/agent/AgentCard";
import styles from "./page.module.css";
import { apiRequest, mediaUrl } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useChatStore } from "@/lib/store/useChatStore";
import { Skeleton } from "@/components/ui/Skeleton";

import { useLanguageStore } from "@/lib/store/useLanguageStore";

import { isOnline } from "@/lib/timeAgo";

// Locations to replace universities
const LOCATIONS = [
  { name: "Nicosia" },
  { name: "Kyrenia" },
  { name: "Famagusta" },
  { name: "Lefke" },
  { name: "Guzelyurt" }
];

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
  const router = useRouter();
  const { t } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const { openChat } = useChatStore();
  const [featuredProperties, setFeaturedProperties] = useState<PropertyData[]>([]);
  const [topAgents, setTopAgents] = useState<AgentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

    const fetchAgents = () =>
      apiRequest("/agents", { auth: false })
        .then((data) => {
          // Filter out Demo Agent
          const filteredAgents = (data || []).filter((agent: AgentData) => agent.name !== 'Demo Agent');
          
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

    // Fetch immediately, then re-fetch after 2s to catch the heartbeat stamp
    fetchAgents();
    const quick = setTimeout(fetchAgents, 2000);
    return () => clearTimeout(quick);
  }, []);

  return (
    <div className={styles.page}>
      <SearchHero />

      <main className="container section">
        {/* Recently Added Section */}
        <motion.section 
          className={styles.section}
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
              {t('view_all')} <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.grid}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton width="100%" height={200} style={{ borderRadius: '12px' }} />
                  <Skeleton width="80%" height={24} />
                  <Skeleton width="50%" height={20} />
                  <Skeleton width="100%" height={40} style={{ marginTop: 'auto' }} />
                </div>
              ))
            ) : (
              featuredProperties.slice(0, 3).map((prop) => (
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
                  images={prop.photos?.length && prop.photos.length > 0 ? prop.photos.map((p: { url: string }) => mediaUrl(p.url) || '') : ['/images/placeholder-studio.jpg']}
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

        {/* Locations Section */}
        <motion.section 
          className={`${styles.section} section`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Browse by Location</h2>
              <p className={styles.ctaSubtitle}>Discover properties in top cities and regions.</p>
            </div>
          </div>
          <div className={styles.universityGrid}>
            {LOCATIONS.map((loc, idx) => (
              <Link key={idx} href={`/search?location=${encodeURIComponent(loc.name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.uniCard}>
                  <h3>{loc.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Trending Section */}
        <motion.section 
          className={`${styles.section} section`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('trending')}</h2>
              <p className={styles.sectionSubtitle}>{t('trending_sub')}</p>
            </div>
            <Link href="/search?sort=popular" className={styles.viewAll}>
              {t('view_all')} <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.grid}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton width="100%" height={200} style={{ borderRadius: '12px' }} />
                  <Skeleton width="80%" height={24} />
                  <Skeleton width="50%" height={20} />
                  <Skeleton width="100%" height={40} style={{ marginTop: 'auto' }} />
                </div>
              ))
            ) : (
              featuredProperties.slice(3, 6).map((prop) => (
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
                  images={prop.photos?.length && prop.photos.length > 0 ? prop.photos.map((p: { url: string }) => mediaUrl(p.url) || '') : ['/images/placeholder-studio.jpg']}
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
              {t('view_all')} <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.grid}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Skeleton circle width={50} height={50} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <Skeleton width="60%" height={20} />
                      <Skeleton width="40%" height={16} />
                    </div>
                  </div>
                  <Skeleton width="100%" height={60} style={{ marginTop: '16px' }} />
                </div>
              ))
            ) : (
              topAgents.slice(0, 3).map((agent, idx) => (
                <AgentCard 
                  key={idx} 
                  agentId={agent.id}
                  name={agent.name}
                  agency={'Independent Agent'}
                  imageUrl={agent.avatar_url ? mediaUrl(agent.avatar_url) || '' : ''}
                  rating={agent.average_rating ? Number(agent.average_rating.toFixed(1)) : 0}
                  reviews={agent.total_reviews || 0}
                  activeListings={agent.active_listings || 0}
                  respondRate={agent.respond_rate}
                  lastSeenAt={agent.last_seen_at}
                  verificationTier={agent.verification_tier}
                  onContact={() => {
                    if (!isAuthenticated) {
                      router.push('/login');
                      return;
                    }
                    openChat({ id: String(agent.id), name: agent.name, avatarUrl: agent.avatar_url ? mediaUrl(agent.avatar_url) || '' : '' });
                  }}
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
          <div className="container">
            <h2 className={`${styles.sectionTitle} text-center`}>{t('how_it_works')}</h2>
            <p className={`${styles.sectionSubtitle} text-center mx-auto`} style={{ margin: '0 auto' }}>
              {t('how_sub')}
            </p>
            <div className={styles.stepsGrid}>
              <div className={styles.step}>
                <PremiumIcon icon={Search} size={32} colorVariant="primary" />
                <h3 style={{ marginTop: '1rem' }}>{t('step1_title')}</h3>
                <p className="text-muted">{t('step1_desc')}</p>
              </div>
              <div className={styles.step}>
                <PremiumIcon icon={Users} size={32} colorVariant="accent" />
                <h3 style={{ marginTop: '1rem' }}>{t('step2_title')}</h3>
                <p className="text-muted">{t('step2_desc')}</p>
              </div>
              <div className={styles.step}>
                <PremiumIcon icon={ShieldCheck} size={32} colorVariant="success" />
                <h3 style={{ marginTop: '1rem' }}>{t('step3_title')}</h3>
                <p className="text-muted">{t('step3_desc')}</p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
