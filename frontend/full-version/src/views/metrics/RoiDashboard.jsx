'use client';

import { Box, Stack, Typography } from '@mui/material';
import PlatformHealthIndicator from '@/components/PlatformHealthIndicator';
import LiveEventsPanel from '@/components/LiveEventsPanel';
import StripeRevenuePanel from '@/components/StripeRevenuePanel';
import EventUsagePanel from '@/components/EventUsagePanel';
import MonitoringAlertsPanel from '@/components/MonitoringAlertsPanel';
import UserFeedbackPanel from '@/components/UserFeedbackPanel';
import DashboardSection from '@/components/DashboardSection';

export default function RoiDashboard() {
  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: '#F4F6F8',
        py: { xs: 2, md: 3 },
        px: { xs: 2, md: 3 }
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
        <Stack spacing={1}>
          <Box sx={{ pb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 520 }}>
              Live operations, billing usage, revenue, pipeline health, and customer feedback.
            </Typography>
          </Box>

          <DashboardSection
            title="Live events"
            description="Currently live sessions and the most recent completed or paused events."
            showDivider={false}
          >
            <LiveEventsPanel />
          </DashboardSection>

          <DashboardSection
            title="Pipeline & reliability"
            description="Translation pipeline health and service monitoring."
          >
            <PlatformHealthIndicator />
            <MonitoringAlertsPanel />
          </DashboardSection>

          <DashboardSection title="Usage & revenue" description="Workspace usage and Stripe billing.">
            <EventUsagePanel />
            <StripeRevenuePanel />
          </DashboardSection>

          <DashboardSection title="Feedback" description="Organizer and viewer ratings after events.">
            <UserFeedbackPanel />
          </DashboardSection>
        </Stack>
      </Box>
    </Box>
  );
}
