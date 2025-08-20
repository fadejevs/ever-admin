'use client';

// @mui
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid2';

// @project
import OverviewCard from '@/components/cards/OverviewCard';
import { getRadiusStyles } from '@/utils/getRadiusStyles';

// @assets
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

/***************************  CARDS - BORDER WITH RADIUS  ***************************/

export function applyBorderWithRadius(radius, theme) {
  return {
    overflow: 'hidden',
    '--Grid-borderWidth': '1px',
    borderTop: 'var(--Grid-borderWidth) solid',
    borderLeft: 'var(--Grid-borderWidth) solid',
    borderColor: 'divider',
    '& > div': {
      overflow: 'hidden',
      borderRight: 'var(--Grid-borderWidth) solid',
      borderBottom: 'var(--Grid-borderWidth) solid',
      borderColor: 'divider',
      [theme.breakpoints.down('md')]: {
        '&:nth-of-type(1)': getRadiusStyles(radius, 'topLeft'),
        '&:nth-of-type(2)': getRadiusStyles(radius, 'topRight'),
        '&:nth-of-type(3)': getRadiusStyles(radius, 'bottomLeft'),
        '&:nth-of-type(4)': getRadiusStyles(radius, 'bottomRight')
      },
      [theme.breakpoints.up('md')]: {
        '&:first-of-type': getRadiusStyles(radius, 'topLeft', 'bottomLeft'),
        '&:last-of-type': getRadiusStyles(radius, 'topRight', 'bottomRight')
      }
    }
  };
}

/***************************   OVERVIEW CARD -DATA  ***************************/

const fallbackOverview = [
  {
    title: 'Unique Visitors',
    value: '23,876',
    compare: 'Compare to last week',
    chip: {
      label: '24.5%',
      avatar: <IconArrowUp />
    }
  },
  {
    title: 'Page View',
    value: '30,450',
    compare: 'Compare to last week',
    chip: {
      label: '20.5%',
      avatar: <IconArrowUp />
    }
  },
  {
    title: 'Events',
    value: '34,789',
    compare: 'Compare to last week',
    chip: {
      label: '20.5%',
      color: 'error',
      avatar: <IconArrowDown />
    }
  },
  {
    title: 'Live Visitor',
    value: '45,687',
    compare: 'Compare to last week',
    chip: {
      label: '24.5%',
      avatar: <IconArrowUp />
    }
  }
];

/***************************   OVERVIEW - CARDS  ***************************/

export default function AnalyticsOverviewCard() {
  const theme = useTheme();
  const [cards, setCards] = useState(fallbackOverview);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/health-summary');
        const data = await res.json();
        if (!mounted || !data || data.error) return;
        const uptimePct = data?.uptimePct != null ? `${data.uptimePct.toFixed(2)}%` : '—';
        const incidents = data?.incidents != null ? String(data.incidents) : '—';
        const avgLatency = data?.avgLatencyMs != null ? `${data.avgLatencyMs} ms` : '—';
        const errorRate = data?.errorRatePct != null ? `${data.errorRatePct}%` : '—';
        setCards([
          { title: 'Uptime', value: uptimePct, compare: 'Last 24h', chip: { label: '' } },
          { title: 'Incidents', value: incidents, compare: 'Last 24h', chip: { label: '' } },
          { title: 'Avg Latency', value: avgLatency, compare: 'Last 1h', chip: { label: '' } },
          { title: 'Error Rate', value: errorRate, compare: 'Last 1h', chip: { label: '' } }
        ]);
      } catch (_e) {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Grid container sx={{ borderRadius: 4, boxShadow: theme.customShadows.section, ...applyBorderWithRadius(16, theme) }}>
      {cards.map((item, index) => (
        <Grid key={index} size={{ xs: 6, sm: 6, md: 3 }}>
          <OverviewCard {...{ ...item, cardProps: { sx: { border: 'none', borderRadius: 0, boxShadow: 'none' } } }} />
        </Grid>
      ))}
    </Grid>
  );
}
