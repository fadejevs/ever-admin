'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { supabase } from '@/utils/supabase/client';
import { isAdminEmail } from '@/utils/adminAuth';

export default function AdminAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for URL hash tokens (from magic link)
        const urlHash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(urlHash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('token_type');

        // Check for PKCE code in query parameters
        const code = searchParams.get('code');

        if (accessToken && tokenType === 'bearer') {
          // Handle tokens from URL hash
          setStatus('Setting up admin session...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) throw error;

          if (data?.session?.user && isAdminEmail(data.session.user.email)) {
            setStatus('Admin authentication successful! Redirecting...');
            setTimeout(() => router.push('/dashboard'), 1000);
          } else {
            setError('Access denied. Only @everspeak.ai emails allowed.');
            await supabase.auth.signOut();
            setTimeout(() => router.push('/admin/login'), 2000);
          }
        } else if (code) {
          // Handle PKCE code
          setStatus('Authenticating...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) throw error;
          
          if (data?.session?.user && isAdminEmail(data.session.user.email)) {
            setStatus('Success! Redirecting to admin dashboard...');
            setTimeout(() => router.push('/dashboard'), 1000);
          } else {
            setError('Access denied. Only @everspeak.ai emails allowed.');
            await supabase.auth.signOut();
            setTimeout(() => router.push('/admin/login'), 2000);
          }
        } else {
          setError('No authentication data found.');
          setTimeout(() => router.push('/admin/login'), 2000);
        }
      } catch (error) {
        setError('Authentication failed: ' + error.message);
        setTimeout(() => router.push('/admin/login'), 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      gap: 2
    }}>
      <CircularProgress />
      <Typography variant="h6">{status}</Typography>
      {error && (
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
