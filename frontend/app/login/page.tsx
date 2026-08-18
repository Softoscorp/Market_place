'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from '../signup/SignupPage.module.css';
import { login as apiLogin, getUser, forgotPassword, resetPassword } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabaseClient';

function LoginContent() {
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
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('reset_token') || '';
  const resetEmail = searchParams.get('email') || '';
  const isPasswordReset = Boolean(resetToken && resetEmail);
  const [showForgot, setShowForgot] = useState(isPasswordReset);
  const [forgotEmail, setForgotEmail] = useState(isPasswordReset ? resetEmail : '');
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
      const { mapBackendUser } = await import('@/lib/store/useAuthStore');

      setSuccess(true);

      // Save credentials for biometric sign-in on the native app
      const { saveBiometricCredentials } = await import('@/lib/biometrics');
      saveBiometricCredentials(formData.email, formData.password).catch(() => {});

      setTimeout(() => {
        setAuthUser(mapBackendUser(user, token));
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
      const { getBiometricCredentials } = await import('@/lib/biometrics');
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
      const { mapBackendUser } = await import('@/lib/store/useAuthStore');

      setSuccess(true);
      setTimeout(() => {
        setAuthUser(mapBackendUser(user, token));
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

  const handleSupabaseGoogle = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    setResetError('');
    setResetMessage('');

    try {
      if (isPasswordReset) {
        const res = await resetPassword({
          email: forgotEmail,
          token: resetToken,
          new_password: newPassword,
        });
        setResetMessage(res.message || 'Password updated! You can now sign in.');
        setIsResetting(false);
        setFormData({ email: forgotEmail, password: newPassword });
        setTimeout(() => {
          setShowForgot(false);
          setResetMessage('');
          router.replace('/login');
        }, 2000);
      } else {
        const res = await forgotPassword({ email: forgotEmail });
        setResetMessage(res.message || 'If an account exists, a reset link has been emailed to you.');
        setIsResetting(false);
      }
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

                  {resetError && <div className={styles.errorText}>{resetError}</div>}
                  {resetMessage && <div className={styles.successText}>{resetMessage}</div>}

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
                        disabled={isPasswordReset}
                      />
                    </div>

                    {isPasswordReset && (
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
                    )}

                    <button 
                      type="submit" 
                      className={styles.submitBtn} 
                      disabled={isResetting}
                    >
                      {isResetting ? <span className={styles.loader}></span> : isPasswordReset ? t('auth_reset_btn') : t('auth_send_link')}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => {
                        setShowForgot(false);
                        setResetMessage('');
                        if (isPasswordReset) router.replace('/login');
                      }}
                      className={styles.cancelBtn}
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

                  {error && <div className={styles.errorText}>{error}</div>}

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
                      <div className={styles.labelRow}>
                        <label className={styles.label}>{t('auth_password')}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(formData.email);
                            setShowForgot(true);
                          }}
                          className={styles.forgotBtn}
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
                  
                  <div className={styles.loginLink}>
                    {t('auth_no_account')} <Link href="/signup">{t('nav_signup')}</Link>
                  </div>

                  {hasBiometrics && (
                    <>
                      <div className={styles.divider}>
                        <span className={styles.dividerLine} />
                        <span className={styles.dividerText}>or</span>
                        <span className={styles.dividerLine} />
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
