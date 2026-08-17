import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { createVendorExpense, listVendorExpenses, uploadInvoiceFile } from '@/server/roi/expensesStore';

export async function GET(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const startDay = url.searchParams.get('startDate') || url.searchParams.get('start_day') || undefined;
    const endDay = url.searchParams.get('endDate') || url.searchParams.get('end_day') || undefined;

    const payload = await listVendorExpenses({ month, status, startDay, endDay });
    return Response.json({ generated_at: new Date().toISOString(), ...payload }, { status: 200 });
  } catch (error) {
    console.error('ROI expenses list error:', error);
    return Response.json({ error: error?.message || 'Failed to list expenses' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const contentType = request.headers.get('content-type') || '';
    let body = {};
    let fileMeta = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      const payloadRaw = form.get('payload');
      body = payloadRaw ? JSON.parse(String(payloadRaw)) : {};

      if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function') {
        const buffer = Buffer.from(await file.arrayBuffer());
        fileMeta = await uploadInvoiceFile({
          buffer,
          filename: file.name || body.invoice_filename || 'invoice.pdf',
          contentType: file.type || 'application/octet-stream',
          userId: auth.user?.id
        });
      }
    } else {
      body = await request.json();
    }

    const expense = await createVendorExpense(
      {
        ...body,
        ...(fileMeta || {})
      },
      { userId: auth.user?.id, email: auth.user?.email }
    );

    return Response.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('ROI expenses create error:', error);
    const message = error?.message || 'Failed to create expense';
    const status = /amount_eur|period_|Provide day|Invalid status/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
