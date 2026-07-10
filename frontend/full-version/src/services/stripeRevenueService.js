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

export async function fetchStripeRevenue(params = {}) {
  const headers = await getAdminAuthHeaders();
  const { data } = await client.get('/api/stripe/revenue', { params, headers });
  return data;
}
