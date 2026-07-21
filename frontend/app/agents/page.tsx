'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AgentCard } from '@/components/agent/AgentCard';
import styles from './AgentsPage.module.css';

const MOCK_AGENTS = [
  {
    id: 1,
    name: 'Emily Davis',
    agency: 'Premium Properties Cyprus',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
    rating: 4.9,
    reviews: 124,
    activeListings: 15,
    isVerified: true
  },
  {
    id: 2,
    name: 'Michael Johnson',
    agency: 'Student Housing Hub',
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces',
    rating: 4.7,
    reviews: 89,
    activeListings: 22,
    isVerified: true
  },
  {
    id: 3,
    name: 'Sarah Wilson',
    agency: 'Kyrenia Estates',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces',
    rating: 4.8,
    reviews: 156,
    activeListings: 8,
    isVerified: true
  },
  {
    id: 4,
    name: 'David Brown',
    agency: 'Nicosia Rentals',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
    rating: 4.6,
    reviews: 64,
    activeListings: 12,
    isVerified: false
  }
];

export default function AgentsPage() {
  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className={styles.header}>
        <h1 className={styles.title}>Find a Verified Agent</h1>
        <p className={styles.subtitle}>
          Work with trusted professionals who know the North Cyprus housing market.
        </p>
      </header>

      <motion.div 
        className={styles.grid}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {MOCK_AGENTS.map((agent) => (
          <a key={agent.id} href={`/agent/${agent.id}`} className={styles.link}>
            <AgentCard
              agentId={agent.id}
              name={agent.name}
              agency={agent.agency}
              imageUrl={agent.imageUrl}
              rating={agent.rating}
              reviews={agent.reviews}
              activeListings={agent.activeListings}
              isVerified={agent.isVerified}
            />
          </a>
        ))}
      </motion.div>
    </motion.div>
  );
}
