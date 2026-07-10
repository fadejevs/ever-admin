import 'server-only';

import { supabase } from '@/utils/supabase/server';
import { resolveEventUnits } from '@/utils/billingUnits';

function isoDateDaysAgo(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function resolveActivityRange({ startDate, endDate, startIso, endIso, rollingHours } = {}) {
  if (rollingHours && Number.isFinite(rollingHours) && rollingHours > 0) {
    const end = new Date();
    const start = new Date(Date.now() - rollingHours * 3600000);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      startDate: formatDateOnly(start),
      endDate: formatDateOnly(end),
      activityField: 'updated_at',
      rollingHours
    };
  }

  if (startIso && endIso) {
    return {
      startIso,
      endIso,
      startDate: startDate || startIso.slice(0, 10),
      endDate: endDate || endIso.slice(0, 10),
      activityField: 'updated_at'
    };
  }

  const range = parseDateRange({ startDate, endDate });
  return { ...range, activityField: 'updated_at' };
}

function parseDateRange({ startDate, endDate } = {}) {
  const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();
  const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 86400000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate: startDate || isoDateDaysAgo(29),
    endDate: endDate || todayIso()
  };
}

function pickEventTitle(event) {
  return event?.title || event?.name || `Event ${event?.id?.slice(0, 8) || 'unknown'}`;
}

function pickLanguages(event) {
  const source = Array.isArray(event?.sourceLanguages)
    ? event.sourceLanguages
    : Array.isArray(event?.source_languages)
      ? event.source_languages
      : event?.sourceLanguage
        ? [event.sourceLanguage]
        : [];
  const target = Array.isArray(event?.targetLanguages)
    ? event.targetLanguages
    : Array.isArray(event?.target_languages)
      ? event.target_languages
      : event?.targetLanguage
        ? [event.targetLanguage]
        : [];
  return {
    source: source.filter(Boolean),
    target: target.filter(Boolean)
  };
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

function computeChargeableSeconds(event) {
  const total = Math.max(0, Number(event?.total_elapsed_seconds || 0));
  const bonus = Math.max(0, Number(event?.bonus_seconds_consumed || 0));
  return Math.max(0, total - bonus);
}

function pickAttendance(event, room, isLive) {
  const peak = Math.max(0, Number(event?.peak_viewer_count || 0));
  const current = isLive ? Math.max(0, Number(room?.viewer_count || 0)) : null;
  return {
    peakListeners: peak > 0 ? peak : current != null && current > 0 ? current : peak,
    currentListeners: current
  };
}

export async function fetchEventUsage({ startDate, endDate, startIso, endIso, rollingHours, limit = 50, status } = {}) {
  const range = resolveActivityRange({ startDate, endDate, startIso, endIso, rollingHours });

  let query = supabase
    .from('events')
    .select('*')
    .gte('updated_at', range.startIso)
    .lte('updated_at', range.endIso)
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const [{ data, error }, activeRoomMap] = await Promise.all([query.limit(Math.min(limit, 500)), fetchActiveRoomMap()]);

  if (error) throw new Error(`Failed to read events: ${error.message}`);

  const rows = data || [];
  const workspaceMap = await fetchWorkspaceMap(rows.map((r) => r.workspace_id));
  const ownerEmails = await fetchOwnerEmails([...workspaceMap.values()].map((w) => w.ownerUserId).filter(Boolean));

  const events = rows.map((row) => {
    const langs = pickLanguages(row);
    const workspace = workspaceMap.get(row.workspace_id);
    const ownerEmail = workspace?.ownerUserId ? ownerEmails.get(workspace.ownerUserId) : null;
    const isLive = row.status === 'Live';
    const room = activeRoomMap.get(row.id);
    const attendance = pickAttendance(row, room, isLive);
    const chargeableSeconds = computeChargeableSeconds(row);
    const targetLanguageCount = Math.max(1, langs.target.length || 1);
    const units = resolveEventUnits({
      chargeableSeconds,
      targetLanguageCount,
      ledgerUnits: row.units_consumed
    });

    return {
      id: row.id,
      title: pickEventTitle(row),
      status: row.status || 'Unknown',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      durationSeconds: Math.max(0, Number(row.total_elapsed_seconds || 0)),
      chargeableSeconds,
      bonusSecondsConsumed: Math.max(0, Number(row.bonus_seconds_consumed || 0)),
      unitsConsumed: units.unitsConsumed,
      ledgerUnitsConsumed: units.ledgerUnits,
      estimatedUnits: units.estimatedUnits,
      unitsIsEstimated: units.isEstimated,
      targetLanguageCount,
      sourceLanguages: langs.source,
      targetLanguages: langs.target,
      peakListeners: attendance.peakListeners,
      currentListeners: attendance.currentListeners,
      workspaceId: row.workspace_id,
      workspaceName: workspace?.name || null,
      customerEmail: ownerEmail || null
    };
  });

  const totalUnits = events.reduce((sum, row) => sum + row.unitsConsumed, 0);

  return {
    startDate: range.startDate,
    endDate: range.endDate,
    activityField: range.activityField,
    rollingHours: range.rollingHours ?? null,
    count: events.length,
    totalUnits,
    unitDefinition:
      '1 unit = 1 chargeable hour × target language. Shows billed units from ledger when set; otherwise estimated from elapsed time.',
    events,
    updatedAt: new Date().toISOString()
  };
}

export function eventUsageToCsv(payload) {
  const headers = [
    'event_id',
    'title',
    'status',
    'created_at',
    'duration_seconds',
    'chargeable_seconds',
    'bonus_seconds_consumed',
    'units_consumed',
    'ledger_units_consumed',
    'estimated_units',
    'units_is_estimated',
    'target_language_count',
    'source_languages',
    'target_languages',
    'peak_listeners',
    'current_listeners',
    'customer_email',
    'workspace_name'
  ];

  const escape = (value) => {
    const s = value == null ? '' : String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers.join(',')];
  for (const row of payload?.events || []) {
    lines.push(
      [
        row.id,
        row.title,
        row.status,
        row.createdAt,
        row.durationSeconds,
        row.chargeableSeconds,
        row.bonusSecondsConsumed,
        row.unitsConsumed,
        row.ledgerUnitsConsumed,
        row.estimatedUnits,
        row.unitsIsEstimated,
        row.targetLanguageCount,
        (row.sourceLanguages || []).join('; '),
        (row.targetLanguages || []).join('; '),
        row.peakListeners ?? '',
        row.currentListeners ?? '',
        row.customerEmail ?? '',
        row.workspaceName ?? ''
      ]
        .map(escape)
        .join(',')
    );
  }
  return lines.join('\n');
}
