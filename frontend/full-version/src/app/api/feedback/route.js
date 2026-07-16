import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { fetchUserFeedback } from '@/server/feedback';

export async function GET(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const audience = url.searchParams.get('audience') || 'admin';
    const limit = url.searchParams.get('limit') || '100';
    const payload = await fetchUserFeedback({ audience, limit });
    return Response.json(payload, { status: 200 });
  } catch (error) {
    console.error('[feedback]', error);
    return Response.json({ error: error?.message || 'Failed to load feedback' }, { status: 500 });
  }
}
