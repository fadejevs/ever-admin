import 'server-only';

import { fetchMetricsUpstream } from '@/server/metricsProxy';

export async function fetchMonitoringStatus(requestUrl) {
  const [healthSummary, services, platformHealth, alertStatus] = await Promise.all([
    fetchMetricsUpstream('/health/summary', requestUrl),
    fetchMetricsUpstream('/health/services', requestUrl),
    fetchMetricsUpstream('/api/platform/health', requestUrl),
    fetchMetricsUpstream('/health/alerts/status', requestUrl)
  ]);

  return {
    healthSummary: healthSummary.ok ? healthSummary.data : { error: healthSummary.data?.error, status: 'unknown' },
    services: services.ok ? services.data : { error: services.data?.error, services: [] },
    platformHealth: platformHealth.ok ? platformHealth.data : { error: platformHealth.data?.error, ok: false },
    alerts: alertStatus.ok ? alertStatus.data : { slackConfigured: false, activeIncidents: [] },
    updatedAt: new Date().toISOString()
  };
}
