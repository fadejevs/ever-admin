'use client';

import { useId, useState } from 'react';
import { Box, Collapse, IconButton, Stack, Typography } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

function sectionDomId(title, explicitId) {
  if (explicitId) return explicitId;
  return `dashboard-section-${String(title || '')
    .toLowerCase()
    .replace(/\s+/g, '-')}`;
}

export default function DashboardSection({
  id,
  title,
  description,
  children,
  showDivider = true,
  /** When set, section body starts collapsed and can be toggled. */
  collapsible = false,
  defaultExpanded = true,
  /** Optional chip/count shown next to the title. */
  badge = null
}) {
  const reactId = useId();
  const sectionId = sectionDomId(title, id);
  const [expanded, setExpanded] = useState(collapsible ? defaultExpanded : true);
  const bodyId = `${reactId}-body`;

  return (
    <Box
      component="section"
      id={sectionId}
      aria-labelledby={`${sectionId}-label`}
      sx={{
        scrollMarginTop: 88,
        ...(showDivider
          ? {
              pt: 3,
              mt: 0.5,
              borderTop: '1px solid',
              borderColor: 'divider'
            }
          : {
              pt: 0.5
            })
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ mb: expanded || !collapsible ? 2 : 0 }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              id={`${sectionId}-label`}
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: 'text.primary'
              }}
            >
              {title}
            </Typography>
            {badge}
          </Stack>
          {description && (expanded || !collapsible) ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, maxWidth: 560, lineHeight: 1.45 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {collapsible ? (
          <IconButton
            size="small"
            aria-expanded={expanded}
            aria-controls={bodyId}
            aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
            onClick={() => setExpanded((v) => !v)}
            sx={{
              mt: -0.25,
              color: 'text.secondary',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <ExpandMoreRoundedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>

      {collapsible ? (
        <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
          <Stack id={bodyId} spacing={2}>
            {children}
          </Stack>
        </Collapse>
      ) : (
        <Stack spacing={2}>{children}</Stack>
      )}
    </Box>
  );
}
