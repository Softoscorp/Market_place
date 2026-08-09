'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Bed, Bath, ArrowLeft, Heart, Share2, Calendar, Check, Images } from 'lucide-react';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { MoveInCalculator } from '@/components/property/MoveInCalculator';
import { AgentCard } from '@/components/agent/AgentCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { useRouter } from 'next/navigation';
import { apiRequest, mediaUrl, saveProperty, getApartmentRatings } from '@/lib/api';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ProtectedImage } from '@/components/ui/ProtectedImage';

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
  parking?: boolean;
  pet_friendly?: boolean;
  generator?: boolean;
  pool?: boolean;
  gym?: boolean;
  agent_average_rating?: number;
  agent_rating_count?: number;
  agent?: { id: string; name: string; avatar_url?: string; verification_tier?: 'none' | 'local' | 'international'; respond_rate?: number };
  photos?: Array<{ url: string }>;
  distance_to_university?: number;
  upfront_rent_months?: number;
  deposit_months?: number;
  commission_months?: number;
}

const TABS = [
  { id: 'highlights', label: 'Highlights' },
  { id: 'features', label: 'Features' },
  { id: 'description', label: 'Description' },
  { id: 'reviews', label: 'Reviews' },
] as const;

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
  const { t } = useLanguageStore();
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
    const listingId = resolvedParams.id;
    const abort = new AbortController();

    const loadProperty = apiRequest(`/listings/${listingId}`, { auth: false, signal: abort.signal });
    const loadRatings = getApartmentRatings(Number(listingId));

    Promise.all([loadProperty, loadRatings])
      .then(async ([data, ratingData]) => {
        setProperty(data);
        setReviews(Array.isArray(ratingData) ? ratingData : ratingData?.items || []);
        setLoading(false);

        const unique = (list: PropertyData[]) =>
          Array.from(new Map(list.map((p) => [p.id, p])).values()).filter((p) => p.id !== data.id);

        if (data?.house_type && typeof data.price === 'number') {
          const band = data.price * 0.2;
          const q = new URLSearchParams({
            house_type: data.house_type,
            min_price: String(Math.max(0, Math.round(data.price - band))),
            max_price: String(Math.round(data.price + band)),
            page_size: '10',
          });

          try {
            const bandRes = await apiRequest(`/listings?${q.toString()}`, { auth: false, signal: abort.signal });
            let matches = unique(bandRes.items || []);
            if (matches.length < 3) {
              const typeRes = await apiRequest(`/listings?house_type=${encodeURIComponent(data.house_type)}&page_size=10`, { auth: false, signal: abort.signal });
              matches = unique([...matches, ...(typeRes.items || [])]);
            }
            if (matches.length < 3) {
              const newestRes = await apiRequest(`/listings?page_size=10&sort=newest`, { auth: false, signal: abort.signal });
              matches = unique([...matches, ...(newestRes.items || [])]);
            }
            setSimilarProperties(matches.slice(0, 6));
          } catch (err) {
            if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'AbortError') return;
            console.error(err);
            setSimilarProperties([]);
          }
        } else {
          setSimilarProperties([]);
        }
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        console.error(err);
        setLoading(false);
      });

    return () => abort.abort();
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

  const handleRoommateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRoommateData({ ...roommateData, [e.target.name]: e.target.value });
  };

  const handleRoommateSubmit = async () => {
    try {
      await apiRequest('/roommates', {
        method: 'POST',
        body: {
          budget: Number(roommateData.budget),
          bio: roommateData.bio,
          listing_id: Number(resolvedParams.id)
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

  const handleBookingSubmit = async () => {
    setShowBookingModal(false);
    showToast("Booking request sent! The agent will contact you shortly.", "success");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard!", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToTab = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <div className="section container text-center">Loading...</div>;
  if (!property) return notFound();

  const agent = property.agent;
  const images = property.photos && property.photos.length > 0 
    ? (property.photos.map((p) => mediaUrl(p.url)).filter(Boolean) as string[])
    : ['/images/placeholder-studio.jpg'];

  const bedrooms = parseInt(property.house_type?.split('+')[0]) || 1;
  const bathrooms = 1;

  const amenities: Array<{ label: string; value: boolean | undefined }> = [
    { label: 'Furnished', value: property.furnished },
    { label: 'Parking', value: property.parking },
    { label: 'Pet Friendly', value: property.pet_friendly },
    { label: 'Generator', value: property.generator },
    { label: 'Pool', value: property.pool },
    { label: 'Gym', value: property.gym },
  ].filter((a) => a.value);

  return (
    <div className={styles.page}>
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={styles.toast}
          style={{
            backgroundColor: notification.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
          }}
        >
          {notification.text}
        </motion.div>
      )}

      {/* ============ HERO ============ */}
      <div className={styles.hero}>
        <div className={styles.heroImageWrap}>
          <ProtectedImage src={images[0]} alt={property.title} className={styles.heroImage} />
        </div>
        <div className={styles.heroScrim} />

        <div className={styles.heroTop}>
          <button className={styles.heroBtn} onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className={styles.heroTopRight}>
            <button className={styles.heroBtn} onClick={handleShare} aria-label="Share property">
              <Share2 size={19} aria-hidden="true" />
            </button>
            <button className={styles.heroBtn} onClick={handleSave} aria-label="Save property" style={{ color: isSaved ? 'var(--danger)' : undefined }}>
              <Heart size={19} aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className={styles.pricePill}>
          <span className={styles.priceAmount}>£{property.price}</span>
          <span className={styles.pricePer}>/mo</span>
        </div>

        <div className={styles.heroCaption}>
          <div className={styles.heroBadges}>
            <Badge variant="accent">{property.house_type}</Badge>
            <Badge variant="neutral">{property.furnished ? 'Furnished' : 'Unfurnished'}</Badge>
            {agent?.verification_tier === 'local' && <Badge variant="verified">Local Verified</Badge>}
            {agent?.verification_tier === 'international' && <Badge variant="verified">Verified</Badge>}
          </div>
          <h1 className={styles.heroTitle}>{property.title}</h1>
          <div className={styles.heroLoc}>
            <MapPin size={15} aria-hidden="true" />
            {property.location}
            {property.distance_to_university != null && property.distance_to_university > 0 && (
              <span className={styles.heroUni}>· {property.distance_to_university} km from uni</span>
            )}
          </div>
        </div>
      </div>

      {/* ============ STICKY TABS ============ */}
      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button key={tab.id} className={styles.tabItem} onClick={() => scrollToTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <motion.div 
        className={styles.body}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className={styles.container}>
          <div className={styles.mainGrid}>
            <div className={styles.left}>

              {/* At a glance */}
              <section id="highlights" className={styles.section}>
                <h2 className={styles.sectionTitle}>At a glance</h2>
                <div className={styles.atGlance}>
                  <div className={styles.featureTile}>
                    <div className={styles.featureIcon}>
                      <PremiumIcon icon={Bed} size={20} colorVariant="primary" containerSize={40} />
                    </div>
                    <div>
                      <div className={styles.featureValue}>{bedrooms}</div>
                      <div className={styles.featureLabel}>Bedrooms</div>
                    </div>
                  </div>
                  <div className={styles.featureTile}>
                    <div className={styles.featureIcon}>
                      <PremiumIcon icon={Bath} size={20} colorVariant="primary" containerSize={40} />
                    </div>
                    <div>
                      <div className={styles.featureValue}>{bathrooms}</div>
                      <div className={styles.featureLabel}>Bathrooms</div>
                    </div>
                  </div>
                  <div className={styles.featureTile}>
                    <div className={styles.featureIcon}>
                      <PremiumIcon icon={MapPin} size={20} colorVariant="primary" containerSize={40} />
                    </div>
                    <div>
                      <div className={styles.featureValue}>
                        {property.distance_to_university != null && property.distance_to_university > 0
                          ? `${property.distance_to_university} km`
                          : '—'}
                      </div>
                      <div className={styles.featureLabel}>From Uni</div>
                    </div>
                  </div>
                  <div className={styles.featureTile}>
                    <div className={styles.featureIcon}>
                      <PremiumIcon icon={Calendar} size={20} colorVariant="primary" containerSize={40} />
                    </div>
                    <div>
                      <div className={styles.featureValue}>£{property.price}</div>
                      <div className={styles.featureLabel}>Per month</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Gallery */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Photos</h2>
                <PropertyGallery images={images} title={property.title} />
              </section>

              {/* Features / Amenities */}
              {amenities.length > 0 && (
                <section id="features" className={styles.section}>
                  <h2 className={styles.sectionTitle}>Features</h2>
                  <div className={styles.amenitiesGrid}>
                    {amenities.map((a) => (
                      <div key={a.label} className={styles.amenityItem}>
                        <span className={styles.amenityCheck}>
                          <Check size={13} strokeWidth={3} aria-hidden="true" />
                        </span>
                        {a.label}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Description */}
              <section id="description" className={styles.section}>
                <h2 className={styles.sectionTitle}>Description</h2>
                <p className={styles.description}>{property.description}</p>
              </section>

              {/* Reviews */}
              <section id="reviews" className={styles.section}>
                <div className={styles.reviewsHead}>
                  <h2 className={styles.sectionTitle}>Property Reviews ({reviews.length})</h2>
                  {!showReviewForm && user?.role !== 'agent' && (
                    <Button variant="secondary" onClick={() => setShowReviewForm(true)}>
                      Write a Review
                    </Button>
                  )}
                </div>

                {showReviewForm && (
                  <div className={styles.reviewFormWrap}>
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
              </section>
            </div>

            <div className={styles.right}>
              <div className={styles.sideCard}>
                <MoveInCalculator 
                  rent={property.price}
                  deposit={property.price * (property.deposit_months || 1)}
                  commission={property.price * (property.commission_months || 1)}
                  advanceMonths={property.upfront_rent_months || 1}
                  currency={'£'}
                />
                <div className={styles.sideBtns}>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    fullWidth
                    onClick={() => setShowBookingModal(true)}
                  >
                    Book Apartment
                  </Button>
                  <Button variant={isSaved ? "primary" : "secondary"} size="lg" fullWidth onClick={handleSave}>
                    <Heart size={18} aria-hidden="true" style={{ marginRight: 'var(--space-2)' }} /> {isSaved ? "Saved" : "Save to Wishlist"}
                  </Button>
                </div>
              </div>

              {agent && (
                <AgentCard
                  agentId={agent.id}
                  name={agent.name}
                  agency={t('independent_agent')}
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
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============ SIMILAR PROPERTIES ============ */}
      {similarProperties.length > 0 && (
        <motion.div 
          className={styles.similarSection}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.container}>
            <div className={styles.similarHead}>
              <h2 className={styles.sectionTitle}>Similar Properties</h2>
              <Link href={`/search?house_type=${encodeURIComponent(property.house_type)}`} className={styles.seeAll}>
                See all →
              </Link>
            </div>
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
          </div>
        </motion.div>
      )}

      {/* ============ STICKY BOTTOM BAR ============ */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomPrice}>
          <span className={styles.bottomAmount}>£{property.price}</span>
          <span className={styles.bottomPer}>/mo</span>
        </div>
        <div className={styles.bottomActions}>
          <button className={styles.bottomSave} onClick={handleSave} aria-label="Save property" style={{ color: isSaved ? 'var(--danger)' : undefined }}>
            <Heart size={19} aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button className={styles.bottomBook} onClick={() => setShowBookingModal(true)}>
            Book Apartment
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} title="Book Apartment">
        <div style={{ padding: 'var(--space-4)' }}>
          <p style={{ marginBottom: 'var(--space-4)' }}>You are about to submit a booking request for <strong>{property.title}</strong>.</p>
          <p style={{ marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>The agent will review your request and contact you to proceed with the contract.</p>
          <Button variant="primary" fullWidth onClick={handleBookingSubmit}>
            Confirm Booking Request
          </Button>
        </div>
      </Modal>

      {/* Roommate Prompt Modal */}
      <Modal isOpen={showRoommatePrompt} onClose={() => setShowRoommatePrompt(false)} title="Looking for a Roommate?">
        <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <Heart size={48} color="var(--favorite)" aria-hidden="true" style={{ margin: '0 auto', marginBottom: 'var(--space-4)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Want to split the rent?</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You can create a roommate request for this apartment. Other users will see it and can message you to team up!</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
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
        <div style={{ padding: 'var(--space-4)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>What is your maximum budget for your share? (£)</label>
            <Input 
              type="number" 
              name="budget" 
              placeholder="e.g. 400" 
              value={roommateData.budget} 
              onChange={handleRoommateChange} 
            />
          </div>
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Bio & Lifestyle</label>
            <textarea 
              name="bio" 
              placeholder="Describe yourself and what you're looking for in a roommate..." 
              value={roommateData.bio} 
              onChange={handleRoommateChange}
              style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', minHeight: '100px' }}
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
