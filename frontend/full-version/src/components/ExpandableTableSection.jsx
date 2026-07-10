'use client';

import { Box, Button, Collapse, Typography } from '@mui/material';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';

export default function ExpandableTableSection({
  count,
  itemLabel = 'items',
  expanded,
  onToggle,
  disabled = false,
  children
}) {
  const plural = count === 1 ? itemLabel.replace(/s$/, '') : itemLabel;
  const countText = count != null ? `${count} ${plural}` : itemLabel;

  return (
    <Box
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: expanded ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s ease'
      }}
    >
      <Button
        fullWidth
        variant="text"
        color="inherit"
        disabled={disabled}
        onClick={onToggle}
        sx={{
          py: 1.25,
          px: 2,
          justifyContent: 'space-between',
          textTransform: 'none',
          borderRadius: 0,
          '&:hover': { bgcolor: 'action.selected' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {!expanded ? <UnfoldMoreRoundedIcon fontSize="small" color="primary" /> : null}
          <Box sx={{ textAlign: 'left', minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {expanded ? `Hide ${itemLabel}` : `Show ${countText}`}
            </Typography>
            {!expanded ? (
              <Typography variant="caption" color="text.secondary">
                Tap to expand the full table
              </Typography>
            ) : null}
          </Box>
        </Box>
        {expanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
      </Button>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            overflowX: 'auto',
            px: 2,
            pb: 2,
            pt: 0.5,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
