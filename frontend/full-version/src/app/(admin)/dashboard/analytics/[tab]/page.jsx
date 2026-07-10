import PropTypes from 'prop-types';
import DashboardAnalytics from '@/views/admin/dashboard/analytics';

export default async function AnalyticsTabPage({ params }) {
  const { tab } = await params;
  return <DashboardAnalytics tab={tab || 'metrics'} />;
}

export async function generateStaticParams() {
  return [{ tab: 'metrics' }, { tab: 'benchmarks' }, { tab: 'finances' }];
}

AnalyticsTabPage.propTypes = { params: PropTypes.object };
