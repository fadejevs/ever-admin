import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { fetchLiveEvents } from '@/server/liveEvents';

export async function GET(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const payload = await fetchLiveEvents();
    return Response.json(payload, { status: 200 });
  } catch (error) {
    console.error('[live-events]', error);
    return Response.json({ error: error?.message || 'Failed to load live events' }, { status: 500 });
  }
}
