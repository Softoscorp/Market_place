'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './ReportModal.module.css';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  propertyTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  propertyTitle 
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const t = useLanguageStore((s) => s.t);

  const REPORT_REASONS = [
    { id: 'fake', label: t('rm_fake_listing'), description: t('rm_fake_listing_desc') },
    { id: 'wrong_price', label: t('rm_wrong_price'), description: t('rm_wrong_price_desc') },
    { id: 'unavailable', label: t('rm_already_rented'), description: t('rm_already_rented_desc') },
    { id: 'other', label: t('rm_other'), description: t('rm_other_desc') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReason) {
      onSubmit(selectedReason, details);
      setSelectedReason('');
      setDetails('');
      onClose();
    }
  };

  const isSubmitDisabled = !selectedReason || (selectedReason === 'other' && details.trim().length === 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('rm_title')}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.description}>
          {t('rm_desc').replace('{name}', propertyTitle || t('rm_other'))}
        </p>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>{t('rm_select_reason')}</span>
          <div className={styles.optionsList}>
            {REPORT_REASONS.map((reason) => (
              <label 
                key={reason.id} 
                className={clsx(
                  styles.option, 
                  selectedReason === reason.id && styles.optionSelected
                )}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className={styles.radioInput}
                />
                <div className={styles.optionText}>
                  <span className={styles.optionTitle}>{reason.label}</span>
                  <span className={styles.optionDesc}>{reason.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>{t('rm_details_optional')}</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('rm_details_placeholder')}
            className={styles.textarea}
          />
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('auth_cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitDisabled}>
            {t('rm_submit_report')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
