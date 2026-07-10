// @third-party
import axios from 'axios';
import { supabase } from '@/utils/supabase/client';

// Separate base URL for metrics API so we don't interfere with app API
// Use internal Next.js routes to avoid CORS and auth issues
const METRICS_BASE_URL = '';

const client = axios.create({
  baseURL: METRICS_BASE_URL,
  timeout: 15000
});

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

export async function fetchHealthSummary(params = {}) {
  try {
    const { data } = await client.get('/api/health-summary', { params });
    return data;
  } catch (error) {
    console.error('fetchHealthSummary error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

export async function fetchServiceHealth(params = {}) {
  try {
    const { data } = await client.get('/api/services', { params });
    return data;
  } catch (error) {
    console.error('fetchServiceHealth error:', error?.response?.data || error?.message || error);
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
    const { data } = await client.get('/api/expenses', { params });
    return data;
  } catch (error) {
    console.error('fetchExpenses error:', error?.response?.data || error?.message || error);
    throw error;
  }
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
