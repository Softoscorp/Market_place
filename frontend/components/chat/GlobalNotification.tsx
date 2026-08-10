'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './GlobalNotification.module.css';

export function GlobalNotification() {
  const { notification, clearNotification, openChat } = useChatStore();
  const t = useLanguageStore((s) => s.t);

  const handleOpenChat = () => {
    if (!notification) return;
    openChat({
      id: notification.contactName, // using name as ID fallback if needed, but the store handles it
      name: notification.contactName,
      avatarUrl: notification.avatarUrl
    });
    clearNotification();
  };

  return (
    <div className={styles.notificationWrapper}>
      <AnimatePresence>
        {notification && (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={handleOpenChat}
          >
            <img src={notification.avatarUrl} alt={notification.contactName} className={styles.avatar} />
            <div className={styles.content}>
              <div className={styles.header}>
                <h4 className={styles.name}>{notification.contactName}</h4>
                <span className={styles.time}>{t('gn_just_now')}</span>
              </div>
              <p className={styles.text}>{notification.text}</p>
            </div>
            <button 
              className={styles.closeBtn} 
              onClick={(e) => {
                e.stopPropagation();
                clearNotification();
              }}
              aria-label={t('gn_dismiss')}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
