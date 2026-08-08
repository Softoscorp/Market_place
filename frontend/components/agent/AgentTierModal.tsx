import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
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
              <span className={`${styles.tierBadge} ${styles.tierGoldBadge}`}>
                <VerifiedBadge tier="international" size="sm" />
                <span>International</span>
              </span>
            </div>
            <p className={styles.tierDesc}>
              These agents have completed the highest level of verification, including international background checks. You can deal with them internationally. Highly trusted.
            </p>
          </div>

          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <span className={`${styles.tierBadge} ${styles.tierBlueBadge}`}>
                <VerifiedBadge tier="local" size="sm" />
                <span>Local</span>
              </span>
            </div>
            <p className={styles.tierDesc}>
              These agents have completed local identity verification and are trusted members of our platform.
            </p>
          </div>

          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <span className={`${styles.tierBadge} ${styles.tierNoneBadge}`}>
                <VerifiedBadge tier="none" size="sm" />
                <span>Not Verified</span>
              </span>
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
