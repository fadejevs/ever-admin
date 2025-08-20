// @third-party
import axios from 'axios';

// Separate base URL for metrics API so we don't interfere with app API
// Use internal Next.js routes to avoid CORS and auth issues
const METRICS_BASE_URL = '';

const client = axios.create({
  baseURL: METRICS_BASE_URL,
  timeout: 15000
});

export async function fetchMetrics(params = {}) {
  try {
    const { data } = await client.get('/api/metrics', { params });
    return data;
  } catch (error) {
    console.error('fetchMetrics error:', error?.response?.data || error?.message || error);
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

// Helpers to normalize common shapes into chart-ready series
export function toLineSeries(points = [], { id = 'series', label = 'Series', color } = {}) {
  return [{ id, label, data: points, color }];
}

export function toBarSeries(values = [], { id = 'series', label = 'Series', color } = {}) {
  return [{ id, label, data: values, color }];
}
