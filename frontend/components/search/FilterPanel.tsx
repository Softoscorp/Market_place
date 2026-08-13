'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './FilterPanel.module.css';

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useLanguageStore((s) => s.t);

  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [houseType, setHouseType] = useState(searchParams.get('house_type') || '');
  
  // Amenities
  const [furnished, setFurnished] = useState(searchParams.get('furnished') === 'true');
  const [generator, setGenerator] = useState(searchParams.get('generator') === 'true');
  const [pool, setPool] = useState(searchParams.get('pool') === 'true');
  const [gym, setGym] = useState(searchParams.get('gym') === 'true');
  const [parking, setParking] = useState(searchParams.get('parking') === 'true');
  const [petFriendly, setPetFriendly] = useState(searchParams.get('pet_friendly') === 'true');

  const [prevParams, setPrevParams] = useState(searchParams.toString());

  if (searchParams.toString() !== prevParams) {
    setPrevParams(searchParams.toString());
    setLocation(searchParams.get('location') || '');
    setMinPrice(searchParams.get('min_price') || '');
    setMaxPrice(searchParams.get('max_price') || '');
    setHouseType(searchParams.get('house_type') || '');
    setFurnished(searchParams.get('furnished') === 'true');
    setGenerator(searchParams.get('generator') === 'true');
    setPool(searchParams.get('pool') === 'true');
    setGym(searchParams.get('gym') === 'true');
    setParking(searchParams.get('parking') === 'true');
    setPetFriendly(searchParams.get('pet_friendly') === 'true');
  }

  const handleApply = () => {
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) params.set('q', q);

    if (location) params.set('location', location);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (houseType) params.set('house_type', houseType);

    if (furnished) params.set('furnished', 'true');
    if (generator) params.set('generator', 'true');
    if (pool) params.set('pool', 'true');
    if (gym) params.set('gym', 'true');
    if (parking) params.set('parking', 'true');
    if (petFriendly) params.set('pet_friendly', 'true');

    router.push(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setHouseType('');
    setFurnished(false);
    setGenerator(false);
    setPool(false);
    setGym(false);
    setParking(false);
    setPetFriendly(false);
    router.push('/search');
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('show_filters')}</h2>
        <button type="button" onClick={handleReset} className={styles.resetBtn}>{t('fp_reset_all')}</button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('fp_location')}</h3>
        <select 
          className={styles.select} 
          value={location} 
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">{t('fp_any_region')}</option>
          <option value="Famagusta">Famagusta (Gazimağusa)</option>
          <option value="Kyrenia">Kyrenia (Girne)</option>
          <option value="Nicosia">Nicosia (Lefkoşa)</option>
          <option value="Iskele">Iskele (Trikomo)</option>
          <option value="Güzelyurt">Güzelyurt (Morphou)</option>
          <option value="Lefke">Lefke</option>
        </select>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('fp_monthly_rent')}</h3>
        <div className={styles.priceRange}>
          <input 
            type="number" 
            placeholder={t('fp_min')} 
            className={styles.priceInput} 
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className={styles.dash}>-</span>
          <input 
            type="number" 
            placeholder={t('fp_max')} 
            className={styles.priceInput} 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('fp_property_type')}</h3>
        <div className={styles.grid}>
          {[{ value: '1+0', label: t('prf_studio') }, { value: '1+1', label: '1+1' }, { value: '2+1', label: '2+1' }, { value: '3+1', label: '3+1' }, { value: '4+1', label: '4+1' }, { value: '5+1', label: '5+1' }, { value: '6+1', label: '6+1' }].map((type) => (
            <label key={type.value} className={styles.checkboxLabel}>
              <input 
                type="radio" 
                name="houseType"
                checked={houseType === type.value}
                onChange={() => setHouseType(houseType === type.value ? '' : type.value)}
              /> {type.label}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('fp_amenities')}</h3>
        <div className={styles.grid}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} /> {t('fp_fully_furnished')}
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={generator} onChange={(e) => setGenerator(e.target.checked)} /> {t('fp_generator')}
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} /> {t('fp_pool')}
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={gym} onChange={(e) => setGym(e.target.checked)} /> {t('fp_gym')}
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} /> {t('fp_parking')}
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={petFriendly} onChange={(e) => setPetFriendly(e.target.checked)} /> {t('fp_pet_friendly')}
          </label>
        </div>
      </div>

      <button type="button" onClick={handleApply} className={styles.applyBtn}>{t('fp_apply')}</button>
    </div>
  );
}
