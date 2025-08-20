'use client';
import PropTypes from 'prop-types';

import { useEffect } from 'react';

// @next
import { useRouter, usePathname } from 'next/navigation';

//  @mui
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

// @project
import { handlerActiveItem, useGetMenuMaster } from '@/states/menu';
import MetricsTab from '@/views/metrics/MetricsTab';
import BenchmarksTab from '@/views/metrics/BenchmarksTab';
import ExpensesTab from '@/views/metrics/ExpensesTab';

/***************************  DASHBOARD - ANALYTICS  ***************************/

export default function DashboardAnalytics({ tab = 'metrics' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { menuMaster } = useGetMenuMaster();

  const handleChange = (event, newValue) => {
    router.replace(`/dashboard/analytics/${newValue}`);
  };

  useEffect(() => {
    if (!menuMaster || menuMaster.openedItem !== 'dashboard') handlerActiveItem('dashboard');
    // eslint-disable-next-line
  }, [pathname]);

  return (
    <Stack sx={{ gap: 4 }}>
      <Tabs variant="scrollable" scrollButtons="auto" value={tab} onChange={handleChange} aria-label="analytics tabs">
        <Tab label="Metrics" value="metrics" />
        <Tab label="Benchmarks" value="benchmarks" />
        <Tab label="Expenses" value="expenses" />
      </Tabs>
      <Box>
        {tab === 'metrics' && <MetricsTab />}
        {tab === 'benchmarks' && <BenchmarksTab />}
        {tab === 'expenses' && <ExpensesTab />}
      </Box>
    </Stack>
  );
}

DashboardAnalytics.propTypes = { tab: PropTypes.string };
