'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  List, 
  Users, 
  Settings, 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  MousePointerClick,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Pause
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { PremiumIcon } from '@/components/ui/PremiumIcon';
import Link from 'next/link';
import styles from './Dashboard.module.css';

const MOCK_METRICS = [
  { label: 'Total Views', value: '12,450', change: '+14%', icon: Eye, trend: 'up' },
  { label: 'Active Listings', value: '8', change: '0%', icon: List, trend: 'neutral' },
  { label: 'New Messages', value: '34', change: '+5%', icon: MessageSquare, trend: 'up' },
  { label: 'Click Rate', value: '4.2%', change: '-1%', icon: MousePointerClick, trend: 'down' },
];

const MOCK_LISTINGS = [
  { id: '1', title: 'Modern Studio near EMU', type: 'Studio', price: '£350', status: 'Active', views: 1205 },
  { id: '2', title: 'Luxury 2+1 Penthouse', type: '2+1', price: '£800', status: 'Active', views: 3420 },
  { id: '3', title: 'Affordable 1+1 City Center', type: '1+1', price: '£400', status: 'Paused', views: 890 },
];

const MOCK_CRM = [
  { id: 'c1', name: 'Alex Johnson', budget: '£400', status: 'Hot Lead', lastContact: '2 hours ago' },
  { id: 'c2', name: 'Sarah T.', budget: '£600', status: 'Negotiating', lastContact: '1 day ago' },
  { id: 'c3', name: 'Michael Chen', budget: '£350', status: 'Cold Lead', lastContact: '4 days ago' },
];

export default function AgentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { openChat } = useChatStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'agent') {
      router.push('/signup');
    } else {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated, user, router]);

  if (isCheckingAuth) return <div className={styles.loaderContainer}><div className={styles.loader}></div></div>;

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
              {MOCK_METRICS.map((metric, idx) => (
                <div key={idx} className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <metric.icon size={18} className={styles.metricIcon} />
                  </div>
                  <div className={styles.metricValue}>{metric.value}</div>
                  <div className={`${styles.metricChange} ${styles[metric.trend]}`}>
                    {metric.trend === 'up' && <TrendingUp size={14} />}
                    {metric.change} from last month
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.recentActivity}>
              <h3 className={styles.sectionTitle}>Recent Activity</h3>
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <div className={styles.activityDot} style={{ background: 'var(--success)' }}></div>
                  <div className={styles.activityText}><strong>Alex Johnson</strong> sent a message regarding <em>Modern Studio near EMU</em>.</div>
                  <div className={styles.activityTime}>2h ago</div>
                </div>
                <div className={styles.activityItem}>
                  <div className={styles.activityDot} style={{ background: 'var(--accent)' }}></div>
                  <div className={styles.activityText}>Your listing <em>Luxury 2+1 Penthouse</em> reached 3,000 views!</div>
                  <div className={styles.activityTime}>5h ago</div>
                </div>
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
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Property Title</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LISTINGS.map(listing => (
                    <tr key={listing.id}>
                      <td className={styles.fw500}>{listing.title}</td>
                      <td>{listing.type}</td>
                      <td>{listing.price}/mo</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[listing.status.toLowerCase()]}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td>{listing.views}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={styles.iconBtn} title="Edit"><Edit size={16} /></button>
                          <button className={styles.iconBtn} title="Pause"><Pause size={16} /></button>
                          <button className={styles.iconBtn} title="Delete"><Trash2 size={16} color="var(--danger)" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className={styles.crmGrid}>
              {MOCK_CRM.map(client => (
                <div key={client.id} className={styles.crmCard}>
                  <div className={styles.crmHeader}>
                    <h4>{client.name}</h4>
                    <span className={`${styles.leadBadge} ${styles[client.status.replace(' ', '').toLowerCase()]}`}>
                      {client.status}
                    </span>
                  </div>
                  <div className={styles.crmDetails}>
                    <p><strong>Budget:</strong> {client.budget}</p>
                    <p><strong>Last Contact:</strong> {client.lastContact}</p>
                  </div>
                  <button 
                    className={styles.btnSecondary} 
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={() => openChat({
                      id: client.id,
                      name: client.name,
                      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}`
                    })}
                  >
                    <MessageSquare size={14} /> Resume Chat
                  </button>
                </div>
              ))}
            </div>
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
                  <label>Full Name</label>
                  <input type="text" defaultValue={user?.name} className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Email Address</label>
                  <input type="email" defaultValue={user?.email} className={styles.input} disabled />
                </div>
                <div className={styles.inputGroup}>
                  <label>Agency Name</label>
                  <input type="text" defaultValue="Premium Properties Cyprus" className={styles.input} />
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
          <p>{user?.name}</p>
        </div>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <PremiumIcon icon={LayoutDashboard} size={14} colorVariant="primary" containerSize={24} /> Overview
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'listings' ? styles.active : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <PremiumIcon icon={List} size={14} colorVariant="primary" containerSize={24} /> My Listings
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'crm' ? styles.active : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            <PremiumIcon icon={Users} size={14} colorVariant="primary" containerSize={24} /> Client CRM
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <PremiumIcon icon={Settings} size={14} colorVariant="primary" containerSize={24} /> Settings
          </button>
        </nav>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.topbar}>
          <h1 className={styles.pageTitle}>
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'listings' && 'Properties Manager'}
            {activeTab === 'crm' && 'Client Relationships'}
            {activeTab === 'settings' && 'Account Settings'}
          </h1>
          {user?.isVerifiedAgent && (
            <div className={styles.verifiedBadge}>Verified Agent</div>
          )}
        </div>
        
        <div className={styles.contentArea}>
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
