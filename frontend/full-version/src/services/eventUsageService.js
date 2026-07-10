import axios from 'axios';
import { supabase } from '@/utils/supabase/client';

const client = axios.create({ baseURL: '', timeout: 30000 });

async function getAdminAuthHeaders() {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchEventUsage(params = {}) {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.get('/api/events/usage', { params, headers });
  return data;
}

export async function downloadEventUsageCsv(params = {}) {
  const headers = await getAdminAuthHeaders();
  const response = await client.get('/api/events/usage', {
    params: { ...params, format: 'csv' },
    headers,
    responseType: 'blob'
  });
  return response.data;
}
