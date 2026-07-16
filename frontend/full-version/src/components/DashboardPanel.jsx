'use client';

import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const TONE_STYLES = {
  primary: (theme) => ({
    bg: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main
  }),
  live: (theme) => ({
    bg: alpha(theme.palette.error.main, 0.08),
    color: theme.palette.error.main
  }),
  feedback: (theme) => ({
    bg: alpha(theme.palette.secondary.main, 0.1),
    color: theme.palette.secondary.dark
  }),
  pipeline: (theme) => ({
    bg: alpha(theme.palette.info.main, 0.08),
    color: theme.palette.info.dark
  }),
  neutral: (theme) => ({
    bg: alpha(theme.palette.text.primary, 0.06),
    color: theme.palette.text.secondary
  })
};

const ACCENT_BORDER = {
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  info: 'info.main'
};

export default function DashboardPanel({
  title,
  subtitle,
  icon: IconComponent,
  iconNode,
  iconTone = 'primary',
  actions = null,
  chips = null,
  footer = null,
  accent = null,
  children = null,
  footerSlot = null
}) {
  const theme = useTheme();
  const tone = TONE_STYLES[iconTone]?.(theme) || TONE_STYLES.primary(theme);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderLeftWidth: accent ? 3 : 1,
        borderLeftColor: accent ? ACCENT_BORDER[accent] || 'divider' : 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.25 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ md: 'flex-start' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
            {iconNode || IconComponent ? (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: tone.bg,
                  color: tone.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {iconNode || (IconComponent ? <IconComponent sx={{ fontSize: 22 }} /> : null)}
              </Box>
            ) : null}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.35 }}>
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
                  {subtitle}
                </Typography>
              ) : null}
              {chips ? (
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  {chips}
                </Stack>
              ) : null}
            </Box>
          </Stack>
          {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
        </Stack>

        {children ? <Box sx={{ mt: children ? 2 : 0 }}>{children}</Box> : null}

        {footer ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            {footer}
          </Typography>
        ) : null}
      </Box>

      {footerSlot}
    </Paper>
  );
}
