'use client';

import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from '@/components/MainCard';
import { BarChart } from '@mui/x-charts/BarChart';
import { fetchBenchmarks } from '@/services/metricsService';

export default function BenchmarksTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchBenchmarks();
        // Expecting { endpoints: ['POST /api/xyz', ...], avgLatency: [..] }
        const endpoints = data.endpoints || [];
        const avgLatency = data.avgLatency || [];
        if (!mounted) return;
        setLabels(endpoints);
        setValues(avgLatency);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load benchmarks');
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
              Benchmarks
            </Typography>
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Stack>
          <BarChart
            height={320}
            series={[{ data: values, label: 'Avg Latency (ms)' }]}
            xAxis={[{ scaleType: 'band', data: labels }]}
            loading={loading}
          />
        </MainCard>
      </Grid>
    </Grid>
  );
}


