'use client';
import PropTypes from 'prop-types';

// @next
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

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
      // Redirect immediately without showing "Access Denied"
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return null;
  }

  return children;
}

AdminAuthGuard.propTypes = { children: PropTypes.node };
