import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './AgentTierModal.module.css';

interface AgentTierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentTierModal({ isOpen, onClose }: AgentTierModalProps) {
  const t = useLanguageStore((s) => s.t);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('atm_title')}>
      <div className={styles.container}>
        <p className={styles.intro}>
          {t('atm_intro')}
        </p>

        <div className={styles.tierList}>
          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <span className={`${styles.tierBadge} ${styles.tierGoldBadge}`}>
                <VerifiedBadge tier="international" size="sm" />
                <span>{t('atm_international')}</span>
              </span>
            </div>
            <p className={styles.tierDesc}>
              {t('atm_international_desc')}
            </p>
          </div>

          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <span className={`${styles.tierBadge} ${styles.tierBlueBadge}`}>
                <VerifiedBadge tier="local" size="sm" />
                <span>{t('atm_local')}</span>
              </span>
            </div>
            <p className={styles.tierDesc}>
              {t('atm_local_desc')}
            </p>
          </div>

          <div className={styles.tierItem}>
            <div className={styles.tierHeader}>
              <span className={`${styles.tierBadge} ${styles.tierNoneBadge}`}>
                <VerifiedBadge tier="none" size="sm" />
                <span>{t('atm_not_verified')}</span>
              </span>
            </div>
            <p className={styles.tierDesc}>
              {t('atm_not_verified_desc')}
            </p>
          </div>
        </div>

        <button className={styles.gotItBtn} onClick={onClose}>
          {t('atm_got_it')}
        </button>
      </div>
    </Modal>
  );
}
