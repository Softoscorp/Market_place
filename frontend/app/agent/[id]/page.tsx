'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { AgentCard } from '@/components/agent/AgentCard';
import { PropertyCard } from '@/components/property/PropertyCard';
import { BackButton } from '@/components/ui/BackButton';
import { useChatStore } from '@/lib/store/useChatStore';
import { getAgentProfile, mediaUrl } from '@/lib/api';

import styles from './page.module.css';

export default function AgentProfilePage() {
  const params = useParams();
  // Safe way to get params in Next.js 15+ without awaiting: React.use(params as any)
  // For simplicity, we assume params is resolved or we cast it
  const id = params?.id as string;
  const { openChat } = useChatStore();

interface AgentProfile {
  agent: {
    id: number;
    name: string;
    is_verified: boolean;
    avatarUrl?: string;
  };
  average_rating: number | null;
  rating_count: number;
  listings: Array<{
    id: number;
    title: string;
    city: string;
    district: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqm: number;
    house_type?: string;
    photos?: Array<{ url: string }>;
    features?: string[];
  }>;
}

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    async function loadProfile() {
      try {
        const data = await getAgentProfile(id);
        setProfile(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load agent profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <BackButton />
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <BackButton />
        <div className={styles.error}>{error || 'Agent not found'}</div>
      </div>
    );
  }

  const { agent, average_rating, rating_count, listings } = profile;

  return (
    <div className={styles.container}>
      <BackButton />

      <motion.section 
        className={styles.profileSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.profileCardWrapper}>
          <AgentCard
            agentId={agent.id}
            name={agent.name}
            agency={'Independent Agent'}
            imageUrl={mediaUrl(agent.avatarUrl) || '/images/placeholder-studio.jpg'}
            rating={average_rating || 5.0}
            reviews={rating_count || 0}
            activeListings={listings?.length || 0}
            isVerified={agent.is_verified}
            onContact={() => openChat({ id: String(agent.id), name: agent.name, avatarUrl: mediaUrl(agent.avatarUrl) || '' })}
          />
        </div>
      </motion.section>

      <motion.section 
        className={styles.listingsSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className={styles.sectionTitle}>Listings by {agent.name.split(' ')[0]}</h2>
        
        {listings && listings.length > 0 ? (
          <div className={styles.grid}>
            {listings.map((listing) => (
              <PropertyCard
                key={listing.id}
                id={listing.id.toString()}
                title={listing.title}
                location={`${listing.city}, ${listing.district}`}
                price={listing.price}
                currency="£"
                images={[listing.photos && listing.photos.length > 0 ? (mediaUrl(listing.photos[0].url) || '/images/placeholder-studio.jpg') : '/images/placeholder-studio.jpg']}
                type={listing.house_type || 'Unknown'}
                sizeSqf={listing.sqm}
                bedrooms={listing.bedrooms}
                bathrooms={listing.bathrooms}
                moveInCost={listing.price * 2}
                agentName={agent.name}
              />
            ))}
          </div>
        ) : (
          <p>This agent currently has no active listings.</p>
        )}
      </motion.section>
    </div>
  );
}
