'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabaseClient';
import { supabaseLogin, getUser } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLanguageStore } from '@/lib/store/useLanguageStore';
import styles from './page.module.css';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuthUser } = useAuthStore();
  const { t } = useLanguageStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await getSupabase().auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session?.access_token) {
          throw new Error('No access token found from Supabase');
        }

        const role = searchParams.get('role') || undefined;

        // Exchange Supabase token for our backend token
        await supabaseLogin(session.access_token, role);
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

        // Sign out of supabase on frontend since we only use it for the bridge
        await getSupabase().auth.signOut();

        if (user.role === 'agent') {
          router.replace('/agent-dashboard');
        } else if (user.role === 'admin' || user.role === 'customer_care') {
          router.replace('/admin');
        } else {
          router.replace('/profile');
        }
      } catch (err: unknown) {
        console.error('Auth callback error:', err);
        setError((err as Error).message || 'Authentication failed');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    handleAuth();
  }, [router, searchParams, setAuthUser]);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div>
          <h2 className={styles.errorTitle}>{t('acb_error_title')}</h2>
          <p>{error}</p>
          <p className={styles.redirectText}>{t('acb_redirecting_login')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner} />
      <p className={styles.spinnerText}>{t('acb_completing_login')}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}