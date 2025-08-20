'use client';

// @next
import { useRouter } from 'next/navigation';

import { useEffect } from 'react';

/***************************  DASHBOARD  ***************************/

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Stay at /dashboard/ instead of redirecting
    // router.replace('/dashboard/analytics/metrics');
  }, [router]);

  return (
    <div style={{ padding: '24px' }}>
      <h1>Dashboard</h1>
      <p>Welcome to the admin dashboard. Use the navigation to access different sections.</p>
    </div>
  );
}
