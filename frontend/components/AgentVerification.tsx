"use client";

import { useState, useEffect, useRef } from "react";
import { getMyVerificationStatus, applyForVerification, uploadVerificationProof, type QualityReport } from "@/lib/api";
import { ShieldCheck, ShieldAlert, BadgeCheck, Upload, User, BookUser } from "lucide-react";
import { useLanguageStore } from "@/lib/store/useLanguageStore";
import styles from "./AgentVerification.module.css";

interface VerificationApplication {
  id: number;
  tier: "local" | "international";
  status: "pending" | "approved" | "rejected";
  reviewer_notes?: string;
}

function qualityMessage(detail: string | unknown, t: (key: string) => string): string {
  if (typeof detail !== "string") return "";
  const code = detail.split(":")[0];
  if (code === "verify_photo_blurry") return t('verify_photo_blurry');
  if (code === "verify_photo_dark") return t('verify_photo_dark');
  if (code === "verify_photo_overexposed") return t('verify_photo_overexposed');
  if (code === "verify_white_background") return t('verify_white_background');
  return "";
}

function DocUploadStep({ tier, onDone }: { tier: "local" | "international"; onDone: () => void }) {
  const t = useLanguageStore((s) => s.t);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [selfieQuality, setSelfieQuality] = useState<QualityReport | null>(null);
  const [passportQuality, setPassportQuality] = useState<QualityReport | null>(null);
  const [uploading, setUploading] = useState<"selfie" | "passport" | null>(null);
  const [applying, setApplying] = useState(false);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);

  const handleDocUpload = async (kind: "selfie" | "passport", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(kind);
      const { url, quality } = await uploadVerificationProof(file, kind);
      if (kind === 'selfie') {
        setSelfie(url);
        setSelfieQuality(quality ?? null);
      } else {
        setPassport(url);
        setPassportQuality(quality ?? null);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? qualityMessage(err.message, t) : "";
      alert(msg || t('av_failed_upload'));
    } finally {
      setUploading(null);
      if (kind === 'selfie' && selfieInputRef.current) selfieInputRef.current.value = '';
      if (kind === 'passport' && passportInputRef.current) passportInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selfie || !passport) return;
    try {
      setApplying(true);
      await applyForVerification(
        tier,
        selfie,
        passport,
        { selfie: selfieQuality, passport: passportQuality },
      );
      onDone();
    } catch (err: unknown) {
      console.error(err);
      alert(t('av_failed'));
    } finally {
      setApplying(false);
    }
  };

  const uploadingSelfie = uploading === 'selfie';
  const uploadingPassport = uploading === 'passport';

  return (
    <div className={styles.docsStep}>
      <p className={styles.docsHint}>{t('av_docs_hint')}</p>
      <div className={styles.docRow}>
        <button
          type="button"
          className={styles.docBtn}
          onClick={() => selfieInputRef.current?.click()}
          disabled={uploadingSelfie || uploadingPassport || applying}
        >
          <User size={16} />
          {selfie ? t('av_selfie_done') : uploadingSelfie ? t('av_uploading') : t('av_selfie_label')}
        </button>
        <button
          type="button"
          className={styles.docBtn}
          onClick={() => passportInputRef.current?.click()}
          disabled={uploadingSelfie || uploadingPassport || applying}
        >
          <BookUser size={16} />
          {passport ? t('av_passport_done') : uploadingPassport ? t('av_uploading') : t('av_passport_label')}
        </button>
      </div>
      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!selfie || !passport || applying}
      >
        {applying ? <><Upload size={16} /> {t('av_applying')}</> : <><Upload size={16} /> {t('av_submit_docs')}</>}
      </button>

      <input
        type="file"
        ref={selfieInputRef}
        accept="image/*,.pdf"
        className={styles.hiddenInput}
        onChange={(e) => handleDocUpload('selfie', e)}
      />
      <input
        type="file"
        ref={passportInputRef}
        accept="image/*,.pdf"
        className={styles.hiddenInput}
        onChange={(e) => handleDocUpload('passport', e)}
      />
    </div>
  );
}

export function AgentVerification({ verificationTier }: { verificationTier: string }) {
  const t = useLanguageStore((s) => s.t);
  const [apps, setApps] = useState<VerificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getMyVerificationStatus()
      .then((res) => setApps(res))
      .catch((err: unknown) => console.error(err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className={styles.loading}>{t('av_loading')}</div>;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>
          <ShieldCheck size={24} color="var(--text-primary)" />
          {t('av_title')}
        </h2>
        <p className={styles.subtitle}>{t('av_subtitle')}</p>
      </div>

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
                  <DocUploadStep tier="local" onDone={() => setRefreshKey(k => k + 1)} />
                </div>
              );
            } else {
              return <DocUploadStep tier="local" onDone={() => setRefreshKey(k => k + 1)} />;
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
                  <DocUploadStep tier="international" onDone={() => setRefreshKey(k => k + 1)} />
                </div>
              );
            } else if (!isLocalApproved) {
              return (
                <button className={styles.verificationBtn} disabled title={t('av_requires_tier1')}>
                  {t('av_complete_tier1')}
                </button>
              );
            } else {
              return <DocUploadStep tier="international" onDone={() => setRefreshKey(k => k + 1)} />;
            }
          })()}
        </div>
      </div>
    </div>
  );
}