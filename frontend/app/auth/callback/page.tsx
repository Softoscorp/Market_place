'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabaseClient';
import { supabaseLogin, getUser } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuthUser } = useAuthStore();
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>
        <div>
          <h2 style={{ color: 'red', marginBottom: '16px' }}>Authentication Error</h2>
          <p>{error}</p>
          <p style={{ marginTop: '16px', color: '#666' }}>Redirecting you back to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '20px' }}>Completing login...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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