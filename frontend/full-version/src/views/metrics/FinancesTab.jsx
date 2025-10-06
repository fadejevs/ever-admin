'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
  Button,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Badge,
  Card,
  CardContent
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import GetAppIcon from '@mui/icons-material/GetApp';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { fetchExpenses, fetchUserPayments } from '@/services/metricsService';

const StatCard = ({ title, value, hint, trend, color = 'primary', icon }) => (
  <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="overline" sx={{ color: '#637381', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
          {title}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: '#212B36',
            fontWeight: 600,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            wordBreak: 'break-word'
          }}
        >
          {value}
        </Typography>
        {hint ? (
          <Typography
            variant="caption"
            sx={{
              color: '#919EAB',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              wordBreak: 'break-word'
            }}
          >
            {hint}
          </Typography>
        ) : null}
      </Box>
      {icon && (
        <Box
          sx={{
            color: color === 'success' ? '#4CAF50' : color === 'error' ? '#F44336' : '#2196F3',
            ml: 1,
            flexShrink: 0
          }}
        >
          {icon}
        </Box>
      )}
    </Stack>
    {trend && (
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
        {trend > 0 ? (
          <TrendingUpIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#4CAF50' }} />
        ) : (
          <TrendingDownIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#F44336' }} />
        )}
        <Typography
          variant="caption"
          sx={{
            color: trend > 0 ? '#4CAF50' : '#F44336',
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}
        >
          {Math.abs(trend)}% from last month
        </Typography>
      </Stack>
    )}
  </Paper>
);

const MetricRow = ({ metric, value, target, status, trend }) => (
  <TableRow>
    <TableCell
      sx={{
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        padding: { xs: 1, sm: 1.5 }
      }}
    >
      <Typography sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{metric}</Typography>
    </TableCell>
    <TableCell
      align="right"
      sx={{
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        padding: { xs: 1, sm: 1.5 }
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </TableCell>
    <TableCell
      align="right"
      sx={{
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        padding: { xs: 1, sm: 1.5 }
      }}
    >
      <Typography variant="body2" sx={{ color: '#637381' }}>
        {target}
      </Typography>
    </TableCell>
    <TableCell
      sx={{
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        padding: { xs: 1, sm: 1.5 }
      }}
    >
      <Chip
        size="small"
        label={status}
        color={status === 'Good' ? 'success' : status === 'Warning' ? 'warning' : 'error'}
        variant="outlined"
        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
      />
    </TableCell>
    <TableCell
      align="right"
      sx={{
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        padding: { xs: 1, sm: 1.5 }
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
        {trend > 0 ? (
          <TrendingUpIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: '#4CAF50' }} />
        ) : (
          <TrendingDownIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: '#F44336' }} />
        )}
        <Typography
          variant="caption"
          sx={{
            color: trend > 0 ? '#4CAF50' : '#F44336',
            fontSize: { xs: '0.65rem', sm: '0.75rem' }
          }}
        >
          {Math.abs(trend)}%
        </Typography>
      </Stack>
    </TableCell>
  </TableRow>
);

const FinancesTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Comprehensive mock data for Finances Dashboard
  const generateMockData = () => {
    const now = new Date();
    
    // FN-01: MRR & Growth data (12 months)
    const mrrData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const baseMrr = 15000 + (i * 2500) + Math.random() * 5000;
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        free: Math.floor(baseMrr * 0.3),
        pro: Math.floor(baseMrr * 0.5),
        enterprise: Math.floor(baseMrr * 0.2),
        total: Math.floor(baseMrr),
        growth: Math.floor((Math.random() - 0.3) * 40 + 15)
      };
    });

    // FN-02: KPI Cards data
    const kpiData = {
      mrr: 18500,
      arr: 222000,
      growth: 23.5,
      activeCustomers: 1247,
      churn: 2.1,
      nrr: 118.5,
      grossMargin: 78.2
    };

    // FN-03: Usage Metrics
    const usageData = {
      dau: 342,
      wau: 1890,
      mau: 8234,
      events24h: 1247,
      events7d: 8934,
      events30d: 45678,
      hoursDaily: 89.4,
      hoursMonthly: 2678.2
    };

    // FN-04: Top Languages
    const topLanguages = [
      { name: 'English → Spanish', hours: 12450, percentage: 32.1 },
      { name: 'English → French', hours: 8930, percentage: 23.0 },
      { name: 'Spanish → English', hours: 6780, percentage: 17.5 },
      { name: 'English → German', hours: 5420, percentage: 14.0 },
      { name: 'French → English', hours: 3890, percentage: 10.0 },
      { name: 'German → English', hours: 2340, percentage: 6.0 },
      { name: 'Other', hours: 1960, percentage: 5.1 }
    ];

    // FN-05: Geographical Usage
    const geoData = [
      { country: 'United States', usage: 45.2, revenue: 125000 },
      { country: 'United Kingdom', usage: 18.7, revenue: 52000 },
      { country: 'Germany', usage: 12.3, revenue: 34000 },
      { country: 'France', usage: 9.8, revenue: 28000 },
      { country: 'Spain', usage: 7.1, revenue: 19000 },
      { country: 'Canada', usage: 4.2, revenue: 12000 },
      { country: 'Australia', usage: 2.7, revenue: 8000 }
    ];

    // FN-06: Pricing Strategy & Conversions
    const pricingData = [
      {
        name: 'Free',
        users: 892,
        trials: 1247,
        conversions: 156,
        conversionRate: 12.5,
        revenue: 0,
        avgLtv: 0,
        downgrades: 0
      },
      {
        name: 'Pro',
        users: 298,
        trials: 445,
        conversions: 298,
        conversionRate: 67.0,
        revenue: 8940,
        avgLtv: 450,
        downgrades: 12
      },
      {
        name: 'Enterprise',
        users: 57,
        trials: 89,
        conversions: 57,
        conversionRate: 64.0,
        revenue: 17100,
        avgLtv: 3000,
        downgrades: 2
      }
    ];

    // FN-07: Expense List
    const expensesData = [
      { category: 'ASR Services', amount: 2340, percentage: 28.1, trend: 5.2 },
      { category: 'Translation (MT)', amount: 1890, percentage: 22.7, trend: -2.1 },
      { category: 'TTS Services', amount: 1560, percentage: 18.7, trend: 8.3 },
      { category: 'Hosting/Infra', amount: 1240, percentage: 14.9, trend: 12.5 },
      { category: 'Tools & Software', amount: 890, percentage: 10.7, trend: -1.8 },
      { category: 'Marketing', amount: 410, percentage: 4.9, trend: 15.2 }
    ];

    // FN-08: Gross Margin Calculation
    const marginData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const revenue = 15000 + (i * 2500) + Math.random() * 5000;
      const margin = 75 + Math.random() * 10;
      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.floor(revenue),
        margin: Math.floor(margin * 100) / 100,
        expenses: Math.floor(revenue * (1 - margin / 100))
      };
    });

    return {
      mrrData,
      kpiData,
      usageData,
      topLanguages,
      geoData,
      pricingData,
      expensesData,
      marginData
    };
  };

  const [mockData, setMockData] = useState(generateMockData());
  const [dataSource, setDataSource] = useState('mock');

  // Fetch real data from APIs
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        // Try to fetch expenses and user payments data
        const [expensesData, userPaymentsData] = await Promise.allSettled([
          fetchExpenses(),
          fetchUserPayments()
        ]);

        let hasRealData = false;
        
        if (expensesData.status === 'fulfilled' && expensesData.value && expensesData.value.length > 0) {
          hasRealData = true;
          console.log('Using real expenses data from API');
        }
        
        if (userPaymentsData.status === 'fulfilled' && userPaymentsData.value && userPaymentsData.value.total_users > 0) {
          hasRealData = true;
          console.log('Using real user payments data from API');
        }
        
        if (hasRealData) {
          setDataSource('api');
        } else {
          setDataSource('mock');
          console.log('Using mock data - APIs not available or returning empty data');
        }
      } catch (error) {
        console.warn('Failed to fetch real data, using mock data:', error);
        setDataSource('mock');
      }
    };

    fetchRealData();
  }, []);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header with Export and Notifications */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Finances Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Export Data">
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              size="small"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Financial Alerts">
            <Badge badgeContent={2} color="warning">
              <IconButton>
                <NotificationsActiveIcon />
              </IconButton>
            </Badge>
          </Tooltip>
        </Box>
      </Box>

      {/* Data Source Indicator */}
      <Alert 
        severity={dataSource === 'api' ? 'success' : 'info'} 
        sx={{ mb: 3 }}
      >
        <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          <strong>Data Source:</strong> {dataSource === 'api' ? 'Real data from backend APIs' : 'Sample data for demonstration'} 
          {dataSource === 'mock' && ' - Connect to your backend to see real financial data'}
        </Typography>
      </Alert>

      {/* Financial Alerts */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          <strong>Alert:</strong> Free plan users consuming 45% of interpretation hours. Consider usage limits or conversion incentives.
        </Typography>
      </Alert>

      {/* FN-02: KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="MRR"
            value={`$${mockData.kpiData.mrr.toLocaleString()}`}
            hint="Monthly Recurring Revenue"
            trend={mockData.kpiData.growth}
            color="success"
            icon={<AttachMoneyIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="ARR"
            value={`$${mockData.kpiData.arr.toLocaleString()}`}
            hint="Annual Recurring Revenue"
            trend={mockData.kpiData.growth}
            color="success"
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Churn Rate"
            value={`${mockData.kpiData.churn}%`}
            hint="Monthly churn"
            trend={-mockData.kpiData.churn}
            color={mockData.kpiData.churn <= 3 ? 'success' : 'warning'}
            icon={<PeopleIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gross Margin"
            value={`${mockData.kpiData.grossMargin}%`}
            hint="Profit margin"
            trend={2.1}
            color="success"
            icon={<TrendingUpIcon />}
          />
        </Grid>
      </Grid>

      {/* Dashboard Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable">
          <Tab label="MRR & Growth" />
          <Tab label="Usage Metrics" />
          <Tab label="Language Analysis" />
          <Tab label="Geographic Usage" />
          <Tab label="Pricing & Conversions" />
          <Tab label="Expenses" />
          <Tab label="Profitability" />
        </Tabs>

        {/* FN-01: MRR & Growth Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              MRR Trends & Growth (Last 12 Months)
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData.mrrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value, name) => [`$${value.toLocaleString()}`, name]} />
                  <Area type="monotone" dataKey="free" stackId="1" stroke="#4CAF50" fill="#4CAF50" />
                  <Area type="monotone" dataKey="pro" stackId="1" stroke="#2196F3" fill="#2196F3" />
                  <Area type="monotone" dataKey="enterprise" stackId="1" stroke="#FF9800" fill="#FF9800" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        {/* FN-03: Usage Metrics Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              User Adoption & Usage Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    Active Users
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="h4" color="primary">{mockData.usageData.dau}</Typography>
                      <Typography variant="caption">DAU</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h4" color="primary">{mockData.usageData.wau}</Typography>
                      <Typography variant="caption">WAU</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h4" color="primary">{mockData.usageData.mau}</Typography>
                      <Typography variant="caption">MAU</Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    Events & Hours
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="h4" color="primary">{mockData.usageData.events24h}</Typography>
                      <Typography variant="caption">Events (24h)</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h4" color="primary">{mockData.usageData.events7d}</Typography>
                      <Typography variant="caption">Events (7d)</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h4" color="primary">{mockData.usageData.hoursMonthly.toFixed(0)}</Typography>
                      <Typography variant="caption">Hours (30d)</Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* FN-04: Top Languages Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Top Language Pairs by Interpretation Hours
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.topLanguages} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <RechartsTooltip formatter={(value) => [`${value.toLocaleString()} hours`, 'Hours']} />
                  <Bar dataKey="hours" fill="#2196F3" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        {/* FN-05: Geographical Usage Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Usage Distribution by Country
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Country</TableCell>
                    <TableCell align="right">Usage %</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Avg Revenue/User</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockData.geoData.map((country, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 600 }}>{country.country}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <Box sx={{ width: 60, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                            <Box 
                              sx={{ 
                                width: `${country.usage}%`, 
                                height: '100%', 
                                backgroundColor: '#2196F3'
                              }} 
                            />
                          </Box>
                          <Typography variant="body2">{country.usage}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">${country.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right">${(country.revenue / (country.usage * 10)).toFixed(0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* FN-06: Pricing Strategy & Conversions Tab */}
        {activeTab === 4 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Pricing Strategy & Conversion Metrics
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Plan</TableCell>
                    <TableCell align="right">Users</TableCell>
                    <TableCell align="right">Trials</TableCell>
                    <TableCell align="right">Conversions</TableCell>
                    <TableCell align="right">Conversion Rate</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Avg LTV</TableCell>
                    <TableCell align="right">Downgrades</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockData.pricingData.map((plan, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography>{plan.name}</Typography>
                          {plan.name === 'Enterprise' && (
                            <Chip label="Premium" size="small" color="error" variant="outlined" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{plan.users.toLocaleString()}</TableCell>
                      <TableCell align="right">{plan.trials.toLocaleString()}</TableCell>
                      <TableCell align="right">{plan.conversions.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          sx={{ color: plan.conversionRate >= 50 ? '#4CAF50' : '#FF9800' }}
                        >
                          {plan.conversionRate}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">${plan.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right">${plan.avgLtv.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          sx={{ color: plan.downgrades > 5 ? '#F44336' : '#4CAF50' }}
                        >
                          {plan.downgrades}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* FN-07: Expense List Tab */}
        {activeTab === 5 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Monthly Expenses Breakdown
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockData.expensesData.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 600 }}>{expense.category}</TableCell>
                      <TableCell align="right">${expense.amount.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <Box sx={{ width: 60, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                            <Box 
                              sx={{ 
                                width: `${expense.percentage}%`, 
                                height: '100%', 
                                backgroundColor: '#FF9800'
                              }} 
                            />
                          </Box>
                          <Typography variant="body2">{expense.percentage}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
                          {expense.trend > 0 ? (
                            <TrendingUpIcon sx={{ fontSize: 14, color: '#F44336' }} />
                          ) : (
                            <TrendingDownIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
                          )}
                          <Typography 
                            variant="caption" 
                            sx={{ color: expense.trend > 0 ? '#F44336' : '#4CAF50' }}
                          >
                            {Math.abs(expense.trend)}%
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* FN-08: Gross Margin Calculation Tab */}
        {activeTab === 6 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Revenue vs Expenses & Gross Margin
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.marginData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value, name) => [`$${value.toLocaleString()}`, name]} />
                  <Bar dataKey="revenue" fill="#4CAF50" name="Revenue" />
                  <Bar dataKey="expenses" fill="#F44336" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            
            {/* Profitability Summary */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Profitability Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Total Revenue (12m)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                    ${mockData.marginData.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Total Expenses (12m)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#F44336' }}>
                    ${mockData.marginData.reduce((sum, m) => sum + m.expenses, 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Gross Profit</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                    ${(mockData.marginData.reduce((sum, m) => sum + m.revenue - m.expenses, 0)).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">Avg Margin</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#FF9800' }}>
                    {(mockData.marginData.reduce((sum, m) => sum + m.margin, 0) / mockData.marginData.length).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FinancesTab;
