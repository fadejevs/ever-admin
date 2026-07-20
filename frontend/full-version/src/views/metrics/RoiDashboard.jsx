'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import PlatformHealthIndicator from '@/components/PlatformHealthIndicator';
import LiveEventsPanel from '@/components/LiveEventsPanel';
import MonitoringAlertsPanel from '@/components/MonitoringAlertsPanel';
import DashboardSection from '@/components/DashboardSection';

const JUMP_LINKS = [
  { id: 'live-events', label: 'Live' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'alerts', label: 'Alerts' }
];

function scrollToSection(id) {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function RoiDashboard() {
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
                  Ops
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Live sessions, pipeline health, and alerts.
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

          <DashboardSection id="live-events" title="Live events" showDivider={false}>
            <LiveEventsPanel />
          </DashboardSection>

          <DashboardSection
            id="pipeline"
            title="Pipeline"
            description="Translation / ASR / TTS health at a glance."
            collapsible
            defaultExpanded
          >
            <PlatformHealthIndicator />
          </DashboardSection>

          <DashboardSection
            id="alerts"
            title="Alerts"
            description="Incidents and monitoring signals."
            collapsible
            defaultExpanded={false}
          >
            <MonitoringAlertsPanel />
          </DashboardSection>
        </Stack>
      </Box>
    </Box>
  );
}
