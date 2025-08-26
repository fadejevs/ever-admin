'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

export default function HandleTokens() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing tokens...');

  useEffect(() => {
    const handleTokens = async () => {
      try {
        // Get tokens from URL hash
        const urlHash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(urlHash);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('token_type');
        const expiresAt = hashParams.get('expires_at');
        const expiresIn = hashParams.get('expires_in');

        console.log('Handle tokens: Processing URL hash tokens');
        console.log('Handle tokens: Has access token:', !!accessToken);
        console.log('Handle tokens: Token type:', tokenType);

        if (accessToken && tokenType === 'bearer') {
          setStatus('Setting up your session...');

          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (!error && data?.session) {
            console.log('Handle tokens: Session set successfully');
            console.log('Handle tokens: User email:', data.session.user?.email);
            setStatus('Authentication successful! Redirecting...');

            // Small delay to ensure the session is properly set
            setTimeout(() => {
              router.replace('/dashboard/analytics');
            }, 500);
          } else {
            console.error('Handle tokens: Session setup failed:', error);
            setStatus('Authentication failed. Redirecting to login...');

            setTimeout(() => {
              router.replace('/login?error=session_setup_failed');
            }, 2000);
          }
        } else {
          console.error('Handle tokens: No valid tokens found');
          setStatus('No valid authentication tokens found. Redirecting to login...');

          setTimeout(() => {
            router.replace('/login?error=no_auth_data');
          }, 2000);
        }
      } catch (error) {
        console.error('Handle tokens: Exception:', error);
        setStatus('Authentication error. Redirecting to login...');

        setTimeout(() => {
          router.replace('/login?error=auth_error');
        }, 2000);
      }
    };

    handleTokens();
  }, [router]);

  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '400px',
        margin: '100px auto'
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
