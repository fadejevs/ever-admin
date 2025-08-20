'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { fetchExpenses } from '@/services/metricsService';

const StatCard = ({ title, value, hint }) => (
  <Paper sx={{ p: 2, borderRadius: 2 }}>
    <Typography variant="overline" sx={{ color: '#637381' }}>{title}</Typography>
    <Typography variant="h5" sx={{ color: '#212B36', fontWeight: 600 }}>{value}</Typography>
    {hint ? (<Typography variant="caption" sx={{ color: '#919EAB' }}>{hint}</Typography>) : null}
  </Paper>
);

const ExpensesTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [expensesData, setExpensesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch expenses data from API
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchExpenses({ period: selectedPeriod });
        if (!mounted) return;
        setExpensesData(data);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load expenses');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [selectedPeriod]);

  // Process API data into dashboard format
  const services = expensesData ? [
    { 
      service: 'Azure Speech (RT)', 
      calls: expensesData.daily?.[0]?.amount || 1727, 
      unit: 'min', 
      unitCost: 0.01667, 
      quantity: 950, 
      cost: (expensesData.daily?.[0]?.amount || 1727) * 0.01667,
      model: 'azure'
    },
    { 
      service: 'OpenAI Whisper', 
      calls: expensesData.daily?.[1]?.amount || 63, 
      unit: 'min', 
      unitCost: 0.006, 
      quantity: 980, 
      cost: (expensesData.daily?.[1]?.amount || 63) * 0.006,
      model: 'whisper'
    },
    { 
      service: 'GPT-4o Transcribe', 
      calls: expensesData.daily?.[2]?.amount || 210, 
      unit: 'min', 
      unitCost: 0.006, 
      quantity: 250, 
      cost: (expensesData.daily?.[2]?.amount || 210) * 0.006,
      model: 'gpt-4o-transcribe'
    },
    { 
      service: 'Groq Whisper', 
      calls: expensesData.daily?.[3]?.amount || 67, 
      unit: 'min', 
      unitCost: 0.00067, 
      quantity: 450, 
      cost: (expensesData.daily?.[3]?.amount || 67) * 0.00067,
      model: 'groq-whisper-large-v3-turbo'
    },
    { 
      service: 'Translation (Azure)', 
      calls: expensesData.daily?.[4]?.amount || 1200, 
      unit: 'char', 
      unitCost: 0.00000549, 
      quantity: 45000, 
      cost: (expensesData.daily?.[4]?.amount || 1200) * 0.00000549,
      model: 'azure-translator'
    },
    { 
      service: 'LLM Processing', 
      calls: expensesData.daily?.[5]?.amount || 180, 
      unit: 'tok', 
      unitCost: 0.000045, 
      quantity: 180000, 
      cost: (expensesData.daily?.[5]?.amount || 180) * 0.000045,
      model: 'gpt-4o'
    },
    { 
      service: 'TTS (Azure)', 
      calls: expensesData.daily?.[6]?.amount || 45, 
      unit: 'char', 
      unitCost: 0.000016, 
      quantity: 25000, 
      cost: (expensesData.daily?.[6]?.amount || 45) * 0.000016,
      model: 'azure-tts'
    }
  ] : [];

  const total = services.reduce((s, r) => s + r.cost, 0);
  const topSpender = services.sort((a,b) => b.cost - a.cost)[0];
  const totalCalls = services.reduce((s, r) => s + r.calls, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Loading expenses...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="h6">Error loading expenses</Typography>
        <Typography variant="body2" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={`Total cost (${selectedPeriod})`} value={`$${total.toFixed(2)}`} hint="All services combined" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Top spender" value={topSpender?.service || '—'} hint={topSpender ? `$${topSpender.cost.toFixed(2)}` : ''} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total calls" value={totalCalls.toLocaleString()} hint="API requests" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Avg cost/day" value={`$${(total / (selectedPeriod === '1d' ? 1 : selectedPeriod === '7d' ? 7 : 30)).toFixed(2)}`} hint="Daily average" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Service Costs Breakdown</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="1d">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell align="right">Calls</TableCell>
              <TableCell align="right">Unit</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">% of Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.service}</TableCell>
                <TableCell align="right">{r.calls.toLocaleString()}</TableCell>
                <TableCell align="right">{r.unit}</TableCell>
                <TableCell align="right">${r.unitCost.toFixed(6)}</TableCell>
                <TableCell align="right">{r.quantity.toLocaleString()}</TableCell>
                <TableCell align="right">${r.cost.toFixed(2)}</TableCell>
                <TableCell align="right">{total > 0 ? ((r.cost / total) * 100).toFixed(1) : 0}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Cost Trend</Typography>
        <Box sx={{ height: 220, bgcolor: '#F9FAFB', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Cost trend chart coming soon...
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ExpensesTab;


