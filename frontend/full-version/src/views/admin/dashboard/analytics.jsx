'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import StripeRevenuePanel from '@/components/StripeRevenuePanel';
import EventUsagePanel from '@/components/EventUsagePanel';
import UserFeedbackPanel from '@/components/UserFeedbackPanel';
import DashboardSection from '@/components/DashboardSection';

const JUMP_LINKS = [
  { id: 'usage-revenue', label: 'Usage' },
  { id: 'feedback', label: 'Feedback' }
];

function scrollToSection(id) {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/***************************  DASHBOARD - ANALYTICS  ***************************/

export default function DashboardAnalytics() {
  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: '#F4F6F8',
        py: { xs: 2, md: 2.5 },
        px: { xs: 2, md: 3 }
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
        <Stack spacing={0.5}>
          <Box
            sx={{
              pb: 1.5,
              position: 'sticky',
              top: 64,
              zIndex: 10,
              bgcolor: '#F4F6F8',
              pt: 0.5,
              mx: { xs: -0.5, sm: 0 },
              px: { xs: 0.5, sm: 0 }
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
                  Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Usage, revenue, and customer feedback.
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {JUMP_LINKS.map((link) => (
                  <Button
                    key={link.id}
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => scrollToSection(link.id)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      color: 'text.secondary',
                      borderRadius: 2,
                      px: 1.25,
                      minWidth: 0,
                      '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'background.paper' }
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Stack>
            </Stack>
          </Box>

          <DashboardSection
            id="usage-revenue"
            title="Usage & revenue"
            description="Workspace minutes and Stripe."
            showDivider={false}
          >
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                alignItems: 'start'
              }}
            >
              <EventUsagePanel />
              <StripeRevenuePanel />
            </Box>
          </DashboardSection>

          <DashboardSection id="feedback" title="Feedback" description="Post-event organizer and viewer ratings.">
            <UserFeedbackPanel />
          </DashboardSection>
        </Stack>
      </Box>
    </Box>
  );
}
