// @next
import NextLink from 'next/link';

// @mui
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import branding from '@/branding.json';

/***************************  AUTH - COPYRIGHT  ***************************/

export default function Copyright() {
  const copyrightSX = { display: { xs: 'flex', sm: 'flex' } };

  const linkProps = {
    component: NextLink,
    variant: 'caption',
    color: 'text.secondary',
    target: '_blank',
    underline: 'hover',
    sx: { '&:hover': { color: 'primary.main' } }
  };

  return (
    <Stack sx={{ gap: 1, width: 'fit-content', mx: 'auto', pb: { xs: 2, sm: 0 } }}>
      <Stack direction="row" sx={{ flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: { xs: 1, sm: 1.5 }, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={copyrightSX}>
          © 2025 {branding.brandName}
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'flex', sm: 'flex' } }} />
        <Link {...linkProps} href="#" sx={{ whiteSpace: 'nowrap' }}>
          Privacy Policy
        </Link>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'flex', sm: 'flex' } }} />
        <Link {...linkProps} href="#" sx={{ whiteSpace: 'nowrap' }}>
          Terms & Conditions
        </Link>
      </Stack>
    </Stack>
  );
}
