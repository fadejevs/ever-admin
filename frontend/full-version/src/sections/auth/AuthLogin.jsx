'use client';
import PropTypes from 'prop-types';

// @next
import { useRouter, useSearchParams } from 'next/navigation';

import { useState, useEffect } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

// @third-party
import { useForm } from 'react-hook-form';

// @project
import axios from '@/utils/axios';
import { emailSchema } from '@/utils/validationSchema';

export default function AuthLogin({ inputSx }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  const [isProcessing, setIsProcessing] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: { email: '' } });

  // Handle error parameters from URL
  useEffect(() => {
    const error = searchParams.get('error');
    const details = searchParams.get('details');
    
    if (error) {
      const errorMessages = {
        'pkce_callback_failed': 'Authentication failed. Please try logging in again.',
        'pkce_callback_exception': 'Authentication error occurred. Please try again.',
        'session_setup_failed': 'Session setup failed. Please try logging in again.',
        'session_exception': 'Authentication error occurred. Please try again.',
        'no_auth_data': 'No authentication data found. Please try logging in again.',
        'auth_signout': 'You have been signed out. Please log in again.',
        'auth_timeout': 'Authentication timed out. Please try logging in again.',
        'auth_error': details ? `Authentication error: ${details}` : 'Authentication error occurred. Please try again.',
        'auth_expired': 'Your login link has expired. Please request a new one.',
        'auth_already_used': 'This login link has already been used. Please request a new one.'
      };
      setLoginError(errorMessages[error] || 'An error occurred during authentication. Please try again.');
    }
  }, [searchParams]);

  // Handle form submission
  const onSubmit = async (formData) => {
    setIsProcessing(true);
    setLoginError('');

    try {
      // First check if the email exists
      const { data: checkData } = await axios.get(`/api/auth/check-email?email=${formData.email}`);
      console.log('Check email response:', checkData);

      if (!checkData.exists) {
        setLoginError('There is no account associated with this email. Please sign up.');
        router.push('/register');
        return;
      }

      // If email exists, magic link has already been sent by the check-email endpoint
      router.push(`/otp-verification?email=${encodeURIComponent(formData.email)}&verify=login`);
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      const errorMessage =
        error.response?.data?.error === 'email rate limit exceeded'
          ? 'Too many login attempts. Please wait a few minutes before trying again.'
          : error.response?.data?.error || 'Failed to process login request';
      setLoginError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={2}>
          <Box>
            <InputLabel>Email</InputLabel>
            <OutlinedInput
              {...register('email', emailSchema)}
              placeholder="example@email.com"
              fullWidth
              error={Boolean(errors.email)}
              sx={inputSx}
              type="email"
              autoComplete="email"
            />
            {errors.email?.message && <FormHelperText error>{errors.email.message}</FormHelperText>}
          </Box>
        </Stack>

        <Button
          type="submit"
          color="primary"
          variant="contained"
          disabled={isProcessing}
          endIcon={isProcessing && <CircularProgress color="secondary" size={16} />}
          sx={{ minWidth: 120, mt: { xs: 1, sm: 4 }, '& .MuiButton-endIcon': { ml: 1 }, marginTop:{ xs: 3, sm: 3 } }}
        >
          Send Login Link
        </Button>

        {loginError && (
          <Alert sx={{ mt: 2 }} severity="error" variant="filled" icon={false}>
            {loginError}
          </Alert>
        )}
      </form>
    </>
  );
}

AuthLogin.propTypes = { inputSx: PropTypes.any };
