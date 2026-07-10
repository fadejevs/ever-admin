import 'server-only';

/** Prefer /api/health/* — same handlers as /health/*, matches other prod API routes. */
const UPSTREAM_PATH_FALLBACKS = {
  '/health/summary': ['/api/health/summary', '/health/summary'],
  '/health/services': ['/api/health/services', '/health/services'],
  '/health/alerts/status': ['/api/health/alerts/status', '/health/alerts/status']
};

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

function resolveUpstreamPaths(path) {
  const normalized = String(path || '').trim();
  const fallbacks = UPSTREAM_PATH_FALLBACKS[normalized];
  return fallbacks?.length ? fallbacks : [normalized];
}

async function fetchUpstreamOnce(base, path, requestUrl, headers) {
  const target = new URL(path, `${base}/`);
  if (requestUrl) {
    const incoming = new URL(requestUrl);
    incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(target.toString(), {
    headers,
    cache: 'no-store',
    signal: controller.signal
  });
  clearTimeout(timer);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const notDeployed = res.status === 404;
    return {
      ok: false,
      status: res.status,
      data: {
        error: notDeployed
          ? `Health API not on ${base} yet — deploy the latest main app (needs ${path}).`
          : `Upstream returned non-JSON (${res.status})`,
        upstream: base,
        path,
        notDeployed,
        offline: true
      }
    };
  }

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function fetchMetricsUpstream(path, requestUrl) {
  const base = getMetricsBaseUrl();
  if (!base) {
    return {
      ok: false,
      status: 503,
      data: {
        error: 'Metrics base URL not configured. Set NEXT_PUBLIC_METRICS_API on admin Vercel.',
        offline: true
      }
    };
  }

  const headers = getMetricsAuthHeaders();
  const paths = resolveUpstreamPaths(path);
  let lastResult = null;

  for (const candidate of paths) {
    try {
      const result = await fetchUpstreamOnce(base, candidate, requestUrl, headers);
      lastResult = result;
      if (result.ok) return result;
      if (result.status !== 404 && !result.data?.notDeployed) return result;
    } catch (error) {
      const timedOut = error?.name === 'AbortError';
      lastResult = {
        ok: false,
        status: 502,
        data: {
          error: timedOut
            ? `Main app health check timed out (${base}).`
            : `Failed to reach main app at ${base}`,
          upstream: base,
          path: candidate,
          offline: true
        }
      };
      if (candidate === paths[paths.length - 1]) return lastResult;
    }
  }

  if (lastResult?.data?.notDeployed) {
    lastResult.data.message =
      'Deploy app.everspeak.ai with /api/health/* routes and set matching METRICS_API_KEY on admin + main Vercel.';
  }

  return (
    lastResult || {
      ok: false,
      status: 502,
      data: { error: 'Health upstream unavailable', upstream: base, offline: true }
    }
  );
}
