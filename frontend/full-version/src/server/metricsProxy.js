import 'server-only';

export function getMetricsBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_METRICS_API?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_HOST?.trim() ||
    ''
  ).replace(/\/$/, '');
}

export function getMetricsAuthHeaders() {
  const key = process.env.METRICS_API_KEY?.trim();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

export async function fetchMetricsUpstream(path, requestUrl) {
  const base = getMetricsBaseUrl();
  if (!base) {
    return {
      ok: false,
      status: 503,
      data: { error: 'Metrics base URL not configured. Set NEXT_PUBLIC_METRICS_API.' }
    };
  }

  const target = new URL(path, `${base}/`);
  if (requestUrl) {
    const incoming = new URL(requestUrl);
    incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target.toString(), {
      headers: getMetricsAuthHeaders(),
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timer);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, status: 502, data: { error: 'Upstream returned non-JSON', upstream: base } };
    }
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    return {
      ok: false,
      status: 502,
      data: {
        error: timedOut
          ? `Main app health check timed out (${base}). Is it running?`
          : `Failed to reach main app at ${base}`,
        upstream: base,
        offline: true
      }
    };
  }
}
