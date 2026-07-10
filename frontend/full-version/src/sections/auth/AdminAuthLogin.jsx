'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PinOutlinedIcon from '@mui/icons-material/PinOutlined';

import { supabase } from '@/utils/supabase/client';
import { isAdminEmail, normalizeAdminEmail } from '@/utils/adminAuth';

export default function AdminAuthLogin() {
  const router = useRouter();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedEmail = normalizeAdminEmail(email);

  const sendCode = async () => {
    setLoading(true);
    setError('');

    if (!isAdminEmail(normalizedEmail)) {
      setError('Only @everspeak.ai email addresses can sign in.');
      setLoading(false);
      return;
    }

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false }
      });

      if (otpError) {
        if (otpError.message.includes('429') || otpError.message.includes('rate limit')) {
          throw new Error('Too many attempts. Wait a few minutes and try again.');
        }
        if (otpError.message.includes('Signups not allowed') || otpError.message.includes('User not found')) {
          throw new Error('This email is not registered. Ask an admin to invite you first.');
        }
        throw otpError;
      }

      setStep('code');
      setCode('');
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err?.message || 'Failed to send login code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = code.replace(/\D/g, '');
    if (token.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'email'
      });

      if (verifyError) throw verifyError;

      if (!isAdminEmail(data?.user?.email)) {
        await supabase.auth.signOut();
        throw new Error('Only @everspeak.ai accounts can access the admin dashboard.');
      }

      router.replace('/dashboard');
    } catch (err) {
      console.error('Admin verify error:', err);
      setError(err?.message || 'Invalid or expired code. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    await sendCode();
  };

  if (step === 'code') {
    return (
      <Box component="form" onSubmit={verifyCode} sx={{ width: '100%' }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Enter your code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We sent a 6-digit code to <strong>{normalizedEmail}</strong>
            </Typography>
          </Stack>

          <TextField
            label="Login code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            required
            fullWidth
            autoFocus
            disabled={loading}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6, autoComplete: 'one-time-code' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PinOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper', letterSpacing: 4 } }}
          />

          {error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || code.replace(/\D/g, '').length !== 6}
            fullWidth
            sx={{ py: 1.25, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Sign in'}
          </Button>

          <Stack direction="row" spacing={1} justifyContent="center">
            <Button size="small" disabled={loading} onClick={() => sendCode()} sx={{ textTransform: 'none' }}>
              Resend code
            </Button>
            <Button
              size="small"
              disabled={loading}
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
              sx={{ textTransform: 'none' }}
            >
              Use different email
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleEmailSubmit} sx={{ width: '100%' }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Sign in with email
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We&apos;ll email you a 6-digit login code — no password needed.
          </Typography>
        </Stack>

        <TextField
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@everspeak.ai"
          required
          fullWidth
          autoComplete="email"
          autoFocus
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MailOutlineRoundedIcon fontSize="small" color="action" />
              </InputAdornment>
            )
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
        />

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || !email.trim()}
          fullWidth
          sx={{ py: 1.25, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Send login code'}
        </Button>
      </Stack>
    </Box>
  );
}
