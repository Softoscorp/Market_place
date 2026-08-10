'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  List, 
  Users, 
  Settings, 
  Eye, 
  MessageSquare, 
  MousePointerClick,
  Plus,
  Building2,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { apiRequest, mediaUrl } from '@/lib/api';
import { BrandedAvatar } from '@/components/ui/BrandedAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { AgentVerification } from '@/components/AgentVerification';
import { isOnline, lastSeenText } from '@/lib/timeAgo';
import Link from 'next/link';
import styles from './Dashboard.module.css';

interface RealListing {
  id: string | number;
  title: string;
  house_type: string;
  price: number;
  status?: string;
  agent?: { id: number; name: string };
}

export default function AgentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openChat, conversations, fetchConversations } = useChatStore();
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('overview');

  const [agentListings, setAgentListings] = useState<RealListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'agent') {
      router.push('/signup');
      return;
    }

    // Fetch agent listings specifically for this agent
    apiRequest(`/listings?agent_id=${user.id}`, { auth: false })
      .then((data) => {
        const items: RealListing[] = data.items || [];
        setAgentListings(items);
      })
      .catch(() => setAgentListings([]))
      .finally(() => setLoadingListings(false));
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'agent') {
    return <div className={styles.loaderContainer}><div className={styles.loader}></div></div>;
  }

  const conversationList = Object.values(conversations);

  const respondRateStr = user?.respond_rate != null 
    ? `${user.respond_rate}%`
    : '0%';

  const metrics = [
    { labelKey: 'ad_total_views', value: '0', change: '0%', icon: Eye, trend: 'neutral' },
    { labelKey: 'ad_active_listings', value: String(agentListings.length), change: '0%', icon: List, trend: 'neutral' },
    { labelKey: 'ad_messages', value: String(conversationList.length), change: '0%', icon: MessageSquare, trend: 'neutral' },
    { labelKey: 'ad_respond_rate', value: respondRateStr, change: '0%', icon: MousePointerClick, trend: 'neutral' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.overviewTab}
          >
            <div className={styles.metricsGrid}>
              {metrics.map((metric, idx) => (
                <div key={idx} className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>{t(metric.labelKey)}</span>
                    <metric.icon size={18} className={styles.metricIcon} />
                  </div>
                  <div className={styles.metricValue}>{metric.value}</div>
                  <div className={`${styles.metricChange} ${styles[metric.trend]}`}>
                    {t('ad_from_last_month').replace('{change}', metric.change)}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.recentActivity}>
              <h3 className={styles.sectionTitle}>{t('ad_recent_activity')}</h3>
              <div className={styles.activityList}>
                {conversationList.length > 0 ? (
                  conversationList.map((conv) => (
                    <div key={conv.contact.id} className={styles.activityItem}>
                      <div className={styles.activityDot} style={{ background: 'var(--success)' }}></div>
                      <div className={styles.activityText}>
                        <strong>{conv.contact.name}</strong> {t('ad_activity_msg')}
                      </div>
                      <div className={styles.activityTime}>{t('ad_active')}</div>
                    </div>
                  ))
                ) : (
                  <div className={styles.activityItem}>
                    <div className={styles.activityDot} style={{ background: 'var(--text-muted)' }}></div>
                    <div className={styles.activityText}>{t('ad_no_activity')}</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 'listings':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.listingsTab}
          >
            <div className={styles.tabHeader}>
              <h3 className={styles.sectionTitle}>{t('ad_manage_listings')}</h3>
              <Link href="/post-listing" className={styles.btnPrimary}>
                <Plus size={16} /> {t('ad_new_listing')}
              </Link>
            </div>

            {loadingListings ? (
              <p style={{ padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>{t('ad_loading_listings')}</p>
            ) : agentListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-12)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                marginTop: 'var(--space-4)'
              }}>
                <Building2 size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }} />
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--text-primary)' }}>{t('ad_no_listings')}</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>
                  {t('ad_no_listings_sub')}
                </p>
                <Link href="/post-listing" className={styles.btnPrimary} style={{ display: 'inline-flex' }}>
                  <Plus size={16} /> {t('ad_create_first')}
                </Link>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t('ad_col_title')}</th>
                      <th>{t('ad_col_type')}</th>
                      <th>{t('ad_col_price')}</th>
                      <th>{t('ad_col_status')}</th>
                      <th>{t('ad_col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentListings.map((listing) => (
                      <tr key={listing.id}>
                        <td className={styles.fw500}>{listing.title}</td>
                        <td>{listing.house_type}</td>
                        <td>£{listing.price}{t('per_month')}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles.active}`}>
                            {t('ad_active')}
                          </span>
                        </td>
                        <td>
                          <Link href={`/property/${listing.id}`} style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                            {t('ad_view_listing')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        );

      case 'crm':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.crmTab}
          >
            <h3 className={styles.sectionTitle}>{t('ad_crm')}</h3>
            {conversationList.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-12)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                marginTop: 'var(--space-4)'
              }}>
                <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }} />
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--text-primary)' }}>{t('ad_no_leads')}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
                  {t('ad_no_leads_sub')}
                </p>
              </div>
            ) : (
              <div className={styles.crmGrid}>
                {conversationList.map((conv) => (
                  <div key={conv.contact.id} className={styles.crmCard}>
                    <div className={styles.crmCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <BrandedAvatar 
                          src={conv.contact.avatarUrl ? mediaUrl(conv.contact.avatarUrl) : null}
                          name={conv.contact.name || t('common_user')} 
                          size={40}
                          style={{ borderRadius: '50%' }}
                        />
                        <span className={styles.clientName}>{conv.contact.name}</span>
                      </div>
                      <span className={styles.leadBadge}>{t('ad_active_contact')}</span>
                    </div>
                    <button 
                      className={styles.btnSecondary}
                      onClick={() => openChat(conv.contact)}
                    >
                      <MessageSquare size={14} /> {t('ad_resume_chat')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.settingsTab}
          >
            <div className={styles.settingsGrid}>
              <div className={styles.settingsCard}>
                <h3>{t('ad_profile_details')}</h3>
                <div className={styles.inputGroup}>
                  <label>{t('ad_full_name')}</label>
                  <input type="text" defaultValue={user?.name || ''} className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label>{t('ad_email_address')}</label>
                  <input type="email" defaultValue={user?.email || ''} className={styles.input} disabled />
                </div>
                <button className={styles.btnPrimary} style={{marginTop: 'var(--space-4)'}}>{t('ad_save_changes')}</button>
              </div>

              <div className={styles.settingsCard}>
                <h3>{t('ad_notifications')}</h3>
                <div className={styles.toggleRow}>
                  <span>{t('notification_email')}</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className={styles.toggleRow}>
                  <span>{t('notification_sms')}</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className={styles.toggleRow}>
                  <span>{t('notification_weekly')}</span>
                  <input type="checkbox" />
                </div>
              </div>

              <div className={styles.settingsCard} style={{ border: '1px solid var(--danger)' }}>
                <h3 style={{ color: 'var(--danger)' }}>{t('danger_zone')}</h3>
                <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
                  {t('deactivate_desc')}
                </p>
                <button 
                  onClick={async () => {
                    if (window.confirm(t('deactivate_confirm'))) {
                      try {
                        const { getToken } = await import('@/lib/api');
                        const token = getToken() || user?.token;
                        if (!token) return;
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/users/me/deactivate`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ reason: "Agent self-deactivated" })
                        });
                        alert(t('deactivate_success'));
                        logout();
                      } catch (e) {
                        alert(t('deactivate_error'));
                      }
                    }
                  }}
                  style={{
                    backgroundColor: 'var(--danger)',
                    color: 'var(--text-inverse)',
                    padding: 'var(--space-3) var(--space-6)',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    transition: 'background-color var(--duration-fast)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-text)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--danger)'}
                >
                  <ShieldAlert size={18} />
                  {t('deactivate_btn')}
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'verification':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AgentVerification verificationTier={user?.verification_tier || 'none'} />
          </motion.div>
        );

      default: return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>{t('agent_panel')}</h2>
          <p>{user?.name || user?.email}</p>
        </div>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} /> {t('ad_nav_overview')}
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'listings' ? styles.active : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <List size={18} /> {t('ad_nav_my_listings')}
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'crm' ? styles.active : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            <Users size={18} /> {t('ad_nav_crm')}
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} /> {t('common_settings')}
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'verification' ? styles.active : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            <ShieldAlert size={18} /> {t('common_verification')}
          </button>
          
          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-8)' }}>
            <button 
              className={styles.navItem}
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              style={{ color: 'var(--danger)' }}
            >
              <LogOut size={18} color="var(--danger)" /> Sign Out
            </button>
          </div>
        </nav>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'listings' && t('ad_nav_top_properties')}
              {activeTab === 'crm' && t('ad_nav_top_crm')}
              {activeTab === 'settings' && t('ad_nav_top_settings')}
              {activeTab === 'verification' && t('ad_nav_top_verification')}
            </h1>
            <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {user?.name || user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 500, color: isOnline(user?.last_seen_at) ? 'var(--success)' : 'var(--text-secondary)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOnline(user?.last_seen_at) ? 'var(--success)' : 'var(--text-secondary)' }} />
              {(() => { const ls = lastSeenText(user?.last_seen_at); return t(ls.key, ls.params); })()}
            </div>
            
            <VerifiedBadge tier={user?.verification_tier || 'none'} />
          </div>
        </div>
        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
