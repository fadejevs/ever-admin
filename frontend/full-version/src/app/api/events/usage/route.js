import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { eventUsageToCsv, fetchEventUsage } from '@/server/eventUsage';

export async function GET(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const startIso = url.searchParams.get('startIso') || undefined;
    const endIso = url.searchParams.get('endIso') || undefined;
    const rollingHoursRaw = url.searchParams.get('rollingHours');
    const rollingHours = rollingHoursRaw ? Number.parseInt(rollingHoursRaw, 10) : undefined;
    const status = url.searchParams.get('status') || undefined;
    const limit = Number.parseInt(url.searchParams.get('limit') || '50', 10);
    const format = (url.searchParams.get('format') || 'json').toLowerCase();

    const payload = await fetchEventUsage({ startDate, endDate, startIso, endIso, rollingHours, status, limit });

    if (format === 'csv') {
      const csv = eventUsageToCsv(payload);
      const filename = `event-usage-${payload.startDate}-${payload.endDate}.csv`;
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    return Response.json(payload, { status: 200 });
  } catch (error) {
    console.error('[events/usage]', error);
    return Response.json({ error: error?.message || 'Failed to load event usage' }, { status: 500 });
  }
}
