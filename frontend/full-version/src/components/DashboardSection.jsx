'use client';

import { Box, Stack, Typography } from '@mui/material';

export default function DashboardSection({ title, description, children, showDivider = true }) {
  return (
    <Box
      component="section"
      aria-labelledby={`dashboard-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      sx={{
        ...(showDivider
          ? {
              pt: 3.5,
              mt: 1,
              borderTop: '1px solid',
              borderColor: 'divider'
            }
          : {
              pt: 0.5
            })
      }}
    >
      <Box sx={{ mb: 2.25 }}>
        <Typography
          id={`dashboard-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'text.primary'
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, maxWidth: 640, lineHeight: 1.5 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}
