'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, ArrowRight, Check, Sparkles, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import { register } from '@/lib/api';
import { getSupabase } from '@/lib/supabaseClient';
import styles from './SignupPage.module.css';
import fpPromise from '@fingerprintjs/fingerprintjs';

export default function SignupPage() {
  const router = useRouter();
  const { user, isAuthenticated, login: setAuthUser } = useAuthStore();
  const { t } = useLanguageStore();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'agent') {
        router.replace('/agent-dashboard');
      } else {
        router.replace('/profile');
      }
    }
  }, [isAuthenticated, user, router]);

  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState<string | null>(null);

  React.useEffect(() => {
    // Initialize fingerprintjs on mount
    fpPromise.load().then(fp => fp.get()).then(result => {
      setDeviceId(result.visitorId);
    }).catch(err => {
      console.warn('Could not generate device ID', err);
    });
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !role) return;
    
    if (step === 2) {
      const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address (e.g., name@domain.com).');
        return;
      }

      setIsSubmitting(true);
      setError('');
      try {
        // Backend uses 'renter', frontend displays 'student' - map before sending
        const apiRole = role === 'student' ? 'renter' : role;
        const data = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: apiRole,
          device_id: deviceId || undefined,
        });

        // Store the token returned by the server
        const { setToken } = await import('@/lib/api');
        setToken(data.access_token);

        setIsSubmitting(false);
        setStep(3);

        setTimeout(() => {
          setAuthUser({
            id: String(data.user.id),
            name: data.user.name,
            email: data.user.email,
            role: role!,
            token: data.access_token,
          });
        }, 3000);
      } catch (err: unknown) {
        const error = err as Error;
        console.error(error);
        setError(error.message || 'Failed to create account');
        setIsSubmitting(false);
      }
      return;
    }
    
    setStep(step + 1);
  };

  const handleSupabaseGoogle = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role || 'student'}`,
        }
      });
      
      if (error) throw error;
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Google Sign-In failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.splitLayout}>
        {/* Left Side: Premium Imagery & Branding */}
        <div className={styles.visualSide}>
          <div className={styles.visualOverlay}>
            <div className={styles.brand}>
              <Building2 size={32} className={styles.brandIcon} />
              <span>House Agent</span>
            </div>
            
            <motion.div 
              className={styles.visualContent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1>{t('sg_hero_title')}</h1>
              <p>{t('sg_hero_sub')}</p>
              
              <div className={styles.testimonial}>
                <div className={styles.stars}>★★★★★</div>
                <p>&quot;{t('sg_testimonial')}&quot;</p>
                <div className={styles.author}>{t('sg_testimonial_author')}</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Interactive Forms */}
        <div className={styles.formSide}>
          <motion.div 
            className={styles.formWrapper}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.header}>
                    <h2 className={styles.title}>Join House Agent</h2>
                    <p className={styles.subtitle}>How do you want to use the platform?</p>
                  </div>

                  <div className={styles.roleSelector}>
                    <div 
                      className={`${styles.roleBtn} ${role === 'student' ? styles.active : ''}`}
                      onClick={() => setRole('student')}
                    >
                      <User size={32} className={styles.roleIcon} />
                      <span className={styles.roleTitle}>Student / Tenant</span>
                      <span className={styles.roleDesc}>I&apos;m looking for a place to live or roommates</span>
                    </div>
                    
                    <div 
                      className={`${styles.roleBtn} ${role === 'agent' ? styles.active : ''}`}
                      onClick={() => setRole('agent')}
                    >
                      <Briefcase size={32} className={styles.roleIcon} />
                      <span className={styles.roleTitle}>Agent / Landlord</span>
                      <span className={styles.roleDesc}>I want to list properties and find tenants</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {role && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={styles.rewardBoxWrapper}
                      >
                        <div className={styles.rewardBox}>
                          <Sparkles size={24} className={styles.rewardIcon} />
                          <div>
                            <div className={styles.rewardTitle}>
                              {role === 'student' ? "Welcome Bonus!" : "Agent Partnership"}
                            </div>
                            <div className={styles.rewardText}>
                              {role === 'student' 
                                ? "Sign up today and get your first profile match completely free, plus priority viewing on top listings."
                                : "Join as a verified agent to unlock 30 days of commission-free premium placements."}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    className={styles.submitBtn} 
                    onClick={handleNext}
                    disabled={!role}
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                  
                  <div className={styles.loginLink}>
                    {t('sg_have_account')} <Link href="/login">{t('sg_signin')}</Link>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.header}>
                    <h2 className={styles.title}>Let&apos;s get started. Create your account.</h2>
                    <p className={styles.subtitle}>
                      {role === 'student' ? "Find your perfect home in North Cyprus." : "List your properties to thousands of students."}
                    </p>
                  </div>

                  {error && <div className={styles.signupError}>{error}</div>}

                  <form className={styles.form} onSubmit={handleNext}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>{t('auth_full_name')}</label>
                      <input 
                        type="text" 
                        className={styles.input} 
                        required 
                        placeholder={t('sg_name_placeholder')}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>{t('auth_email')}</label>
                      <input 
                        type="email" 
                        className={styles.input} 
                        required 
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>{t('auth_password')}</label>
                      <input 
                        type="password" 
                        className={styles.input} 
                        required 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>

                    <p className={styles.rulesNote}>
                      {t('sg_rules_prefix')}{' '}
                      <Link href="/rules" className={styles.rulesLink}>{t('sg_rules_link')}</Link>
                    </p>

                    <button 
                      type="submit" 
                      className={styles.submitBtn} 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className={styles.loader}></span>
                      ) : (
                        t('auth_complete_signup')
                      )}
                    </button>
                    
                    <div className={styles.divider}>
                      <span className={styles.dividerLine} />
                      <span className={styles.dividerText}>or</span>
                      <span className={styles.dividerLine} />
                    </div>

                    <div className={styles.googleWrapper}>
                      <button
                        type="button"
                        onClick={handleSupabaseGoogle}
                        disabled={isSubmitting}
                        className={`${styles.googleBtn} ${isSubmitting ? styles.googleBtnDisabled : ''}`}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.85-2.22.83-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={styles.successState}
                >
                  <motion.div 
                    className={styles.successIconWrapper}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                  >
                    <Check size={40} className={styles.checkIcon} />
                  </motion.div>
                  <h2 className={styles.title}>Welcome Aboard!</h2>
                  <p className={styles.subtitle}>
                    {role === 'agent' 
                      ? "Redirecting you to complete your KYC verification..." 
                      : "Redirecting you to the properties page..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
