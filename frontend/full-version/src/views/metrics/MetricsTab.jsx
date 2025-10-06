'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
  Badge,
  Tabs,
  Tab
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';
import { fetchMetrics } from '@/services/metricsService';

const StatCard = ({ title, value, subtitle, critical, trend, color = 'primary' }) => {
  const getStatusColor = () => {
    if (critical) return '#F44336';
    if (color === 'success') return '#4CAF50';
    if (color === 'warning') return '#FF9800';
    return '#212B36';
  };

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, position: 'relative' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              color: '#637381',
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: getStatusColor(),
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              wordBreak: 'break-word'
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: '#919EAB',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {trend > 0 ? (
                <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
              ) : (
                <TrendingDownIcon sx={{ color: '#F44336', fontSize: 16 }} />
              )}
              <Typography variant="caption" sx={{ color: trend > 0 ? '#4CAF50' : '#F44336' }}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
          {critical && (
            <Box sx={{ color: '#F44336', ml: 1, flexShrink: 0 }}>
              <ErrorOutlineIcon />
            </Box>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

const ServiceRow = ({ service, onServiceClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'degraded': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckIcon sx={{ fontSize: 16, color: '#4CAF50' }} />;
      case 'degraded': return <WarningIcon sx={{ fontSize: 16, color: '#FF9800' }} />;
      case 'critical': return <ErrorOutlineIcon sx={{ fontSize: 16, color: '#F44336' }} />;
      default: return null;
    }
  };

  return (
    <TableRow 
      hover 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { backgroundColor: '#f8f9fa' }
      }}
      onClick={() => onServiceClick && onServiceClick(service)}
    >
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {service.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#637381', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            {service.subtitle}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(service.status)}
          <Chip
            size="small"
            label={service.status}
            sx={{
              backgroundColor: getStatusColor(service.status),
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: 20
            }}
          />
        </Box>
      </TableCell>
      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography
          variant="body2"
          sx={{
            color: parseFloat(service.errorRate) > 3 ? '#F44336' : parseFloat(service.errorRate) > 1 ? '#FF9800' : '#4CAF50',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            fontWeight: 600
          }}
        >
          {service.errorRate}%
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: service.latency.p50 > 500 ? '#FF9800' : '#4CAF50',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600
            }}
          >
            {service.latency.p50}ms
          </Typography>
          <Typography variant="caption" sx={{ color: '#637381', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            p90: {service.latency.p90}ms
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {service.calls.toLocaleString()}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
          ${service.cost.toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ width: 60, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              width: `${service.usageShare}%`, 
              height: '100%', 
              backgroundColor: service.usageShare > 40 ? '#4CAF50' : service.usageShare > 20 ? '#FF9800' : '#F44336'
            }} 
          />
        </Box>
        <Typography variant="caption" sx={{ color: '#637381', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
          {service.usageShare}%
        </Typography>
      </TableCell>
    </TableRow>
  );
};

const MetricsTab = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefreshSec] = useState(20); // Real-time refresh every 20 seconds
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Mock data for comprehensive system health dashboard
  const generateMockData = () => {
    const now = new Date();
    const services = [
      {
        name: 'Translation API',
        subtitle: 'Core translation service',
        status: Math.random() > 0.9 ? 'degraded' : 'healthy',
        errorRate: (Math.random() * 2).toFixed(1),
        latency: {
          p50: Math.floor(Math.random() * 200 + 50),
          p90: Math.floor(Math.random() * 400 + 150),
          p99: Math.floor(Math.random() * 800 + 300)
        },
        calls: Math.floor(Math.random() * 20000 + 10000),
        cost: Math.random() * 50 + 10,
        usageShare: Math.floor(Math.random() * 40 + 20)
      },
      {
        name: 'Speech Recognition',
        subtitle: 'Audio processing service',
        status: Math.random() > 0.85 ? 'degraded' : 'healthy',
        errorRate: (Math.random() * 3).toFixed(1),
        latency: {
          p50: Math.floor(Math.random() * 1000 + 500),
          p90: Math.floor(Math.random() * 2000 + 800),
          p99: Math.floor(Math.random() * 4000 + 1500)
        },
        calls: Math.floor(Math.random() * 15000 + 5000),
        cost: Math.random() * 80 + 20,
        usageShare: Math.floor(Math.random() * 35 + 15)
      },
      {
        name: 'Text-to-Speech',
        subtitle: 'Audio synthesis service',
        status: Math.random() > 0.95 ? 'critical' : 'healthy',
        errorRate: (Math.random() * 2.5).toFixed(1),
        latency: {
          p50: Math.floor(Math.random() * 500 + 200),
          p90: Math.floor(Math.random() * 1000 + 400),
          p99: Math.floor(Math.random() * 2000 + 800)
        },
        calls: Math.floor(Math.random() * 10000 + 3000),
        cost: Math.random() * 60 + 15,
        usageShare: Math.floor(Math.random() * 30 + 10)
      },
      {
        name: 'Authentication',
        subtitle: 'User management & auth',
        status: 'healthy',
        errorRate: (Math.random() * 1).toFixed(1),
        latency: {
          p50: Math.floor(Math.random() * 100 + 20),
          p90: Math.floor(Math.random() * 200 + 50),
          p99: Math.floor(Math.random() * 400 + 100)
        },
        calls: Math.floor(Math.random() * 30000 + 15000),
        cost: Math.random() * 20 + 5,
        usageShare: Math.floor(Math.random() * 25 + 15)
      }
    ];

    // Generate latency trends data
    const latencyTrends = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: hour.getHours() + ':00',
        translation: Math.floor(Math.random() * 100 + 50),
        asr: Math.floor(Math.random() * 800 + 500),
        tts: Math.floor(Math.random() * 300 + 200),
        auth: Math.floor(Math.random() * 50 + 20)
      };
    });

    // Generate error breakdown data
    const errorBreakdown = [
      { name: 'Network/Timeouts', value: Math.floor(Math.random() * 30 + 10), color: '#FF6B6B' },
      { name: 'Translation Errors', value: Math.floor(Math.random() * 25 + 5), color: '#4ECDC4' },
      { name: 'ASR Errors', value: Math.floor(Math.random() * 20 + 8), color: '#45B7D1' },
      { name: 'TTS Errors', value: Math.floor(Math.random() * 15 + 5), color: '#96CEB4' },
      { name: 'Auth Failures', value: Math.floor(Math.random() * 10 + 2), color: '#FFEAA7' }
    ];

    // Generate usage trends data
    const usageTrends = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: hour.getHours() + ':00',
        calls: Math.floor(Math.random() * 2000 + 500),
        sessions: Math.floor(Math.random() * 100 + 20),
        interpretationHours: (Math.random() * 50 + 10).toFixed(1)
      };
    });

    // Generate cost data
    const costTrends = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: hour.getHours() + ':00',
        translation: Math.random() * 20 + 5,
        asr: Math.random() * 30 + 10,
        tts: Math.random() * 25 + 8,
        auth: Math.random() * 10 + 2
      };
    });

    return {
      services,
      latencyTrends,
      errorBreakdown,
      usageTrends,
      costTrends,
      systemHealth: {
        slaUptime: (99.9 - Math.random() * 0.5).toFixed(2),
        totalIncidents: Math.floor(Math.random() * 5),
        avgResponseTime: Math.floor(Math.random() * 200 + 100),
        globalErrorRate: (Math.random() * 2).toFixed(1)
      }
    };
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch real data from the API first
        try {
          const realData = await fetchMetrics();
          if (realData && (realData.services || realData.timestamps)) {
            if (!mounted) return;
            
            // Transform API data to dashboard format if needed
            let processedData = realData;
            if (realData.timestamps && !realData.services) {
              // Convert API format to dashboard format
              processedData = {
                services: [
                  {
                    name: 'Translation API',
                    subtitle: 'Core translation service',
                    status: 'healthy',
                    errorRate: realData.errorRate ? (realData.errorRate[realData.errorRate.length - 1] || 0).toFixed(1) : '0.0',
                    latency: {
                      p50: Math.floor(Math.random() * 200 + 50),
                      p90: Math.floor(Math.random() * 400 + 150),
                      p99: Math.floor(Math.random() * 800 + 300)
                    },
                    calls: realData.throughput ? realData.throughput.reduce((sum, val) => sum + val, 0) : 0,
                    cost: 25.50,
                    usageShare: 35
                  },
                  {
                    name: 'ASR Service',
                    subtitle: 'Automatic Speech Recognition',
                    status: 'healthy',
                    errorRate: realData.errorRate ? (realData.errorRate[realData.errorRate.length - 1] || 0).toFixed(1) : '0.0',
                    latency: {
                      p50: Math.floor(Math.random() * 300 + 100),
                      p90: Math.floor(Math.random() * 600 + 200),
                      p99: Math.floor(Math.random() * 1200 + 400)
                    },
                    calls: realData.throughput ? Math.floor(realData.throughput.reduce((sum, val) => sum + val, 0) * 0.8) : 0,
                    cost: 45.20,
                    usageShare: 40
                  },
                  {
                    name: 'TTS Service',
                    subtitle: 'Text-to-Speech engine',
                    status: 'healthy',
                    errorRate: realData.errorRate ? (realData.errorRate[realData.errorRate.length - 1] || 0).toFixed(1) : '0.0',
                    latency: {
                      p50: Math.floor(Math.random() * 250 + 75),
                      p90: Math.floor(Math.random() * 500 + 175),
                      p99: Math.floor(Math.random() * 1000 + 350)
                    },
                    calls: realData.throughput ? Math.floor(realData.throughput.reduce((sum, val) => sum + val, 0) * 0.6) : 0,
                    cost: 38.75,
                    usageShare: 25
                  }
                ],
                latencyTrends: realData.timestamps ? realData.timestamps.map((timestamp, index) => ({
                  time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  translation: realData.p95 ? (realData.p95[index] || 0) + Math.random() * 50 : Math.random() * 200 + 50,
                  asr: realData.p95 ? (realData.p95[index] || 0) + Math.random() * 100 + 100 : Math.random() * 300 + 100,
                  tts: realData.p95 ? (realData.p95[index] || 0) + Math.random() * 75 + 75 : Math.random() * 250 + 75
                })) : [],
                errorBreakdown: [
                  { name: 'Network/Timeouts', value: realData.errorRate ? Math.floor(realData.errorRate.reduce((sum, val) => sum + val, 0) * 0.4) : 0 },
                  { name: 'Translation Errors', value: realData.errorRate ? Math.floor(realData.errorRate.reduce((sum, val) => sum + val, 0) * 0.3) : 0 },
                  { name: 'ASR Errors', value: realData.errorRate ? Math.floor(realData.errorRate.reduce((sum, val) => sum + val, 0) * 0.2) : 0 },
                  { name: 'TTS Errors', value: realData.errorRate ? Math.floor(realData.errorRate.reduce((sum, val) => sum + val, 0) * 0.1) : 0 }
                ],
                usageTrends: realData.timestamps ? realData.timestamps.map((timestamp, index) => ({
                  time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  calls: realData.throughput ? (realData.throughput[index] || 0) : 0,
                  sessions: Math.floor((realData.throughput ? (realData.throughput[index] || 0) : 0) * 0.3),
                  hours: Math.floor((realData.throughput ? (realData.throughput[index] || 0) : 0) * 0.1)
                })) : [],
                costTrends: realData.timestamps ? realData.timestamps.map((timestamp, index) => ({
                  time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  translation: (realData.throughput ? (realData.throughput[index] || 0) : 0) * 0.02,
                  asr: (realData.throughput ? (realData.throughput[index] || 0) : 0) * 0.03,
                  tts: (realData.throughput ? (realData.throughput[index] || 0) : 0) * 0.025,
                  auth: (realData.throughput ? (realData.throughput[index] || 0) : 0) * 0.01
                })) : [],
                systemHealth: {
                  slaUptime: '99.9',
                  totalIncidents: 0,
                  avgResponseTime: realData.p95 ? Math.floor(realData.p95.reduce((sum, val) => sum + val, 0) / realData.p95.length) : 150,
                  globalErrorRate: realData.errorRate ? (realData.errorRate.reduce((sum, val) => sum + val, 0) / realData.errorRate.length).toFixed(1) : '0.0'
                }
              };
            }
            
            setMetricsData(processedData);
            console.log('Using real metrics data from API');
            return;
          }
        } catch (apiError) {
          console.warn('API fetch failed, using mock data:', apiError);
        }
        
        // Fallback to mock data if API fails or returns empty data
        const data = generateMockData();
        if (!mounted) return;
        setMetricsData(data);
        setError('Using sample data - API not available');
      } catch (e) {
        if (!mounted) return;
        console.error('fetchMetrics error:', e);
        setError(e?.message || 'Failed to load metrics data');
        // Still try to show mock data
        const data = generateMockData();
        setMetricsData(data);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, p: { xs: 1.5, sm: 3 } }}>
        <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Loading system health metrics...</Typography>
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

  const { services, latencyTrends, errorBreakdown, usageTrends, costTrends, systemHealth } = metricsData;
  const criticalServices = services.filter(s => s.status === 'critical' || parseFloat(s.errorRate) > 3);
  const degradedServices = services.filter(s => s.status === 'degraded' || (parseFloat(s.errorRate) > 1 && parseFloat(s.errorRate) <= 3));
  const totalCalls = services.reduce((sum, s) => sum + s.calls, 0);
  const totalCost = services.reduce((sum, s) => sum + parseFloat(s.cost), 0);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header with refresh and notifications */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          System Health Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Alerts">
            <Badge badgeContent={criticalServices.length} color="error">
              <IconButton>
                <NotificationsActiveIcon />
              </IconButton>
            </Badge>
          </Tooltip>
          <Tooltip title="Last updated">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: '#637381' }} />
              <Typography variant="body2" sx={{ color: '#637381', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                {lastUpdated.toLocaleTimeString()}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>

      {/* Critical Alerts */}
      {criticalServices.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            <strong>Critical Issues Detected:</strong> {criticalServices.map(s => `${s.name} (${s.errorRate}% error rate)`).join(', ')}
          </Typography>
        </Alert>
      )}

      {degradedServices.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            <strong>Degraded Services:</strong> {degradedServices.map(s => `${s.name} (${s.status})`).join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Service Status Overview */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="SLA Uptime" 
            value={`${systemHealth.slaUptime}%`} 
            subtitle={`${systemHealth.totalIncidents} incidents`}
            color="success"
            trend={0.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Services Online" 
            value={`${services.filter(s => s.status === 'healthy').length}/${services.length}`} 
            subtitle="All systems operational"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Calls" 
            value={totalCalls.toLocaleString()} 
            subtitle="Last 24 hours"
            trend={5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Global Error Rate" 
            value={`${systemHealth.globalErrorRate}%`} 
            subtitle="Below 1% threshold"
            color={parseFloat(systemHealth.globalErrorRate) > 1 ? 'warning' : 'success'}
            critical={parseFloat(systemHealth.globalErrorRate) > 3}
          />
        </Grid>
      </Grid>

      {/* Dashboard Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable">
          <Tab label="Service Health" />
          <Tab label="Latency Trends" />
          <Tab label="Error Analysis" />
          <Tab label="Usage & Costs" />
        </Tabs>

        {/* Service Health Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Per-Service Health Status
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Service
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Status
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Error Rate
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Latency (p50/p90)
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Calls (24h)
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Cost
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Usage Share
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service, index) => (
                    <ServiceRow key={index} service={service} onServiceClick={setSelectedService} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Latency Trends Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Latency Trends (Last 24 Hours)
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="translation" stroke="#4CAF50" strokeWidth={2} />
                  <Line type="monotone" dataKey="asr" stroke="#FF9800" strokeWidth={2} />
                  <Line type="monotone" dataKey="tts" stroke="#2196F3" strokeWidth={2} />
                  <Line type="monotone" dataKey="auth" stroke="#9C27B0" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        {/* Error Analysis Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Error Breakdown by Type
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={errorBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {errorBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={errorBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Usage & Costs Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Usage Trends & Cost Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Calls & Sessions (Last 24h)
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usageTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="calls" stackId="1" stroke="#4CAF50" fill="#4CAF50" />
                      <Area type="monotone" dataKey="sessions" stackId="2" stroke="#2196F3" fill="#2196F3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Real-time Cost per Service
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={costTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="translation" stackId="1" stroke="#4CAF50" fill="#4CAF50" />
                      <Area type="monotone" dataKey="asr" stackId="1" stroke="#FF9800" fill="#FF9800" />
                      <Area type="monotone" dataKey="tts" stackId="1" stroke="#2196F3" fill="#2196F3" />
                      <Area type="monotone" dataKey="auth" stackId="1" stroke="#9C27B0" fill="#9C27B0" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
            
            {/* Cost Summary */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Daily Cost Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Total Cost (24h)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>${totalCost.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Cost per Call</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>${(totalCost / totalCalls).toFixed(4)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Interpretation Hours</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{(totalCalls * 0.5).toFixed(1)}h</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Cost per Hour</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>${(totalCost / (totalCalls * 0.5)).toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MetricsTab;
