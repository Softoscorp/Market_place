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
  Building2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { apiRequest } from '@/lib/api';
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
  const { user, isAuthenticated } = useAuthStore();
  const { openChat, conversations } = useChatStore();
  const [activeTab, setActiveTab] = useState('overview');

  const [agentListings, setAgentListings] = useState<RealListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'agent') {
      router.push('/signup');
      return;
    }

    // Fetch agent listings
    apiRequest('/listings', { auth: false })
      .then((data) => {
        const items: RealListing[] = data.items || [];
        const myings = items.filter((item) => String(item.agent?.id) === String(user?.id) || item.agent?.name === user?.name);
        setAgentListings(myings);
      })
      .catch(() => setAgentListings([]))
      .finally(() => setLoadingListings(false));
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'agent') {
    return <div className={styles.loaderContainer}><div className={styles.loader}></div></div>;
  }

  const conversationList = Object.values(conversations);

  const metrics = [
    { label: 'Total Views', value: agentListings.length > 0 ? `${agentListings.length * 150}` : '0', change: '+0%', icon: Eye, trend: 'neutral' },
    { label: 'Active Listings', value: String(agentListings.length), change: '0%', icon: List, trend: 'neutral' },
    { label: 'Messages', value: String(conversationList.length), change: '0%', icon: MessageSquare, trend: 'neutral' },
    { label: 'Click Rate', value: agentListings.length > 0 ? '4.8%' : '0%', change: '0%', icon: MousePointerClick, trend: 'neutral' },
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
                    <div className={styles.activityDot} style={{ background: '#cbd5e1' }}></div>
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
              <p style={{ padding: '2rem', color: '#64748b' }}>Loading listings...</p>
            ) : agentListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                marginTop: '1rem'
              }}>
                <Building2 size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No listings posted yet</h4>
                <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
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
                          <Link href={`/property/${listing.id}`} style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: 500 }}>
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
                padding: '3rem',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                marginTop: '1rem'
              }}>
                <Users size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>No client leads yet</h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Inquiries and messages from interested tenants will appear here.
                </p>
              </div>
            ) : (
              <div className={styles.crmGrid}>
                {conversationList.map((conv) => (
                  <div key={conv.contact.id} className={styles.crmCard}>
                    <div className={styles.crmCardHeader}>
                      <span className={styles.clientName}>{conv.contact.name}</span>
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
                <button className={styles.btnPrimary} style={{marginTop: '1rem'}}>Save Changes</button>
              </div>

              <div className={styles.settingsCard}>
                <h3>Notifications</h3>
                <div className={styles.toggleRow}>
                  <span>Email alerts for new messages</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className={styles.toggleRow}>
                  <span>SMS alerts for hot leads</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className={styles.toggleRow}>
                  <span>Weekly analytics report</span>
                  <input type="checkbox" />
                </div>
              </div>
            </div>
          </motion.div>
        );

      default: return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Agent Panel</h2>
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
        </nav>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'listings' && 'Properties Manager'}
              {activeTab === 'crm' && 'Client Relationships'}
              {activeTab === 'settings' && 'Account Settings'}
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {user?.name || user?.email}
            </p>
          </div>
          <div className={styles.verifiedBadge}>
            Verified Agent
          </div>
        </div>
        <div className={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
