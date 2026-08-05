'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Bed, Bath, ArrowLeft, Heart, Share2, Calendar } from 'lucide-react';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { MoveInCalculator } from '@/components/property/MoveInCalculator';
import { AgentCard } from '@/components/agent/AgentCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import { BackButton } from '@/components/ui/BackButton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { apiRequest, mediaUrl, saveProperty, getApartmentRatings } from '@/lib/api';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';

import styles from './page.module.css';

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface PropertyData {
  id: number;
  title: string;
  description?: string;
  price: number;
  location: string;
  house_type: string;
  furnished?: boolean;
  agent_average_rating?: number;
  agent_rating_count?: number;
  agent?: { id: string; name: string; avatar_url?: string; verification_tier?: 'none' | 'local' | 'international'; respond_rate?: number };
  photos?: Array<{ url: string }>;
  distance_to_university?: number;
  upfront_rent_months?: number;
  deposit_months?: number;
  commission_months?: number;
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { openChat } = useChatStore();
  const resolvedParams = React.use(params);
  
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [similarProperties, setSimilarProperties] = useState<PropertyData[]>([]);
  const [reviews, setReviews] = useState<Array<{ id: number; stars: number; comment?: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Booking and Roommate Flow
  const { user } = useAuthStore();
  const router = useRouter();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRoommatePrompt, setShowRoommatePrompt] = useState(false);
  const [showRoommateForm, setShowRoommateForm] = useState(false);
  const [roommateData, setRoommateData] = useState({ budget: '', bio: '' });
  const [notification, setNotification] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    apiRequest(`/listings/${resolvedParams.id}`, { auth: false })
      .then((data) => {
        setProperty(data);
        setLoading(false);
        // Fetch similar
        apiRequest(`/listings`, { auth: false }).then((listData) => {
          const others = (listData.items || []).filter((p: PropertyData) => p.id !== data.id);
          setSimilarProperties(others.slice(0, 6));
        });
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    getApartmentRatings(Number(resolvedParams.id))
      .then(setReviews)
      .catch(console.error);
  }, [resolvedParams.id]);

  const handleSave = async () => {
    try {
      if (!property) return;
      await saveProperty(property.id);
      setIsSaved(true);
      showToast("Property saved to your favorites!", "success");
    } catch (error) {
      console.error(error);
      showToast("Please log in to save properties.", "error");
    }
  };

  const handleBookingSubmit = () => {
    if (!user) {
      showToast("Please log in to book this apartment.", "error");
      router.push('/login');
      return;
    }
    // Mock booking API call
    setTimeout(() => {
      setShowBookingModal(false);
      setShowRoommatePrompt(true);
    }, 1000);
  };

  const handleRoommateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRoommateData({ ...roommateData, [e.target.name]: e.target.value });
  };

  const handleRoommateSubmit = async () => {
    try {
      // Full request normally includes more fields, but for this mock we just use what we have or mock the rest
      await apiRequest('/roommates', {
        method: 'POST',
        body: {
          name: user?.name || 'User',
          age: 25, // Mocked
          gender: 'Other', // Mocked
          occupation: 'Student', // Mocked
          budget: parseInt(roommateData.budget) || 400,
          looking_for_city: [property?.location.split(',')[0] || 'Unknown'],
          move_in_date: new Date().toISOString(),
          duration_months: 6,
          bio: roommateData.bio,
          habits: ['Clean'], // Mocked
          gender_preference: 'Any',
          listing_id: property?.id
        }
      });
      setShowRoommateForm(false);
      showToast("Roommate profile created successfully!", "success");
      router.push('/roommates');
    } catch (error) {
      console.error(error);
      showToast("Error creating roommate profile.", "error");
    }
  };

  if (loading) return <div className="section container text-center">Loading...</div>;
  if (!property) return notFound();

  const agent = property.agent;
  const images = property.photos && property.photos.length > 0 
    ? (property.photos.map((p) => mediaUrl(p.url)).filter(Boolean) as string[])
    : ['/images/placeholder-studio.jpg'];

  const bedrooms = parseInt(property.house_type?.split('+')[0]) || 1;
  const bathrooms = 1;


  return (
    <div className={styles.container}>
      <BackButton />
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '1rem 1.5rem',
            backgroundColor: notification.type === 'success' ? '#15803d' : '#b91c1c',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          {notification.text}
        </motion.div>
      )}
      <nav className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link href="/search" className={styles.breadcrumbLink}>Properties</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span>{property.title}</span>
      </nav>

      <motion.div 
        className={styles.mainGrid}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <h1 className={styles.title}>{property.title}</h1>
                <div className={styles.location}>
                  <PremiumIcon icon={MapPin} size={14} colorVariant="primary" containerSize={28} />
                  {property.location}
                </div>
                <div className={styles.priceContainer}>
                  <div className={styles.price}>
                    £{property.price}
                  </div>
                  <div className={styles.priceLabel}>per month</div>
                </div>
              </div>
            </div>
            
            <div className={styles.badges}>
              <Badge variant="accent">{property.house_type}</Badge>
              <Badge variant="neutral">{property.furnished ? 'Furnished' : 'Unfurnished'}</Badge>
            </div>
          </div>

          <PropertyGallery images={images} title={property.title} />

          <div className={styles.featuresGrid}>
            {property.distance_to_university != null && property.distance_to_university > 0 && (
              <div className={styles.featureItem}>
                <PremiumIcon icon={MapPin} size={20} colorVariant="primary" containerSize={40} />
                <div className={styles.featureValue}>{property.distance_to_university} km</div>
                <div className={styles.featureLabel}>From Uni</div>
              </div>
            )}
            <div className={styles.featureItem}>
              <PremiumIcon icon={Bed} size={20} colorVariant="primary" containerSize={40} />
              <div className={styles.featureValue}>{bedrooms}</div>
              <div className={styles.featureLabel}>Bedrooms</div>
            </div>
            <div className={styles.featureItem}>
              <PremiumIcon icon={Bath} size={20} colorVariant="primary" containerSize={40} />
              <div className={styles.featureValue}>{bathrooms}</div>
              <div className={styles.featureLabel}>Bathrooms</div>
            </div>

            <div className={styles.featureItem}>
              <PremiumIcon icon={Calendar} size={20} colorVariant="primary" containerSize={40} />
              <div className={styles.featureValue}>Monthly</div>
              <div className={styles.featureLabel}>Payment</div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <p className={styles.description}>{property.description}</p>
          </div>



          <div className={styles.section} style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Property Reviews ({reviews.length})</h2>
              {!showReviewForm && user?.role !== 'agent' && (
                <Button variant="secondary" onClick={() => setShowReviewForm(true)}>
                  Write a Review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <div style={{ marginBottom: '2rem' }}>
                <ReviewForm
                  targetId={Number(resolvedParams.id)}
                  type="apartment"
                  onCancel={() => setShowReviewForm(false)}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    getApartmentRatings(Number(resolvedParams.id)).then(setReviews).catch(console.error);
                  }}
                />
              </div>
            )}

            <ReviewList reviews={reviews} />
          </div>
        </div>

        <div className={styles.sidebar}>
          <MoveInCalculator 
            rent={property.price}
            deposit={property.price * (property.deposit_months || 1)}
            commission={property.price * (property.commission_months || 1)}
            advanceMonths={property.upfront_rent_months || 1}
            currency={'£'}
          />

          {agent && (
            <AgentCard
              agentId={agent.id}
              name={agent.name}
              agency={'Independent Agent'}
              imageUrl={mediaUrl(agent.avatar_url) || ''}
              rating={property.agent_average_rating || 5.0}
              reviews={property.agent_rating_count || 0}
              respondRate={agent.respond_rate}
              verificationTier={agent.verification_tier}
              onContact={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                openChat({ id: String(agent.id), name: agent.name, avatarUrl: mediaUrl(agent.avatar_url) || '' }, property.id);
              }}
            />
          )}

          <div className={styles.actionButtons}>
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth
              onClick={() => setShowBookingModal(true)}
              style={{ marginBottom: '0.5rem', backgroundColor: '#000', color: '#fff' }}
            >
              Book Apartment
            </Button>
            <Button variant={isSaved ? "primary" : "secondary"} size="lg" fullWidth onClick={handleSave}>
              <Heart size={18} style={{ marginRight: '0.5rem' }} /> {isSaved ? "Saved" : "Save to Wishlist"}
            </Button>
          </div>
        </div>
      </motion.div>

      {similarProperties.length > 0 && (
        <motion.div 
          className={styles.similarSection}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h2 className={styles.sectionTitle}>Similar Properties</h2>
          <div className={styles.similarGrid}>
            {similarProperties.map((prop) => (
              <PropertyCard
                key={prop.id}
                id={prop.id.toString()}
                title={prop.title}
                location={prop.location}
                price={prop.price}
                currency={'£'}
                type={prop.house_type || 'Unknown'}
                bedrooms={parseInt(prop.house_type?.split('+')[0]) || 1}
                bathrooms={1}
                images={prop.photos && prop.photos.length > 0 ? (prop.photos.map((p: { url: string }) => mediaUrl(p.url)).filter(Boolean) as string[]) : ['/images/placeholder-studio.jpg']}
                sizeSqf={75}
                upfrontMonths={prop.upfront_rent_months}
                depositMonths={prop.deposit_months}
                commissionMonths={prop.commission_months}
                agentRating={prop.agent_average_rating}
                agentName={prop.agent?.name || 'Agent'}
                agentAvatar={mediaUrl(prop.agent?.avatar_url)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Booking Modal */}
      <Modal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} title="Book Apartment">
        <div style={{ padding: '1rem' }}>
          <p style={{ marginBottom: '1rem' }}>You are about to submit a booking request for <strong>{property.title}</strong>.</p>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>The agent will review your request and contact you to proceed with the contract.</p>
          <Button variant="primary" fullWidth onClick={handleBookingSubmit}>
            Confirm Booking Request
          </Button>
        </div>
      </Modal>

      {/* Roommate Prompt Modal */}
      <Modal isOpen={showRoommatePrompt} onClose={() => setShowRoommatePrompt(false)} title="Looking for a Roommate?">
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <Heart size={48} color="#e11d48" style={{ margin: '0 auto', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Want to split the rent?</h3>
            <p style={{ color: '#6b7280' }}>You can create a roommate request for this apartment. Other users will see it and can message you to team up!</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="secondary" fullWidth onClick={() => setShowRoommatePrompt(false)}>
              No, thanks
            </Button>
            <Button variant="primary" fullWidth onClick={() => {
              setShowRoommatePrompt(false);
              setShowRoommateForm(true);
            }}>
              Yes, find a roommate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Roommate Form Modal */}
      <Modal isOpen={showRoommateForm} onClose={() => setShowRoommateForm(false)} title="Create Roommate Profile">
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>What is your maximum budget for your share? (£)</label>
            <Input 
              type="number" 
              name="budget" 
              placeholder="e.g. 400" 
              value={roommateData.budget} 
              onChange={handleRoommateChange} 
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Bio & Lifestyle</label>
            <textarea 
              name="bio" 
              placeholder="Describe yourself and what you're looking for in a roommate..." 
              value={roommateData.bio} 
              onChange={handleRoommateChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', minHeight: '100px' }}
            />
          </div>
          <Button variant="primary" fullWidth onClick={handleRoommateSubmit}>
            Post Roommate Request
          </Button>
        </div>
      </Modal>
    </div>
  );
}
