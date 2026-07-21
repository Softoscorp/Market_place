'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';
import styles from './ReportModal.module.css';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  propertyTitle?: string;
}

const REPORT_REASONS = [
  { id: 'fake', label: 'Fake Listing', description: 'This property does not exist or the photos are stolen.' },
  { id: 'wrong_price', label: 'Wrong Price / Move-in Cost', description: 'The actual cost is different from what is listed.' },
  { id: 'unavailable', label: 'Already Rented', description: 'The agent says this is no longer available but won\'t take it down.' },
  { id: 'other', label: 'Other', description: 'Something else is wrong with this listing.' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  propertyTitle 
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');

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
    <Modal isOpen={isOpen} onClose={onClose} title="Report Listing">
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.description}>
          Help us keep House Agent safe. Why are you reporting {propertyTitle ? <strong>{propertyTitle}</strong> : 'this listing'}?
        </p>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Select a reason</span>
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
          <span className={styles.label}>Additional Details (Optional)</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Please provide any other information that might help us investigate..."
            className={styles.textarea}
          />
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitDisabled}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
