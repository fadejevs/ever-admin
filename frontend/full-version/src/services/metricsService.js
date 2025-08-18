// @third-party
import axios from 'axios';

// Separate base URL for metrics API so we don't interfere with app API
const METRICS_BASE_URL = process.env.NEXT_PUBLIC_METRICS_API || process.env.NEXT_PUBLIC_API_HOST || '';

const client = axios.create({
  baseURL: METRICS_BASE_URL,
  timeout: 15000
});

export async function fetchMetrics(params = {}) {
  try {
    const { data } = await client.get('/metrics', { params });
    return data;
  } catch (error) {
    console.error('fetchMetrics error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

export async function fetchBenchmarks(params = {}) {
  try {
    const { data } = await client.get('/benchmarks', { params });
    return data;
  } catch (error) {
    console.error('fetchBenchmarks error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

export async function fetchExpenses(params = {}) {
  try {
    const { data } = await client.get('/expenses', { params });
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


