'use client';
import PropTypes from 'prop-types';

import { useEffect, useState } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// @project
import MainCard from '@/components/MainCard';
import CustomTooltip from '@/components/third-party/chart/CustomTooltip';
import Legend from '@/components/third-party/chart/Legend';

//@type

// @assets
import { IconDownload } from '@tabler/icons-react';

// @types

/**************************** CHART - CUSTOM TOOLTIP ********* */

function TooltipWrapper({ counter, groupLabel = '', label = '' }) {
  return <CustomTooltip counter={counter} groupLabel={groupLabel} label={label} />;
}

/***************************  USER BEHAVIOR - CHART  ***************************/

export default function AnalyticsBehaviorChart() {
  const theme = useTheme();

  const [barchart, setBarchart] = useState({ active_user: true, inactive_user: false });
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);

  const toggleVisibility = (id) => {
    setBarchart((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/benchmarks');
        const data = await res.json();
        if (!mounted) return;
        setLabels(Array.isArray(data?.endpoints) ? data.endpoints : []);
        setValues(Array.isArray(data?.avgLatency) ? data.avgLatency : []);
      } catch (_e) {
        // fallback stays empty; chart will render no data
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const seriesData = [
    {
      data: values,
      label: 'Avg Latency (ms)',
      id: 'active_user',
      color: theme.palette.primary.main,
      visible: barchart['active_user']
    },
    {
      data: [],
      label: '—',
      id: 'inactive_user',
      color: theme.palette.primary.light,
      visible: barchart['inactive_user']
    }
  ];

  const lagendItems = seriesData.map((series) => ({ label: series.label, color: series.color, visible: series.visible, id: series.id }));
  const visibleSeries = seriesData.filter((s) => s.visible);

  return (
    <MainCard>
      <Stack sx={{ gap: 3.75 }}>
        <Stack direction="row" sx={{ alignItems: 'end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="h4">Analysis</Typography>
            <Typography variant="caption" color="grey.700">
              Monitor visitor behavior to enhance user experience and retention.
            </Typography>
          </Stack>
          <Stack direction="row" sx={{ gap: 1.5, width: { xs: 1, sm: 'auto' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                format="dd-MMM-yyyy"
                defaultValue={new Date()}
                slotProps={{ textField: { sx: { width: { xs: 1, sm: 'auto' } } } }}
              />
            </LocalizationProvider>
            <IconButton variant="outlined" color="secondary" size="small" aria-label="Download">
              <IconDownload size={16} />
            </IconButton>
          </Stack>
        </Stack>
        <Legend items={lagendItems} onToggle={toggleVisibility} />
      </Stack>

      <BarChart
        xAxis={[{ scaleType: 'band', data: labels, disableLine: true, disableTicks: true }]}
        grid={{ horizontal: true }}
        series={visibleSeries}
        yAxis={[{ disableLine: true, disableTicks: true, tickInterval: [0, 200, 400, 600, 800, 1000] }]}
        colors={seriesData.map((series) => series.color)}
        height={256}
        borderRadius={8}
        slots={{
          itemContent: ({ series, itemData }) => (
            <TooltipWrapper
              counter={series.data[itemData.dataIndex] || ''}
              groupLabel={series.label}
              label={xAxisData[itemData.dataIndex]}
            />
          )
        }}
        slotProps={{ legend: { hidden: true } }}
        tooltip={{ trigger: 'item' }}
        margin={{ top: 40, right: 20, bottom: 20, left: 40 }}
      />
    </MainCard>
  );
}

TooltipWrapper.propTypes = { counter: PropTypes.any, groupLabel: PropTypes.string, label: PropTypes.string };
