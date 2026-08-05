"use client";

import { useState, useEffect, useRef } from "react";
import { getMyVerificationStatus, applyForVerification, uploadVerificationProof } from "@/lib/api";
import { ShieldCheck, ShieldAlert, BadgeCheck, Upload } from "lucide-react";
import styles from "./AgentVerification.module.css";

interface VerificationApplication {
  id: number;
  tier: "local" | "international";
  status: "pending" | "approved" | "rejected";
  reviewer_notes?: string;
}

export function AgentVerification({ verificationTier }: { verificationTier: string }) {
  const [apps, setApps] = useState<VerificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTier, setUploadingTier] = useState<string | null>(null);
  const [targetTier, setTargetTier] = useState<"local" | "international">("local");
  const proofInputRef = useRef<HTMLInputElement>(null);

  const loadStatus = async () => {
    try {
      const res = await getMyVerificationStatus();
      setApps(res);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingTier(targetTier);
      const { url } = await uploadVerificationProof(file);
      await applyForVerification(targetTier, [url]);
      await loadStatus();
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to submit verification application. Please try again.");
    } finally {
      setUploadingTier(null);
      if (proofInputRef.current) {
        proofInputRef.current.value = '';
      }
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading verification status...</div>;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>
          <ShieldCheck size={24} color="#0f172a" />
          Verification Center
        </h2>
        <p className={styles.subtitle}>Build trust by verifying your identity and business</p>
      </div>

      <input
        type="file"
        ref={proofInputRef}
        accept="image/*,.pdf"
        style={{ display: 'none' }}
        onChange={handleProofUpload}
      />

      <div className={styles.verificationGrid}>
        {/* Tier 1 Card */}
        <div className={`${styles.verificationCard} ${styles.tier1}`}>
          <div className={styles.verificationHeader}>
            <div className={`${styles.verificationIcon} ${styles.tier1Icon}`}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className={styles.verificationTitle}>Tier 1: Local</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identity Verification</div>
            </div>
          </div>
          <p className={styles.verificationDesc}>
            Upload a Government-issued ID Card, Driver's License, or Passport to prove your identity.
          </p>

          {(() => {
            const app = apps.find(v => v.tier === 'local');
            const isApproved = verificationTier === 'local' || verificationTier === 'international';

            if (isApproved) {
              return (
                <div className={`${styles.verificationStatus} ${styles.statusApproved}`}>
                  <BadgeCheck size={18} /> Verified
                </div>
              );
            } else if (app && app.status === 'pending') {
              return (
                <div className={`${styles.verificationStatus} ${styles.statusPending}`}>
                  <ShieldAlert size={18} /> Review Pending
                </div>
              );
            } else if (app && app.status === 'rejected') {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className={`${styles.verificationStatus}`} style={{ color: '#ef4444', marginBottom: 0 }}>
                    <ShieldAlert size={18} /> Rejected: {app.reviewer_notes}
                  </div>
                  <button
                    className={styles.verificationBtn}
                    onClick={() => { setTargetTier('local'); proofInputRef.current?.click(); }}
                    disabled={uploadingTier === 'local'}
                  >
                    {uploadingTier === 'local' ? 'Uploading...' : <><Upload size={16} /> Re-apply for Tier 1</>}
                  </button>
                </div>
              );
            } else {
              return (
                <button
                  className={styles.verificationBtn}
                  onClick={() => { setTargetTier('local'); proofInputRef.current?.click(); }}
                  disabled={uploadingTier === 'local'}
                >
                  {uploadingTier === 'local' ? 'Uploading...' : <><Upload size={16} /> Apply for Tier 1</>}
                </button>
              );
            }
          })()}
        </div>

        {/* Tier 2 Card */}
        <div className={`${styles.verificationCard} ${styles.tier2}`}>
          <div className={styles.verificationHeader}>
            <div className={`${styles.verificationIcon} ${styles.tier2Icon}`}>
              <BadgeCheck size={24} />
            </div>
            <div>
              <div className={styles.verificationTitle}>Tier 2: International</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Verification</div>
            </div>
          </div>
          <p className={styles.verificationDesc}>
            Upload your registered Business Certificate or Professional Real Estate License for premium visibility.
          </p>

          {(() => {
            const app = apps.find(v => v.tier === 'international');
            const isLocalApproved = verificationTier === 'local' || verificationTier === 'international';
            const isInternationalApproved = verificationTier === 'international';

            if (isInternationalApproved) {
              return (
                <div className={`${styles.verificationStatus} ${styles.statusApproved}`}>
                  <BadgeCheck size={18} /> Premium Verified
                </div>
              );
            } else if (app && app.status === 'pending') {
              return (
                <div className={`${styles.verificationStatus} ${styles.statusPending}`}>
                  <ShieldAlert size={18} /> Review Pending
                </div>
              );
            } else if (app && app.status === 'rejected') {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className={`${styles.verificationStatus}`} style={{ color: '#ef4444', marginBottom: 0 }}>
                    <ShieldAlert size={18} /> Rejected: {app.reviewer_notes}
                  </div>
                  <button
                    className={`${styles.verificationBtn} ${styles.active}`}
                    onClick={() => { setTargetTier('international'); proofInputRef.current?.click(); }}
                    disabled={uploadingTier === 'international'}
                  >
                    {uploadingTier === 'international' ? 'Uploading...' : <><Upload size={16} /> Re-apply for Tier 2</>}
                  </button>
                </div>
              );
            } else if (!isLocalApproved) {
              return (
                <button className={styles.verificationBtn} disabled title="Requires Tier 1 Verification first">
                  Complete Tier 1 First
                </button>
              );
            } else {
              return (
                <button
                  className={`${styles.verificationBtn} ${styles.active}`}
                  onClick={() => { setTargetTier('international'); proofInputRef.current?.click(); }}
                  disabled={uploadingTier === 'international'}
                >
                  {uploadingTier === 'international' ? 'Uploading...' : <><Upload size={16} /> Apply for Tier 2</>}
                </button>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
}
