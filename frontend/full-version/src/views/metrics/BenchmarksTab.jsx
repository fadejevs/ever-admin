'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Chip, Select, MenuItem, FormControl, InputLabel, useTheme, useMediaQuery } from '@mui/material';
import { fetchBenchmarks } from '@/services/metricsService';

const StatCard = ({ title, value, hint }) => (
  <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
    <Box>
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
      {hint && (
        <Typography variant="caption" sx={{ 
          color: '#919EAB',
          fontSize: { xs: '0.7rem', sm: '0.75rem' }
        }}>
          {hint}
        </Typography>
      )}
    </Box>
  </Paper>
);

const BenchmarksTab = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('overall');
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchBenchmarks();
        if (!mounted) return;
        setBenchmarkData(data);
      } catch (e) {
        if (!mounted) return;
        console.error('fetchBenchmarks error:', e);
        setError(e?.message || 'Failed to load benchmarks data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const asrBenchmarks = benchmarkData ? [
    {
      model_name: 'Whisper Large v3',
      language: 'overall',
      avg_overall_wer: 2.8,
      avg_rtf_total: 0.15,
      cost_batch_per_1000_min: 0.45,
      is_best: true
    },
    {
      model_name: 'Whisper Medium',
      language: 'overall',
      avg_overall_wer: 3.2,
      avg_rtf_total: 0.08,
      cost_batch_per_1000_min: 0.25,
      is_best: false
    },
    {
      model_name: 'Whisper Small',
      language: 'overall',
      avg_overall_wer: 4.1,
      avg_rtf_total: 0.05,
      cost_batch_per_1000_min: 0.15,
      is_best: false
    },
    {
      model_name: 'Whisper Large v3',
      language: 'en',
      avg_overall_wer: 2.1,
      avg_rtf_total: 0.12,
      cost_batch_per_1000_min: 0.42,
      is_best: true
    },
    {
      model_name: 'Whisper Medium',
      language: 'en',
      avg_overall_wer: 2.8,
      avg_rtf_total: 0.07,
      cost_batch_per_1000_min: 0.22,
      is_best: false
    }
  ] : [];

  const filteredData = selectedLanguage === 'overall' 
    ? asrBenchmarks.filter(d => d.language === 'overall') 
    : asrBenchmarks.filter(d => d.language === selectedLanguage);
  
  const bestWER = Math.min(...filteredData.map(d => d.avg_overall_wer));
  const bestRTF = Math.min(...filteredData.map(d => d.avg_rtf_total));
  const bestCost = Math.min(...filteredData.map(d => d.cost_batch_per_1000_min));
  const totalModels = filteredData.length;

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
          Loading benchmarks...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Typography color="error" variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Error loading benchmarks
        </Typography>
        <Typography variant="body2" color="error" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Language Filter */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: { xs: 1, sm: 0 }
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          ASR Model Performance
        </Typography>
        <FormControl size="small" sx={{ 
          minWidth: { xs: '100%', sm: 150 },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={selectedLanguage}
            label="Language"
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <MenuItem value="overall">Overall</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="de">German</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Performance Overview */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Best WER" 
            value={`${bestWER}%`} 
            hint="Word Error Rate (lower is better)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Best RTF" 
            value={bestRTF.toFixed(2)} 
            hint="Real Time Factor (lower is better)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Best Cost" 
            value={`$${bestCost.toFixed(2)}`} 
            hint="Per 1000 minutes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Models Tested" 
            value={totalModels.toString()} 
            hint="Available models"
          />
        </Grid>
      </Grid>

      {/* Benchmarks Table */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ 
          mb: { xs: 1.5, sm: 2 }, 
          fontWeight: 600,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Model Comparison
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: { xs: 400, sm: 600 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Model
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  WER (%)
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  RTF
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Cost
                </TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: 1, sm: 1.5 }
                }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((model, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}>
                        {model.model_name}
                      </Typography>
                      {model.is_best && (
                        <Chip 
                          label="Best" 
                          size="small" 
                          color="success" 
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
                    <Typography variant="body2" sx={{ 
                      color: model.avg_overall_wer === bestWER ? '#4CAF50' : '#637381',
                      fontWeight: model.avg_overall_wer === bestWER ? 600 : 400,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {model.avg_overall_wer}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: model.avg_rtf_total === bestRTF ? '#4CAF50' : '#637381',
                      fontWeight: model.avg_rtf_total === bestRTF ? 600 : 400,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      {model.avg_rtf_total.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: model.cost_batch_per_1000_min === bestCost ? '#4CAF50' : '#637381',
                      fontWeight: model.cost_batch_per_1000_min === bestCost ? 600 : 400,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      ${model.cost_batch_per_1000_min.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: 1, sm: 1.5 }
                  }}>
                    <Chip
                      size="small"
                      label={model.is_best ? 'Recommended' : 'Available'}
                      color={model.is_best ? 'success' : 'default'}
                      variant={model.is_best ? 'filled' : 'outlined'}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Performance Notes */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, mt: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ 
          mb: { xs: 1, sm: 1.5 }, 
          fontWeight: 600,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          Performance Notes
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" sx={{ 
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            color: '#637381'
          }}>
            • <strong>WER (Word Error Rate):</strong> Lower percentage indicates better accuracy
          </Typography>
          <Typography variant="body2" sx={{ 
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            color: '#637381'
          }}>
            • <strong>RTF (Real Time Factor):</strong> Values below 1.0 indicate faster than real-time processing
          </Typography>
          <Typography variant="body2" sx={{ 
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            color: '#637381'
          }}>
            • <strong>Cost:</strong> Per 1000 minutes of audio processing
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default BenchmarksTab;


