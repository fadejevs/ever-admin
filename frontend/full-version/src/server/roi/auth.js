import { supabase } from '@/utils/supabase/server';

export async function assertAdminRequest(request) {
  if (process.env.NODE_ENV !== 'production' || process.env.ROI_DISABLE_AUTH === 'true') {
    return { ok: true, user: null };
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return { ok: false, status: 401, message: 'Missing bearer token' };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, message: 'Invalid session token' };
  }

  const email = data.user.email || '';
  if (!email.endsWith('@everspeak.ai')) {
    return { ok: false, status: 403, message: 'Admin access required' };
  }

  return { ok: true, user: data.user };
}
