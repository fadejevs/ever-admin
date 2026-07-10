'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import AdminAuthLogin from '@/sections/auth/AdminAuthLogin';
import LogoSection from '@/components/logo';
import { supabase } from '@/utils/supabase/client';
import { isAdminEmail } from '@/utils/adminAuth';

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [existingSession, setExistingSession] = useState(null);
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const urlError = searchParams.get('error');

  useEffect(() => {
    const checkExistingSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user && isAdminEmail(session.user.email)) {
        setExistingSession(session.user);
      }
    };
    checkExistingSession();
  }, []);

  const handleUseExistingSession = () => {
    router.push(redirectPath.startsWith('/') ? redirectPath : '/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 4, sm: 6 },
        background: (theme) =>
          `radial-gradient(1200px 600px at 10% -10%, ${theme.palette.primary.main}18, transparent 60%),
           radial-gradient(900px 500px at 100% 0%, ${theme.palette.secondary.main}14, transparent 55%),
           linear-gradient(180deg, #f8f9ff 0%, #ffffff 45%, #fafbff 100%)`
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} alignItems="center">
          <LogoSection to="/admin/login" />

          <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 0.75 }}>
              Admin dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Internal ops for the Everspeak team
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              width: '100%',
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)'
            }}
          >
            {urlError ? (
              <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
                Sign-in did not complete. Request a fresh magic link below.
              </Alert>
            ) : null}

            {existingSession ? (
              <Stack spacing={2.5} sx={{ mb: 3 }}>
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Signed in as <strong>{existingSession.email}</strong>
                </Alert>
                <Button variant="contained" size="large" onClick={handleUseExistingSession} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                  Continue to dashboard
                </Button>
                <Divider>
                  <Typography variant="caption" color="text.secondary">
                    or use another account
                  </Typography>
                </Divider>
              </Stack>
            ) : null}

            <AdminAuthLogin />

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.5, textAlign: 'center' }}>
              Restricted to <strong>@everspeak.ai</strong> accounts. Session enforced on dashboard and API routes.
            </Typography>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
