import { redirect } from 'next/navigation';

export default function AnalyticsIndex() {
  redirect('/dashboard/analytics/metrics');
}
