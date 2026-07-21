import React, { useState } from 'react';
import styles from './RoommateMatchForm.module.css';

const STEPS = [
  { id: 1, title: 'Lifestyle' },
  { id: 2, title: 'Cleanliness' },
  { id: 3, title: 'Schedule' }
];

export function RoommateMatchForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState<Record<string, string>>({});

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
        <h2 className={styles.title}>Find Your Match</h2>
        <p className={styles.subtitle}>Let's understand your lifestyle to find the best roommate.</p>
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
              <h3 className={styles.question}>How often do you have guests over?</h3>
              <div className={styles.optionsGrid}>
                {['Rarely', 'Occasionally', 'Often', 'Constantly'].map(opt => (
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
              <h3 className={styles.question}>Do you smoke?</h3>
              <div className={styles.optionsGrid}>
                {['No', 'Yes, outside', 'Yes, inside', 'Occasionally'].map(opt => (
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
            <h3 className={styles.question}>How clean do you keep your space?</h3>
            <div className={styles.optionsGrid}>
              {['Immaculate', 'Clean but lived in', 'Messy but clean', 'Very relaxed'].map(opt => (
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
            <h3 className={styles.question}>Are you an early bird or night owl?</h3>
            <div className={styles.optionsGrid}>
              {['Early Bird', '9 to 5 Schedule', 'Night Owl', 'Mixed/Shifts'].map(opt => (
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
          <button className={styles.btnBack} onClick={prevStep}>Back</button>
        ) : <div />}
        <button className={styles.btnNext} onClick={nextStep}>
          {currentStep === STEPS.length ? 'Find Matches' : 'Next Step'}
        </button>
      </div>
    </div>
  );
}
