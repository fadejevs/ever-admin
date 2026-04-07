import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { aggregateCustomers, getRoiDataset, parseFilters } from '@/server/roi/aggregate';

export async function GET(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const filters = parseFilters(url);
    const dataset = await getRoiDataset(filters);
    const customers = aggregateCustomers(dataset.rows);

    return Response.json(
      {
        generated_at: dataset.generated_at,
        filters,
        customers
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ROI customers error:', error);
    return Response.json({ error: 'Failed to load customer ROI breakdown' }, { status: 500 });
  }
}
