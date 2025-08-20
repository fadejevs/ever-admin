import 'server-only';

export async function GET(request) {
  const base = process.env.NEXT_PUBLIC_METRICS_API || process.env.NEXT_PUBLIC_API_HOST || '';
  if (!base) return Response.json({ error: 'Metrics base URL not configured. Set NEXT_PUBLIC_METRICS_API.' }, { status: 503 });
  const target = new URL('/health/summary', base);
  try {
    const res = await fetch(target.toString(), { next: { revalidate: 0 } });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json({ error: 'Upstream returned non-JSON' }, { status: 502 });
    }
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json({ error: 'Failed to fetch health summary' }, { status: 502 });
  }
}


