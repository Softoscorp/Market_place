'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image as ImageIcon, Phone, Video, MoreVertical } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import styles from './ChatPanel.module.css';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { mediaUrl } from '@/lib/api';

export function ChatPanel() {
  const { isOpen, activeAgentId, conversations, closeChat, sendMessage } = useChatStore();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = activeAgentId ? conversations[activeAgentId] : null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  useEffect(() => {
    if (isOpen) {
      import('@/lib/push').then(m => m.subscribeToPushNotifications());
    }
  }, [isOpen]);

  // Show loading spinner while conversation is being fetched
  useEffect(() => {
    if (isOpen && !activeConversation) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 5000); // fallback timeout
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [isOpen, activeConversation]);

  // Poll for new messages every 3 seconds while chat is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const { activeConversationId, fetchMessages } = useChatStore.getState();
    if (isOpen && activeConversationId) {
      interval = setInterval(() => {
        fetchMessages(activeConversationId);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, useChatStore.getState().activeConversationId]);

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
                      alt={activeConversation.contact.name || 'User'} 
                      className={styles.avatar}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 className={styles.agentName}>{activeConversation.contact.name}</h3>
                      <div className={styles.status}>
                        <span className={styles.statusDot} />
                        Online now
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb' }} />
                    <h3 className={styles.agentName}>Connecting...</h3>
                  </div>
                )}
              </div>
              <button onClick={closeChat} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.chatArea}>
              {!activeConversation && isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: '#6b7280' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '0.875rem' }}>Starting conversation...</span>
                </div>
              )}
              {!activeConversation && !isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  Could not load conversation. Please try again.
                </div>
              )}
              {activeConversation && activeConversation.messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`${styles.message} ${msg.sender === 'user' ? styles.messageSent : styles.messageReceived}`}
                >
                  {msg.text}
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className={styles.inputArea}>
              <input 
                type="text" 
                className={styles.input}
                placeholder={activeConversation ? "Type a message..." : "Connecting..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!activeConversation}
              />
              <button type="submit" className={styles.sendBtn} disabled={!message.trim() || !activeConversation}>
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
