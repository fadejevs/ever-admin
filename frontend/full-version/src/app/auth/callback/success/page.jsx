'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

export default function AuthCallbackSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    let timeoutId;
    let subscription;

    const handleAuth = async () => {
      try {
        console.log('Auth success: Starting authentication process...');

        // Check for URL parameters that might indicate an error
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('Auth success: Error in URL parameters:', error, errorDescription);
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => {
            router.replace(`/login?error=auth_error&details=${encodeURIComponent(errorDescription || error)}`);
          }, 1000);
          return;
        }

        // First, check if there's already a session
        const {
          data: { session: initialSession }
        } = await supabase.auth.getSession();

        if (initialSession) {
          console.log('Auth success: Initial session found');
          setStatus('Authentication successful! Redirecting...');
          router.replace('/dashboard/analytics');
          return;
        }

        console.log('Auth success: Waiting for auth state change...');
        setStatus('Completing authentication...');

        // Listen for auth state changes
        const {
          data: { subscription: authSubscription }
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change in success page:', event, session);

          if (event === 'SIGNED_IN' && session) {
            console.log('Auth success: User signed in successfully');
            setStatus('Authentication successful! Redirecting...');

            // Small delay to ensure state is fully synced
            setTimeout(() => {
              router.replace('/dashboard/analytics');
            }, 500);
          } else if (event === 'SIGNED_OUT') {
            console.log('Auth success: User signed out');
            setStatus('Authentication failed. Redirecting to login...');
            setTimeout(() => {
              router.replace('/login?error=auth_signout');
            }, 1000);
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('Auth success: Token refreshed successfully');
            setStatus('Authentication successful! Redirecting...');
            setTimeout(() => {
              router.replace('/dashboard/analytics');
            }, 500);
          }
        });

        subscription = authSubscription;

        // Set a timeout in case nothing happens
        timeoutId = setTimeout(() => {
          console.log('Auth success: Timeout reached');
          setStatus('Authentication timed out. Redirecting to login...');
          setTimeout(() => {
            router.replace('/login?error=auth_timeout');
          }, 1000);
        }, 15000); // 15 second timeout
      } catch (error) {
        console.error('Auth success error:', error);
        setStatus('Authentication error. Redirecting to login...');
        setTimeout(() => {
          router.replace('/login?error=auth_error');
        }, 1000);
      }
    };

    handleAuth();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router, searchParams]);

  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        maxWidth: '400px',
        margin: '100px auto',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <div
        style={{
          fontSize: '24px',
          marginBottom: '20px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}
      >
        🔐
      </div>
      <p
        style={{
          fontSize: '16px',
          color: '#666',
          lineHeight: '1.5'
        }}
      >
        {status}
      </p>
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
