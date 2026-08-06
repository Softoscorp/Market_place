'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './ProfilePage.module.css';
import { MessageSquare, LogOut, LayoutDashboard, Camera, ShieldCheck, ShieldAlert, BadgeCheck, FileText, Upload, ChevronRight } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';

import { useRouter } from 'next/navigation';
import { apiRequest, mediaUrl, getToken } from '@/lib/api';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

import { ProtectedImage } from '@/components/ui/ProtectedImage';

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

  // Verification states
  const [verifications, setVerifications] = useState<any[]>([]);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [targetTier, setTargetTier] = useState<string | null>(null);

  const fetchVerifications = async () => {
    if (user?.role !== 'agent') return;
    try {
      const token = getToken() || user?.token;
      if (!token) return;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/verifications/my-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVerifications(data);
      }
    } catch (e) {
      console.error('Failed to fetch verifications', e);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetTier) return;

    setUploadingProof(targetTier);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = getToken() || user?.token;
      
      // Upload file
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/verifications/upload-proof`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();

      // Submit application
      const applyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/verifications/apply`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier: targetTier, proof_urls: [url] })
      });
      if (!applyRes.ok) {
        const err = await applyRes.json();
        throw new Error(err.detail || 'Application failed');
      }

      await fetchVerifications();
      alert('Application submitted successfully!');
    } catch (err: any) {
      alert('Error: ' + err.message);
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

      const token = getToken() || user?.token || '';
      if (!token) {
        setUploadMessage({ text: 'Your session has expired. Please log in again.', type: 'error' });
        logout();
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/users/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      if (!res.ok) {
        const errorDetail = await res.json().catch(() => ({}));
        throw new Error(errorDetail.detail || 'Avatar upload failed');
      }

      const updatedUser = await res.json();
      // Use updateUser so we never lose other in-store fields via stale closure
      updateUser({ avatar_url: updatedUser.avatar_url });
      setUploadMessage({ text: 'Profile picture updated successfully!', type: 'success' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setUploadMessage({ text: 'Failed to upload profile picture.', type: 'error' });
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
        fetchVerifications();
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
    const lastMsgA = a.messages[a.messages.length - 1]?.timestamp || 0;
    const lastMsgB = b.messages[b.messages.length - 1]?.timestamp || 0;
    return lastMsgB - lastMsgA;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!mounted) return null;

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

      <div className={styles.grid}>
        <div className={styles.card}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal Details</h2>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleAvatarSelect} 
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <ProtectedImage 
                src={user?.avatar_url ? (mediaUrl(user.avatar_url) || '') : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=fff&size=128&bold=true`}
                fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=fff&size=128&bold=true`}
                alt={displayName} 
                style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid #e2e8f0', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a' }}>{displayName}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{user?.email}</div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  marginTop: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Camera size={14} />
                {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
              </button>
              {uploadMessage && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8125rem',
                  color: uploadMessage.type === 'success' ? '#15803d' : '#b91c1c',
                  backgroundColor: uploadMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                  borderRadius: '0.375rem',
                  border: `1px solid ${uploadMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                  {uploadMessage.text}
                </div>
              )}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Full Name</label>
            <input 
              type="text" 
              name="name"
              className={styles.input} 
              value={formData.name !== undefined ? formData.name : (user?.name || '')}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Phone Number (SMS & Alerts)</label>
            <input 
              type="tel" 
              name="phone"
              placeholder="+90 533 800 0000"
              className={styles.input} 
              value={formData.phone !== undefined ? formData.phone : (user?.phone || '')}
              onChange={handleChange}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Used for instant SMS lead notifications and identity verification.
            </span>
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Occupation / University</label>
            <input 
              type="text" 
              name="occupation"
              className={styles.input} 
              value={user?.role === 'agent' ? 'Real Estate Agent' : 'Student / Renter'}
              readOnly
              style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
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
              setSaveMessage({ text: 'Profile changes saved successfully!', type: 'success' });
              setTimeout(() => setSaveMessage(null), 3000);
            } catch (err) {
              console.error('Failed to update profile:', err);
              setSaveMessage({ text: 'Failed to update profile.', type: 'error' });
            }
          }}
        >
          Save Profile Changes
        </button>
        {saveMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            fontSize: '0.875rem',
            color: saveMessage.type === 'success' ? '#15803d' : '#b91c1c',
            backgroundColor: saveMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            borderRadius: '0.5rem',
            border: `1px solid ${saveMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            textAlign: 'center'
          }}>
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Verification Center (Agents Only) */}
      {user?.role === 'agent' && (
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={24} color="#0f172a" />
              Verification Center
            </h2>
            <p className={styles.subtitle}>Build trust by verifying your identity and business</p>
          </div>
          
          <input 
            type="file" 
            ref={proofInputRef} 
            accept="image/*,.pdf" 
            style={{ display: 'none' }} 
            onChange={handleProofUpload} 
          />

          <div className={styles.verificationGrid}>
            {/* Tier 1 Card */}
            <div className={`${styles.verificationCard} ${styles.tier1}`}>
              <div className={styles.verificationHeader}>
                <div className={`${styles.verificationIcon} ${styles.tier1Icon}`}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className={styles.verificationTitle}>Tier 1: Local</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identity Verification</div>
                </div>
              </div>
              <p className={styles.verificationDesc}>
                Upload a Government-issued ID Card, Driver's License, or Passport to prove your identity.
              </p>
              
              {(() => {
                const app = verifications.find(v => v.tier === 'local');
                const isApproved = user?.verification_tier === 'local' || user?.verification_tier === 'international';
                
                if (isApproved) {
                  return (
                    <div className={`${styles.verificationStatus} ${styles.statusApproved}`}>
                      <BadgeCheck size={18} /> Verified
                    </div>
                  );
                } else if (app && app.status === 'pending') {
                  return (
                    <div className={`${styles.verificationStatus} ${styles.statusPending}`}>
                      <ShieldAlert size={18} /> Review Pending
                    </div>
                  );
                } else {
                  return (
                    <button 
                      className={styles.verificationBtn} 
                      onClick={() => { setTargetTier('local'); proofInputRef.current?.click(); }}
                      disabled={uploadingProof === 'local'}
                    >
                      {uploadingProof === 'local' ? 'Uploading...' : <><Upload size={16} /> Apply for Tier 1</>}
                    </button>
                  );
                }
              })()}
            </div>

            {/* Tier 2 Card */}
            <div className={`${styles.verificationCard} ${styles.tier2}`}>
              <div className={styles.verificationHeader}>
                <div className={`${styles.verificationIcon} ${styles.tier2Icon}`}>
                  <BadgeCheck size={24} />
                </div>
                <div>
                  <div className={styles.verificationTitle}>Tier 2: International</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Verification</div>
                </div>
              </div>
              <p className={styles.verificationDesc}>
                Upload your registered Business Certificate or Professional Real Estate License for premium visibility.
              </p>
              
              {(() => {
                const app = verifications.find(v => v.tier === 'international');
                const isLocalApproved = user?.verification_tier === 'local' || user?.verification_tier === 'international';
                const isInternationalApproved = user?.verification_tier === 'international';
                
                if (isInternationalApproved) {
                  return (
                    <div className={`${styles.verificationStatus} ${styles.statusApproved}`}>
                      <BadgeCheck size={18} /> Premium Verified
                    </div>
                  );
                } else if (app && app.status === 'pending') {
                  return (
                    <div className={`${styles.verificationStatus} ${styles.statusPending}`}>
                      <ShieldAlert size={18} /> Review Pending
                    </div>
                  );
                } else if (!isLocalApproved) {
                  return (
                    <button className={styles.verificationBtn} disabled title="Requires Tier 1 Verification first">
                      Complete Tier 1 First
                    </button>
                  );
                } else {
                  return (
                    <button 
                      className={`${styles.verificationBtn} ${styles.active}`} 
                      onClick={() => { setTargetTier('international'); proofInputRef.current?.click(); }}
                      disabled={uploadingProof === 'international'}
                    >
                      {uploadingProof === 'international' ? 'Uploading...' : <><Upload size={16} /> Apply for Tier 2</>}
                    </button>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>Messages Hub</h2>
          <p className={styles.subtitle}>All your conversations in one place</p>
        </div>

        {conversationList.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={48} className={styles.emptyIcon} />
            <h3>No messages yet</h3>
            <p>When you contact an agent or roommate, your conversations will appear here.</p>
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
                  <ProtectedImage 
                    src={(conv.contact.avatarUrl ? mediaUrl(conv.contact.avatarUrl) : '') || ''}
                    fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(conv.contact.name || 'User')}&background=0F172A&color=fff&size=128&bold=true`}
                    alt={conv.contact.name || 'User'} 
                    className={styles.avatar}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
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
                          <>{lastMessage.sender === 'user' ? 'You: ' : ''}{lastMessage.text}</>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>New conversation...</span>
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
      
      {/* Danger Zone */}
      <div className={styles.card} style={{ border: '1px solid #ef4444', marginTop: '2rem' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title} style={{ color: '#ef4444' }}>Danger Zone</h2>
          <p className={styles.subtitle}>Irreversible and critical account actions</p>
        </div>
        
        <div style={{ padding: '1rem 0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>Deactivate Account</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>
            Deactivating your account will immediately log you out and block access to your account. Your profile and listings will no longer be visible to the public. For security and fraud prevention, your data is retained in our systems.
          </p>
          <button 
            onClick={async () => {
              if (window.confirm("Are you sure you want to deactivate your account? This action will log you out immediately.")) {
                try {
                  const token = getToken() || user?.token;
                  if (!token) return;
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/users/me/deactivate`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ reason: "User self-deactivated" })
                  });
                  alert("Your account has been deactivated.");
                  logout();
                } catch (e) {
                  alert("Failed to deactivate account. Please contact support.");
                }
              }
            }}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            <ShieldAlert size={18} />
            Deactivate My Account
          </button>
        </div>
      </div>
      </div>
    </motion.div>
  );
}
