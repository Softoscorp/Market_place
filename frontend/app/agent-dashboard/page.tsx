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
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const { openChat, conversations, fetchConversations } = useChatStore();
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('overview');

  const [agentListings, setAgentListings] = useState<RealListing[]>([]);
  const [listingClaims, setListingClaims] = useState<Record<number, ListingClaim>>({});
  const [loadingListings, setLoadingListings] = useState(true);
  const [stats, setStats] = useState<import('@/lib/api').ListingStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    if (!hasHydrated) return; // wait for persisted store to rehydrate on refresh
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
  }, [hasHydrated, isAuthenticated, user, router]);

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

  if (!hasHydrated || !isAuthenticated || user?.role !== 'agent') {
    return <div className={styles.loaderContainer}><div className={styles.loader}></div></div>;
  }

  const conversationList = Object.values(conversations);

  const dailyByDay = new Map<string, { views: number; clicks: number }>();
  (stats?.listings || []).forEach((l) => {
    l.daily.forEach((p) => {
      const cur = dailyByDay.get(p.day) || { views: 0, clicks: 0 };
      cur.views += p.views;
      cur.clicks += p.clicks;
      dailyByDay.set(p.day, cur);
    });
  });
  const fullSeries = Array.from(dailyByDay.entries())
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const series = fullSeries.slice(-analyticsPeriod);
  const heroViews = series.reduce((s, p) => s + p.views, 0);
  const peakPoint = series.reduce((m, p) => (p.views > m.views ? p : m), series[0] || null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const half = Math.floor(series.length / 2);
  const firstSum = series.slice(0, half).reduce((s, p) => s + p.views, 0);
  const secondSum = series.slice(half).reduce((s, p) => s + p.views, 0);
  const deltaPct = firstSum > 0 ? Math.round(((secondSum - firstSum) / firstSum) * 100) : null;
  const topListings = [...(stats?.listings || [])]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  const maxViews = topListings[0]?.views || 1;
  const listingMeta = new Map<number, RealListing>();
  agentListings.forEach((l) => listingMeta.set(Number(l.id), l));

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
            <div className={styles.analyticsHeader}>
              <div>
                <h3 className={styles.sectionTitle}>{t('ad_analytics_title')}</h3>
                <p className={styles.analyticsSubtitle}>{t('ad_analytics_subtitle')}</p>
              </div>
              <div className={styles.analyticsPeriod}>
                {([7, 30, 90] as const).map((d) => (
                  <button
                    key={d}
                    className={analyticsPeriod === d ? styles.analyticsPeriodOn : ''}
                    onClick={() => setAnalyticsPeriod(d)}
                  >
                    {d}D
                  </button>
                ))}
              </div>
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
              <>
                <div className={styles.analyticsHero}>
                  <div className={styles.analyticsEyebrow}>
                    {t('ad_total_views')} · {t('ad_analytics_last').replace('{days}', String(analyticsPeriod))}
                  </div>
                  <div className={styles.analyticsBigRow}>
                    <div className={styles.analyticsBigNum}>{heroViews.toLocaleString()}</div>
                    {deltaPct !== null && deltaPct >= 0 && (
                      <div className={styles.analyticsDelta}>
                        ▲ {deltaPct}% {t('ad_analytics_vs_prev')}
                      </div>
                    )}
                    {deltaPct !== null && deltaPct < 0 && (
                      <div className={`${styles.analyticsDelta} ${styles.analyticsDeltaDown}`}>
                        ▼ {Math.abs(deltaPct)}% {t('ad_analytics_vs_prev')}
                      </div>
                    )}
                  </div>
                  <div className={styles.analyticsHeroSub}>
                    {t('ad_analytics_across').replace('{count}', String(stats.listings.length))}
                    {peakPoint && ` · ${t('ad_analytics_peak_day')} ${peakPoint.day} (${peakPoint.views})`}
                  </div>

                  <div className={styles.analyticsChart}>
                    {series.map((p) => {
                      const h = peakPoint && peakPoint.views > 0
                        ? Math.max(6, Math.round((p.views / peakPoint.views) * 100))
                        : 6;
                      const isToday = p.day === todayStr;
                      return (
                        <div
                          key={p.day}
                          className={`${styles.analyticsChartBar} ${isToday ? styles.analyticsChartBarToday : ''}`}
                          style={{ height: `${h}%` }}
                          title={`${p.day}: ${p.views}`}
                        >
                          <span className={styles.analyticsBarTip}>{p.views}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.analyticsChartLabels}>
                    <span>{series[0]?.day}</span>
                    <span>{series[Math.floor(series.length / 3)]?.day}</span>
                    <span>{series[Math.floor((series.length * 2) / 3)]?.day}</span>
                    <span>
                      {series[series.length - 1]?.day === todayStr
                        ? t('ad_analytics_today')
                        : series[series.length - 1]?.day}
                    </span>
                  </div>
                </div>

                <div className={styles.analyticsTotals}>
                  <div className={styles.analyticsTile}><div className={styles.analyticsTileValue}>{stats.totals.views.toLocaleString()}</div><div className={styles.analyticsTileLabel}>{t('ad_analytics_views')}</div></div>
                  <div className={`${styles.analyticsTile} ${styles.analyticsTileBlue}`}><div className={styles.analyticsTileValue}>{stats.totals.clicks.toLocaleString()}</div><div className={styles.analyticsTileLabel}>{t('ad_analytics_clicks')}</div></div>
                  <div className={`${styles.analyticsTile} ${styles.analyticsTileGold}`}><div className={styles.analyticsTileValue}>{stats.totals.saves.toLocaleString()}</div><div className={styles.analyticsTileLabel}>{t('ad_analytics_saves')}</div></div>
                  <div className={styles.analyticsTile}><div className={styles.analyticsTileValue}>{stats.totals.messages.toLocaleString()}</div><div className={styles.analyticsTileLabel}>{t('ad_analytics_messages')}</div></div>
                  <div className={styles.analyticsTile}><div className={styles.analyticsTileValue}>{stats.totals.claims.toLocaleString()}</div><div className={styles.analyticsTileLabel}>{t('ad_analytics_claims')}</div></div>
                  <div className={styles.analyticsTile}><div className={styles.analyticsTileValue}>{stats.totals.completed.toLocaleString()}</div><div className={styles.analyticsTileLabel}>{t('ad_analytics_completed')}</div></div>
                </div>

                <div className={styles.analyticsSectionTitle}>
                  <h4>{t('ad_analytics_top')}</h4>
                  <span>{t('ad_analytics_by_views')}</span>
                </div>
                <div className={styles.analyticsRankList}>
                  {topListings.map((listing, idx) => {
                    const meta = listingMeta.get(listing.id);
                    const badge = idx === 0 ? styles.rankGold : idx === 1 ? styles.rankSilver : idx === 2 ? styles.rankBronze : '';
                    return (
                      <div key={listing.id} className={styles.analyticsRankRow}>
                        <div className={`${styles.rankBadge} ${badge}`}>{idx + 1}</div>
                        <div className={styles.rankName}>
                          <div className={styles.rankTitle}>{listing.title}</div>
                          <div className={styles.rankMeta}>
                            {meta ? `${meta.house_type} · £${meta.price}/mo` : ''}
                          </div>
                        </div>
                        <div className={styles.rankBarCol}>
                          <div className={styles.rankBar}>
                            <i style={{ width: `${Math.round((listing.views / maxViews) * 100)}%` }} />
                          </div>
                        </div>
                        <div className={styles.rankStat}>
                          <div className={styles.rankStatNum}>{listing.views.toLocaleString()}</div>
                          <div className={styles.rankStatLabel}>{t('ad_analytics_views')}</div>
                        </div>
                        <div className={styles.rankStat}>
                          <div className={styles.rankStatNum}>{listing.clicks.toLocaleString()}</div>
                          <div className={styles.rankStatLabel}>{t('ad_analytics_clicks')}</div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    className={styles.analyticsViewAll}
                    onClick={() => setActiveTab('listings')}
                  >
                    {t('ad_analytics_view_all').replace('{count}', String(stats.listings.length))} →
                  </button>
                </div>
              </>
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
