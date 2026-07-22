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
              <h2 className={styles.sectionTitle}>Recently Added</h2>
              <p className={styles.sectionSubtitle}>Discover the newest properties on the market.</p>
            </div>
            <Link href="/search?sort=newest" className={styles.viewAll}>
              View All <ArrowRight size={16} />
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
              <h2 className={styles.sectionTitle}>Browse by University</h2>
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
              <h2 className={styles.sectionTitle}>Trending Properties</h2>
              <p className={styles.sectionSubtitle}>Properties that are getting the most attention right now.</p>
            </div>
            <Link href="/search?sort=popular" className={styles.viewAll}>
              View All <ArrowRight size={16} />
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
              <h2 className={styles.sectionTitle}>Top Verified Agents</h2>
              <p className={styles.sectionSubtitle}>Work with the best real estate professionals in North Cyprus.</p>
            </div>
            <Link href="/agents" className={styles.viewAll}>
              View All <ArrowRight size={16} />
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
            <h2 className={`${styles.sectionTitle} text-center`}>How It Works</h2>
            <p className={`${styles.sectionSubtitle} text-center mx-auto`} style={{ margin: '0 auto' }}>
              Your journey to the perfect home in North Cyprus made simple and secure.
            </p>
            <div className={styles.stepsGrid}>
              <div className={styles.step}>
                <PremiumIcon icon={Search} size={32} colorVariant="primary" />
                <h3 style={{ marginTop: '1rem' }}>1. Search</h3>
                <p className="text-muted">Find exactly what you&apos;re looking for with our advanced filters and university proximity tools.</p>
              </div>
              <div className={styles.step}>
                <PremiumIcon icon={Users} size={32} colorVariant="accent" />
                <h3 style={{ marginTop: '1rem' }}>2. Connect</h3>
                <p className="text-muted">Message verified agents directly or find roommates through our trusted platform.</p>
              </div>
              <div className={styles.step}>
                <PremiumIcon icon={ShieldCheck} size={32} colorVariant="success" />
                <h3 style={{ marginTop: '1rem' }}>3. Move In</h3>
                <p className="text-muted">Secure your ideal home with transparent move-in costs and clear rental terms.</p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
