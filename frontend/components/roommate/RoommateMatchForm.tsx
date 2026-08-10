'use client';

import React, { useState } from 'react';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './RoommateMatchForm.module.css';

export function RoommateMatchForm() {
  const t = useLanguageStore((s) => s.t);
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const STEPS = [
    { id: 1 },
    { id: 2 },
    { id: 3 }
  ];

  const handleSelect = (key: string, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('rmf_title')}</h2>
        <p className={styles.subtitle}>{t('rmf_subtitle')}</p>
      </div>

      <div className={styles.progress}>
        {STEPS.map(step => (
          <div 
            key={step.id} 
            className={`${styles.progressStep} ${currentStep >= step.id ? styles.progressStepActive : ''}`} 
          />
        ))}
      </div>

      <div className={styles.stepContent}>
        {currentStep === 1 && (
          <>
            <div>
              <h3 className={styles.question}>{t('rmf_q_guests')}</h3>
              <div className={styles.optionsGrid}>
                {[t('rmf_guests_rarely'), t('rmf_guests_occasionally'), t('rmf_guests_often'), t('rmf_guests_constantly')].map(opt => (
                  <div 
                    key={opt}
                    className={`${styles.optionCard} ${selections['guests'] === opt ? styles.optionCardSelected : ''}`}
                    onClick={() => handleSelect('guests', opt)}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className={styles.question}>{t('rmf_q_smoke')}</h3>
              <div className={styles.optionsGrid}>
                {[t('rmf_smoke_no'), t('rmf_smoke_sometimes'), t('rmf_smoke_outside'), t('rmf_smoke_inside')].map(opt => (
                  <div 
                    key={opt}
                    className={`${styles.optionCard} ${selections['smoking'] === opt ? styles.optionCardSelected : ''}`}
                    onClick={() => handleSelect('smoking', opt)}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <div>
            <h3 className={styles.question}>{t('rmf_q_clean')}</h3>
            <div className={styles.optionsGrid}>
              {[t('rmf_clean_immaculate'), t('rmf_clean_lived'), t('rmf_clean_messy'), t('rmf_clean_relaxed')].map(opt => (
                <div 
                  key={opt}
                  className={`${styles.optionCard} ${selections['cleanliness'] === opt ? styles.optionCardSelected : ''}`}
                  onClick={() => handleSelect('cleanliness', opt)}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h3 className={styles.question}>{t('rmf_q_schedule')}</h3>
            <div className={styles.optionsGrid}>
              {[t('rmf_sched_early'), t('rmf_sched_9to5'), t('rmf_sched_night'), t('rmf_sched_mixed')].map(opt => (
                <div 
                  key={opt}
                  className={`${styles.optionCard} ${selections['schedule'] === opt ? styles.optionCardSelected : ''}`}
                  onClick={() => handleSelect('schedule', opt)}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {currentStep > 1 ? (
          <button className={styles.btnBack} onClick={prevStep}>{t('back')}</button>
        ) : <div />}
        <button className={styles.btnNext} onClick={nextStep}>
          {currentStep === STEPS.length ? t('rmf_find_matches') : t('rmf_next_step')}
        </button>
      </div>
    </div>
  );
}
