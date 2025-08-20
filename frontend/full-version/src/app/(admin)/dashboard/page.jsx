'use client';

// @next
import { useRouter } from 'next/navigation';

import { useEffect } from 'react';

// @project
import { handlerActiveItem, useGetMenuMaster } from '@/states/menu';
import MetricsTab from '@/views/metrics/MetricsTab';

/***************************  DASHBOARD  ***************************/

export default function Dashboard() {
  const router = useRouter();
  const { menuMaster } = useGetMenuMaster();

  useEffect(() => {
    if (!menuMaster || menuMaster.openedItem !== 'dashboard') handlerActiveItem('dashboard');
  }, [menuMaster]);

  return (
    <div style={{ padding: '24px' }}>
      <MetricsTab />
    </div>
  );
}
