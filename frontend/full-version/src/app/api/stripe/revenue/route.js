import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { fetchStripeRevenue } from '@/server/stripeRevenue';

export async function GET(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const limit = Number(url.searchParams.get('limit') || 15);

    const payload = await fetchStripeRevenue({ startDate, endDate, limit });
    return Response.json(payload, { status: 200 });
  } catch (error) {
    console.error('[stripe/revenue]', error);
    return Response.json({ error: error?.message || 'Failed to load Stripe revenue' }, { status: 500 });
  }
}
