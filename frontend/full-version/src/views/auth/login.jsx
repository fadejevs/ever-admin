// @next
import NextLink from 'next/link';

// @mui
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import AuthLogin from '@/sections/auth/AuthLogin';
import AuthSocial from '@/sections/auth/AuthSocial';
import Copyright from '@/sections/auth/Copyright';

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return (
    <Stack sx={{ height: 1, minHeight: { xs: '100vh', md: 'auto' }, alignItems: 'center', justifyContent: 'space-between', gap: 3, pt: { xs: 6, sm: 8, md: 0 }, pb: { xs: 3, sm: 4, md: 0 } }}>
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack sx={{ gap: { xs: 1.25, sm: 1.5 }, textAlign: 'center', mb: { xs: 4, sm: 8 } }}>
          <Typography variant="h1">Sign In</Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Select the method of login.
          </Typography>
        </Stack>

        {/* Social login buttons */}
        <AuthSocial />

        <Divider sx={{ my: { xs: 2, sm: 3 }, width: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            or continue with email
          </Typography>
        </Divider>

    
          {/* Login form */}
          <AuthLogin />
   

        <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 2, sm: 2 } }}>
          Don't have an account?{' '}
          <Link component={NextLink} underline="hover" variant="subtitle2" href="/register" sx={{ '&:hover': { color: 'primary.dark' } }}>
            Sign Up
          </Link>
        </Typography>
      </Box>
      <Copyright/>
    </Stack>
  );
}
