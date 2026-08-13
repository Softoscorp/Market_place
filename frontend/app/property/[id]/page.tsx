'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Bed, Bath, ArrowLeft, Heart, Share2, Calendar, Check } from 'lucide-react';
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
  { id: 'highlights', labelKey: 'pd_highlights' },
  { id: 'features', labelKey: 'pd_features' },
  { id: 'description', labelKey: 'pd_description' },
  { id: 'reviews', labelKey: 'pd_reviews' },
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
  const { t, lang } = useLanguageStore();
  const router = useRouter();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRoommatePrompt, setShowRoommatePrompt] = useState(false);
  const [showRoommateForm, setShowRoommateForm] = useState(false);
  const [roommateData, setRoommateData] = useState({ budget: '', bio: '' });
  const [notification, setNotification] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [translatedDesc, setTranslatedDesc] = useState<{ title: string; description: string } | null>(null);
  const [translating, setTranslating] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const targetLang = lang === 'tr' ? 'en' : 'tr';

  const handleTranslateDescription = async () => {
    if (!property || translating) return;
    if (translatedDesc) {
      setTranslatedDesc(null);
      return;
    }
    setTranslating(true);
    try {
      const res = await apiRequest(`/listings/${property.id}/translation?target_lang=${targetLang}`, { auth: false });
      setTranslatedDesc({ title: res.title, description: res.description });
    } catch (e) {
      showToast(t('pd_translate_error'), 'error');
      console.error('Translation failed', e);
    } finally {
      setTranslating(false);
    }
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
      showToast(t('pd_saved_toast'), "success");
    } catch (error) {
      console.error(error);
      showToast(t('pd_login_save'), "error");
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
      showToast(t('pd_roommate_created'), "success");
      router.push('/roommates');
    } catch (error) {
      console.error(error);
      showToast(t('pd_roommate_error'), "error");
    }
  };

  const handleBookingSubmit = async () => {
    setShowBookingModal(false);
    showToast(t('pd_booking_sent'), "success");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast(t('pd_link_copied'), "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToTab = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <div className={`${styles.container} ${styles.section} ${styles.textCenter}`}>{t('pd_loading')}</div>;
  if (!property) return notFound();

  const agent = property.agent;
  const images = property.photos && property.photos.length > 0 
    ? (property.photos.map((p) => mediaUrl(p.url)).filter(Boolean) as string[])
    : ['/images/listing-placeholder.svg'];

  const bedrooms = parseInt(property.house_type?.split('+')[0]) || 1;
  const bathrooms = 1;

  const amenities: Array<{ labelKey: string; value: boolean | undefined }> = [
    { labelKey: 'fp_fully_furnished', value: property.furnished },
    { labelKey: 'fp_parking', value: property.parking },
    { labelKey: 'fp_pet_friendly', value: property.pet_friendly },
    { labelKey: 'fp_generator', value: property.generator },
    { labelKey: 'fp_pool', value: property.pool },
    { labelKey: 'fp_gym', value: property.gym },
  ].filter((a) => a.value);

  return (
    <div className={styles.page}>
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`${styles.toast} ${notification.type === 'success' ? styles.toastSuccess : styles.toastDanger}`}
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
          <button className={styles.heroBtn} onClick={() => router.back()} aria-label={t('pd_go_back')}>
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className={styles.heroTopRight}>
            <button className={styles.heroBtn} onClick={handleShare} aria-label={t('pd_share')}>
              <Share2 size={19} aria-hidden="true" />
            </button>
            <button className={`${styles.heroBtn} ${isSaved ? styles.heroBtnSaved : ''}`} onClick={handleSave} aria-label={isSaved ? t('pd_saved') : t('pd_save_wishlist')}>
              <Heart size={19} aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className={styles.pricePill}>
          <span className={styles.priceAmount}>£{property.price}</span>
          <span className={styles.pricePer}>{t('per_month')}</span>
        </div>

        <div className={styles.heroCaption}>
          <div className={styles.heroBadges}>
            <Badge variant="accent">{property.house_type}</Badge>
            <Badge variant="neutral">{property.furnished ? t('fp_fully_furnished') : t('pd_unfurnished')}</Badge>
            {agent?.verification_tier === 'local' && <Badge variant="verified">{t('dg_local_verified')}</Badge>}
            {agent?.verification_tier === 'international' && <Badge variant="verified">{t('verified')}</Badge>}
          </div>
          <h1 className={styles.heroTitle}>{property.title}</h1>
          <div className={styles.heroLoc}>
            <MapPin size={15} aria-hidden="true" />
            {property.location}
            {property.distance_to_university != null && property.distance_to_university > 0 && (
              <span className={styles.heroUni}>· {t('pd_km_from_uni').replace('{km}', String(property.distance_to_university))}</span>
            )}
          </div>
        </div>
      </div>

      {/* ============ STICKY TABS ============ */}
      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button key={tab.id} className={styles.tabItem} onClick={() => scrollToTab(tab.id)}>
            {t(tab.labelKey)}
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
                <h2 className={styles.sectionTitle}>{t('pd_at_glance')}</h2>
                <div className={styles.atGlance}>
                  <div className={styles.featureTile}>
                    <div className={styles.featureIcon}>
                      <PremiumIcon icon={Bed} size={20} colorVariant="primary" containerSize={40} />
                    </div>
                    <div>
                      <div className={styles.featureValue}>{bedrooms}</div>
                      <div className={styles.featureLabel}>{t('pd_bedrooms')}</div>
                    </div>
                  </div>
                  <div className={styles.featureTile}>
                    <div className={styles.featureIcon}>
                      <PremiumIcon icon={Bath} size={20} colorVariant="primary" containerSize={40} />
                    </div>
                    <div>
                      <div className={styles.featureValue}>{bathrooms}</div>
                      <div className={styles.featureLabel}>{t('pd_bathrooms')}</div>
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
                      <div className={styles.featureLabel}>{t('pd_from_uni')}</div>
                    </div>
                  </div>
                  <div className={styles.featureTile}>
                    <div className={styles.featureIcon}>
                      <PremiumIcon icon={Calendar} size={20} colorVariant="primary" containerSize={40} />
                    </div>
                    <div>
                      <div className={styles.featureValue}>£{property.price}</div>
                      <div className={styles.featureLabel}>{t('pd_per_month')}</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Gallery */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('pd_photos')}</h2>
                <PropertyGallery images={images} title={property.title} />
              </section>

              {/* Features / Amenities */}
              {amenities.length > 0 && (
                <section id="features" className={styles.section}>
                  <h2 className={styles.sectionTitle}>{t('pd_features')}</h2>
                  <div className={styles.amenitiesGrid}>
                    {amenities.map((a) => (
                      <div key={a.labelKey} className={styles.amenityItem}>
                        <span className={styles.amenityCheck}>
                          <Check size={13} strokeWidth={3} aria-hidden="true" />
                        </span>
                        {t(a.labelKey)}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Description */}
              <section id="description" className={styles.section}>
                <div className={styles.reviewsHead}>
                  <h2 className={styles.sectionTitle}>{t('pd_description')}</h2>
                  {property.description && (
                    <Button variant="secondary" onClick={handleTranslateDescription} disabled={translating}>
                      {translating
                        ? t('pd_translating')
                        : translatedDesc
                          ? t('pd_show_original')
                          : t('pd_translate').replace('{lang}', lang === 'tr' ? 'EN' : 'TR')}
                    </Button>
                  )}
                </div>
                <p className={styles.description}>{translatedDesc ? translatedDesc.description : property.description}</p>
              </section>

              {/* Reviews */}
              <section id="reviews" className={styles.section}>
                <div className={styles.reviewsHead}>
                  <h2 className={styles.sectionTitle}>{t('pd_reviews_count').replace('{count}', String(reviews.length))}</h2>
                  {!showReviewForm && user?.role !== 'agent' && (
                    <Button variant="secondary" onClick={() => setShowReviewForm(true)}>
                      {t('rf_write_review')}
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
                    {t('pd_book')}
                  </Button>
                  <Button variant={isSaved ? "primary" : "secondary"} size="lg" fullWidth onClick={handleSave}>
                    <Heart size={18} aria-hidden="true" className={styles.heartIcon} /> {isSaved ? t('pd_saved') : t('pd_save_wishlist')}
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
              <h2 className={styles.sectionTitle}>{t('pd_similar')}</h2>
              <Link href={`/search?house_type=${encodeURIComponent(property.house_type)}`} className={styles.seeAll}>
                {t('pd_see_all')}
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
                  type={prop.house_type || t('common_unknown')}
                  bedrooms={parseInt(prop.house_type?.split('+')[0]) || 1}
                  bathrooms={1}
                  images={prop.photos && prop.photos.length > 0 ? (prop.photos.map((p: { url: string }) => mediaUrl(p.url)).filter(Boolean) as string[]) : ['/images/listing-placeholder.svg']}
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
          <span className={styles.bottomPer}>{t('per_month')}</span>
        </div>
        <div className={styles.bottomActions}>
          <button className={`${styles.bottomSave} ${isSaved ? styles.bottomSaveSaved : ''}`} onClick={handleSave} aria-label={t('pd_save_wishlist')}>
            <Heart size={19} aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button className={styles.bottomBook} onClick={() => setShowBookingModal(true)}>
            {t('pd_book')}
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} title={t('pd_booking_title')}>
        <div className={styles.modalBody}>
          <p className={styles.modalText}>{t('pd_booking_desc').replace('{title}', property.title)}</p>
          <p className={styles.modalTextSecondary}>{t('pd_booking_desc2')}</p>
          <Button variant="primary" fullWidth onClick={handleBookingSubmit}>
            {t('pd_confirm_booking')}
          </Button>
        </div>
      </Modal>

      {/* Roommate Prompt Modal */}
      <Modal isOpen={showRoommatePrompt} onClose={() => setShowRoommatePrompt(false)} title={t('pd_roommate_prompt')}>
        <div className={styles.modalBodyCenter}>
          <div className={styles.modalSection}>
            <Heart size={48} color="var(--favorite)" aria-hidden="true" className={styles.roommateHeart} />
            <h3 className={styles.modalTitle}>{t('pd_split_rent')}</h3>
            <p className={styles.modalTextMuted}>{t('pd_split_rent_desc')}</p>
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" fullWidth onClick={() => setShowRoommatePrompt(false)}>
              {t('pd_no_thanks')}
            </Button>
            <Button variant="primary" fullWidth onClick={() => {
              setShowRoommatePrompt(false);
              setShowRoommateForm(true);
            }}>
              {t('pd_yes_roommate')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Roommate Form Modal */}
      <Modal isOpen={showRoommateForm} onClose={() => setShowRoommateForm(false)} title={t('pd_create_roommate')}>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>{t('pd_budget_label')}</label>
            <Input 
              type="number" 
              name="budget" 
              placeholder={t('pd_budget_placeholder')} 
              value={roommateData.budget} 
              onChange={handleRoommateChange} 
            />
          </div>
          <div className={styles.modalSection}>
            <label className={styles.fieldLabel}>{t('pd_bio_label')}</label>
            <textarea 
              name="bio" 
              placeholder={t('pd_bio_placeholder')} 
              value={roommateData.bio} 
              onChange={handleRoommateChange}
              className={styles.roommateTextarea}
            />
          </div>
          <Button variant="primary" fullWidth onClick={handleRoommateSubmit}>
            {t('pd_post_roommate')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
