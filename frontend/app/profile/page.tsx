'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './ProfilePage.module.css';
import { MessageSquare, LogOut, LayoutDashboard, Camera, ShieldCheck, ShieldAlert, Upload, Bookmark, User, Star, Settings, IdCard, Award } from 'lucide-react';
import { useChatStore, type Message } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';

import { useRouter } from 'next/navigation';
import { apiRequest, mediaUrl, getToken, getSavedProperties, getAgentProfile, getMyVerificationStatus, applyForVerification, uploadVerificationProof, uploadAvatar, deactivateAccount } from '@/lib/api';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { BrandedAvatar } from '@/components/ui/BrandedAvatar';

function previewText(msg: Message): string {
  if (msg.message_type === 'image') return '[Image]';
  if (msg.message_type === 'voice') return '[Voice message]';
  if (msg.message_type === 'listing') return msg.listing ? `[Apartment: ${msg.listing.title}]` : '[Apartment]';
  return msg.text || '';
}

interface VerificationApplication {
  tier: 'local' | 'international';
  status: 'pending' | 'approved' | 'rejected';
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const { t } = useLanguageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: undefined as string | undefined,
    phone: undefined as string | undefined,
    occupation: undefined as string | undefined
  });
  const [mounted, setMounted] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Stat tile data
  const [savedCount, setSavedCount] = useState(0);
  const [avgRating, setAvgRating] = useState<string>('—');

  // Verification states
  const [verifications, setVerifications] = useState<VerificationApplication[]>([]);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [targetTier, setTargetTier] = useState<string | null>(null);

  const fetchVerifications = async () => {
    if (user?.role !== 'agent') return;
    try {
      const data = await getMyVerificationStatus();
      setVerifications(data);
    } catch (e) {
      console.error('Failed to fetch verifications', e);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetTier) return;

    setUploadingProof(targetTier);
    try {
      const { url } = await uploadVerificationProof(file);
      await applyForVerification(targetTier, [url]);
      await fetchVerifications();
      alert('Application submitted successfully!');
    } catch (err: unknown) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingProof(null);
      setTargetTier(null);
      if (proofInputRef.current) proofInputRef.current.value = '';
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setUploadMessage(null);
    try {
      const data = new FormData();
      data.append('file', file);

      if (!getToken()) {
        setUploadMessage({ text: t('pr_session_expired'), type: 'error' });
        logout();
        return;
      }

      const updatedUser = await uploadAvatar(file);
      // Use updateUser so we never lose other in-store fields via stale closure
      updateUser({ avatar_url: updatedUser.avatar_url });
      setUploadMessage({ text: t('pr_avatar_updated'), type: 'success' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setUploadMessage({ text: t('pr_avatar_failed'), type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Auth guard: redirect to login when user logs out
  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Fetch fresh user data from backend on mount; if token is invalid (401), clear stale session
  React.useEffect(() => {
    const token = getToken() || user?.token;
    if (token) {
      apiRequest('/users/me')
        .then((freshUser) => {
          if (freshUser) {
            // Only update fields that the backend actually returned (not null/undefined)
            // This prevents a race where freshUser has a stale null avatar_url
            // right after a successful upload
            const patch: Record<string, unknown> = {};
            if (freshUser.name != null) patch.name = freshUser.name;
            if (freshUser.phone != null) patch.phone = freshUser.phone;
            // Only update avatar_url from backend if it's a non-empty string
            if (freshUser.avatar_url) patch.avatar_url = freshUser.avatar_url;
            if (freshUser.is_verified != null) patch.is_verified = freshUser.is_verified;
            if (freshUser.role) patch.role = freshUser.role === 'renter' ? 'student' : freshUser.role;
            updateUser(patch as Partial<import('@/lib/store/useAuthStore').User>);
          }
        })
        .catch((err) => {
          console.error('Error refreshing user profile:', err);
          if (err?.status === 401) {
            logout();
          }
        });
      
      if (user?.role === 'agent') {
        getMyVerificationStatus()
          .then((res) => setVerifications(res))
          .catch((err: unknown) => console.error('Failed to fetch verifications', err));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = user?.name || formData.name || 'User';

  const { conversations, openChat, fetchConversations } = useChatStore();
  
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  const conversationList = Object.values(conversations).sort((a, b) => {
    const lastMsgA = (a.lastMessageAt ?? a.messages[a.messages.length - 1]?.timestamp) || 0;
    const lastMsgB = (b.lastMessageAt ?? b.messages[b.messages.length - 1]?.timestamp) || 0;
    return lastMsgB - lastMsgA;
  });

  const unreadCount = conversationList.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Load stat tile data (saved, roommates, rating)
  React.useEffect(() => {
    if (!isAuthenticated || !user) return;

    getSavedProperties()
      .then((data) => setSavedCount((data || []).length))
      .catch(() => {});

    if (user.role === 'agent') {
      getAgentProfile(user.id)
        .then((profile) => {
          const avgRating = (profile as Record<string, unknown> | null | undefined)?.average_rating;
          if (avgRating != null && Number(avgRating) > 0) {
            setAvgRating(Number(avgRating).toFixed(1));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!mounted) return null;

  const roleLabel =
    user?.role === 'agent'
      ? 'Real Estate Agent'
      : user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'customer_care'
      ? 'Customer Care'
      : 'Student / Renter';

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <BackButton />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('profile_title')}</h1>
          <p className={styles.subtitle}>{t('profile_sub')}</p>
        </div>
        <div className={styles.headerActions}>
          {user?.role === 'agent' && (
            <Link href="/agent-dashboard" className={styles.btnDashboard}>
              <LayoutDashboard size={18} /> Agent Dashboard
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'customer_care') && (
            <Link href="/admin" className={styles.btnDashboard}>
              <LayoutDashboard size={18} /> Admin Dashboard
            </Link>
          )}
          <button 
            onClick={() => {
              logout();
                window.location.href = '/login';
            }} 
            className={styles.btnLogOut}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Identity row */}
      <div className={styles.me}>
        <div className={styles.meAvatar}>
          <ProtectedImage 
            src={user?.avatar_url ? (mediaUrl(user.avatar_url) || '') : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=fff&size=128&bold=true`}
            fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=fff&size=128&bold=true`}
            alt={displayName} 
          />
          <button 
            type="button"
            className={styles.cameraBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            title={t('pr_change_photo')}
          >
            <Camera size={14} />
          </button>
        </div>
        <div className={styles.meInfo}>
          <div className={styles.meName}>{displayName}</div>
          <div className={styles.meEmail}>{user?.email} · {roleLabel}</div>
        </div>
        <div className={styles.meActs}>
          <button className={styles.btnGhost} onClick={() => scrollTo('account')}>
            <Settings size={16} /> Settings
          </button>
          <button className={styles.btnPrimary} onClick={() => scrollTo('details')}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className={styles.stats}>
        <Link href="/saved" className={styles.tile}>
          <div className={styles.tileIcon}><Bookmark size={20} /></div>
          <div><div className={styles.tileValue}>{savedCount}</div><div className={styles.tileLabel}>{t('pr_saved_properties')}</div></div>
        </Link>
        <div className={styles.tile}>
          <div className={styles.tileIcon}><MessageSquare size={20} /></div>
          <div><div className={styles.tileValue}>{unreadCount}</div><div className={styles.tileLabel}>Unread messages</div></div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tileIcon}><Star size={20} /></div>
          <div><div className={styles.tileValue}>{avgRating}</div><div className={styles.tileLabel}>Average rating</div></div>
        </div>
      </div>

      {/* Two-column workspace */}
      <div className={styles.main}>
        <div className={styles.col}>
          {/* Personal Details */}
          <div className={styles.card} id="details">
          <div className={styles.cardTitleRow}>
            <div className={styles.cardTitleLead}>
              <span className={styles.cardTitleIcon}><User size={18} /></span>
              <h3 className={styles.cardTitle}>Personal Details</h3>
            </div>
            {uploadMessage && (
              <span className={`${styles.statusChip} ${uploadMessage.type === 'success' ? styles.chipGreen : styles.chipRed}`}>
                {uploadMessage.text}
              </span>
            )}
          </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className={styles.hiddenInput} 
              onChange={handleAvatarSelect} 
            />

            <div className={styles.pair}>
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  className={styles.input} 
                  value={formData.name !== undefined ? formData.name : (user?.name || '')}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone (SMS & Alerts)</label>
                <input 
                  type="tel" 
                  name="phone"
                  placeholder="+90 533 800 0000"
                  className={styles.input} 
                  value={formData.phone !== undefined ? formData.phone : (user?.phone || '')}
                  onChange={handleChange}
                />
                <span className={styles.hint}>
                  Used for instant SMS lead notifications and identity verification.
                </span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input 
                type="email" 
                className={`${styles.input} ${styles.readonlyInput}`} 
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Occupation / University</label>
              <input 
                type="text" 
                name="occupation"
                className={`${styles.input} ${styles.readonlyInput}`} 
                value={user?.role === 'agent' ? 'Real Estate Agent' : 'Student / Renter'}
                readOnly
              />
            </div>

            <button 
              className={styles.saveBtn}
              onClick={async () => {
                try {
                  const updatedUser = await apiRequest('/users/me', {
                    method: 'PATCH',
                    body: {
                      name: formData.name || user?.name,
                      phone: formData.phone !== undefined ? formData.phone : user?.phone
                    }
                  });
                  if (user) {
                    updateUser({
                      name: updatedUser.name || formData.name || user.name,
                      phone: updatedUser.phone || formData.phone || user.phone,
                    });
                  }
                  setSaveMessage({ text: t('pr_profile_saved'), type: 'success' });
                  setTimeout(() => setSaveMessage(null), 3000);
                } catch (err) {
                  console.error('Failed to update profile:', err);
                  setSaveMessage({ text: t('pr_profile_failed'), type: 'error' });
                }
              }}
            >
              Save Profile Changes
            </button>
            {saveMessage && (
              <div className={`${styles.statusChip} ${styles.statusBlock} ${saveMessage.type === 'success' ? styles.chipGreen : styles.chipRed}`}>
                {saveMessage.text}
              </div>
            )}
          </div>

          {/* Verification Progress (Agents Only) */}
          {user?.role === 'agent' && (
            <div className={styles.card}>
              <div className={styles.cardTitleRow}>
                <div className={styles.cardTitleLead}>
                  <span className={styles.cardTitleIcon}><ShieldCheck size={18} /></span>
                  <h3 className={styles.cardTitle}>Verification Progress</h3>
                </div>
              </div>

              <input 
                type="file" 
                ref={proofInputRef} 
                accept="image/*,.pdf" 
                className={styles.hiddenInput} 
                onChange={handleProofUpload} 
              />

              {/* Tier 1 */}
              {(() => {
                const app = verifications.find(v => v.tier === 'local');
                const isApproved = user?.verification_tier === 'local' || user?.verification_tier === 'international';
                const isPending = app && app.status === 'pending';

                return (
                  <div className={styles.verifyRow}>
                    <div className={styles.verifyTop}>
                      <span className={styles.verifyTitle}><IdCard size={15} className={styles.iconInline} /> Tier 1 · Local</span>
                      {isApproved ? (
                        <span className={`${styles.chipMini} ${styles.chipGreen}`}>✓ Verified</span>
                      ) : isPending ? (
                        <span className={`${styles.chipMini} ${styles.chipAmber}`}><ShieldAlert size={12} /> Review Pending</span>
                      ) : (
                        <button 
                          className={styles.applyBtn}
                          onClick={() => { setTargetTier('local'); proofInputRef.current?.click(); }}
                          disabled={uploadingProof === 'local'}
                        >
                          {uploadingProof === 'local' ? 'Uploading...' : <><Upload size={14} /> Apply</>}
                        </button>
                      )}
                    </div>
                    <div className={styles.bar}>
                      <div className={`${styles.fill} ${isApproved ? styles.fillFull : isPending ? styles.fillHalf : ''}`}></div>
                    </div>
                  </div>
                );
              })()}

              {/* Tier 2 */}
              {(() => {
                const app = verifications.find(v => v.tier === 'international');
                const isLocalApproved = user?.verification_tier === 'local' || user?.verification_tier === 'international';
                const isInternationalApproved = user?.verification_tier === 'international';
                const isPending = app && app.status === 'pending';

                return (
                  <div className={styles.verifyRow}>
                    <div className={styles.verifyTop}>
                      <span className={styles.verifyTitle}><Award size={15} className={styles.iconInline} /> Tier 2 · International</span>
                      {isInternationalApproved ? (
                        <span className={`${styles.chipMini} ${styles.chipGreen}`}>✓ Premium Verified</span>
                      ) : isPending ? (
                        <span className={`${styles.chipMini} ${styles.chipAmber}`}><ShieldAlert size={12} /> Review Pending</span>
                      ) : !isLocalApproved ? (
                        <span className={`${styles.chipMini} ${styles.chipGrey}`}>Complete Tier 1 First</span>
                      ) : (
                        <button 
                          className={styles.applyBtn}
                          onClick={() => { setTargetTier('international'); proofInputRef.current?.click(); }}
                          disabled={uploadingProof === 'international'}
                        >
                          {uploadingProof === 'international' ? 'Uploading...' : <><Upload size={14} /> Apply</>}
                        </button>
                      )}
                    </div>
                    <div className={styles.bar}>
                      <div className={`${styles.fill} ${isInternationalApproved ? styles.fillFull : isPending ? styles.fillHalf : isLocalApproved ? styles.fillHalf : ''}`}></div>
                    </div>
                  </div>
                );
              })()}

              <p className={styles.verifyNote}>
                Tier 1 unlocks the verified badge on your listings. Tier 2 adds premium visibility for agents.
              </p>
            </div>
          )}
        </div>

        <div className={styles.col}>
          {/* Messages */}
            <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <div className={styles.cardTitleLead}>
                <span className={styles.cardTitleIcon}><MessageSquare size={18} /></span>
                <h3 className={styles.cardTitle}>{t('messages_hub')}</h3>
              </div>
              {unreadCount > 0 && (
                <span className={`${styles.chipMini} ${styles.chipGreen}`}>{unreadCount} new</span>
              )}
            </div>

            {conversationList.length === 0 ? (
              <div className={styles.emptyState}>
                <MessageSquare size={40} className={styles.emptyIcon} />
                <h4>{t('no_messages_yet')}</h4>
                <p>{t('no_messages_sub')}</p>
              </div>
            ) : (
              <div className={styles.conversationList}>
                {conversationList.map((conv) => {
                  const lastMessage = conv.messages[conv.messages.length - 1];
                  return (
                    <div 
                      key={conv.contact.id} 
                      className={styles.conversationItem}
                      onClick={() => openChat(conv.contact)}
                    >
                      <BrandedAvatar 
                        src={conv.contact.avatarUrl ? mediaUrl(conv.contact.avatarUrl) : null}
                        name={conv.contact.name || 'User'} 
                        size={40}
                        className={styles.avatar}
                      />
                      <div className={styles.conversationInfo}>
                        <div className={styles.conversationHeader}>
                          <h4 className={styles.contactName}>{conv.contact.name}</h4>
                          {lastMessage && (
                            <span className={styles.time}>
                              {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className={styles.messagePreview}>
                          <span className={styles.lastText}>
                            {lastMessage ? (
                              <>{lastMessage.sender === 'user' ? 'You: ' : ''}{previewText(lastMessage)}</>
                            ) : (
                              <span className={styles.emptyPreview}>New conversation...</span>
                            )}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Account */}
          <div className={styles.card} id="account">
            <div className={styles.cardTitleRow}>
              <div className={styles.cardTitleLead}>
                <span className={styles.cardTitleIcon}><Settings size={18} /></span>
                <h3 className={styles.cardTitle}>Account</h3>
              </div>
            </div>
            <Link href="/saved" className={styles.accountBtn}>
              <Bookmark size={16} /> {t('pr_saved_properties')}
            </Link>
            <Link href="/messages" className={styles.accountBtn}>
              <MessageSquare size={16} /> {t('pr_messages_hub')}
            </Link>
            <button 
              className={`${styles.accountBtn} ${styles.dangerBtn}`}
              onClick={async () => {
                if (window.confirm(t('deactivate_confirm'))) {
                  try {
                    await deactivateAccount();
                    alert(t('deactivate_success'));
                    logout();
                  } catch {
                    alert(t('deactivate_error'));
                  }
                }
              }}
            >
              <ShieldAlert size={16} />
              {t('deactivate_btn')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
