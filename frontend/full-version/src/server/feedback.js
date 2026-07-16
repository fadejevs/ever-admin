import 'server-only';

import { supabase } from '@/utils/supabase/server';

function groupFeedbackSummaries(rows = []) {
  const byCustomer = new Map();
  const byLanguage = new Map();

  for (const row of rows) {
    const customerKey = row.workspace_id || 'unknown';
    const customerLabel = row.workspace_name || row.workspace_id || 'Unknown workspace';
    const languageKey = row.language_code || 'unspecified';
    const languageLabel = row.language_code || 'Unspecified';

    if (!byCustomer.has(customerKey)) {
      byCustomer.set(customerKey, { key: customerKey, label: customerLabel, count: 0, totalRating: 0 });
    }
    if (!byLanguage.has(languageKey)) {
      byLanguage.set(languageKey, { key: languageKey, label: languageLabel, count: 0, totalRating: 0 });
    }

    const customerBucket = byCustomer.get(customerKey);
    const languageBucket = byLanguage.get(languageKey);
    customerBucket.count += 1;
    customerBucket.totalRating += row.rating;
    languageBucket.count += 1;
    languageBucket.totalRating += row.rating;
  }

  const toSummary = (bucket) => ({
    ...bucket,
    averageRating: bucket.count > 0 ? Number((bucket.totalRating / bucket.count).toFixed(2)) : null
  });

  return {
    byCustomer: [...byCustomer.values()].map(toSummary).sort((a, b) => b.count - a.count),
    byLanguage: [...byLanguage.values()].map(toSummary).sort((a, b) => b.count - a.count)
  };
}

function normalizeAudience(value) {
  const audience = String(value || 'admin').trim().toLowerCase();
  return audience === 'participant' ? 'participant' : 'admin';
}

export async function fetchUserFeedback({ audience = 'admin', limit = 100 } = {}) {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 500);
  const safeAudience = normalizeAudience(audience);

  const { data: feedbackRows, error: feedbackError } = await supabase
    .from('user_feedback')
    .select('id, workspace_id, event_id, user_id, audience, rating, language_code, comment, created_at')
    .eq('audience', safeAudience)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (feedbackError) {
    throw new Error(feedbackError.message || 'Failed to load feedback');
  }

  const rows = feedbackRows || [];
  const workspaceIds = [...new Set(rows.map((row) => row.workspace_id).filter(Boolean))];
  const eventIds = [...new Set(rows.map((row) => row.event_id).filter(Boolean))];

  const [{ data: workspaces }, { data: events }] = await Promise.all([
    workspaceIds.length
      ? supabase.from('workspaces').select('id, name').in('id', workspaceIds)
      : Promise.resolve({ data: [] }),
    eventIds.length ? supabase.from('events').select('id, title').in('id', eventIds) : Promise.resolve({ data: [] })
  ]);

  const workspaceById = new Map((workspaces || []).map((workspace) => [workspace.id, workspace]));
  const eventById = new Map((events || []).map((event) => [event.id, event]));

  const items = rows.map((row) => ({
    ...row,
    workspace_name: workspaceById.get(row.workspace_id)?.name || null,
    event_title: eventById.get(row.event_id)?.title || null
  }));

  const summaries = groupFeedbackSummaries(items);
  const averageRating =
    items.length > 0 ? Number((items.reduce((sum, row) => sum + row.rating, 0) / items.length).toFixed(2)) : null;

  return {
    audience: safeAudience,
    total: items.length,
    averageRating,
    summaries,
    items
  };
}
