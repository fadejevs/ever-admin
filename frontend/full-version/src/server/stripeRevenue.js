import 'server-only';

import { supabase } from '@/utils/supabase/server';

const TYPE_LABELS = {
  purchase: 'PAYG top-up',
  subscription: 'Subscription',
  monthly_topup: 'Monthly top-up',
  addon: 'Live add-on',
  proration: 'Plan change',
  refund: 'Refund'
};

function isoDateDaysAgo(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseDateRange({ startDate, endDate } = {}) {
  const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();
  const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 86400000);
  return { startIso: start.toISOString(), endIso: end.toISOString(), startDate: startDate || isoDateDaysAgo(29), endDate: endDate || todayIso() };
}

async function fetchWorkspaceMap(workspaceIds) {
  const map = new Map();
  const ids = [...new Set(workspaceIds.filter(Boolean))];
  if (!ids.length) return map;

  const { data } = await supabase.from('workspaces').select('id, name, owner_user_id').in('id', ids);
  for (const row of data || []) {
    map.set(row.id, { name: row.name || 'Workspace', ownerUserId: row.owner_user_id || null });
  }
  return map;
}

async function fetchOwnerEmails(ownerIds) {
  const map = new Map();
  const ids = [...new Set(ownerIds.filter(Boolean))];
  if (!ids.length || !supabase?.auth?.admin?.listUsers) return map;

  const remaining = new Set(ids);
  let page = 1;
  while (remaining.size > 0 && page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const user of data.users) {
      if (remaining.has(user.id) && user.email) {
        map.set(user.id, user.email);
        remaining.delete(user.id);
      }
    }
    if (data.users.length < 1000) break;
    page += 1;
  }
  return map;
}

function aggregateTransactions(rows) {
  let grossCents = 0;
  let refundCents = 0;
  const byType = {};

  for (const row of rows) {
    const cents = Number(row.amount_cents) || 0;
    if (cents > 0) grossCents += cents;
    if (cents < 0) refundCents += Math.abs(cents);

    const type = row.type || 'unknown';
    if (!byType[type]) byType[type] = { type, label: TYPE_LABELS[type] || type, count: 0, amountCents: 0 };
    byType[type].count += 1;
    byType[type].amountCents += cents;
  }

  return {
    grossCents,
    refundCents,
    netCents: grossCents - refundCents,
    transactionCount: rows.length,
    byType: Object.values(byType).sort((a, b) => Math.abs(b.amountCents) - Math.abs(a.amountCents))
  };
}

export async function fetchStripeRevenue({ startDate, endDate, limit = 15 } = {}) {
  const range = parseDateRange({ startDate, endDate });

  const { data, error } = await supabase
    .from('billing_transactions')
    .select(
      'id, workspace_id, type, units, amount_cents, currency, stripe_payment_intent_id, stripe_invoice_id, stripe_refund_id, created_at, note'
    )
    .gte('created_at', range.startIso)
    .lte('created_at', range.endIso)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return {
        source: 'billing_transactions',
        configured: false,
        message: 'billing_transactions table not found — run billing migrations on Supabase.',
        ...range,
        totals: { grossCents: 0, refundCents: 0, netCents: 0, transactionCount: 0, byType: [] },
        transactions: [],
        updatedAt: new Date().toISOString()
      };
    }
    throw new Error(`Failed to read billing_transactions: ${error.message}`);
  }

  const rows = data || [];
  const totals = aggregateTransactions(rows);
  const workspaceMap = await fetchWorkspaceMap(rows.map((r) => r.workspace_id));
  const ownerEmails = await fetchOwnerEmails([...workspaceMap.values()].map((w) => w.ownerUserId).filter(Boolean));

  const transactions = rows.slice(0, limit).map((row) => {
    const workspace = workspaceMap.get(row.workspace_id);
    const ownerEmail = workspace?.ownerUserId ? ownerEmails.get(workspace.ownerUserId) : null;
    return {
      id: row.id,
      type: row.type,
      typeLabel: TYPE_LABELS[row.type] || row.type || 'Unknown',
      amountCents: Number(row.amount_cents) || 0,
      currency: (row.currency || 'eur').toUpperCase(),
      units: row.units,
      workspaceId: row.workspace_id,
      workspaceName: workspace?.name || null,
      customerEmail: ownerEmail || null,
      stripePaymentIntentId: row.stripe_payment_intent_id || null,
      stripeInvoiceId: row.stripe_invoice_id || null,
      stripeRefundId: row.stripe_refund_id || null,
      createdAt: row.created_at,
      note: row.note || null
    };
  });

  return {
    source: 'billing_transactions',
    configured: true,
    message: 'Recorded by Stripe webhooks into billing_transactions.',
    startDate: range.startDate,
    endDate: range.endDate,
    totals,
    transactions,
    updatedAt: new Date().toISOString()
  };
}
