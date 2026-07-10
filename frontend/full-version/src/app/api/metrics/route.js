import 'server-only';
import { fetchMetricsUpstream } from '@/server/metricsProxy';

export async function GET(request) {
  const { status, data } = await fetchMetricsUpstream('/metrics', request.url);
  return Response.json(data, { status });
}
