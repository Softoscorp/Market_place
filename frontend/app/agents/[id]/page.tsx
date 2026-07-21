'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { notFound } from 'next/navigation';
import { AgentProfile } from '@/components/agent/AgentProfile';
import { PropertyCard } from '@/components/property/PropertyCard';
import { BackButton } from '@/components/ui/BackButton';
import styles from './AgentDetailPage.module.css';
import { apiRequest, mediaUrl, getAgentRatings } from '@/lib/api';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { Button } from '@/components/ui/Button';

interface ProfileData {
  agent: { name: string; avatarUrl?: string; bio?: string; is_verified?: boolean; id: string };
  average_rating: number;
  rating_count: number;
  listings: Array<{
    id: number;
    title: string;
    location: string;
    price: number;
    house_type: string;
    photos: Array<{ url: string }>;
  }>;
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviews, setReviews] = useState<Array<{ id: number; stars: number; comment?: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    apiRequest(`/agents/${resolvedParams.id}`, { auth: false })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    getAgentRatings(Number(resolvedParams.id))
      .then(setReviews)
      .catch(console.error);
  }, [resolvedParams.id]);

  if (loading) return <div className="section container text-center">Loading...</div>;
  if (!profile) return notFound();

  const { agent, average_rating, rating_count, listings } = profile;

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <BackButton />
      <motion.div 
        className={styles.profileSection}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <AgentProfile 
          name={agent.name}
          agency={'Independent Agent'}
          imageUrl={mediaUrl(agent.avatarUrl) || ''}
          bio={agent.bio || 'Professional real estate agent.'}
          rating={average_rating || 5.0}
          reviews={rating_count || 0}
          activeListings={listings?.length || 0}
          experienceYears={2}
          isVerified={agent.is_verified}
        />
      </motion.div>

      <motion.div 
        className={styles.listingsSection}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h2 className={styles.sectionTitle}>Active Listings ({listings?.length || 0})</h2>
        <div className={styles.grid}>
          {listings && listings.map((prop) => (
            <PropertyCard
              key={prop.id}
              id={prop.id.toString()}
              title={prop.title}
              location={prop.location}
              price={prop.price}
              currency="£"
              type={prop.house_type}
              bedrooms={parseInt(prop.house_type.split('+')[0]) || 1}
              bathrooms={1}
              images={prop.photos?.length > 0 ? prop.photos.map((p) => mediaUrl(p.url) || '') : ['/images/placeholder-studio.jpg']}
              sizeSqf={75}
              moveInCost={prop.price * 3}
              agentRating={average_rating || 5.0}
              agentName={agent.name}
              agentAvatar={mediaUrl(agent.avatarUrl) || undefined}
              isVerified={agent.is_verified}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        className={styles.reviewsSection}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ marginTop: '3rem', padding: '2rem', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Reviews ({reviews.length})</h2>
          {!showReviewForm && (
            <Button variant="secondary" onClick={() => setShowReviewForm(true)}>
              Write a Review
            </Button>
          )}
        </div>

        {showReviewForm && (
          <div style={{ marginBottom: '2rem' }}>
            <ReviewForm
              targetId={Number(resolvedParams.id)}
              type="agent"
              onCancel={() => setShowReviewForm(false)}
              onSuccess={() => {
                setShowReviewForm(false);
                getAgentRatings(Number(resolvedParams.id)).then(setReviews).catch(console.error);
              }}
            />
          </div>
        )}

        <ReviewList reviews={reviews} />
      </motion.div>
    </motion.div>
  );
}
