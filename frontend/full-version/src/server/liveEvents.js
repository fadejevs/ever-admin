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

function pickActivityAt(event) {
  return event?.updated_at || event?.updatedAt || event?.timestamp || event?.created_at || null;
}

/** Parse events.timestamp (YYYY-MM-DD, DD.MM.YYYY, or Date-parseable). */
function parseEventDate(timestamp) {
  const raw = String(timestamp || '').trim();
  if (!raw || raw.toLowerCase() === 'not specified') return null;

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  }

  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return null;
  const date = new Date(parsed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseStartTimeMinutes(startTime) {
  const match = String(startTime || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function enrichScheduledRow(row, workspaceMap, ownerEmails) {
  const workspace = workspaceMap.get(row.workspace_id || row.workspaceId);
  const ownerEmail = workspace?.ownerUserId ? ownerEmails.get(workspace.ownerUserId) : null;
  const date = parseEventDate(row.timestamp);
  const startTime = row.startTime || row.start_time || null;
  const timeMinutes = parseStartTimeMinutes(startTime);
  const dayStart = date ? startOfLocalDay(date).getTime() : null;

  return {
    id: row.id,
    title: pickEventTitle(row),
    status: row.status,
    scheduledDate: date ? toDateKey(date) : null,
    scheduledTime: startTime || null,
    sortKey: dayStart == null ? Number.POSITIVE_INFINITY : dayStart + (timeMinutes == null ? 0 : timeMinutes * 60_000),
    workspaceId: row.workspace_id || row.workspaceId || null,
    workspaceName: workspace?.name || null,
    customerEmail: ownerEmail || null
  };
}

async function fetchUpcomingScheduledEvents(limit = 8, now = new Date()) {
  const { data, error } = await supabase.from('events').select('*').eq('status', 'Scheduled').limit(200);

  if (error) throw new Error(`Failed to read scheduled events: ${error.message}`);

  const rows = data || [];
  const workspaceMap = await fetchWorkspaceMap(rows.map((r) => r.workspace_id || r.workspaceId));
  const ownerIds = [...workspaceMap.values()].map((w) => w.ownerUserId).filter(Boolean);
  const ownerEmails = await fetchOwnerEmails(ownerIds);
  const today = startOfLocalDay(now).getTime();

  return rows
    .map((row) => enrichScheduledRow(row, workspaceMap, ownerEmails))
    .filter((row) => {
      if (!row.scheduledDate) return false;
      const [year, month, day] = row.scheduledDate.split('-').map(Number);
      const dayStart = new Date(year, month - 1, day).getTime();
      return dayStart >= today;
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, limit)
    .map(({ sortKey: _sortKey, ...row }) => row);
}

function pickPeakListeners(event) {
  return Math.max(0, Number(event?.peak_viewer_count ?? event?.peakViewerCount ?? 0));
}

const RECENT_RAN_LIMIT = 80;

async function fetchRecentRanEvents(limit = RECENT_RAN_LIMIT) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['Completed', 'Paused'])
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to read recent events: ${error.message}`);

  const rows = data || [];
  const workspaceMap = await fetchWorkspaceMap(rows.map((r) => r.workspace_id || r.workspaceId));
  const ownerIds = [...workspaceMap.values()].map((w) => w.ownerUserId).filter(Boolean);
  const ownerEmails = await fetchOwnerEmails(ownerIds);

  return rows.map((row) => {
    const workspace = workspaceMap.get(row.workspace_id || row.workspaceId);
    const ownerEmail = workspace?.ownerUserId ? ownerEmails.get(workspace.ownerUserId) : null;

    return {
      id: row.id,
      title: pickEventTitle(row),
      status: row.status,
      ranAt: pickActivityAt(row),
      peakListeners: pickPeakListeners(row),
      workspaceId: row.workspace_id || row.workspaceId || null,
      workspaceName: workspace?.name || null,
      customerEmail: ownerEmail || null
    };
  });
}

export async function fetchLiveEvents() {
  const nowMs = Date.now();
  const [liveResult, activeRoomMap, recentEvents, upcomingEvents] = await Promise.all([
    supabase.from('events').select('*').eq('status', LIVE_STATUS),
    fetchActiveRoomMap(),
    fetchRecentRanEvents(RECENT_RAN_LIMIT),
    fetchUpcomingScheduledEvents(8, new Date(nowMs))
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
    recentEvents,
    upcomingEvents,
    updatedAt: new Date(nowMs).toISOString()
  };
}
