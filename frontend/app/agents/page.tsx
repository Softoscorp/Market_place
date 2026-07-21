'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { AgentCard } from '@/components/agent/AgentCard';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { apiRequest } from '@/lib/api';
import styles from './AgentsPage.module.css';

interface Agent {
  id: number;
  name: string;
  agency?: string;
  avatarUrl?: string;
  is_verified?: boolean;
  average_rating?: number;
  total_reviews?: number;
  active_listings?: number;
}

export default function AgentsPage() {
  const { t } = useLanguageStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/agents', { auth: false })
      .then((data) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className={styles.header}>
        <h1 className={styles.title}>{t('agents_title')}</h1>
        <p className={styles.subtitle}>{t('agents_sub')}</p>
      </header>

      {loading ? (
        <div className={styles.emptyState}>
          <p>{t('loading')}</p>
        </div>
      ) : agents.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} strokeWidth={1.2} />
          <h2>{t('no_agents')}</h2>
          <p>{t('no_agents_sub')}</p>
        </div>
      ) : (
        <motion.div
          className={styles.grid}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {agents.map((agent) => (
            <a key={agent.id} href={`/agent/${agent.id}`} className={styles.link}>
              <AgentCard
                agentId={agent.id}
                name={agent.name}
                agency={agent.agency ?? ''}
                imageUrl={agent.avatarUrl ?? ''}
                rating={agent.average_rating ?? 0}
                reviews={agent.total_reviews ?? 0}
                activeListings={agent.active_listings ?? 0}
                isVerified={agent.is_verified}
              />
            </a>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
