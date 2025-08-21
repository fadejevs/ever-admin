'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Alert, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack, useTheme, useMediaQuery } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { fetchMetrics } from '@/services/metricsService';

const StatCard = ({ title, value, subtitle, critical }) => (
  <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="overline" sx={{ 
          color: '#637381',
          fontSize: { xs: '0.7rem', sm: '0.75rem' }
        }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ 
          color: '#212B36', 
          fontWeight: 600,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          wordBreak: 'break-word'
        }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ 
            color: '#919EAB',
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {critical && (
        <Box sx={{ 
          color: '#F44336',
          ml: 1,
          flexShrink: 0
        }}>
          <ErrorOutlineIcon />
        </Box>
      )}
    </Stack>
  </Paper>
);

const ServiceRow = ({ name, subtitle, status, errorRate, latency, calls, highlight }) => (
  <TableRow sx={{ backgroundColor: highlight ? '#f8f9fa' : 'inherit' }}>
    <TableCell sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Box>
        <Typography sx={{ 
          fontWeight: 600,
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ 
          color: '#637381',
          fontSize: { xs: '0.65rem', sm: '0.75rem' }
        }}>
          {subtitle}
        </Typography>
      </Box>
    </TableCell>
    <TableCell sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Chip
        size="small"
        label={status}
        color={status === 'healthy' ? 'success' : status === 'degraded' ? 'warning' : 'error'}
        variant="outlined"
        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
      />
    </TableCell>
    <TableCell align="right" sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Typography variant="body2" sx={{ 
        color: parseFloat(errorRate) > 3 ? '#F44336' : '#4CAF50',
        fontSize: { xs: '0.75rem', sm: '0.875rem' }
      }}>
        {errorRate}%
      </Typography>
    </TableCell>
    <TableCell align="right" sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Typography variant="body2" sx={{ 
        color: latency > 500 ? '#FF9800' : '#4CAF50',
        fontSize: { xs: '0.75rem', sm: '0.875rem' }
      }}>
        {latency}ms
      </Typography>
    </TableCell>
    <TableCell align="right" sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Typography variant="body2" sx={{ 
        fontSize: { xs: '0.75rem', sm: '0.875rem' }
      }}>
        {calls.toLocaleString()}
      </Typography>
    </TableCell>
  </TableRow>
);

const MetricsTab = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefreshSec] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchMetrics();
        if (!mounted) return;
        setMetricsData(data);
      } catch (e) {
        if (!mounted) return;
        console.error('fetchMetrics error:', e);
        setError(e?.message || 'Failed to load metrics data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, autoRefreshSec * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [autoRefreshSec]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const services = metricsData ? [
    {
      name: 'Translation API',
      subtitle: 'Core translation service',
      status: 'healthy',
      errorRate: '0.5',
      latency: 120,
      calls: 15420,
      highlight: false
    },
    {
      name: 'Speech Recognition',
      subtitle: 'Audio processing service',
      status: 'healthy',
      errorRate: '1.2',
      latency: 850,
      calls: 8920,
      highlight: false
    },
    {
      name: 'Text-to-Speech',
      subtitle: 'Audio synthesis service',
      status: 'healthy',
      errorRate: '0.8',
      latency: 320,
      calls: 5670,
      highlight: false
    },
    {
      name: 'User Management',
      subtitle: 'Authentication & profiles',
      status: 'healthy',
      errorRate: '0.3',
      latency: 45,
      calls: 23410,
      highlight: false
    }
  ] : [];

  const issues = services.filter(s => parseFloat(s.errorRate) > 3).map(s => `${s.name} has ${s.errorRate} error rate (max: 3%)`);
  const servicesOnline = `${services.filter((s) => s.status === 'healthy').length}/${services.length}`;
  const totalCalls = services.reduce((sum, s) => sum + s.calls, 0);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400, 
        p: { xs: 1.5, sm: 3 } 
      }}>
        <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Loading metrics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Status Overview */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Services Online" 
            value={servicesOnline} 
            subtitle="All systems operational"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Calls" 
            value={totalCalls.toLocaleString()} 
            subtitle="Last 24 hours"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Avg Response Time" 
            value="120ms" 
            subtitle="Across all services"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Error Rate" 
            value="0.7%" 
            subtitle="Below 1% threshold"
          />
        </Grid>
      </Grid>

      {/* Alerts */}
      {issues.length > 0 && (
        <Alert severity="warning" sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            <strong>Issues Detected:</strong> {issues.join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Last Updated */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        mb: { xs: 2, sm: 3 },
        fontSize: { xs: '0.8rem', sm: '0.875rem' }
      }}>
        <AccessTimeIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
        <Typography variant="body2" sx={{ 
          color: '#637381',
          fontSize: { xs: '0.8rem', sm: '0.875rem' }
        }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Services Table */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ 
          mb: { xs: 1.5, sm: 2 }, 
          fontWeight: 600,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Service Health
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: { xs: 400, sm: 600 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Service
                </TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Error Rate
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Latency
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Calls
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service, index) => (
                <ServiceRow key={index} {...service} />
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default MetricsTab;


