'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './FilterPanel.module.css';

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        <h2 className={styles.title}>Filters</h2>
        <button type="button" onClick={handleReset} className={styles.resetBtn}>Reset All</button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Location</h3>
        <select 
          className={styles.select} 
          value={location} 
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">Any Region</option>
          <option value="Famagusta">Famagusta (Gazimağusa)</option>
          <option value="Kyrenia">Kyrenia (Girne)</option>
          <option value="Nicosia">Nicosia (Lefkoşa)</option>
          <option value="Iskele">Iskele (Trikomo)</option>
          <option value="Güzelyurt">Güzelyurt (Morphou)</option>
          <option value="Lefke">Lefke</option>
        </select>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Price Range (£)</h3>
        <div className={styles.priceRange}>
          <input 
            type="number" 
            placeholder="Min" 
            className={styles.priceInput} 
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span style={{ color: '#8B97A8' }}>-</span>
          <input 
            type="number" 
            placeholder="Max" 
            className={styles.priceInput} 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Property Type</h3>
        <div className={styles.grid}>
          {['Studio', '1+1', '2+1', '3+1'].map((type) => (
            <label key={type} className={styles.checkboxLabel}>
              <input 
                type="radio" 
                name="houseType"
                checked={houseType === type}
                onChange={() => setHouseType(houseType === type ? '' : type)}
              /> {type}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Amenities</h3>
        <div className={styles.grid}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} /> Fully Furnished
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={generator} onChange={(e) => setGenerator(e.target.checked)} /> Generator
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} /> Pool
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={gym} onChange={(e) => setGym(e.target.checked)} /> Gym
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} /> Parking
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={petFriendly} onChange={(e) => setPetFriendly(e.target.checked)} /> Pet Friendly
          </label>
        </div>
      </div>

      <button type="button" onClick={handleApply} className={styles.applyBtn}>Apply Filters</button>
    </div>
  );
}
