'use client';

// @next
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

// @mui
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

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

  useEffect(() => {
    if (!menuMaster || menuMaster.openedItem !== 'dashboard') handlerActiveItem('dashboard');
  }, [menuMaster]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack sx={{ gap: 4 }}>
        <Tabs variant="scrollable" scrollButtons="auto" value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
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
