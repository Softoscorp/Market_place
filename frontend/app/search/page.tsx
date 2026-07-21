'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FilterPanel } from '@/components/search/FilterPanel';
import { PropertyCard } from '@/components/property/PropertyCard';
import styles from './page.module.css';

import { mockProperties } from '@/lib/data/mock-properties';
import { mockAgents } from '@/lib/data/mock-agents';


export default function SearchPage() {
  return (
    <div className={styles.page}>
      <motion.div 
        className={styles.searchHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className={`container ${styles.headerContent}`}>
          <h1 className={styles.title}>
            Search Results <span>({mockProperties.length} properties)</span>
          </h1>
          <div className={styles.sortOptions}>
            <select className={styles.sortSelect} defaultValue="recommended">
              <option value="recommended">Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.main 
        className="container section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className={styles.content}>
          <aside className={styles.sidebar}>
            <FilterPanel />
          </aside>
          
          <div className={styles.results}>
            <div className={styles.grid}>
              {mockProperties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  id={prop.id}
                  title={prop.title}
                  location={`${prop.neighborhood}, ${prop.city}`}
                  price={prop.price}
                  currency={prop.currency}
                  type={prop.type}
                  bedrooms={prop.bedrooms}
                  bathrooms={prop.bathrooms}
                  images={prop.imageUrls.length > 0 ? prop.imageUrls : ['/images/placeholder-studio.jpg']}
                  sizeSqf={prop.squareMeters}
                  moveInCost={prop.price * (prop.depositMonths + prop.commissionMonths + 1)}
                  agentRating={mockAgents.find((a) => a.id === prop.agentId)?.rating}
                  agentName={mockAgents.find((a) => a.id === prop.agentId)?.name || 'Agent'}
                  agentAvatar={mockAgents.find((a) => a.id === prop.agentId)?.avatarUrl}
                  isVerified={['Verified', 'Trusted Agent', 'Top Agent'].includes(mockAgents.find((a) => a.id === prop.agentId)?.verificationTier || '')}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
