import { redirect } from 'next/navigation';

/** Old Metrics / Benchmarks / Finances tab URLs collapse onto Analytics. */
export default function AnalyticsTabPage() {
  redirect('/dashboard/analytics');
}
