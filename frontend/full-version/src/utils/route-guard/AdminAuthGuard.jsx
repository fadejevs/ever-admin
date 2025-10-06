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
      console.log('AdminAuthGuard: Checking session...');
      const {
        data: { session }
      } = await supabase.auth.getSession();
      console.log('AdminAuthGuard: Session data:', session);
      
      if (session?.user && session.user.email?.endsWith('@everspeak.ai')) {
        console.log('AdminAuthGuard: Valid admin session found');
        setUser(session.user);
      } else {
        console.log('AdminAuthGuard: No valid admin session found - setting up dev session');
        // For development: Set up a session with the token you provided
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IncrN25iVmovKyt5R2VmTDciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2pweWRndHptYmN3Ynl1ZnB2dXBwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhZTFlNjJjZS1kMjNlLTQyMzYtOGEyYi0xY2YzMTRiYWViM2UiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU4NjIwOTg5LCJpYXQiOjE3NTg2MTczODksImVtYWlsIjoicmFsZnNAZXZlcnNwZWFrLmFpIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InJhbGZzQGV2ZXJzcGVhay5haSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImFlMWU2MmNlLWQyM2UtNDIzNi04YTJiLTFjZjMxNGJhZWIzZSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTc1ODYxNzM4OX1dLCJzZXNzaW9uX2lkIjoiN2JkZmFiYjgtMjFhMi00ZmJlLTk4MzctMTRhOWIyMWU3MjEyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.xfGFt6OPf00X3CtWSf4LthTRVEAwtNJlSn3LOYpCaX4',
            refresh_token: 'p66mhtax4gtd'
          });
          
          if (!error && data?.session?.user) {
            console.log('AdminAuthGuard: Dev session set successfully');
            setUser(data.session.user);
          } else {
            console.log('AdminAuthGuard: Failed to set dev session:', error);
          }
        } catch (error) {
          console.log('AdminAuthGuard: Error setting dev session:', error);
        }
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
