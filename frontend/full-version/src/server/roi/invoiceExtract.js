/**
 * Lightweight invoice → structured expense fields (EVE-138).
 * PDF/text extract + OpenAI JSON; images via vision when needed.
 */

const MAX_TEXT = 40000;
const CATEGORIES = ['asr', 'translation', 'tts', 'llm', 'other'];

function extOf(filename = '') {
  const parts = String(filename).toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

async function extractPdfText(buffer) {
  const { extractText } = await import('unpdf');
  const result = await extractText(new Uint8Array(buffer));
  if (Array.isArray(result?.text)) return result.text.join('\n');
  if (typeof result?.text === 'string') return result.text;
  if (typeof result === 'string') return result;
  return '';
}

function extractPlainText(buffer) {
  return Buffer.from(buffer).toString('utf8');
}

function openaiKey() {
  return process.env.OPENAI_ADMIN_API_KEY || process.env.OPENAI_API_KEY || '';
}

function parseJsonObject(raw) {
  const text = String(raw || '').trim();
  const fenced = text.match(/\{[\s\S]*\}/);
  const payload = fenced ? fenced[0] : text;
  return JSON.parse(payload);
}

function coerceDraft(parsed = {}) {
  const amountEur = Number(parsed.amount_eur ?? parsed.amountEur ?? parsed.total_eur);
  const amountOriginal = Number(parsed.amount_original ?? parsed.amountOriginal ?? parsed.total);
  const day = parsed.day || parsed.invoice_date || parsed.date || null;
  const periodStart = parsed.period_start || parsed.periodStart || parsed.billing_period_start || null;
  const periodEnd = parsed.period_end || parsed.periodEnd || parsed.billing_period_end || null;

  let category = String(parsed.category || 'other').toLowerCase();
  if (!CATEGORIES.includes(category)) category = 'other';

  return {
    vendor: String(parsed.vendor || parsed.provider || 'unknown').trim() || 'unknown',
    category,
    amount_eur: Number.isFinite(amountEur) ? amountEur : Number.isFinite(amountOriginal) ? amountOriginal : 0,
    currency: String(parsed.currency || 'EUR').toUpperCase(),
    amount_original: Number.isFinite(amountOriginal) ? amountOriginal : null,
    day: day || null,
    period_start: periodStart || null,
    period_end: periodEnd || null,
    note: String(parsed.note || parsed.description || parsed.invoice_number || '').trim(),
    confidence: Number(parsed.confidence ?? 0.7),
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : []
  };
}

const SYSTEM_PROMPT = `You extract vendor invoice / cloud billing fields for an internal ROI expenses ledger.
Return ONLY valid JSON with these keys:
- vendor (string, lowercase slug preferred, e.g. openai, deepl, elevenlabs, google_cloud, azure, deepgram, render, vercel)
- category (one of: asr, translation, tts, llm, other)
- amount_eur (number; convert to EUR if needed using ~0.92 USD/EUR when currency is USD)
- currency (original invoice currency code)
- amount_original (number in original currency)
- day (YYYY-MM-DD invoice date if single charge)
- period_start / period_end (YYYY-MM-DD billing period when present)
- note (short: invoice # + one-line description)
- confidence (0-1)
- warnings (string array of uncertainties)

Category hints:
- Deepgram / ElevenLabs STT / Azure Speech STT → asr
- DeepL / Google Translate → translation
- ElevenLabs TTS / Azure TTS / OpenAI TTS → tts
- OpenAI / Gemini / Anthropic chat/LLM usage → llm
- GCP / Render / Vercel / hosting / domains → other

Prefer period_start/period_end for monthly invoices. Prefer day for one-off charges.
If amount unclear, set amount_eur to 0 and add a warning.`;

async function chatExtract({ text, imageBase64, mimeType }) {
  const key = openaiKey();
  if (!key) throw new Error('OPENAI_API_KEY (or OPENAI_ADMIN_API_KEY) is required for invoice extract');

  const userContent = imageBase64
    ? [
        {
          type: 'text',
          text: 'Extract the invoice fields from this document image. Return JSON only.'
        },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType || 'image/png'};base64,${imageBase64}` }
        }
      ]
    : `Extract invoice fields from this text. Return JSON only.\n\n${text}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.ROI_INVOICE_EXTRACT_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent }
      ]
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI extract failed (${res.status}): ${errText.slice(0, 240)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  return coerceDraft(parseJsonObject(content));
}

/**
 * @param {{ buffer: Buffer, filename?: string, contentType?: string }} input
 */
export async function extractInvoiceDraft(input) {
  const filename = input.filename || 'invoice';
  const contentType = input.contentType || '';
  const ext = extOf(filename);
  const buffer = Buffer.isBuffer(input.buffer) ? input.buffer : Buffer.from(input.buffer);

  const isImage = contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);

  if (isImage) {
    const draft = await chatExtract({
      imageBase64: buffer.toString('base64'),
      mimeType: contentType || `image/${ext === 'jpg' ? 'jpeg' : ext || 'png'}`
    });
    return { draft, extracted_text_chars: 0, mode: 'vision' };
  }

  let text = '';
  if (ext === 'pdf' || contentType === 'application/pdf') {
    text = await extractPdfText(buffer);
  } else {
    text = extractPlainText(buffer);
  }

  text = String(text || '').trim();
  if (text.length < 8) {
    throw new Error('Could not read enough text from the file. Try PDF/TXT/CSV or a clear screenshot.');
  }
  if (text.length > MAX_TEXT) {
    const half = Math.floor(MAX_TEXT / 2);
    text = `${text.slice(0, half)}\n\n[...truncated...]\n\n${text.slice(-half)}`;
  }

  const draft = await chatExtract({ text });
  return { draft, extracted_text_chars: text.length, mode: 'text' };
}
