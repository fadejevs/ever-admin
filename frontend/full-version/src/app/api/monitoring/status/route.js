import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { fetchMonitoringStatus } from '@/server/monitoringStatus';

export async function GET(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const payload = await fetchMonitoringStatus(request.url);
    return Response.json(payload, { status: 200 });
  } catch (error) {
    console.error('[monitoring/status]', error);
    return Response.json({ error: error?.message || 'Failed to load monitoring status' }, { status: 500 });
  }
}
