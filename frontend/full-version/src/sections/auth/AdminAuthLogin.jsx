'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// @mui
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';

// @project
import { supabase } from '@/utils/supabase/client';

export default function AdminAuthLogin() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.endsWith('@everspeak.ai')) {
      setError('Only @everspeak.ai email addresses are allowed.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback/success`,
          data: {
            admin_access: true,
            redirect_to: `${window.location.origin}/dashboard`
          }
        }
      });

      if (error) {
        // Handle rate limiting specifically
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please wait a few minutes before trying again.');
        }
        throw error;
      }

      setSuccess('Magic link sent! Check your email.');
    } catch (error) {
      console.error('Admin login error:', error);

      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Too many login attempts. Please wait 5-10 minutes before trying again.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid @everspeak.ai email address.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link first.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={isMobile ? 2.5 : 3} sx={{ width: '100%' }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            Admin Login
          </Typography>

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@everspeak.ai"
            required
            fullWidth
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '0.85rem', sm: '0.875rem' }
              }
            }}
          />

          {error && (
            <Alert
              severity="error"
              sx={{
                borderRadius: 2,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '& .MuiAlert-message': {
                  width: '100%',
                  wordBreak: 'break-word'
                }
              }}
            >
              <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                {error}
              </Typography>
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{
                borderRadius: 2,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '& .MuiAlert-message': {
                  width: '100%',
                  wordBreak: 'break-word'
                }
              }}
            >
              <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                {success}
              </Typography>
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              height: { xs: 44, sm: 48 },
              borderRadius: 2,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Send Magic Link'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
