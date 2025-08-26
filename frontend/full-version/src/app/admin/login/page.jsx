'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Paper, Typography, Alert, Button, Divider, useTheme, useMediaQuery } from '@mui/material';
import AdminAuthLogin from '@/sections/auth/AdminAuthLogin';
import { supabase } from '@/utils/supabase/client';

export default function AdminLogin() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [existingSession, setExistingSession] = useState(null);

  useEffect(() => {
    const checkExistingSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user?.email?.endsWith('@everspeak.ai')) {
        setExistingSession(session.user);
      }
    };
    checkExistingSession();
  }, []);

  const handleUseExistingSession = () => {
    router.push('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 }
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 480 }
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            sx={{
              mb: 1,
              fontWeight: 700
            }}
          >
            Admin Dashboard
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Secure access for @everspeak.ai team members
          </Typography>
        </Box>

        {/* Main Content */}
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            overflow: 'hidden' // Prevent content from popping out
          }}
        >
          {/* Info Alert */}
          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: 2,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            <Typography variant="body2">
              <strong>Restricted Access:</strong> Only @everspeak.ai email addresses can access the admin dashboard.
            </Typography>
          </Alert>

          {/* Existing Session */}
          {existingSession && (
            <>
              <Paper
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  mb: 3,
                  bgcolor: 'success.light',
                  color: 'success.contrastText',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'success.main'
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  ✅ Already Authenticated
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  You're logged in as: <strong>{existingSession.email}</strong>
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleUseExistingSession}
                  sx={{
                    bgcolor: 'success.dark',
                    '&:hover': { bgcolor: 'success.main' },
                    borderRadius: 2,
                    px: 3,
                    py: 1
                  }}
                  fullWidth={isMobile}
                >
                  Continue to Dashboard
                </Button>
              </Paper>

              <Divider sx={{ my: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    px: 2,
                    bgcolor: 'background.paper'
                  }}
                >
                  OR
                </Typography>
              </Divider>
            </>
          )}

          {/* Login Form */}
          <Box sx={{ overflow: 'hidden' }}>
            <AdminAuthLogin />
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.8rem' }
            }}
          >
            Admin Portal • Secure Access Only
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
