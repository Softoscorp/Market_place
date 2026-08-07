import React from 'react';
import { Check, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import styles from './AgentTierModal.module.css';

interface AgentTierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentTierModal({ isOpen, onClose }: AgentTierModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agent Verification Tiers">
      <div className={styles.container}>
        <p className={styles.intro}>
          To keep our platform safe and reliable, we verify agents and assign them tiers based on their verification level. Here's what they mean:
        </p>

        <div className={styles.tierList}>
          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <div className={`${styles.tierBadge} ${styles.tierGoldBadge}`}>
                <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Verified</span>
              </div>
            </div>
            <p className={styles.tierDesc}>
              These agents have completed the highest level of verification, including international background checks. Highly trusted.
            </p>
          </div>

          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <div className={`${styles.tierBadge} ${styles.tierGreenBadge}`}>
                <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Verified</span>
              </div>
            </div>
            <p className={styles.tierDesc}>
              These agents have completed local identity verification and are trusted members of our platform.
            </p>
          </div>

          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <div className={`${styles.tierBadge} ${styles.tierNoneBadge}`}>
                <ShieldAlert size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Not Verified Yet</span>
              </div>
            </div>
            <p className={styles.tierDesc}>
              These agents have not completed their verification. <strong>You can still rent through them, but it will be at your own risk.</strong>
            </p>
          </div>
        </div>

        <button className={styles.gotItBtn} onClick={onClose}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
