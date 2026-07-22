'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Download, Bell, Check, X, Share, PlusSquare } from 'lucide-react';
import styles from './InstallAppModal.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on your phone:\n1. Tap the Share or Menu button (⋮) in your browser.\n2. Select "Add to Home Screen" or "Install App".');
    }
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported by your browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          reg.showNotification('Notifications Enabled!', {
            body: 'You will now receive instant push alerts for leads and messages on House Agent.',
            icon: '/favicon.ico'
          });
        });
      }
    } else {
      alert('Notification permission was denied. Please enable notifications in your browser settings.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.backdrop} onClick={onClose}>
        <motion.div 
          className={styles.modal} 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>

          <div className={styles.header}>
            <div className={styles.iconCircle}>
              <Smartphone size={28} color="#ffffff" />
            </div>
            <h2 className={styles.title}>Install House Agent App</h2>
            <p className={styles.subtitle}>Get instant lead alerts and quick home-screen access on your phone.</p>
          </div>

          <div className={styles.steps}>
            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNum}>1</span>
                <div>
                  <h4 className={styles.stepTitle}>Install App on Phone</h4>
                  <p className={styles.stepDesc}>Add House Agent directly to your mobile home screen.</p>
                </div>
              </div>
              <button 
                className={styles.actionBtn}
                onClick={handleInstallClick}
              >
                <Download size={16} />
                {installed ? 'App Installed' : 'Install Mobile App'}
              </button>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNum}>2</span>
                <div>
                  <h4 className={styles.stepTitle}>Enable Push Notifications</h4>
                  <p className={styles.stepDesc}>Receive instant push notifications for new leads and messages.</p>
                </div>
              </div>
              <button 
                className={`${styles.actionBtn} ${notificationsEnabled ? styles.activeBtn : ''}`}
                onClick={handleEnableNotifications}
              >
                {notificationsEnabled ? <Check size={16} /> : <Bell size={16} />}
                {notificationsEnabled ? 'Notifications Active' : 'Enable Mobile Notifications'}
              </button>
            </div>
          </div>

          <div className={styles.instructions}>
            <h4 className={styles.guideTitle}>Manual Installation Guide</h4>
            <div className={styles.guideRow}>
              <strong>Android (Chrome):</strong> Tap browser menu <span className={styles.badge}>⋮</span> → Select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.
            </div>
            <div className={styles.guideRow}>
              <strong>iOS / iPhone (Safari):</strong> Tap Share <Share size={14} style={{ display: 'inline', margin: '0 2px' }} /> → Select <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', margin: '0 2px' }} />.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
