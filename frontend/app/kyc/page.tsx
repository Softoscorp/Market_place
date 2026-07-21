'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, CheckCircle, TrendingUp, Award } from 'lucide-react';
import styles from './KycPage.module.css';
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';
import { submitKycDocument as submitKYC } from '@/lib/api';

export default function KycPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Create a mock file since the UI currently doesn't have an actual file input element handled properly
    // In a real implementation we would get this from an input type="file"
    
    try {
      await submitKYC('license.pdf');
      setSubmitted(true);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Failed to submit KYC. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <BackButton />
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {!submitted ? (
          <>
            <div className={styles.iconWrapper}>
              <ShieldCheck size={40} />
            </div>
            
            <h1 className={styles.title}>Become a Verified Agent</h1>
            <p className={styles.subtitle}>
              Upload your TRNC Estate Agent License to unlock premium features and build trust with thousands of students.
            </p>

            <div className={styles.benefits}>
              <div className={styles.benefitItem}>
                <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                <span><strong>Trusted Agent Badge</strong> displayed on all your listings.</span>
              </div>
              <div className={styles.benefitItem}>
                <TrendingUp size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                <span><strong>3x more visibility</strong> in search results.</span>
              </div>
              <div className={styles.benefitItem}>
                <Award size={20} color="#FF9500" style={{ flexShrink: 0 }} />
                <span><strong>30 Days Commission-Free</strong> premium placements upon approval.</span>
              </div>
            </div>

            {error && <div style={{color: 'red', marginTop: '1rem', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.uploadSection}>
              <label className={styles.label}>Upload TRNC License or Agency ID</label>
              <div className={styles.uploadBox}>
                <FileText size={32} />
                <span>Drag & drop your PDF or image here</span>
                <span style={{ fontSize: '0.75rem' }}>Max file size: 5MB</span>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </form>
          </>
        ) : (
          <motion.div 
            className={styles.successState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}
            >
              <CheckCircle size={80} color="var(--success)" />
            </motion.div>
            <h1 className={styles.title}>Documents Received!</h1>
            <p className={styles.subtitle}>
              Our team will review your application within 24 hours. Once approved, your Verified Agent badge will automatically appear on your profile.
            </p>
            <Link href="/post-listing" style={{ textDecoration: 'none' }}>
              <button className={styles.submitBtn} style={{ marginTop: '1rem' }}>
                Post your first listing
              </button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
