'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check } from 'lucide-react';
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

      setAuthUser({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role === 'renter' ? 'student' : user.role,
        token,
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Invalid email or password');
      setIsSubmitting(false);
    }
  };

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

                  {resetError && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{resetError}</div>}
                  {resetMessage && <div style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.9rem' }}>{resetMessage}</div>}

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
                        color: '#64748b',
                        marginTop: '1rem',
                        cursor: 'pointer',
                        width: '100%',
                        fontSize: '0.9rem',
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

                  {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

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
                            color: '#2563eb',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            padding: 0,
                            marginBottom: '0.5rem'
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
