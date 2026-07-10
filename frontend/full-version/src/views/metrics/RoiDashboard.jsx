'use client';

import { Box, Stack, Typography } from '@mui/material';
import PlatformHealthIndicator from '@/components/PlatformHealthIndicator';
import LiveEventsPanel from '@/components/LiveEventsPanel';
import StripeRevenuePanel from '@/components/StripeRevenuePanel';
import TranslationHealthPanel from '@/components/TranslationHealthPanel';

export default function RoiDashboard() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>

        <PlatformHealthIndicator />
        <TranslationHealthPanel />
        <LiveEventsPanel />
        <StripeRevenuePanel />
      </Stack>
    </Box>
  );
}
