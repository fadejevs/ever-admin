// @third-party
import axios from 'axios';
import { supabase } from '@/utils/supabase/client';

// Separate base URL for metrics API so we don't interfere with app API
// Use internal Next.js routes to avoid CORS and auth issues
const METRICS_BASE_URL = '';

const client = axios.create({
  baseURL: METRICS_BASE_URL,
  timeout: 10000
});

function isOfflineError(error) {
  const status = error?.response?.status;
  const msg = String(error?.message || '');
  return status === 502 || status === 503 || msg.includes('timeout') || error?.code === 'ECONNABORTED';
}

function offlineHealthPayload(message) {
  return {
    offline: true,
    status: 'unknown',
    message,
    error: message,
    services: [],
    errorRatePct: 0,
    p95LatencyMs: 0,
    totalRequests: 0
  };
}

async function getAdminAuthHeaders() {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchMetrics(params = {}) {
  try {
    const { data } = await client.get('/api/metrics', { params });
    return data;
  } catch (error) {
    console.error('fetchMetrics error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchHealthSummary(params = {}, options = {}) {
  const retries = options.retries ?? 1;
  const retryDelayMs = options.retryDelayMs ?? 1200;
  let last;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const { data } = await client.get('/api/health-summary', { params });
      last = data;
      if (data?.offline) return data;
      if (attempt === retries - 1) return data;
    } catch (error) {
      if (attempt === retries - 1) {
        if (isOfflineError(error)) {
          const body = error?.response?.data || {};
          return offlineHealthPayload(
            body.message ||
              body.error ||
              'Main app unreachable — set NEXT_PUBLIC_METRICS_API and METRICS_API_KEY on admin Vercel.'
          );
        }
        throw error;
      }
    }
    await sleep(retryDelayMs);
  }

  return last;
}

export async function fetchServiceHealth(params = {}) {
  try {
    const { data } = await client.get('/api/services', { params });
    return data;
  } catch (error) {
    if (isOfflineError(error)) {
      return {
        offline: true,
        services: [],
        message: error?.response?.data?.error || 'Main app unreachable — health proxy needs the main app running.'
      };
    }
    throw error;
  }
}

export async function fetchBenchmarks(params = {}) {
  try {
    const { data } = await client.get('/api/benchmarks', { params });
    return data;
  } catch (error) {
    console.error('fetchBenchmarks error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

export async function fetchExpenses(params = {}) {
  try {
    const headers = await getAdminAuthHeaders();
    const { data } = await client.get('/api/roi/expenses', { params, headers });
    return data;
  } catch (error) {
    console.error('fetchExpenses error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

export async function extractRoiInvoice(file) {
  const headers = await getAdminAuthHeaders();
  const form = new FormData();
  form.append('file', file);
  const { data } = await client.post('/api/roi/expenses/extract', form, {
    headers,
    timeout: 120000
  });
  return data;
}

export async function createRoiExpense(payload, file = null) {
  const headers = await getAdminAuthHeaders();
  if (file) {
    const form = new FormData();
    form.append('file', file);
    form.append('payload', JSON.stringify(payload));
    const { data } = await client.post('/api/roi/expenses', form, { headers, timeout: 60000 });
    return data;
  }
  const { data } = await client.post('/api/roi/expenses', payload, { headers });
  return data;
}

export async function updateRoiExpense(id, payload) {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.patch(`/api/roi/expenses/${id}`, payload, { headers });
  return data;
}

export async function deleteRoiExpense(id) {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.delete(`/api/roi/expenses/${id}`, { headers });
  return data;
}

export async function fetchUserPayments(params = {}) {
  try {
    const { data } = await client.get('/api/user-payments', { params });
    return data;
  } catch (error) {
    console.error('fetchUserPayments error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

export async function fetchEventQualityAssessments(params = {}) {
  try {
    const { data } = await client.get('/api/event-quality', { params });
    return data;
  } catch (error) {
    console.error('fetchEventQualityAssessments error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

// Helpers to normalize common shapes into chart-ready series
export function toLineSeries(points = [], { id = 'series', label = 'Series', color } = {}) {
  return [{ id, label, data: points, color }];
}

export function toBarSeries(values = [], { id = 'series', label = 'Series', color } = {}) {
  return [{ id, label, data: values, color }];
}

export async function fetchRoiSummary(params = {}) {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.get('/api/roi/summary', { params, headers });
  return data;
}

export async function fetchRoiCustomers(params = {}) {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.get('/api/roi/customers', { params, headers });
  return data;
}

export async function fetchRoiEvents(params = {}) {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.get('/api/roi/events', { params, headers });
  return data;
}

export async function fetchRoiReconciliation(params = {}) {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.get('/api/roi/reconciliation', { params, headers });
  return data;
}
