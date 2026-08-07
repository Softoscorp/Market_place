'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';

import styles from './ChatPanel.module.css';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { mediaUrl } from '@/lib/api';
import { isOnline } from '@/lib/timeAgo';
import { useLanguageStore } from '@/lib/store/useLanguageStore';

export function ChatPanel() {
  const { isOpen, activeAgentId, activeConversationId, conversations, closeChat, sendMessage, chatError, clearChatError, isLoadingMessages } = useChatStore();
  const { t } = useLanguageStore();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = activeAgentId ? conversations[activeAgentId] : null;

  const getLocalizedLastSeenText = (lastSeenAt: string | null | undefined) => {
    if (!lastSeenAt) return t('chat_offline');

    const date = new Date(lastSeenAt.endsWith('Z') ? lastSeenAt : `${lastSeenAt}Z`);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return t('chat_online_now');
    if (diffMin < 60) return t('chat_last_seen_min').replace('{count}', String(diffMin));

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return t('chat_last_seen_hour').replace('{count}', String(diffHours));

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t('chat_last_seen_yesterday');
    if (diffDays < 7) return t('chat_last_seen_days').replace('{count}', String(diffDays));

    return t('chat_offline');
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Poll for new messages every 5 seconds while chat is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const { fetchMessages } = useChatStore.getState();
    if (isOpen && activeConversationId) {
      interval = setInterval(() => {
        fetchMessages(activeConversationId);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, activeConversationId]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessage(message);
    setMessage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
          />
          <motion.div 
            className={styles.panel}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className={styles.header}>
              <div className={styles.agentInfo}>
                {activeConversation ? (
                  <>
                    <ProtectedImage 
                      src={(activeConversation.contact.avatarUrl ? mediaUrl(activeConversation.contact.avatarUrl) : '') || ''}
                      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.contact.name || 'User')}&background=0F172A&color=fff&size=128&bold=true`}
                      alt={activeConversation.contact.name || t('chat_user')} 
                      className={styles.avatar}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 className={styles.agentName}>{activeConversation.contact.name}</h3>
                      <div className={styles.status} style={{ color: isOnline(activeConversation.contact.lastSeenAt) ? 'var(--success)' : 'var(--text-muted)' }}>
                        <span className={styles.statusDot} style={{ 
                          background: isOnline(activeConversation.contact.lastSeenAt) ? 'var(--success)' : 'var(--text-muted)',
                          boxShadow: isOnline(activeConversation.contact.lastSeenAt) ? '0 0 0 2px var(--bg-surface), 0 0 6px var(--success)' : 'none'
                        }} />
                        {getLocalizedLastSeenText(activeConversation.contact.lastSeenAt)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface)' }} />
                    <h3 className={styles.agentName}>{t('chat_connecting')}</h3>
                  </div>
                )}
              </div>
              <button onClick={closeChat} className={styles.closeBtn} aria-label="Close chat">
                <X size={20} />
              </button>
            </div>

            <div className={styles.chatArea}>
              {isLoadingMessages && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{t('chat_loading_messages')}</span>
                </div>
              )}
              {!isLoadingMessages && !activeConversation && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  {t('chat_error_load')}
                </div>
              )}
              {!isLoadingMessages && activeConversation && activeConversation.messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`${styles.message} ${msg.sender === 'user' ? styles.messageSent : styles.messageReceived}`}
                >
                  {msg.text}
                  <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: 'var(--space-1)', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {chatError && (
              <div style={{
                backgroundColor: 'var(--danger-muted)',
                color: 'var(--danger)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--danger-border)',
                margin: '0 var(--space-4)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <span>{chatError}</span>
                <button onClick={clearChatError} style={{ color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className={styles.inputArea}>
              <input 
                type="text" 
                className={styles.input}
                placeholder={activeConversation ? t('chat_type_message') : t('chat_placeholder_connecting')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!activeConversation}
              />
              <button type="submit" className={styles.sendBtn} disabled={!message.trim() || !activeConversation} aria-label="Send message">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
