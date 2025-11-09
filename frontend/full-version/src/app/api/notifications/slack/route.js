import 'server-only';

async function proxyRequest(method, request) {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  if (!base) {
    return Response.json({ error: 'API base URL not configured. Set NEXT_PUBLIC_API_URL.' }, { status: 503 });
  }

  const target = new URL('/api/notifications/slack', base);

  const init = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (method === 'GET') {
    const url = new URL(request.url);
    url.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  } else {
    const body = await request.json().catch(() => ({}));
    init.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(target.toString(), {
      ...init,
      next: { revalidate: 0 }
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch (error) {
    console.error('Slack notification proxy error:', error);
    return Response.json({ error: 'Failed to contact backend for Slack notification' }, { status: 502 });
  }
}

export async function GET(request) {
  return proxyRequest('GET', request);
}

export async function POST(request) {
  return proxyRequest('POST', request);
}


