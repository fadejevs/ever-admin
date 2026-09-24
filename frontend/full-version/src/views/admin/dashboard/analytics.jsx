'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import StripeRevenuePanel from '@/components/StripeRevenuePanel';
import EventUsagePanel from '@/components/EventUsagePanel';
import UserFeedbackPanel from '@/components/UserFeedbackPanel';
import RoiSummaryPanel from '@/components/RoiSummaryPanel';
import ExpensesPanel from '@/components/ExpensesPanel';
import DashboardSection from '@/components/DashboardSection';

const JUMP_LINKS = [
  { id: 'feedback', label: 'Feedback' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'usage-revenue', label: 'Usage' },
  { id: 'roi', label: 'ROI' },
  { id: 'expenses', label: 'Expenses' }
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
        bgcolor: 'background.default',
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
              bgcolor: 'background.default',
              pt: 0.5,
              mx: { xs: -0.5, sm: 0 },
              px: { xs: 0.5, sm: 0 }
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
                  Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Customer feedback, Stripe, usage, ROI, and vendor expenses.
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

          <DashboardSection id="feedback" title="Feedback" description="Post-event organizer and viewer ratings." showDivider={false}>
            <UserFeedbackPanel />
          </DashboardSection>

          <DashboardSection id="stripe" title="Stripe" description="Charges, refunds, and net revenue.">
            <StripeRevenuePanel />
          </DashboardSection>

          <DashboardSection id="usage-revenue" title="Usage" description="Workspace minutes.">
            <EventUsagePanel />
          </DashboardSection>

          <DashboardSection id="roi" title="ROI" description="Margin from revenue vs API costs, including confirmed vendor expenses.">
            <RoiSummaryPanel />
          </DashboardSection>

          <DashboardSection
            id="expenses"
            title="Expenses"
            description="Upload provider invoices, AI-extract fields, confirm month-to-month spend into ROI."
          >
            <ExpensesPanel />
          </DashboardSection>
        </Stack>
      </Box>
    </Box>
  );
}
