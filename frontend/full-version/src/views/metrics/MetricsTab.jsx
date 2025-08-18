'use client';

import { useEffect, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import MainCard from '@/components/MainCard';
import { LineChart } from '@mui/x-charts/LineChart';
import { fetchMetrics } from '@/services/metricsService';

export default function MetricsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [series, setSeries] = useState([]);
  const [xLabels, setXLabels] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchMetrics();
        // Expecting shape { timestamps: [...], p95: [...], errorRate: [...], throughput: [...] }
        const timestamps = data.timestamps || [];
        const p95 = data.p95 || [];
        const errorRate = data.errorRate || [];
        const throughput = data.throughput || [];

        if (!mounted) return;
        setXLabels(timestamps.map((t) => new Date(t)));
        setSeries([
          { id: 'p95', label: 'P95 Latency (ms)', data: p95 },
          { id: 'errorRate', label: 'Error Rate (%)', data: errorRate },
          { id: 'tps', label: 'Throughput (req/s)', data: throughput }
        ]);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load metrics');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <MainCard>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 400 }}>
              API Health Metrics
            </Typography>
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Stack>
          <LineChart
            sx={{ '& .MuiLineElement-root': { strokeWidth: 2 } }}
            height={300}
            series={series.map((s) => ({ ...s, showMark: false }))}
            xAxis={[{ scaleType: 'point', data: xLabels, valueFormatter: (d) => (d ? new Date(d).toLocaleTimeString() : '') }]}
            slotProps={{ legend: { hidden: true } }}
            grid={{ horizontal: true }}
            loading={loading}
          />
        </MainCard>
      </Grid>
    </Grid>
  );
}


