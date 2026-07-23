'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './ProfilePage.module.css';
import { MessageSquare, LogOut, LayoutDashboard, Camera } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';

import { useRouter } from 'next/navigation';
import { apiRequest, mediaUrl, API_BASE_URL, getToken } from '@/lib/api';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

import { ProtectedImage } from '@/components/ui/ProtectedImage';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { t } = useLanguageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    occupation: user?.role === 'agent' ? 'Real Estate Agent' : 'Student / Renter'
  });
  const [mounted, setMounted] = useState(false);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const token = getToken() || user?.token || '';
      if (!token) {
        alert('Your session has expired. Please log in again.');
        logout();
        return;
      }

      const res = await fetch(`${API_BASE_URL}/users/me/avatar`, {
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
      alert('Profile picture updated successfully!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('Failed to upload profile picture. Please try logging in again.');
    } finally {
      // Reset the file input so the same file can be re‑selected without auto‑re‑upload
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadingAvatar(false);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

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
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = user?.name || formData.name || 'User';

  const { conversations, openChat } = useChatStore();
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
              router.push('/login');
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
              value={formData.occupation}
              onChange={handleChange}
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
              alert('Profile changes saved successfully!');
            } catch (err) {
              console.error('Failed to update profile:', err);
              alert('Failed to update profile.');
            }
          }}
        >
          Save Profile Changes
        </button>
      </div>

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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={conv.contact.avatarUrl} alt={conv.contact.name} className={styles.avatar} />
                  <div className={styles.conversationInfo}>
                    <div className={styles.conversationHeader}>
                      <h4 className={styles.contactName}>{conv.contact.name}</h4>
                      <span className={styles.time}>
                        {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={styles.messagePreview}>
                      <span className={styles.lastText}>
                        {lastMessage.sender === 'user' ? 'You: ' : ''}{lastMessage.text}
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
      </div>
    </motion.div>
  );
}
