'use client';

import { useEffect } from 'react';
import { handlerActiveItem, useGetMenuMaster } from '@/states/menu';
import RoiDashboard from '@/views/metrics/RoiDashboard';

/***************************  DASHBOARD  ***************************/

export default function Dashboard() {
  const { menuMaster } = useGetMenuMaster();

  useEffect(() => {
    if (!menuMaster || menuMaster.openedItem !== 'dashboard') handlerActiveItem('dashboard');
  }, [menuMaster]);

  return <RoiDashboard />;
}
