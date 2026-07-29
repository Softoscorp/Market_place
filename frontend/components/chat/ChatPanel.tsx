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

  if (!isOpen || !activeConversation) return null;

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
                <ProtectedImage 
                  src={activeConversation.contact.avatarUrl ? mediaUrl(activeConversation.contact.avatarUrl) : ''}
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
              </div>
              <button onClick={closeChat} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.chatArea}>
              {activeConversation.messages.map(msg => (
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
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className={styles.sendBtn} disabled={!message.trim()}>
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
