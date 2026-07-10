import axios from 'axios';
import { supabase } from '@/utils/supabase/client';

const client = axios.create({ baseURL: '', timeout: 15000 });

async function getAdminAuthHeaders() {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchLiveEvents() {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.get('/api/live-events', { headers });
  return data;
}
