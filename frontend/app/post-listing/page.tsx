'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, MapPin, Calculator, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { BackButton } from '@/components/ui/BackButton';
import styles from './PostListingPage.module.css';
import { apiRequest } from '@/lib/api';

export default function PostListingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [price, setPrice] = useState(500);
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
                  <span style={{ fontSize: '0.875rem' }}>PNG, JPG, WEBP (max 10MB per image)</span>
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
              <input id="listingTitle" type="text" className={styles.input} placeholder="e.g. Modern 2+1 near EMU" />
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
                <label className={styles.label}>Monthly Rent (£)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Type</label>
                <select id="listingType" className={styles.input}>
                  <option value="1+0">Studio (1+0)</option>
                  <option value="1+1">1+1</option>
                  <option value="2+1">2+1</option>
                  <option value="3+1">3+1</option>
                  <option value="4+1">4+1</option>
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
                <label className={styles.label}>Deposit (Months)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(Number(e.target.value))}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Commission (Months)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={commissionMonths}
                  onChange={(e) => setCommissionMonths(Number(e.target.value))}
                />
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
            <div className={styles.previewTitle}>
              <Calculator size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/>
              Move-in Cost Preview
            </div>
            
            <div className={styles.previewRow}>
              <span>Upfront Rent ({upfrontMonths}x)</span>
              <span>£{upfront}</span>
            </div>
            <div className={styles.previewRow}>
              <span>Deposit ({depositMonths}x)</span>
              <span>£{deposit}</span>
            </div>
            <div className={styles.previewRow}>
              <span>Agency Commission ({commissionMonths}x)</span>
              <span>£{commission}</span>
            </div>
            
            <div className={`${styles.previewRow} ${styles.total}`}>
              <span>Total Move-in Cost</span>
              <span>£{totalMoveIn}</span>
            </div>

            <button 
              className={styles.submitBtn} 
              disabled={isPublishing}
              onClick={async () => {
                try {
                  setIsPublishing(true);
                  const title = (document.getElementById('listingTitle') as HTMLInputElement).value || 'New Property';
                  const house_type = (document.getElementById('listingType') as HTMLSelectElement).value;

                  const payload = {
                    title,
                    description,
                    price,
                    house_type,
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
                marginTop: '1rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                color: publishMessage.type === 'success' ? '#15803d' : '#b91c1c',
                backgroundColor: publishMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                borderRadius: '0.5rem',
                border: `1px solid ${publishMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                textAlign: 'center'
              }}>
                {publishMessage.text}
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
              By publishing, you agree to our Verified Agent terms.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
