import 'server-only';

import { supabase } from '@/utils/supabase/server';

const LIVE_STATUS = 'Live';

function pickEventTitle(event) {
  return event?.title || event?.name || `Event ${event?.id?.slice(0, 8) || 'unknown'}`;
}

function pickLanguages(event) {
  const source = Array.isArray(event?.sourceLanguages)
    ? event.sourceLanguages
    : Array.isArray(event?.source_languages)
      ? event.source_languages
      : [];
  const target = Array.isArray(event?.targetLanguages)
    ? event.targetLanguages
    : Array.isArray(event?.target_languages)
      ? event.target_languages
      : [];
  return {
    source: source.filter(Boolean),
    target: target.filter(Boolean)
  };
}

function pickStartedAt(event) {
  return event?.started_at || event?.startedAt || event?.updated_at || event?.timestamp || event?.created_at || null;
}

function formatDurationMs(startIso, nowMs = Date.now()) {
  if (!startIso) return null;
  const start = Date.parse(startIso);
  if (Number.isNaN(start)) return null;
  return Math.max(0, nowMs - start);
}

function getMetricsBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_METRICS_API?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_HOST?.trim() ||
    ''
  ).replace(/\/$/, '');
}

async function fetchActiveRoomMap() {
  const base = getMetricsBaseUrl();
  if (!base) return new Map();

  try {
    const res = await fetch(`${base}/api/platform/live-rooms`, { cache: 'no-store' });
    if (!res.ok) return new Map();
    const data = await res.json();
    const map = new Map();
    for (const room of data?.rooms || []) {
      if (room?.room_id) map.set(room.room_id, room);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchWorkspaceMap(workspaceIds) {
  const map = new Map();
  const ids = [...new Set(workspaceIds.filter(Boolean))];
  if (!ids.length) return map;

  const { data, error } = await supabase.from('workspaces').select('id, name, owner_user_id').in('id', ids);
  if (error || !data) return map;
  for (const row of data) {
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

export async function fetchLiveEvents() {
  const nowMs = Date.now();
  const [liveResult, activeRoomMap] = await Promise.all([
    supabase.from('events').select('*').eq('status', LIVE_STATUS),
    fetchActiveRoomMap()
  ]);
  const { data, error } = liveResult;

  if (error) throw new Error(`Failed to read live events: ${error.message}`);

  const dbLiveRows = (data || []).sort((a, b) => {
    const aTs = Date.parse(pickStartedAt(a) || 0);
    const bTs = Date.parse(pickStartedAt(b) || 0);
    return bTs - aTs;
  });
  const rows = dbLiveRows.filter((row) => activeRoomMap.has(row.id));
  const staleLiveCount = dbLiveRows.length - rows.length;
  const workspaceMap = await fetchWorkspaceMap(rows.map((r) => r.workspace_id || r.workspaceId));
  const ownerIds = [...workspaceMap.values()].map((w) => w.ownerUserId).filter(Boolean);
  const ownerEmails = await fetchOwnerEmails(ownerIds);

  const events = rows.map((row) => {
    const workspace = workspaceMap.get(row.workspace_id || row.workspaceId);
    const ownerEmail = workspace?.ownerUserId ? ownerEmails.get(workspace.ownerUserId) : null;
    const startedAt = pickStartedAt(row);
    const langs = pickLanguages(row);
    const room = activeRoomMap.get(row.id);

    return {
      id: row.id,
      title: pickEventTitle(row),
      status: row.status,
      startedAt,
      liveDurationMs: formatDurationMs(startedAt, nowMs),
      workspaceId: row.workspace_id || row.workspaceId || null,
      workspaceName: workspace?.name || null,
      customerEmail: ownerEmail || null,
      sourceLanguages: langs.source,
      targetLanguages: langs.target,
      hasMeetingLink: Boolean(row.meeting_link || row.meetingLink),
      viewerCount: room?.viewer_count ?? 0,
      adminCount: room?.admin_connections ?? 0,
      connectionCount: room?.total_connections ?? 0
    };
  });

  events.sort((a, b) => (b.viewerCount ?? 0) - (a.viewerCount ?? 0));

  const totalListeners = events.reduce((sum, row) => sum + (row.viewerCount ?? 0), 0);

  return {
    events,
    count: events.length,
    totalListeners,
    staleLiveCount,
    dbLiveCount: dbLiveRows.length,
    updatedAt: new Date(nowMs).toISOString()
  };
}
