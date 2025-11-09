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
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchEventQualityAssessments } from '@/services/metricsService';

const ScoreCard = ({ title, score, subtitle, color = 'primary' }) => {
  const getScoreColor = () => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
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
            variant="h4"
            sx={{
              color: getScoreColor(),
              fontWeight: 600,
              fontSize: { xs: '1.75rem', sm: '2.25rem' },
              wordBreak: 'break-word'
            }}
          >
            {score}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#919EAB',
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
            {getScoreLabel()}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: '#919EAB',
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                display: 'block',
                mt: 0.5
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircularProgress
            variant="determinate"
            value={score}
            size={60}
            thickness={4}
            sx={{
              color: getScoreColor(),
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round'
              }
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

const AssessmentRow = ({ assessment }) => {
  const { timestamp, assessment: data } = assessment;
  const { eventTitle, durationMinutes, scores, overallScore, metrics } = data;
  
  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    return '#F44336';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {eventTitle || 'Untitled Event'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#637381', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            {formatDate(timestamp)}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography
          variant="body2"
          sx={{
            color: getScoreColor(overallScore),
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            fontWeight: 600
          }}
        >
          {overallScore}
        </Typography>
      </TableCell>
      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography
          variant="body2"
          sx={{
            color: getScoreColor(scores.translationLatency),
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {scores.translationLatency}
        </Typography>
      </TableCell>
      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography
          variant="body2"
          sx={{
            color: getScoreColor(scores.systemReliability),
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {scores.systemReliability}
        </Typography>
      </TableCell>
      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography
          variant="body2"
          sx={{
            color: getScoreColor(scores.contentSafety),
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {scores.contentSafety}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {durationMinutes.toFixed(1)} min
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {metrics.totalTranslations || 0}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

const EventQualityTab = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentsData, setAssessmentsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEventQualityAssessments({ limit: 50 });
        if (!mounted) return;
        setAssessmentsData(data);
      } catch (e) {
        if (!mounted) return;
        console.error('fetchEventQualityAssessments error:', e);
        setError(e?.message || 'Failed to load event quality assessments');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEventQualityAssessments({ limit: 50 });
      setAssessmentsData(data);
    } catch (e) {
      console.error('fetchEventQualityAssessments error:', e);
      setError(e?.message || 'Failed to refresh event quality assessments');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !assessmentsData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, p: { xs: 1.5, sm: 3 } }}>
        <CircularProgress />
        <Typography sx={{ ml: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Loading event quality assessments...
        </Typography>
      </Box>
    );
  }

  if (error && !assessmentsData) {
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

  const assessments = assessmentsData?.assessments || [];
  
  // Calculate average scores
  const avgOverall = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.assessment.overallScore, 0) / assessments.length)
    : 0;
  const avgLatency = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.assessment.scores.translationLatency, 0) / assessments.length)
    : 0;
  const avgReliability = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.assessment.scores.systemReliability, 0) / assessments.length)
    : 0;
  const avgSafety = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.assessment.scores.contentSafety, 0) / assessments.length)
    : 0;

  // Prepare chart data
  const scoreTrends = assessments.slice(0, 20).reverse().map((a, index) => ({
    index: index + 1,
    overall: a.assessment.overallScore,
    latency: a.assessment.scores.translationLatency,
    reliability: a.assessment.scores.systemReliability,
    safety: a.assessment.scores.contentSafety
  }));

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Event Quality Assessments
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
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

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* Score Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ScoreCard
            title="Overall Score"
            score={avgOverall}
            subtitle={`Average across ${assessments.length} events`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ScoreCard
            title="Translation Latency"
            score={avgLatency}
            subtitle="Processing speed performance"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ScoreCard
            title="System Reliability"
            score={avgReliability}
            subtitle="Error rate & connection stability"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ScoreCard
            title="Content Safety"
            score={avgSafety}
            subtitle="Safety blocks effectiveness"
          />
        </Grid>
      </Grid>

      {/* Score Trends Chart */}
      {scoreTrends.length > 0 && (
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Score Trends (Last 20 Events)
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="overall" stroke="#212B36" strokeWidth={2} name="Overall" />
                <Line type="monotone" dataKey="latency" stroke="#4CAF50" strokeWidth={2} name="Latency" />
                <Line type="monotone" dataKey="reliability" stroke="#2196F3" strokeWidth={2} name="Reliability" />
                <Line type="monotone" dataKey="safety" stroke="#9C27B0" strokeWidth={2} name="Safety" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {/* Assessments Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recent Event Assessments
          </Typography>
          {assessments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ color: '#637381' }}>
                No event quality assessments available yet.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Event
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Overall
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Latency
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Reliability
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Safety
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Duration
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, padding: { xs: 1, sm: 1.5 } }}>
                      Translations
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assessments.map((assessment, index) => (
                    <AssessmentRow key={index} assessment={assessment} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default EventQualityTab;

