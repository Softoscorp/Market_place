'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, ArrowRight, Check, Sparkles, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/lib/store/useAuthStore';
import styles from './SignupPage.module.css';
import { register } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const { login: setAuthUser } = useAuthStore();
  
  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !role) return;
    
    if (step === 2) {
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
        });

        // Store the token returned by the server
        const { setToken } = await import('@/lib/api');
        setToken(data.access_token);

        setAuthUser({
          id: String(data.user.id),
          name: data.user.name,
          email: data.user.email,
          role: role!,
          token: data.access_token,
        });

        setIsSubmitting(false);
        setStep(3);

        setTimeout(() => {
          if (role === 'agent') router.push('/kyc');
          else router.push('/search');
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
              <h1>Find Your Perfect Space in North Cyprus</h1>
              <p>Join thousands of students and verified agents on the most trusted housing platform.</p>
              
              <div className={styles.testimonial}>
                <div className={styles.stars}>★★★★★</div>
                <p>&quot;House Agent made finding my flatmate and apartment so easy!&quot;</p>
                <div className={styles.author}>— Sarah T., EMU Student</div>
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
                    Already have an account? <Link href="/login">Sign in</Link>
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

                  {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                  <form className={styles.form} onSubmit={handleNext}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Full Name {role === 'agent' ? '(or Agency Name)' : ''}</label>
                      <input 
                        type="text" 
                        className={styles.input} 
                        required 
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
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
                        "Complete Sign Up"
                      )}
                    </button>
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
