import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { deleteVendorExpense, updateVendorExpense } from '@/server/roi/expensesStore';

async function readId(context) {
  const params = await context?.params;
  return params?.id;
}

export async function PATCH(request, context) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const id = await readId(context);
    const body = await request.json();
    const expense = await updateVendorExpense(id, body);
    return Response.json({ expense }, { status: 200 });
  } catch (error) {
    console.error('ROI expenses update error:', error);
    const message = error?.message || 'Failed to update expense';
    const status = /amount_eur|period_|Provide day|Invalid status|Missing expense/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(request, context) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const id = await readId(context);
    await deleteVendorExpense(id);
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('ROI expenses delete error:', error);
    return Response.json({ error: error?.message || 'Failed to delete expense' }, { status: 500 });
  }
}
