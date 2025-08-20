import 'server-only';

export async function GET(request) {
  const base = process.env.NEXT_PUBLIC_METRICS_API || process.env.NEXT_PUBLIC_API_HOST || '';
  if (!base) return Response.json({ error: 'Metrics base URL not configured. Set NEXT_PUBLIC_METRICS_API.' }, { status: 503 });
  const target = new URL('/health/services', base);
  const res = await fetch(target.toString(), { next: { revalidate: 0 } });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
