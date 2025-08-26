'use client';
import PropTypes from 'prop-types';

// @next
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

// @project
import { supabase } from '@/utils/supabase/client';

export default function AdminAuthGuard({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user && session.user.email?.endsWith('@everspeak.ai')) {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && session.user.email?.endsWith('@everspeak.ai')) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Stack spacing={2} sx={{ maxWidth: 400, textAlign: 'center' }}>
          <Typography variant="h5">Access Denied</Typography>
          <Alert severity="error">Only @everspeak.ai email addresses can access the admin dashboard.</Alert>
          <Button variant="contained" onClick={() => router.push('/admin/login')}>
            Go to Login
          </Button>
        </Stack>
      </Box>
    );
  }

  return children;
}

AdminAuthGuard.propTypes = { children: PropTypes.node };
