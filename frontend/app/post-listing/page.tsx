'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, MapPin, Calculator, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { BackButton } from '@/components/ui/BackButton';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BrandedAvatar } from '@/components/ui/BrandedAvatar';
import styles from './PostListingPage.module.css';
import { apiRequest, mediaUrl } from '@/lib/api';

export default function PostListingPage() {
  const router = useRouter();
  const t = useLanguageStore((s) => s.t);
  const { user, isAuthenticated } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(500);
  const [currency, setCurrency] = useState("£");
  const [houseType, setHouseType] = useState('1+1');
  const [upfrontMonths, setUpfrontMonths] = useState(1);
  const [depositMonths, setDepositMonths] = useState(2);
  const [commissionMonths, setCommissionMonths] = useState(1);
  const [location, setLocation] = useState('Famagusta');
  const [distanceToUni, setDistanceToUni] = useState(1.5);
  const [description, setDescription] = useState('');

  // Amenities
  const [furnished, setFurnished] = useState(true);
  const [generator, setGenerator] = useState(false);
  const [pool, setPool] = useState(false);
  const [gym, setGym] = useState(false);
  const [parking, setParking] = useState(true);
  const [petFriendly, setPetFriendly] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [publishMessage, setPublishMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Basic auth guard
    let timeout: NodeJS.Timeout;
    if (!isAuthenticated || user?.role !== 'agent') {
      router.push('/signup');
    } else {
      timeout = setTimeout(() => setIsCheckingAuth(false), 0);
    }
    return () => clearTimeout(timeout);
  }, [isAuthenticated, user, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
      const newUrls = filesArr.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const removePhoto = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  if (isCheckingAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  const upfront = price * upfrontMonths;
  const deposit = price * depositMonths;
  const commission = price * commissionMonths;
  const totalMoveIn = upfront + deposit + commission;

  return (
    <div className={styles.container}>
      <BackButton />
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.header}>
          <h1 className={styles.title}>{t('pl_title')}</h1>
          <p className={styles.subtitle}>{t('pl_subtitle')}</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('pl_images')}</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <div 
                className={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={48} />
                <div>
                  <strong>{t('pl_upload_cta')}</strong><br/>
                  <span style={{ fontSize: 'var(--text-sm)' }}>{t('pl_upload_hint')}</span>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className={styles.imagePreviewsGrid}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className={styles.previewThumbWrapper}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={t('pl_preview').replace('{n}', String(idx))} className={styles.previewThumb} />
                      <button 
                        type="button" 
                        className={styles.removeThumbBtn} 
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx);
                        }}
                        aria-label={t('pl_remove_photo')}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('pl_listing_title')}</label>
              <input id="listingTitle" type="text" className={styles.input} placeholder={t('pl_listing_title_placeholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('pl_description')}</label>
              <textarea 
                className={styles.input} 
                style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('pl_description_placeholder')}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t('pl_monthly_rent')}</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <select 
                    className={styles.input}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{ width: '80px', flexShrink: 0 }}
                  >
                    <option value="£">£</option>
                    <option value="$">$</option>
                    <option value="₺">₺</option>
                  </select>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    style={{ flexGrow: 1 }}
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t('pl_type')}</label>
                <select id="listingType" className={styles.input} value={houseType} onChange={(e) => setHouseType(e.target.value)}>
                  <option value="1+0">{t('pl_studio')}</option>
                  <option value="1+1">1+1</option>
                  <option value="2+1">2+1</option>
                  <option value="3+1">3+1</option>
                  <option value="4+1">4+1</option>
                  <option value="5+1">5+1</option>
                  <option value="6+1">6+1</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('pl_distance')}</label>
              <input 
                type="number" 
                step="0.1"
                className={styles.input} 
                value={distanceToUni}
                onChange={(e) => setDistanceToUni(Number(e.target.value))}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t('pl_upfront_months')}</label>
                <select 
                  className={styles.input}
                  value={upfrontMonths}
                  onChange={(e) => setUpfrontMonths(Number(e.target.value))}
                >
                  <option value={1}>{t('pl_1month')}</option>
                  <option value={2}>{t('pl_2months')}</option>
                  <option value={3}>{t('pl_3months')}</option>
                  <option value={6}>{t('pl_6months')}</option>
                  <option value={12}>{t('pl_12months')}</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t('pl_deposit')}</label>
                <select 
                  className={styles.input}
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(Number(e.target.value))}
                >
                  <option value={0}>{t('pl_no_deposit')}</option>
                  <option value={1}>{t('pl_1mo_rent')}</option>
                  <option value={2}>{t('pl_2mo_rent')}</option>
                  <option value={3}>{t('pl_3mo_rent')}</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t('pl_commission')}</label>
                <select 
                  className={styles.input}
                  value={commissionMonths}
                  onChange={(e) => setCommissionMonths(Number(e.target.value))}
                >
                  <option value={0}>{t('pl_no_commission')}</option>
                  <option value={0.5}>{t('pl_half_rent')}</option>
                  <option value={1}>{t('pl_1mo_commission')}</option>
                  <option value={2}>{t('pl_2mo_commission')}</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('pl_location')}</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                <select 
                  className={styles.input} 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="Famagusta">Famagusta (Gazimağusa)</option>
                  <option value="Kyrenia">Kyrenia (Girne)</option>
                  <option value="Nicosia">Nicosia (Lefkoşa)</option>
                  <option value="Iskele">Iskele (Trikomo)</option>
                  <option value="Güzelyurt">Güzelyurt (Morphou)</option>
                  <option value="Lefke">Lefke</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('pl_amenities')}</label>
              <div className={styles.amenitiesGrid}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
                  {t('fp_fully_furnished')}
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={generator} onChange={(e) => setGenerator(e.target.checked)} />
                  {t('fp_generator')}
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} />
                  {t('fp_pool')}
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={gym} onChange={(e) => setGym(e.target.checked)} />
                  {t('fp_gym')}
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} />
                  {t('fp_parking')}
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={petFriendly} onChange={(e) => setPetFriendly(e.target.checked)} />
                  {t('fp_pet_friendly')}
                </label>
              </div>
            </div>
          </div>

          <div className={styles.previewSidebar}>
            {(() => {
              const agentAvatarSrc = user?.avatar_url ? mediaUrl(user.avatar_url) : null;
              return (
                <>
            <div className={styles.agentHeader}>
              <div className={styles.agentAvatar}>
                <BrandedAvatar
                  src={agentAvatarSrc}
                  name={user?.name || 'Agent'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                />
              </div>
              <div className={styles.agentInfo}>
                <div className={styles.agentName}>
                  {user?.name || 'Agent'}
                  <VerifiedBadge tier={user?.verification_tier || 'none'} />
                </div>
                <div className={styles.agentSub}>{t('pl_agent_sidebar')}</div>
              </div>
            </div>

            <div className={styles.previewCard}>
              <div className={styles.previewCardImg}>
                {previewUrls.length > 0 ? (
                  <img src={previewUrls[0]} alt={t('pl_listing_preview')} className={styles.previewCardImgEl} />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src="/images/listing-placeholder.svg" alt={t('pl_listing_preview')} className={styles.previewCardImgEl} />
                )}
                <div className={styles.previewCardScrim} />
                <span className={styles.previewType}>{houseType}</span>
                <div className={styles.previewPrice}>
                  <span className={styles.previewPriceAmt}>{currency}{price}</span>
                  <span className={styles.previewPricePer}>{t('per_month')}</span>
                </div>
              </div>
              <div className={styles.previewCardInfo}>
                <div className={styles.previewCardTitle}>{title || t('pl_preview_title')}</div>
                <div className={styles.previewCardLoc}>
                  <MapPin size={13} /> {location}
                  {distanceToUni > 0 && <span> · {t('pl_km_uni').replace('{km}', String(distanceToUni))}</span>}
                </div>
                <div className={styles.previewCardFooter}>
                  <div className={styles.previewAgent}>
                    <div className={styles.previewAgentAvatar}>
                      <BrandedAvatar
                        src={agentAvatarSrc}
                        name={user?.name || 'Agent'}
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                      />
                    </div>
                    <span>{user?.name?.split(' ')[0] || 'Agent'}</span>
                    <VerifiedBadge tier={user?.verification_tier || 'none'} size="sm" />
                  </div>
                  <div className={styles.previewTerm}>
                    <span className={styles.previewTermLabel}>{t('prop_move_in')}</span>
                    <span className={styles.previewTermValue}>{currency}{totalMoveIn}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.previewTitle}>
              <Calculator size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/>
              {t('pl_move_in_cost')}
            </div>
            
            <div className={styles.summaryItem}>
              <span>{t('pl_upfront_rent')}</span>
              <span>{currency}{upfront}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>{t('pl_deposit')}</span>
              <span>{currency}{deposit}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>{t('pl_commission')}</span>
              <span>{currency}{commission}</span>
            </div>
            
            <div className={styles.summaryItem}>
              <span>{t('pl_total_move_in')}</span>
              <span>{currency}{totalMoveIn}</span>
            </div>

            <button 
              className={styles.submitBtn} 
              disabled={isPublishing}
              onClick={async () => {
                try {
                  setIsPublishing(true);
                  const title = (document.getElementById('listingTitle') as HTMLInputElement).value || t('pl_new_property');

                  const payload = {
                    title,
                    description,
                    price,
                    currency,
                    house_type: houseType,
                    location,
                    upfront_rent_months: upfrontMonths,
                    deposit_months: depositMonths,
                    commission_months: commissionMonths,
                    distance_to_university: distanceToUni,
                    furnished,
                    generator,
                    pool,
                    gym,
                    parking,
                    pet_friendly: petFriendly
                  };
                  
                  // 1. Post listing
                  const res = await apiRequest('/listings', { method: 'POST', body: payload });

                  // 2. Upload photos if selected
                  if (selectedFiles.length > 0 && res.id) {
                    for (const file of selectedFiles) {
                      const formData = new FormData();
                      formData.append('file', file);
                      await apiRequest(`/listings/${res.id}/photos`, {
                        method: 'POST',
                        formData,
                      });
                    }
                  }

                  setPublishMessage({ text: t('pl_published'), type: 'success' });
                  setTimeout(() => router.push('/property/' + res.id), 1500);
                } catch (err: unknown) {
                  const error = err as Error;
                  setPublishMessage({ text: error.message || t('pl_failed'), type: 'error' });
                } finally {
                  setIsPublishing(false);
                }
              }}
            >
              {isPublishing ? t('pl_publishing') : t('pl_publish')}
            </button>
            {publishMessage && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
                color: publishMessage.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
                backgroundColor: publishMessage.type === 'success' ? 'var(--success-muted)' : 'var(--danger-muted)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${publishMessage.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
                textAlign: 'center'
              }}>
                {publishMessage.text}
              </div>
            )}
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
              {t('pl_agree')}
            </p>
                </>
              );
            })()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
