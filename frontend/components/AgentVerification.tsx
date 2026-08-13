"use client";

import { useState, useEffect, useRef } from "react";
import { getMyVerificationStatus, applyForVerification, uploadVerificationProof } from "@/lib/api";
import { ShieldCheck, ShieldAlert, BadgeCheck, Upload } from "lucide-react";
import { useLanguageStore } from "@/lib/store/useLanguageStore";
import styles from "./AgentVerification.module.css";

interface VerificationApplication {
  id: number;
  tier: "local" | "international";
  status: "pending" | "approved" | "rejected";
  reviewer_notes?: string;
}

export function AgentVerification({ verificationTier }: { verificationTier: string }) {
  const t = useLanguageStore((s) => s.t);
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
    getMyVerificationStatus()
      .then((res) => setApps(res))
      .catch((err: unknown) => console.error(err))
      .finally(() => setLoading(false));
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
      alert(t('av_failed'));
    } finally {
      setUploadingTier(null);
      if (proofInputRef.current) {
        proofInputRef.current.value = '';
      }
    }
  };

  if (loading) return <div className={styles.loading}>{t('av_loading')}</div>;

  const applyBtn = (tier: 'local' | 'international', reapplying: boolean) => {
    const tierNum = tier === 'local' ? 1 : 2;
    const uploading = uploadingTier === tier;
    if (uploading) {
      return <><Upload size={16} /> {t('av_uploading')}</>;
    }
    return <><Upload size={16} /> {t(reapplying ? 'av_reapply' : 'av_apply').replace('{tier}', String(tierNum))}</>;
  };

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>
          <ShieldCheck size={24} color="var(--text-primary)" />
          {t('av_title')}
        </h2>
        <p className={styles.subtitle}>{t('av_subtitle')}</p>
      </div>

      <input
        type="file"
        ref={proofInputRef}
        accept="image/*,.pdf"
        className={styles.hiddenInput}
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
              <div className={styles.verificationTitle}>{t('av_tier1')}</div>
              <div className={styles.tier1Badge}>{t('av_tier1_sub')}</div>
            </div>
          </div>
          <p className={styles.verificationDesc}>
            {t('av_tier1_desc')}
          </p>

          {(() => {
            const app = apps.find(v => v.tier === 'local');
            const isApproved = verificationTier === 'local' || verificationTier === 'international';

            if (isApproved) {
              return (
                <div className={`${styles.verificationStatus} ${styles.statusApproved}`}>
                  <BadgeCheck size={18} /> {t('verified')}
                </div>
              );
            } else if (app && app.status === 'pending') {
              return (
                <div className={`${styles.verificationStatus} ${styles.statusPending}`}>
                  <ShieldAlert size={18} /> {t('av_review_pending')}
                </div>
              );
            } else if (app && app.status === 'rejected') {
              return (
                <div className={styles.rejectedWrap}>
                  <div className={`${styles.verificationStatus} ${styles.statusRejected}`}>
                    <ShieldAlert size={18} /> {t('av_rejected').replace('{notes}', app.reviewer_notes || '')}
                  </div>
                  <button
                    className={styles.verificationBtn}
                    onClick={() => { setTargetTier('local'); proofInputRef.current?.click(); }}
                    disabled={uploadingTier === 'local'}
                  >
                    {applyBtn('local', true)}
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
                  {applyBtn('local', false)}
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
              <div className={styles.verificationTitle}>{t('av_tier2')}</div>
              <div className={styles.tier2Badge}>{t('av_tier2_sub')}</div>
            </div>
          </div>
          <p className={styles.verificationDesc}>
            {t('av_tier2_desc')}
          </p>

          {(() => {
            const app = apps.find(v => v.tier === 'international');
            const isLocalApproved = verificationTier === 'local' || verificationTier === 'international';
            const isInternationalApproved = verificationTier === 'international';

            if (isInternationalApproved) {
              return (
                <div className={`${styles.verificationStatus} ${styles.statusApproved}`}>
                  <BadgeCheck size={18} /> {t('av_premium_verified')}
                </div>
              );
            } else if (app && app.status === 'pending') {
              return (
                <div className={`${styles.verificationStatus} ${styles.statusPending}`}>
                  <ShieldAlert size={18} /> {t('av_review_pending')}
                </div>
              );
            } else if (app && app.status === 'rejected') {
              return (
                <div className={styles.rejectedWrap}>
                  <div className={`${styles.verificationStatus} ${styles.statusRejected}`}>
                    <ShieldAlert size={18} /> {t('av_rejected').replace('{notes}', app.reviewer_notes || '')}
                  </div>
                  <button
                    className={`${styles.verificationBtn} ${styles.active}`}
                    onClick={() => { setTargetTier('international'); proofInputRef.current?.click(); }}
                    disabled={uploadingTier === 'international'}
                  >
                    {applyBtn('international', true)}
                  </button>
                </div>
              );
            } else if (!isLocalApproved) {
              return (
                <button className={styles.verificationBtn} disabled title={t('av_requires_tier1')}>
                  {t('av_complete_tier1')}
                </button>
              );
            } else {
              return (
                <button
                  className={`${styles.verificationBtn} ${styles.active}`}
                  onClick={() => { setTargetTier('international'); proofInputRef.current?.click(); }}
                  disabled={uploadingTier === 'international'}
                >
                  {applyBtn('international', false)}
                </button>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
}
