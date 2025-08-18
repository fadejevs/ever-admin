'use client';

import { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from '@/components/MainCard';
import { LineChart } from '@mui/x-charts/LineChart';
import { fetchExpenses } from '@/services/metricsService';

export default function ExpensesTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchExpenses();
        // Expecting { daily: [{ date: '2025-08-01', amount: 123.45 }, ...] }
        const daily = data.daily || [];
        if (!mounted) return;
        setPoints(daily);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load expenses');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const x = useMemo(() => points.map((p) => new Date(p.date)), [points]);
  const y = useMemo(() => points.map((p) => p.amount), [points]);

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={12}>
        <MainCard>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 400 }}>
              Expenses
            </Typography>
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Stack>
          <LineChart
            height={300}
            series={[{ data: y, label: 'Daily Cost (USD)' }]}
            xAxis={[{ scaleType: 'point', data: x, valueFormatter: (d) => (d ? new Date(d).toLocaleDateString() : '') }]}
            loading={loading}
          />
        </MainCard>
      </Grid>
    </Grid>
  );
}


