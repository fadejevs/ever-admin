'use client';

// @next
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

// @mui
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';

// @project
import { handlerActiveItem, useGetMenuMaster } from '@/states/menu';
import MetricsTab from '@/views/metrics/MetricsTab';
import BenchmarksTab from '@/views/metrics/BenchmarksTab';
import FinancesTab from '@/views/metrics/FinancesTab';

/***************************  DASHBOARD  ***************************/

export default function Dashboard() {
  const router = useRouter();
  const { menuMaster } = useGetMenuMaster();
  const [activeTab, setActiveTab] = useState('metrics');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!menuMaster || menuMaster.openedItem !== 'dashboard') handlerActiveItem('dashboard');
  }, [menuMaster]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Stack sx={{ gap: { xs: 2, sm: 3, md: 4 } }}>
        <Tabs 
          variant={isMobile ? "fullWidth" : "scrollable"} 
          scrollButtons={isMobile ? false : "auto"} 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="analytics tabs"
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              minHeight: { xs: 48, sm: 56 },
              padding: { xs: '8px 12px', sm: '12px 16px' }
            }
          }}
        >
          <Tab label="Metrics" value="metrics" />
          <Tab label="Benchmarks" value="benchmarks" />
          <Tab label="Finances" value="finances" />
        </Tabs>
        <Box>
          {activeTab === 'metrics' && <MetricsTab />}
          {activeTab === 'benchmarks' && <BenchmarksTab />}
          {activeTab === 'finances' && <FinancesTab />}
        </Box>
      </Stack>
    </Box>
  );
}
