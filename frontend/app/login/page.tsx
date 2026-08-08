'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from '../signup/SignupPage.module.css';
import { login as apiLogin, getUser, resetPassword } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, login: setAuthUser } = useAuthStore();
  const { t } = useLanguageStore();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'agent') {
        router.replace('/agent-dashboard');
      } else if (user.role === 'admin' || user.role === 'customer_care') {
        router.replace('/admin');
      } else {
        router.replace('/profile');
      }
    }
  }, [isAuthenticated, user, router]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await apiLogin(formData.email, formData.password);
      const user = await getUser();
      
      const { getToken } = await import('@/lib/api');
      const token = getToken() || '';

      setSuccess(true);

      // Save credentials for biometric sign-in on the native app
      const { saveBiometricCredentials } = await import('@/lib/biometrics');
      saveBiometricCredentials(formData.email, formData.password).catch(() => {});

      setTimeout(() => {
        setAuthUser({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role === 'renter' ? 'student' : user.role,
          token,
        });
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Invalid email or password');
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const { getBiometricCredentials, deleteBiometricCredentials } = await import('@/lib/biometrics');
      const creds = await getBiometricCredentials();
      if (!creds) {
        setError('Biometric sign-in unavailable. Please sign in with your email and password.');
        setIsSubmitting(false);
        return;
      }

      await apiLogin(creds.username, creds.password);
      const user = await getUser();
      const { getToken } = await import('@/lib/api');
      const token = getToken() || '';

      setSuccess(true);
      setTimeout(() => {
        setAuthUser({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role === 'renter' ? 'student' : user.role,
          token,
        });
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      // If the stored password is stale (backend rejects it), clear it so the user signs in manually.
      const { deleteBiometricCredentials } = await import('@/lib/biometrics');
      deleteBiometricCredentials().catch(() => {});
      setError(error.message || 'Biometric sign-in failed. Please sign in with your email and password.');
      setIsSubmitting(false);
    }
  };

  const [hasBiometrics, setHasBiometrics] = React.useState(false);
  const autoPromptedRef = React.useRef(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const { isBiometricAvailable, hasBiometricCredentials } = await import('@/lib/biometrics');
      const [available, saved] = await Promise.all([
        isBiometricAvailable().catch(() => false),
        hasBiometricCredentials().catch(() => false),
      ]);
      if (active) setHasBiometrics(available && saved);
      // Auto-prompt once on native when credentials exist but no session is active
      if (active && available && saved && !autoPromptedRef.current) {
        autoPromptedRef.current = true;
        handleBiometricLogin();
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    setResetError('');
    setResetMessage('');

    try {
      const res = await resetPassword({
        email: forgotEmail,
        new_password: newPassword,
      });
      setResetMessage(res.message || 'Password reset successfully! You can now sign in.');
      setIsResetting(false);
      setFormData({ email: forgotEmail, password: newPassword });
      setTimeout(() => {
        setShowForgot(false);
        setResetMessage('');
      }, 2000);
    } catch (err: unknown) {
      const error = err as Error;
      setResetError(error.message || 'Failed to reset password');
      setIsResetting(false);
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
              <h1>{t('auth_welcome_back')}</h1>
              <p>{t('auth_login_sub')}</p>
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
              {showForgot ? (
                /* Forgot Password View */
                <motion.div
                  key="forgot-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.header}>
                    <h2 className={styles.title}>{t('auth_reset_title')}</h2>
                    <p className={styles.subtitle}>{t('auth_reset_sub')}</p>
                  </div>

                  {resetError && <div style={{ color: 'var(--danger)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>{resetError}</div>}
                  {resetMessage && <div style={{ color: 'var(--success)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>{resetMessage}</div>}

                  <form className={styles.form} onSubmit={handleResetPassword}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>{t('auth_email')}</label>
                      <input 
                        type="email" 
                        className={styles.input} 
                        required 
                        placeholder="john@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.label}>{t('auth_new_password')}</label>
                      <input 
                        type="password" 
                        className={styles.input} 
                        required 
                        minLength={6}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className={styles.submitBtn} 
                      disabled={isResetting}
                    >
                      {isResetting ? <span className={styles.loader}></span> : t('auth_reset_btn')}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setShowForgot(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--space-4)',
                        cursor: 'pointer',
                        width: '100%',
                        fontSize: 'var(--text-base)',
                        textAlign: 'center'
                      }}
                    >
                      {t('auth_cancel')}
                    </button>
                  </form>
                </motion.div>
              ) : !success ? (
                /* Login Form View */
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.header}>
                    <h2 className={styles.title}>{t('auth_signin_title')}</h2>
                    <p className={styles.subtitle}>{t('auth_signin_sub')}</p>
                  </div>

                  {error && <div style={{ color: 'var(--danger)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>{error}</div>}

                  <form className={styles.form} onSubmit={handleSubmit}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className={styles.label}>{t('auth_password')}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(formData.email);
                            setShowForgot(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: 'var(--text-sm)',
                            cursor: 'pointer',
                            padding: 0,
                            marginBottom: 'var(--space-2)'
                          }}
                        >
                          {t('auth_forgot_password')}
                        </button>
                      </div>
                      <input 
                        type="password" 
                        className={styles.input} 
                        required 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className={styles.submitBtn} 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className={styles.loader}></span>
                      ) : (
                        t('auth_signin_btn')
                      )}
                    </button>
                  </form>
                  
                  <div className={styles.loginLink}>
                    {t('auth_no_account')} <Link href="/signup">{t('nav_signup')}</Link>
                  </div>

                  {hasBiometrics && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-5) 0' }}>
                        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>or</span>
                        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                      </div>
                      <button
                        type="button"
                        onClick={handleBiometricLogin}
                        disabled={isSubmitting}
                        className={styles.biometricBtn}
                      >
                        <Fingerprint size={20} />
                        {isSubmitting ? t('auth_signin_btn') : 'Sign in with Face ID / Fingerprint'}
                      </button>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="success"
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
                  <h2 className={styles.title}>Signed In!</h2>
                  <p className={styles.subtitle}>
                    Redirecting you to the home page...
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
