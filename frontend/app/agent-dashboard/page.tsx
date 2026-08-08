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
import { ProtectedImage } from '@/components/ui/ProtectedImage';
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
    { label: 'Total Views', value: '0', change: '0%', icon: Eye, trend: 'neutral' },
    { label: 'Active Listings', value: String(agentListings.length), change: '0%', icon: List, trend: 'neutral' },
    { label: 'Messages', value: String(conversationList.length), change: '0%', icon: MessageSquare, trend: 'neutral' },
    { label: 'Respond Rate', value: respondRateStr, change: '0%', icon: MousePointerClick, trend: 'neutral' },
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
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <metric.icon size={18} className={styles.metricIcon} />
                  </div>
                  <div className={styles.metricValue}>{metric.value}</div>
                  <div className={`${styles.metricChange} ${styles[metric.trend]}`}>
                    {metric.change} from last month
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.recentActivity}>
              <h3 className={styles.sectionTitle}>Recent Activity</h3>
              <div className={styles.activityList}>
                {conversationList.length > 0 ? (
                  conversationList.map((conv) => (
                    <div key={conv.contact.id} className={styles.activityItem}>
                      <div className={styles.activityDot} style={{ background: 'var(--success)' }}></div>
                      <div className={styles.activityText}>
                        <strong>{conv.contact.name}</strong> sent a message regarding listing inquiry.
                      </div>
                      <div className={styles.activityTime}>Active</div>
                    </div>
                  ))
                ) : (
                  <div className={styles.activityItem}>
                    <div className={styles.activityDot} style={{ background: 'var(--text-muted)' }}></div>
                    <div className={styles.activityText}>No recent activity yet. Post your first listing to start getting inquiries.</div>
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
              <h3 className={styles.sectionTitle}>Manage Listings</h3>
              <Link href="/post-listing" className={styles.btnPrimary}>
                <Plus size={16} /> New Listing
              </Link>
            </div>

            {loadingListings ? (
              <p style={{ padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>Loading listings...</p>
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
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--text-primary)' }}>No listings posted yet</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>
                  Post your properties to showcase them to thousands of students and tenants in North Cyprus.
                </p>
                <Link href="/post-listing" className={styles.btnPrimary} style={{ display: 'inline-flex' }}>
                  <Plus size={16} /> Create First Listing
                </Link>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Property Title</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentListings.map((listing) => (
                      <tr key={listing.id}>
                        <td className={styles.fw500}>{listing.title}</td>
                        <td>{listing.house_type}</td>
                        <td>£{listing.price}/mo</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles.active}`}>
                            Active
                          </span>
                        </td>
                        <td>
                          <Link href={`/property/${listing.id}`} style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                            View Listing
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
            <h3 className={styles.sectionTitle}>Client CRM (Leads)</h3>
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
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--text-primary)' }}>No client leads yet</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
                  Inquiries and messages from interested tenants will appear here.
                </p>
              </div>
            ) : (
              <div className={styles.crmGrid}>
                {conversationList.map((conv) => (
                  <div key={conv.contact.id} className={styles.crmCard}>
                    <div className={styles.crmCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <ProtectedImage 
                          src={(conv.contact.avatarUrl ? mediaUrl(conv.contact.avatarUrl) : '') || ''}
                          fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(conv.contact.name || 'User')}&background=0F172A&color=fff&size=128&bold=true`}
                          alt={conv.contact.name || 'User'} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span className={styles.clientName}>{conv.contact.name}</span>
                      </div>
                      <span className={styles.leadBadge}>Active Contact</span>
                    </div>
                    <button 
                      className={styles.btnSecondary}
                      onClick={() => openChat(conv.contact)}
                    >
                      <MessageSquare size={14} /> Resume Chat
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
                <h3>Profile Details</h3>
                <div className={styles.inputGroup}>
                  <label>Full Name / Agency Name</label>
                  <input type="text" defaultValue={user?.name || ''} className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Email Address</label>
                  <input type="email" defaultValue={user?.email || ''} className={styles.input} disabled />
                </div>
                <button className={styles.btnPrimary} style={{marginTop: 'var(--space-4)'}}>Save Changes</button>
              </div>

              <div className={styles.settingsCard}>
                <h3>Notifications</h3>
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
            <LayoutDashboard size={18} /> Overview
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'listings' ? styles.active : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <List size={18} /> My Listings
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'crm' ? styles.active : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            <Users size={18} /> Client CRM
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} /> Settings
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'verification' ? styles.active : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            <ShieldAlert size={18} /> Verification
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
              {activeTab === 'listings' && 'Properties Manager'}
              {activeTab === 'crm' && 'Client CRM'}
              {activeTab === 'settings' && 'Account Settings'}
              {activeTab === 'verification' && 'Trust & Verification'}
            </h1>
            <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {user?.name || user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 500, color: isOnline(user?.last_seen_at) ? 'var(--success)' : 'var(--text-secondary)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOnline(user?.last_seen_at) ? 'var(--success)' : 'var(--text-secondary)' }} />
              {lastSeenText(user?.last_seen_at)}
            </div>
            
            <VerifiedBadge tier={user?.verification_tier || 'none'} label />
          </div>
        </div>
        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
