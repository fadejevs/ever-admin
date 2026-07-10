import 'server-only';
import { fetchMetricsUpstream } from '@/server/metricsProxy';

export async function GET(request) {
  const { status, data } = await fetchMetricsUpstream('/health/summary', request.url);
  if (data?.offline) {
    return Response.json(
      {
        offline: true,
        notDeployed: Boolean(data.notDeployed),
        status: 'unknown',
        message: data.message || data.error,
        error: data.error,
        services: [],
        errorRatePct: 0,
        p95LatencyMs: 0,
        totalRequests: 0
      },
      { status: 200 }
    );
  }
  return Response.json(data, { status });
}
