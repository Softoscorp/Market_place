import React from 'react';
import styles from './FilterPanel.module.css';

export function FilterPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Filters</h2>
        <button className={styles.resetBtn}>Reset All</button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Location</h3>
        <select className={styles.select}>
          <option value="">Any Region</option>
          <option value="kyrenia">Kyrenia (Girne)</option>
          <option value="famagusta">Famagusta (Gazimağusa)</option>
          <option value="nicosia">Nicosia (Lefkoşa)</option>
          <option value="iskele">Iskele</option>
        </select>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Price Range (£)</h3>
        <div className={styles.priceRange}>
          <input type="number" placeholder="Min" className={styles.priceInput} />
          <span style={{ color: '#8B97A8' }}>-</span>
          <input type="number" placeholder="Max" className={styles.priceInput} />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Property Type</h3>
        <div className={styles.grid}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> 1+1 Apartment
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> 2+1 Apartment
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> 3+1 Apartment
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> Villa
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> Student Dorm
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> Studio
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Amenities</h3>
        <div className={styles.grid}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> Fully Furnished
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> Generator
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> Pool
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" /> Gym
          </label>
        </div>
      </div>

      <button className={styles.applyBtn}>Apply Filters</button>
    </div>
  );
}
