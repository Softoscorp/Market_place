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
  ShieldAlert,
  TrendingUp,
  Heart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useChatStore } from '@/lib/store/useChatStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { apiRequest, mediaUrl, deactivateAccount, releaseClaim, completeClaim, getMyListingStats } from '@/lib/api';
import { BrandedAvatar } from '@/components/ui/BrandedAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { AgentVerification } from '@/components/AgentVerification';
import { ClaimedBadge } from '@/components/claim/ClaimButton';
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

interface ListingClaim {
  target_type: string;
  target_id: number;
  claimer_name?: string | null;
  claimer_id: number;
  created_at?: string;
}

export default function AgentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openChat, conversations, fetchConversations } = useChatStore();
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('overview');

  const [agentListings, setAgentListings] = useState<RealListing[]>([]);
  const [listingClaims, setListingClaims] = useState<Record<number, ListingClaim>>({});
  const [loadingListings, setLoadingListings] = useState(true);
  const [stats, setStats] = useState<import('@/lib/api').ListingStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

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

    // Fetch agent listings specifically for this agent (including claimed ones
    // so the owner can release them).
    apiRequest(`/listings?agent_id=${user.id}&include_claimed=true`, { auth: false })
      .then((data) => {
        const items: RealListing[] = data.items || [];
        setAgentListings(items);
        return items;
      })
      .catch(() => setAgentListings([]))
      .finally(() => setLoadingListings(false));

    apiRequest('/claims/owner?target_type=listing', { auth: true })
      .then((claims: ListingClaim[]) => {
        const map: Record<number, ListingClaim> = {};
        (claims || []).forEach((c) => { map[Number(c.target_id)] = c; });
        setListingClaims(map);
      })
      .catch(() => setListingClaims({}));

    getMyListingStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [isAuthenticated, user, router]);

  const handleRelease = async (id: string | number) => {
    if (!window.confirm(t('claim_release_confirm'))) return;
    try {
      await releaseClaim('listing', Number(id));
      setListingClaims((prev) => {
        const next = { ...prev };
        delete next[Number(id)];
        return next;
      });
    } catch (err) {
      console.error(err);
      alert(t('claim_release_error'));
    }
  };

  const handleComplete = async (id: string | number) => {
    if (!window.confirm(t('claim_complete_confirm'))) return;
    try {
      await completeClaim('listing', Number(id));
      setListingClaims((prev) => {
        const next = { ...prev };
        delete next[Number(id)];
        return next;
      });
    } catch (err) {
      console.error(err);
      alert(t('claim_complete_error'));
    }
  };

  if (!isAuthenticated || user?.role !== 'agent') {
    return <div className={styles.loaderContainer}><div className={styles.loader}></div></div>;
  }

  const conversationList = Object.values(conversations);

  const metrics = [
    { labelKey: 'ad_total_views', value: stats ? String(stats.totals.views) : '…', change: '0%', icon: Eye, trend: 'neutral' },
    { labelKey: 'ad_total_clicks', value: stats ? String(stats.totals.clicks) : '…', change: '0%', icon: MousePointerClick, trend: 'neutral' },
    { labelKey: 'ad_total_saves', value: stats ? String(stats.totals.saves) : '…', change: '0%', icon: Heart, trend: 'neutral' },
    { labelKey: 'ad_total_messages', value: stats ? String(stats.totals.messages) : '…', change: '0%', icon: MessageSquare, trend: 'neutral' },
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
                      <div className={`${styles.activityDot} ${styles.activityDotSuccess}`}></div>
                      <div className={styles.activityText}>
                        <strong>{conv.contact.name}</strong> {t('ad_activity_msg')}
                      </div>
                      <div className={styles.activityTime}>{t('ad_active')}</div>
                    </div>
                  ))
                ) : (
                  <div className={styles.activityItem}>
                    <div className={`${styles.activityDot} ${styles.activityDotMuted}`}></div>
                    <div className={styles.activityText}>{t('ad_no_activity')}</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 'analytics':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.analyticsTab}
          >
            <div className={styles.tabHeader}>
              <h3 className={styles.sectionTitle}>{t('ad_analytics_title')}</h3>
            </div>

            {loadingStats ? (
              <p className={styles.loadingText}>{t('ad_loading_listings')}</p>
            ) : !stats || stats.listings.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <TrendingUp size={48} className={styles.emptyStateIcon} />
                <h4 className={styles.emptyStateTitle}>{t('ad_analytics_empty')}</h4>
                <p className={styles.emptyStateText}>{t('ad_analytics_empty_sub')}</p>
              </div>
            ) : (
              <div className={styles.analyticsGrid}>
                {stats.listings.map((listing) => {
                  const rate = listing.views > 0 ? Math.round((listing.clicks / listing.views) * 100) : 0;
                  const peak = listing.daily.reduce((m, p) => Math.max(m, p.views), 0);
                  return (
                    <div key={listing.id} className={styles.analyticsCard}>
                      <div className={styles.analyticsCardHead}>
                        <Link href={`/property/${listing.id}`} className={styles.analyticsTitle}>
                          {listing.title}
                        </Link>
                        <span className={styles.analyticsRate}>{rate}% {t('ad_analytics_ctr')}</span>
                      </div>
                      <div className={styles.analyticsStatRow}>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsStatValue}>{listing.views}</span>
                          <span className={styles.analyticsStatLabel}>{t('ad_analytics_views')}</span>
                        </div>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsStatValue}>{listing.clicks}</span>
                          <span className={styles.analyticsStatLabel}>{t('ad_analytics_clicks')}</span>
                        </div>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsStatValue}>{listing.saves}</span>
                          <span className={styles.analyticsStatLabel}>{t('ad_analytics_saves')}</span>
                        </div>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsStatValue}>{listing.messages}</span>
                          <span className={styles.analyticsStatLabel}>{t('ad_analytics_messages')}</span>
                        </div>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsStatValue}>{listing.claims}</span>
                          <span className={styles.analyticsStatLabel}>{t('ad_analytics_claims')}</span>
                        </div>
                        <div className={styles.analyticsStat}>
                          <span className={styles.analyticsStatValue}>{listing.completed}</span>
                          <span className={styles.analyticsStatLabel}>{t('ad_analytics_completed')}</span>
                        </div>
                      </div>
                      <div className={styles.dailyBars}>
                        {listing.daily.length === 0 ? (
                          <span className={styles.dailyEmpty}>{t('ad_analytics_no_daily')}</span>
                        ) : (
                          listing.daily.map((point) => {
                            const h = peak > 0 ? Math.max(8, Math.round((point.views / peak) * 100)) : 8;
                            return (
                              <div key={point.day} className={styles.dailyBarWrap} title={`${point.day}: ${point.views}`}>
                                <div className={styles.dailyBar} style={{ height: `${h}%` }} />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              <p className={styles.loadingText}>{t('ad_loading_listings')}</p>
            ) : agentListings.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <Building2 size={48} className={styles.emptyStateIcon} />
                <h4 className={styles.emptyStateTitle}>{t('ad_no_listings')}</h4>
                <p className={styles.emptyStateText}>
                  {t('ad_no_listings_sub')}
                </p>
                <Link href="/post-listing" className={`${styles.btnPrimary} ${styles.inlineBtn}`}>
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
                    {agentListings.map((listing) => {
                      const claim = listingClaims[Number(listing.id)];
                      return (
                        <tr key={listing.id}>
                          <td className={styles.fw500}>{listing.title}</td>
                          <td>{listing.house_type}</td>
                          <td>£{listing.price}{t('per_month')}</td>
                          <td>
                            {claim ? (
                              <ClaimedBadge claimerName={claim.claimer_name} className={styles.claimBadge} />
                            ) : (
                              <span className={`${styles.statusBadge} ${styles.active}`}>
                                {t('ad_active')}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className={styles.actionCell}>
                              <Link href={`/property/${listing.id}`} className={styles.viewListingLink}>
                                {t('ad_view_listing')}
                              </Link>
                              {claim && (
                                <>
                                  <button className={styles.completeBtn} onClick={() => handleComplete(listing.id)}>
                                    {t('claim_complete')}
                                  </button>
                                  <button className={styles.releaseBtn} onClick={() => handleRelease(listing.id)}>
                                    {t('claim_release')}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
              <div className={styles.emptyStateCard}>
                <Users size={48} className={styles.emptyStateIcon} />
                <h4 className={styles.emptyStateTitle}>{t('ad_no_leads')}</h4>
                <p className={styles.emptyStateSubtext}>
                  {t('ad_no_leads_sub')}
                </p>
              </div>
            ) : (
              <div className={styles.crmGrid}>
                {conversationList.map((conv) => (
                  <div key={conv.contact.id} className={styles.crmCard}>
                    <div className={styles.crmCardHeader}>
                      <div className={styles.crmClientRow}>
                        <BrandedAvatar 
                          src={conv.contact.avatarUrl ? mediaUrl(conv.contact.avatarUrl) : null}
                          name={conv.contact.name || t('common_user')} 
                          size={40}
                          className={styles.avatarRound}
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
                <button className={`${styles.btnPrimary} ${styles.saveBtnMargin}`}>{t('ad_save_changes')}</button>
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

              <div className={`${styles.settingsCard} ${styles.dangerCard}`}>
                <h3 className={styles.dangerTitle}>{t('danger_zone')}</h3>
                <p className={styles.dangerDesc}>
                  {t('deactivate_desc')}
                </p>
                <button 
                  onClick={async () => {
                    if (window.confirm(t('deactivate_confirm'))) {
                      try {
                        await deactivateAccount("Agent self-deactivated");
                        alert(t('deactivate_success'));
                        logout();
                      } catch {
                        alert(t('deactivate_error'));
                      }
                    }
                  }}
                  className={styles.dangerButton}
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
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={18} /> {t('ad_nav_analytics')}
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
          
          <div className={styles.navFooter}>
            <button 
              className={`${styles.navItem} ${styles.signOutBtn}`}
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
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
              {activeTab === 'analytics' && t('ad_nav_top_analytics')}
              {activeTab === 'crm' && t('ad_nav_top_crm')}
              {activeTab === 'settings' && t('ad_nav_top_settings')}
              {activeTab === 'verification' && t('ad_nav_top_verification')}
            </h1>
            <p className={styles.topbarUser}>
              {user?.name || user?.email}
            </p>
          </div>
          <div className={styles.topbarRight}>
            <div className={`${styles.onlineStatus} ${isOnline(user?.last_seen_at) ? styles.statusOnline : styles.statusOffline}`}>
              <div className={isOnline(user?.last_seen_at) ? styles.statusDotOnline : styles.statusDotOffline} />
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
