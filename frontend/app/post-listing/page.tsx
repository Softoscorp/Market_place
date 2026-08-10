'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, MapPin, Calculator, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { BackButton } from '@/components/ui/BackButton';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BrandedAvatar } from '@/components/ui/BrandedAvatar';
import styles from './PostListingPage.module.css';
import { apiRequest, mediaUrl } from '@/lib/api';

export default function PostListingPage() {
  const router = useRouter();
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
          <h1 className={styles.title}>Post a New Listing</h1>
          <p className={styles.subtitle}>Upload photos and details for your property.</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Property Images</label>
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
                  <strong>Click to upload</strong> or drag and drop<br/>
                  <span style={{ fontSize: 'var(--text-sm)' }}>PNG, JPG, WEBP (max 10MB per image)</span>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className={styles.imagePreviewsGrid}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className={styles.previewThumbWrapper}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Preview ${idx}`} className={styles.previewThumb} />
                      <button 
                        type="button" 
                        className={styles.removeThumbBtn} 
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx);
                        }}
                        aria-label="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Listing Title</label>
              <input id="listingTitle" type="text" className={styles.input} placeholder="e.g. Modern 2+1 near EMU" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Description</label>
              <textarea 
                className={styles.input} 
                style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the property..."
              />
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Monthly Rent</label>
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
                <label className={styles.label}>Type</label>
                <select id="listingType" className={styles.input} value={houseType} onChange={(e) => setHouseType(e.target.value)}>
                  <option value="1+0">Studio (1+0)</option>
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
              <label className={styles.label}>Distance to University (km)</label>
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
                <label className={styles.label}>Upfront Rent (Months)</label>
                <select 
                  className={styles.input}
                  value={upfrontMonths}
                  onChange={(e) => setUpfrontMonths(Number(e.target.value))}
                >
                  <option value={1}>1 Month (Standard)</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months (Yearly)</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Deposit</label>
                <select 
                  className={styles.input}
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(Number(e.target.value))}
                >
                  <option value={0}>No Deposit</option>
                  <option value={1}>1 Month Rent</option>
                  <option value={2}>2 Months Rent</option>
                  <option value={3}>3 Months Rent</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Agency Commission</label>
                <select 
                  className={styles.input}
                  value={commissionMonths}
                  onChange={(e) => setCommissionMonths(Number(e.target.value))}
                >
                  <option value={0}>No Commission</option>
                  <option value={0.5}>Half Month Rent (50%)</option>
                  <option value={1}>1 Month Rent (100%)</option>
                  <option value={2}>2 Months Rent</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Location / Region</label>
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
              <label className={styles.label}>Property Amenities</label>
              <div className={styles.amenitiesGrid}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
                  Fully Furnished
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={generator} onChange={(e) => setGenerator(e.target.checked)} />
                  Generator
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} />
                  Pool
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={gym} onChange={(e) => setGym(e.target.checked)} />
                  Gym
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} />
                  Parking
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={petFriendly} onChange={(e) => setPetFriendly(e.target.checked)} />
                  Pet Friendly
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
                <div className={styles.agentSub}>Posting as agent</div>
              </div>
            </div>

            <div className={styles.previewCard}>
              <div className={styles.previewCardImg}>
                {previewUrls.length > 0 ? (
                  <img src={previewUrls[0]} alt="Listing preview" className={styles.previewCardImgEl} />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src="/images/listing-placeholder.svg" alt="Listing preview" className={styles.previewCardImgEl} />
                )}
                <div className={styles.previewCardScrim} />
                <span className={styles.previewType}>{houseType}</span>
                <div className={styles.previewPrice}>
                  <span className={styles.previewPriceAmt}>{currency}{price}</span>
                  <span className={styles.previewPricePer}>/mo</span>
                </div>
              </div>
              <div className={styles.previewCardInfo}>
                <div className={styles.previewCardTitle}>{title || 'Your listing title'}</div>
                <div className={styles.previewCardLoc}>
                  <MapPin size={13} /> {location}
                  {distanceToUni > 0 && <span> · {distanceToUni}km to uni</span>}
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
                    <span className={styles.previewTermLabel}>Move-in</span>
                    <span className={styles.previewTermValue}>{currency}{totalMoveIn}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.previewTitle}>
              <Calculator size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/>
              Move-in Cost Preview
            </div>
            
            <div className={styles.summaryItem}>
              <span>Upfront Rent</span>
              <span>{currency}{upfront}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Deposit</span>
              <span>{currency}{deposit}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Agency Commission</span>
              <span>{currency}{commission}</span>
            </div>
            
            <div className={styles.summaryItem}>
              <span>Total Move-in Cost</span>
              <span>{currency}{totalMoveIn}</span>
            </div>

            <button 
              className={styles.submitBtn} 
              disabled={isPublishing}
              onClick={async () => {
                try {
                  setIsPublishing(true);
                  const title = (document.getElementById('listingTitle') as HTMLInputElement).value || 'New Property';

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

                  setPublishMessage({ text: 'Listing published successfully! Redirecting...', type: 'success' });
                  setTimeout(() => router.push('/property/' + res.id), 1500);
                } catch (err: unknown) {
                  const error = err as Error;
                  setPublishMessage({ text: error.message || 'Failed to post listing', type: 'error' });
                } finally {
                  setIsPublishing(false);
                }
              }}
            >
              {isPublishing ? 'Publishing...' : 'Publish Listing'}
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
              By publishing, you agree to our Verified Agent terms.
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
