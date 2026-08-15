'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Info, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { AgentCard } from '@/components/agent/AgentCard';
import { AgentTierModal } from '@/components/agent/AgentTierModal';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { apiRequest, mediaUrl } from '@/lib/api';
import { isOnline } from '@/lib/timeAgo';
import styles from './AgentsPage.module.css';

interface Agent {
  id: number;
  name: string;
  agency?: string;
  avatar_url?: string;
  verification_tier?: 'none' | 'local' | 'international';
  average_rating?: number;
  total_reviews?: number;
  active_listings?: number;
  respond_rate?: number;
  last_seen_at?: string | null;
}

export default function AgentsPage() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const { isAuthenticated, user } = useAuthStore();
  const { openChat } = useChatStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTierModal, setShowTierModal] = useState(false);
  const [page, setPage] = useState(1);
  const AGENTS_PER_PAGE = 6;

  useEffect(() => {
    // Show tier modal once per browser
    const hasSeenModal = localStorage.getItem('hasSeenAgentTiers');
    if (!hasSeenModal) {
      // Delay it slightly so it pops up smoothly after initial load
      const t = setTimeout(() => {
        setShowTierModal(true);
        localStorage.setItem('hasSeenAgentTiers', 'true');
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  const fetchAgents = () =>
    apiRequest('/agents', { auth: false })
      .then((data) => {
        const agentList = Array.isArray(data) ? data : [];
        
        // Sort by online status (online first)
        agentList.sort((a: Agent, b: Agent) => {
          const aOnline = isOnline(a.last_seen_at);
          const bOnline = isOnline(b.last_seen_at);
          if (aOnline && !bOnline) return -1;
          if (!aOnline && bOnline) return 1;
          return 0;
        });

        setAgents(agentList);
      })
      .catch(() => setAgents([]));

  useEffect(() => {
    // First fetch — show content fast
    fetchAgents().finally(() => setLoading(false));

    // Re-fetch after 2s so our own heartbeat ping has had time to stamp last_seen_at
    const quick = setTimeout(fetchAgents, 2000);

    // Live polling — refreshes online dots every 30s
    const poll = setInterval(fetchAgents, 30_000);

    return () => {
      clearTimeout(quick);
      clearInterval(poll);
    };
  }, []);

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t('agents_title')}</h1>
          <button 
            className={styles.infoBtn}
            onClick={() => setShowTierModal(true)}
            aria-label={t('ag_tiers_aria')}
          >
            <Info size={20} />
            <span>{t('ag_verification_tiers')}</span>
          </button>
        </div>
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
        <>
        <motion.div
          className={styles.grid}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {agents
            .slice((page - 1) * AGENTS_PER_PAGE, page * AGENTS_PER_PAGE)
            .map((agent) => (
              <AgentCard
                key={agent.id}
                agentId={agent.id}
                name={agent.name}
                agency={agent.agency ?? ''}
                imageUrl={mediaUrl(agent.avatar_url) || ''}
                rating={agent.average_rating ?? 0}
                reviews={agent.total_reviews ?? 0}
                activeListings={agent.active_listings ?? 0}
                respondRate={agent.respond_rate}
                lastSeenAt={user && String(agent.id) === String(user.id) ? (user.last_seen_at || agent.last_seen_at) : agent.last_seen_at}
                verificationTier={agent.verification_tier}
                onContact={() => {
                  if (!isAuthenticated) {
                    router.push('/login');
                    return;
                  }
                  openChat({ id: String(agent.id), name: agent.name, avatarUrl: agent.avatar_url ? mediaUrl(agent.avatar_url) || '' : '' });
                }}
              />
          ))}
        </motion.div>

        {agents.length > AGENTS_PER_PAGE && (
          <nav className={styles.pagination} aria-label={t('ag_pagination')}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label={t('ag_prev')}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.ceil(agents.length / AGENTS_PER_PAGE) }).map((_, i) => (
              <button
                key={i}
                className={`${styles.pageBtn} ${page === i + 1 ? styles.active : ''}`}
                onClick={() => setPage(i + 1)}
                aria-label={t('ag_page').replace('{n}', String(i + 1))}
              >
                {i + 1}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.min(Math.ceil(agents.length / AGENTS_PER_PAGE), p + 1))}
              disabled={page === Math.ceil(agents.length / AGENTS_PER_PAGE)}
              aria-label={t('ag_next')}
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
        </>
      )}

      <AgentTierModal 
        isOpen={showTierModal} 
        onClose={() => setShowTierModal(false)} 
      />
    </motion.div>
  );
}
