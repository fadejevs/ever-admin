'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, FormControl, InputLabel, Stack, Chip, Divider, Alert, useTheme, useMediaQuery } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
// import { fetchExpenses, fetchUserPayments } from '@/services/metricsService';

const StatCard = ({ title, value, hint, trend, color = 'primary', icon }) => (
  <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="overline" sx={{ color: '#637381', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{title}</Typography>
        <Typography variant="h5" sx={{ 
          color: '#212B36', 
          fontWeight: 600, 
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          wordBreak: 'break-word'
        }}>
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" sx={{ 
            color: '#919EAB', 
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            wordBreak: 'break-word'
          }}>
            {hint}
          </Typography>
        ) : null}
      </Box>
      {icon && (
        <Box sx={{ 
          color: color === 'success' ? '#4CAF50' : color === 'error' ? '#F44336' : '#2196F3',
          ml: 1,
          flexShrink: 0
        }}>
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
        <Typography variant="caption" sx={{ 
          color: trend > 0 ? '#4CAF50' : '#F44336',
          fontSize: { xs: '0.7rem', sm: '0.75rem' }
        }}>
          {Math.abs(trend)}% from last month
        </Typography>
      </Stack>
    )}
  </Paper>
);

const MetricRow = ({ metric, value, target, status, trend }) => (
  <TableRow>
    <TableCell sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Typography sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{metric}</Typography>
    </TableCell>
    <TableCell align="right" sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
    </TableCell>
    <TableCell align="right" sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Typography variant="body2" sx={{ color: '#637381' }}>{target}</Typography>
    </TableCell>
    <TableCell sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Chip
        size="small"
        label={status}
        color={status === 'Good' ? 'success' : status === 'Warning' ? 'warning' : 'error'}
        variant="outlined"
        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
      />
    </TableCell>
    <TableCell align="right" sx={{ 
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      padding: { xs: 1, sm: 1.5 }
    }}>
      <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
        {trend > 0 ? (
          <TrendingUpIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: '#4CAF50' }} />
        ) : (
          <TrendingDownIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: '#F44336' }} />
        )}
        <Typography variant="caption" sx={{ 
          color: trend > 0 ? '#4CAF50' : '#F44336',
          fontSize: { xs: '0.65rem', sm: '0.75rem' }
        }}>
          {Math.abs(trend)}%
        </Typography>
      </Stack>
    </TableCell>
  </TableRow>
);

const FinancesTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Use local mock data for now (until main codebase is deployed with finances API)
  const mockExpensesData = {
    total: 850.00,
    breakdown: {
      infrastructure: 450.00,
      development: 250.00,
      marketing: 150.00
    }
  };

  const mockUserPaymentsData = {
    total_users: 14,
    paid_users: 0,
    free_users: 14,
    total_revenue: 0.00,
    monthly_revenue: 0.00,
    growth_rate: 25.0,
    churn_rate: 0.0,
    plans: [
      {
        name: 'Free',
        users: 14,
        conversion: 0,
        revenue: 0.00
      },
      {
        name: 'Pro',
        users: 0,
        conversion: 0,
        revenue: 0.00
      },
      {
        name: 'Enterprise',
        users: 0,
        conversion: 0,
        revenue: 0.00
      }
    ]
  };

  // Calculate financial metrics from mock data
  const calculateFinancialMetrics = () => {
    const totalExpenses = mockExpensesData.total;
    const totalUsers = mockUserPaymentsData.total_users;
    const paidUsers = mockUserPaymentsData.paid_users;
    const totalRevenue = mockUserPaymentsData.total_revenue;
    const monthlyRevenue = mockUserPaymentsData.monthly_revenue;
    
    // Calculate CAC (Customer Acquisition Cost)
    const cac = totalExpenses / Math.max(paidUsers || 1, 1);
    
    // Calculate LTV (Lifetime Value) - assuming 12 month average lifetime
    const avgMonthlyRevenue = monthlyRevenue / Math.max(paidUsers || 1, 1);
    const ltv = avgMonthlyRevenue * 12;
    
    // Calculate churn rate
    const churnRate = mockUserPaymentsData.churn_rate;
    
    // Calculate revenue metrics
    const mrr = monthlyRevenue;
    const arr = mrr * 12;
    const growth = mockUserPaymentsData.growth_rate;
    
    // Calculate pricing breakdown
    const plans = mockUserPaymentsData.plans;
    const averagePrice = paidUsers > 0 ? totalRevenue / paidUsers : 0;

    return {
      cac: { 
        current: cac, 
        target: 35.00, 
        trend: cac < 35 ? -12.5 : 5.2 
      },
      ltv: { 
        current: ltv, 
        target: 350.00, 
        trend: ltv > 350 ? 8.2 : -5.1 
      },
      churn: { 
        current: churnRate, 
        target: 3.0, 
        trend: churnRate < 3 ? -15.3 : 8.7 
      },
      revenue: { 
        mrr, 
        arr, 
        growth 
      },
      pricing: {
        plans,
        averagePrice
      }
    };
  };

  const financialData = calculateFinancialMetrics();
  const ltvCacRatio = financialData.ltv.current / financialData.cac.current;
  const paybackPeriod = financialData.cac.current / (financialData.ltv.current / 12);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Data Source Indicator */}
      <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          <strong>Beta Dashboard:</strong> Using sample data for 14 free users. 
          Deploy the finances API to your main codebase to see real data.
        </Typography>
      </Alert>

      {/* Key Financial Metrics */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="CAC" 
            value={`$${financialData.cac.current.toFixed(2)}`} 
            hint={`Target: $${financialData.cac.target}`}
            trend={financialData.cac.trend}
            color={financialData.cac.current <= financialData.cac.target ? 'success' : 'error'}
            icon={<AttachMoneyIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="LTV" 
            value={`$${financialData.ltv.current.toFixed(2)}`} 
            hint={`Target: $${financialData.ltv.target}`}
            trend={financialData.ltv.trend}
            color={financialData.ltv.current >= financialData.ltv.target ? 'success' : 'warning'}
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="LTV:CAC Ratio" 
            value={ltvCacRatio.toFixed(2)} 
            hint={`Payback: ${paybackPeriod.toFixed(1)} months`}
            trend={financialData.ltv.trend - financialData.cac.trend}
            color={ltvCacRatio >= 3 ? 'success' : ltvCacRatio >= 2 ? 'warning' : 'error'}
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Churn Rate" 
            value={`${financialData.churn.current}%`} 
            hint={`Target: ${financialData.churn.target}%`}
            trend={financialData.churn.trend}
            color={financialData.churn.current <= financialData.churn.target ? 'success' : 'error'}
            icon={<PeopleIcon />}
          />
        </Grid>
      </Grid>

      {/* Revenue Overview */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ 
          mb: { xs: 1.5, sm: 2 }, 
          fontWeight: 600,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Revenue Overview
        </Typography>
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="overline" sx={{ 
                color: '#637381',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                MRR
              </Typography>
              <Typography variant="h5" sx={{ 
                color: '#212B36', 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}>
                ${financialData.revenue.mrr.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#919EAB',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                Monthly Recurring Revenue
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="overline" sx={{ 
                color: '#637381',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                ARR
              </Typography>
              <Typography variant="h5" sx={{ 
                color: '#212B36', 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}>
                ${financialData.revenue.arr.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#919EAB',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                Annual Recurring Revenue
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="overline" sx={{ 
                color: '#637381',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                Growth
              </Typography>
              <Typography variant="h5" sx={{ 
                color: '#4CAF50', 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}>
                +{financialData.revenue.growth}%
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#919EAB',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                Month over Month
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="overline" sx={{ 
                color: '#637381',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                Avg Price
              </Typography>
              <Typography variant="h5" sx={{ 
                color: '#212B36', 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}>
                ${financialData.pricing.averagePrice.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#919EAB',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                Per Customer
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Pricing Strategy */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: { xs: 1.5, sm: 2 },
          gap: { xs: 1, sm: 0 }
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Pricing Strategy & Conversion
          </Typography>
          <FormControl size="small" sx={{ 
            minWidth: { xs: '100%', sm: 120 },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: { xs: 400, sm: 600 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Plan
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Users
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Conversion Rate
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Revenue
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Avg LTV
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {financialData.pricing.plans.map((plan, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}>
                        {plan.name}
                      </Typography>
                      {plan.name === 'Enterprise' && (
                        <Chip 
                          label="Premium" 
                          size="small" 
                          color="error" 
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    {plan.users.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: plan.conversion >= 10 ? '#4CAF50' : '#FF9800',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {plan.conversion}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    ${plan.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    ${plan.name === 'Free' ? '0' : (plan.revenue / plan.users).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Financial Health Metrics */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ 
          mb: { xs: 1.5, sm: 2 }, 
          fontWeight: 600,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Financial Health Metrics
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: { xs: 400, sm: 600 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Metric
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Current
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Target
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
                  Trend
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <MetricRow 
                metric="CAC Payback Period"
                value={`${paybackPeriod.toFixed(1)} months`}
                target="< 12 months"
                status={paybackPeriod <= 12 ? 'Good' : paybackPeriod <= 18 ? 'Warning' : 'Critical'}
                trend={-financialData.cac.trend}
              />
              <MetricRow 
                metric="LTV:CAC Ratio"
                value={ltvCacRatio.toFixed(2)}
                target="> 3.0"
                status={ltvCacRatio >= 3 ? 'Good' : ltvCacRatio >= 2 ? 'Warning' : 'Critical'}
                trend={financialData.ltv.trend - financialData.cac.trend}
              />
              <MetricRow 
                metric="Churn Rate"
                value={`${financialData.churn.current}%`}
                target="< 3%"
                status={financialData.churn.current <= 3 ? 'Good' : financialData.churn.current <= 5 ? 'Warning' : 'Critical'}
                trend={financialData.churn.trend}
              />
              <MetricRow 
                metric="Revenue Growth"
                value={`${financialData.revenue.growth}%`}
                target="> 20%"
                status={financialData.revenue.growth >= 20 ? 'Good' : financialData.revenue.growth >= 10 ? 'Warning' : 'Critical'}
                trend={financialData.revenue.growth}
              />
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default FinancesTab;


