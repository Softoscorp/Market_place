'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { SearchHero } from "@/components/search/SearchHero";
import { PropertyCard } from "@/components/property/PropertyCard";
import { AgentCard } from "@/components/agent/AgentCard";
import styles from "./page.module.css";
import { apiRequest, mediaUrl } from "@/lib/api";

import { useLanguageStore } from "@/lib/store/useLanguageStore";

// Mock data for universities
const UNIVERSITIES = [
  { name: "Eastern Mediterranean University (EMU)", location: "Famagusta", distance: "0 mins" },
  { name: "Girne American University (GAU)", location: "Kyrenia", distance: "10 mins" },
  { name: "Near East University (NEU)", location: "Nicosia", distance: "15 mins" },
  { name: "Cyprus International University (CIU)", location: "Nicosia", distance: "15 mins" }
];

interface PropertyData {
  id: string | number;
  title: string;
  location: string;
  price: number;
  house_type: string;
  photos?: Array<{ url: string }>;
  agent_average_rating?: number;
  agent?: { name: string; avatarUrl?: string; is_verified?: boolean };
}

interface AgentData {
  id: number;
  name: string;
  avatarUrl?: string;
  is_verified?: boolean;
  average_rating?: number;
  total_reviews?: number;
  active_listings?: number;
}

export default function HomePage() {
  const { t } = useLanguageStore();
  const [featuredProperties, setFeaturedProperties] = useState<PropertyData[]>([]);
  const [topAgents, setTopAgents] = useState<AgentData[]>([]);

  useEffect(() => {
    apiRequest("/listings", { auth: false })
      .then((data) => setFeaturedProperties(data.items || []))
      .catch(console.error);

    apiRequest("/agents", { auth: false })
      .then((data) => setTopAgents(data || []))
      .catch(console.error);
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
            {featuredProperties.slice(0, 3).map((prop) => (
              <PropertyCard
                key={prop.id}
                id={prop.id.toString()}
                title={prop.title}
                location={prop.location}
                price={prop.price}
                currency="£"
                type={prop.house_type}
                bedrooms={parseInt(prop.house_type?.split('+')[0]) || 1}
                bathrooms={1}
                images={prop.photos?.length && prop.photos.length > 0 ? prop.photos.map((p: { url: string }) => mediaUrl(p.url) || '') : ['/images/placeholder-studio.jpg']}
                sizeSqf={75}
                moveInCost={prop.price * 3}
                agentRating={prop.agent_average_rating || 5.0}
                agentName={prop.agent?.name || 'Agent'}
                agentAvatar={prop.agent?.avatarUrl ? mediaUrl(prop.agent.avatarUrl) : undefined}
                isVerified={prop.agent?.is_verified}
              />
            ))}
          </div>
        </motion.section>

        {/* Universities Section */}
        <motion.section 
          className={`${styles.section} section`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t('by_university')}</h2>
              <p className={styles.ctaSubtitle}>Join thousands of students and agents who have already found success on our platform.</p>
            </div>
          </div>
          <div className={styles.universityGrid}>
            {UNIVERSITIES.map((uni, idx) => (
              <div key={idx} className={styles.uniCard}>
                <h3>{uni.name}</h3>
                <p>{uni.location}</p>
              </div>
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
            {featuredProperties.slice(3, 6).map((prop) => (
              <PropertyCard
                key={prop.id}
                id={prop.id.toString()}
                title={prop.title}
                location={prop.location}
                price={prop.price}
                currency="£"
                type={prop.house_type}
                bedrooms={parseInt(prop.house_type?.split('+')[0]) || 1}
                bathrooms={1}
                images={prop.photos?.length && prop.photos.length > 0 ? prop.photos.map((p: { url: string }) => mediaUrl(p.url) || '') : ['/images/placeholder-studio.jpg']}
                sizeSqf={75}
                moveInCost={prop.price * 3}
                agentRating={prop.agent_average_rating || 5.0}
                agentName={prop.agent?.name || 'Agent'}
                agentAvatar={prop.agent?.avatarUrl ? mediaUrl(prop.agent.avatarUrl) : undefined}
                isVerified={prop.agent?.is_verified}
              />
            ))}
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
            {topAgents.slice(0, 3).map((agent, idx) => (
              <AgentCard 
                key={idx} 
                agentId={agent.id}
                name={agent.name}
                agency={'Independent Agent'}
                imageUrl={agent.avatarUrl ? mediaUrl(agent.avatarUrl) || '' : ''}
                rating={agent.average_rating ? Number(agent.average_rating.toFixed(1)) : 0}
                reviews={agent.total_reviews || 0}
                activeListings={agent.active_listings || 0}
                isVerified={agent.is_verified}
              />
            ))}
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
