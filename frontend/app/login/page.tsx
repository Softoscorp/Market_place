'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import styles from '../signup/SignupPage.module.css';
import { login as apiLogin, getUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login: setAuthUser } = useAuthStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Login returns the token, which apiLogin stores in localStorage
      await apiLogin(formData.email, formData.password);
      
      // Fetch user profile to get their role
      const user = await getUser();
      
      setAuthUser({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
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
              <h1>Welcome Back</h1>
              <p>Sign in to manage your properties, roommates, and search history.</p>
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
              {!success ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.header}>
                    <h2 className={styles.title}>Sign In</h2>
                    <p className={styles.subtitle}>
                      Welcome back! Please enter your details.
                    </p>
                  </div>

                  {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                  <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Email Address</label>
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
                      <label className={styles.label}>Password</label>
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
                        "Sign In"
                      )}
                    </button>
                  </form>
                  
                  <div className={styles.loginLink}>
                    Don&apos;t have an account? <Link href="/signup">Sign up</Link>
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
