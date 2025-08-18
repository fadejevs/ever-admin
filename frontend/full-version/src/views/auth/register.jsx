// @next
import NextLink from 'next/link';

// @mui
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import { SocialTypes } from '@/enum';
import AuthRegister from '@/sections/auth/AuthRegister';
import AuthSocial from '@/sections/auth/AuthSocial';
import Copyright from '@/sections/auth/Copyright';

/***************************  AUTH - REGISTER  ***************************/

export default function Register() {
  return (
    <Stack sx={{ height: 1, minHeight: { xs: '100vh', md: 'auto' }, alignItems: 'center', justifyContent: 'space-between', gap: 3, pt: { xs: 6, sm: 8, md: 0 }, pb: { xs: 3, sm: 4, md: 0 } }}>
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack sx={{ gap: { xs: 1.25, sm: 1.5 }, textAlign: 'center', mb: { xs: 4, sm: 8 } }}>
          <Typography variant="h1">Sign Up</Typography>
          <Typography variant="body1" color="text.secondary">
            Sign Up for free. No credit card required.
          </Typography>
        </Stack>

        {/* Social login buttons */}
        <AuthSocial type={SocialTypes.HORIZONTAL} />

        <Divider sx={{ my: { xs: 3, sm: 5 } }}>
          <Typography variant="body2" color="text.secondary">
            or continue with email
          </Typography>
        </Divider>

        {/* Login form */}
        <AuthRegister />

        <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 2.5, sm: 3 } }}>
          Already have an account?{' '}
          <Link component={NextLink} underline="hover" variant="subtitle2" href="/login" sx={{ '&:hover': { color: 'primary.dark' } }}>
            Sign In
          </Link>
        </Typography>
      </Box>

      {/* Copyright section anchored at bottom */}
      <Copyright />
    </Stack>
  );
}
