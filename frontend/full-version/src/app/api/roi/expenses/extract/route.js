import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { extractInvoiceDraft } from '@/server/roi/invoiceExtract';
import { uploadInvoiceFile } from '@/server/roi/expensesStore';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function') {
      return Response.json({ error: 'file is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) return Response.json({ error: 'Empty file' }, { status: 400 });
    if (buffer.length > MAX_BYTES) {
      return Response.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const filename = file.name || 'invoice.pdf';
    const contentType = file.type || 'application/octet-stream';

    const [{ draft, extracted_text_chars, mode }, fileMeta] = await Promise.all([
      extractInvoiceDraft({ buffer, filename, contentType }),
      uploadInvoiceFile({
        buffer,
        filename,
        contentType,
        userId: auth.user?.id
      })
    ]);

    return Response.json(
      {
        draft: {
          ...draft,
          ...fileMeta,
          source: 'invoice_upload',
          status: 'draft',
          extracted_json: {
            ...draft,
            mode,
            extracted_text_chars,
            extracted_at: new Date().toISOString()
          }
        },
        mode,
        extracted_text_chars
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ROI invoice extract error:', error);
    return Response.json({ error: error?.message || 'Failed to extract invoice' }, { status: 500 });
  }
}
