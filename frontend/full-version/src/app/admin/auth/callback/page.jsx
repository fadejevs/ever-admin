'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { supabase } from '@/utils/supabase/client';

export default function AdminAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');

      if (code) {
        try {
          setStatus('Authenticating...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          if (data?.session?.user?.email?.endsWith('@everspeak.ai')) {
            setStatus('Success! Redirecting to admin dashboard...');
            setTimeout(() => router.push('/dashboard'), 1000);
          } else {
            setError('Access denied. Only @everspeak.ai emails allowed.');
            await supabase.auth.signOut();
            setTimeout(() => router.push('/admin/login'), 2000);
          }
        } catch (error) {
          setError('Authentication failed: ' + error.message);
          setTimeout(() => router.push('/admin/login'), 2000);
        }
      } else {
        setError('No authentication code found.');
        setTimeout(() => router.push('/admin/login'), 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        gap: 2,
        p: 3
      }}
    >
      <CircularProgress />
      <Typography variant="h6">{status}</Typography>

      {error && (
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      )}

      <Button variant="outlined" onClick={() => router.push('/admin/login')} sx={{ mt: 2 }}>
        Back to Login
      </Button>
    </Box>
  );
}
