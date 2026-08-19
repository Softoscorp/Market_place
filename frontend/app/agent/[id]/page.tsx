'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { AgentCard } from '@/components/agent/AgentCard';
import { PropertyCard } from '@/components/property/PropertyCard';
import { BackButton } from '@/components/ui/BackButton';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { getAgentProfile, getAgentRatings, mediaUrl } from '@/lib/api';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { Button } from '@/components/ui/Button';

import styles from './page.module.css';

export default function AgentProfilePage() {
  const params = useParams();
  // Safe way to get params in Next.js 15+ without awaiting: React.use(params as any)
  // For simplicity, we assume params is resolved or we cast it
  const id = params?.id as string;
  const router = useRouter();
  const { openChat } = useChatStore();
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useLanguageStore();

interface AgentProfile {
  agent: {
    id: number;
    name: string;
    verification_tier?: 'none' | 'local' | 'international';
    avatar_url?: string;
    respond_rate?: number;
    last_seen_at?: string | null;
    active_listings?: number;
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
    upfront_rent_months?: number;
    deposit_months?: number;
    commission_months?: number;
  }>;
}

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Array<{ id: number; stars: number; comment?: string; created_at: string }>>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

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

    getAgentRatings(Number(id))
      .then(setReviews)
      .catch(console.error);
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <BackButton />
        <div className={styles.loading}>{t('ag_loading_profile')}</div>
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

  // When viewing your own profile, prefer the live value kept fresh by the heartbeat
  const isSelf = user && String(agent.id) === String(user.id);
  const lastSeenAt = isSelf ? (user.last_seen_at || agent.last_seen_at) : agent.last_seen_at;

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
            agency={t('independent_agent')}
            imageUrl={mediaUrl(agent.avatar_url) || '/images/listing-placeholder.svg'}
            rating={average_rating || 5.0}
            reviews={rating_count || 0}
            activeListings={listings?.length || 0}
            respondRate={agent.respond_rate}
            lastSeenAt={lastSeenAt}
            verificationTier={agent.verification_tier}
            onContact={() => {
              if (!isAuthenticated) {
                router.push('/login');
                return;
              }
              openChat({ id: String(agent.id), name: agent.name, avatarUrl: mediaUrl(agent.avatar_url) || '' });
            }}
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
                images={[listing.photos && listing.photos.length > 0 ? (mediaUrl(listing.photos[0].url) || '/images/listing-placeholder.svg') : '/images/listing-placeholder.svg']}
                type={listing.house_type || 'Unknown'}
                sizeSqf={listing.sqm}
                bedrooms={listing.bedrooms}
                bathrooms={listing.bathrooms}
                upfrontMonths={listing.upfront_rent_months}
                depositMonths={listing.deposit_months}
                commissionMonths={listing.commission_months}
                agentName={agent.name}
              />
            ))}
          </div>
        ) : (
          <p>{t('ag_no_listings')}</p>
        )}
      </motion.section>

      <motion.section
        className={styles.reviewsSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className={styles.reviewsHeader}>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleReset}`}>{t('ar_reviews_count').replace('{count}', String(reviews.length))}</h2>
          {!showReviewForm && (
            <Button variant="secondary" onClick={() => setShowReviewForm(true)}>
              {t('rf_write_review')}
            </Button>
          )}
        </div>

        {showReviewForm && (
          <div className={styles.reviewsFormWrap}>
            <ReviewForm
              targetId={Number(id)}
              type="agent"
              onCancel={() => setShowReviewForm(false)}
              onSuccess={() => {
                setShowReviewForm(false);
                getAgentRatings(Number(id)).then(setReviews).catch(console.error);
              }}
            />
          </div>
        )}

        <ReviewList reviews={reviews} />
      </motion.section>
    </div>
  );
}
