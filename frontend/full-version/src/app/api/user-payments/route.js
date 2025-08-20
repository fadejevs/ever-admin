import 'server-only';

export async function GET(request) {
  const base = process.env.NEXT_PUBLIC_METRICS_API || process.env.NEXT_PUBLIC_API_HOST || '';
  if (!base) {
    return Response.json({ error: 'Metrics base URL not configured. Set NEXT_PUBLIC_METRICS_API.' }, { status: 503 });
  }
  const url = new URL(request.url);
  const target = new URL('/user-payments', base);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));

  try {
    const res = await fetch(target.toString(), { next: { revalidate: 0 } });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: 'Failed to fetch user payment data' }, { status: 502 });
  }
}
