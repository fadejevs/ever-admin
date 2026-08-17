import { supabase } from '@/utils/supabase/server';
import { getRoiConfig } from '@/server/roi/config';
import { allocateVendorCostsToRows, fetchVendorDailyCosts } from '@/server/roi/vendorCosts';

const CACHE = new Map();

const COST_KEY_CANDIDATES = {
  asr: ['asr_cost', 'asr_api_cost', 'speech_to_text_cost', 'stt_cost'],
  translation: ['translation_cost', 'mt_cost', 'deepl_cost'],
  tts: ['tts_cost', 'text_to_speech_cost', 'synthesis_cost'],
  llm: ['llm_cost', 'ai_cost', 'language_model_cost']
};

const RUNTIME_SECONDS_KEYS = ['duration_seconds', 'runtime_seconds', 'elapsed_seconds', 'total_elapsed_seconds', 'session_seconds'];

function readNumber(obj, keys, fallback = 0) {
  for (const key of keys) {
    const value = obj?.[key];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

function extractRuntimeSecondsFromSession(session) {
  return readNumber(session, RUNTIME_SECONDS_KEYS, 0);
}

function extractCosts(event) {
  const asr = readNumber(event, COST_KEY_CANDIDATES.asr, 0);
  const translation = readNumber(event, COST_KEY_CANDIDATES.translation, 0);
  const tts = readNumber(event, COST_KEY_CANDIDATES.tts, 0);
  const llm = readNumber(event, COST_KEY_CANDIDATES.llm, 0);

  const explicitTotal = readNumber(event, ['api_cost_total', 'total_api_cost', 'cost_total'], NaN);
  const componentTotal = asr + translation + tts + llm;
  const apiCostTotal = Number.isFinite(explicitTotal) && explicitTotal > 0 ? explicitTotal : componentTotal;

  return { asr, translation, tts, llm, apiCostTotal, hasExplicitCost: apiCostTotal > 0 };
}

function estimateCostsFromRuntime(runtimeSeconds, config) {
  const minutes = Math.max(0, Number(runtimeSeconds || 0) / 60);
  const asr = minutes * Number(config?.estimatedCostPerMinute?.asr || 0);
  const translation = minutes * Number(config?.estimatedCostPerMinute?.translation || 0);
  const tts = minutes * Number(config?.estimatedCostPerMinute?.tts || 0);
  const llm = minutes * Number(config?.estimatedCostPerMinute?.llm || 0);
  return {
    asr,
    translation,
    tts,
    llm,
    apiCostTotal: asr + translation + tts + llm
  };
}

function estimateCostsFromProviderUsage(event, config) {
  const deeplChars = readNumber(event, ['deepl_chars', 'translation_characters', 'mt_characters', 'translated_chars'], 0);
  const ttsChars = readNumber(event, ['tts_chars', 'speech_chars', 'synthesized_characters'], 0);
  const chatInputTokens = readNumber(event, ['llm_input_tokens', 'openai_input_tokens', 'chat_input_tokens'], 0);
  const chatOutputTokens = readNumber(event, ['llm_output_tokens', 'openai_output_tokens', 'chat_output_tokens'], 0);
  const asrSeconds = readNumber(event, ['asr_seconds', 'speech_to_text_seconds', 'stt_seconds'], 0);

  const hasUsage = deeplChars > 0 || ttsChars > 0 || chatInputTokens > 0 || chatOutputTokens > 0 || asrSeconds > 0;
  if (!hasUsage) return null;

  const perM = 1_000_000;
  const deeplUsageRate =
    Number(config?.deeplPricing?.usage_eur_per_million_chars || 0) || Number(config?.providerCosts?.deepl_eur_per_million_chars || 0);
  const translation = (deeplChars / perM) * deeplUsageRate;
  const tts = (ttsChars / perM) * Number(config?.providerCosts?.openai_tts_eur_per_million_chars || 0);
  const llmInput = (chatInputTokens / perM) * Number(config?.providerCosts?.openai_chat_input_eur_per_million_tokens || 0);
  const llmOutput = (chatOutputTokens / perM) * Number(config?.providerCosts?.openai_chat_output_eur_per_million_tokens || 0);
  const llm = llmInput + llmOutput;
  const asr = (asrSeconds / 3600) * Number(config?.providerCosts?.elevenlabs_asr_eur_per_hour || 0);

  return {
    asr,
    translation,
    tts,
    llm,
    apiCostTotal: asr + translation + tts + llm,
    source: 'provider_usage',
    deeplChars
  };
}

function normalizeDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function pickEventDay(event) {
  const candidates = [event?.created_at, event?.updated_at, event?.timestamp, event?.date];
  for (const candidate of candidates) {
    const day = normalizeDay(candidate);
    if (day) return day;
  }
  return null;
}

function pickWorkspaceId(event) {
  return event?.workspace_id || event?.workspaceId || event?.organization_id || event?.organizationId || event?.org_id || 'unassigned';
}

function pickCustomerId(event) {
  return event?.customer_id || event?.customerId || event?.created_by || event?.user_id || 'unknown';
}

function pickCustomerEmail(event) {
  return event?.customer_email || event?.created_by_email || event?.user_email || event?.email || null;
}

function pickPlanTier(event) {
  const raw = event?.plan_tier || event?.planTier || event?.subscription_tier || event?.plan || 'free';
  return String(raw || 'free').toLowerCase();
}

function pickTargetLanguageCount(event) {
  const fromArrays = [event?.targetLanguages, event?.target_languages, event?.target_langs, event?.languages_target];
  for (const candidate of fromArrays) {
    if (Array.isArray(candidate) && candidate.length > 0) return candidate.length;
  }
  const numeric = Number(event?.target_language_count || event?.target_languages_count || event?.language_count);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return 1;
}

function pickEventLabel(event) {
  return event?.title || event?.name || `Event ${event?.id || 'unknown'}`;
}

function roiSafe(grossMargin, apiCostTotal) {
  if (!Number.isFinite(apiCostTotal) || apiCostTotal <= 0) return null;
  return grossMargin / apiCostTotal;
}

function extractActualRevenue(event) {
  const keys = ['revenue', 'event_revenue', 'amount_paid', 'invoice_amount', 'price_total', 'payment_amount'];
  return readNumber(event, keys, 0);
}

function resolveUsageRate(planTier, config) {
  const isBundleLike = /bundle|monthly|enterprise|business|pro/.test(planTier || '') && !/payg|pay-as-you-go/.test(planTier || '');
  const rawRate = isBundleLike
    ? config?.usageRevenuePricing?.bundle_eur_per_hour_lang
    : config?.usageRevenuePricing?.payg_eur_per_hour_lang;
  const rate = Number(rawRate);
  return Number.isFinite(rate) ? rate : 0;
}

function exceedsFreeAllowance(runtimeSeconds, targetLanguageCount, config) {
  const minutes = Math.max(0, Number(runtimeSeconds || 0) / 60);
  const langs = Math.max(1, Number(targetLanguageCount || 1));
  const maxMinutes = Number(config?.freeAllowance?.max_minutes || 10);
  const maxTargetLanguages = Number(config?.freeAllowance?.max_target_languages || 1);
  return minutes > maxMinutes || langs > maxTargetLanguages;
}

function estimateUsageRevenue(event, runtimeSeconds, planTier, targetLanguageCount, config) {
  const actualRevenue = extractActualRevenue(event);
  if (actualRevenue > 0) {
    return { revenue: actualRevenue, revenueSource: 'actual' };
  }

  if (planTier === 'free') {
    if (exceedsFreeAllowance(runtimeSeconds, targetLanguageCount, config)) {
      const runtimeHours = Math.max(0, Number(runtimeSeconds || 0) / 3600);
      const languages = Math.max(1, Number(targetLanguageCount || 1));
      const rate = Number(config?.usageRevenuePricing?.payg_eur_per_hour_lang || 0);
      return {
        revenue: runtimeHours * languages * rate,
        revenueSource: 'usage_estimated_overage'
      };
    }
    return { revenue: 0, revenueSource: 'free_allowance' };
  }

  const runtimeHours = Math.max(0, Number(runtimeSeconds || 0) / 3600);
  const languages = Math.max(1, Number(targetLanguageCount || 1));
  const rate = resolveUsageRate(planTier, config);
  return {
    revenue: runtimeHours * languages * rate,
    revenueSource: 'usage_estimated'
  };
}

function inRange(day, start, end) {
  if (!day) return false;
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

function buildCacheKey(filters) {
  return JSON.stringify(filters);
}

function getCached(filters, config) {
  const key = buildCacheKey(filters);
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.createdAt > config.cacheTtlMs) {
    CACHE.delete(key);
    return null;
  }
  return hit.payload;
}

function setCached(filters, payload) {
  const key = buildCacheKey(filters);
  CACHE.set(key, { createdAt: Date.now(), payload });
}

async function fetchEventsRaw() {
  const { data, error } = await supabase.from('events').select('*');
  if (error) throw new Error(`Failed to read events: ${error.message}`);
  return data || [];
}

async function fetchSessionsRaw() {
  const { data, error } = await supabase.from('event_usage_sessions').select('*');
  if (error) return [];
  return data || [];
}

async function fetchAuthEmailsByUserIds(userIds) {
  const map = new Map();
  if (!Array.isArray(userIds) || userIds.length === 0) return map;
  if (!supabase?.auth?.admin?.listUsers) return map;

  const remaining = new Set(userIds.filter((id) => id && id !== 'unknown'));
  let page = 1;
  const perPage = 1000;

  while (remaining.size > 0 && page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;

    for (const user of data.users) {
      if (remaining.has(user.id) && user.email) {
        map.set(user.id, user.email);
        remaining.delete(user.id);
      }
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return map;
}

async function fetchAuthUserIdsByEmails(emails) {
  const map = new Map();
  if (!Array.isArray(emails) || emails.length === 0) return map;
  if (!supabase?.auth?.admin?.listUsers) return map;

  const target = new Set(emails.map((email) => String(email || '').toLowerCase()));
  let page = 1;
  const perPage = 1000;

  while (target.size > 0 && page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;

    for (const user of data.users) {
      const email = String(user?.email || '').toLowerCase();
      if (email && target.has(email)) {
        map.set(email, user.id);
        target.delete(email);
      }
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return map;
}

function readEmailFromProfileRow(row) {
  return row?.email || row?.user_email || row?.primary_email || row?.contact_email || null;
}

async function fetchProfileEmailsByUserIds(userIds) {
  const map = new Map();
  if (!Array.isArray(userIds) || userIds.length === 0) return map;

  const { data, error } = await supabase.from('profiles').select('*').in('id', userIds);
  if (error || !Array.isArray(data)) return map;

  for (const row of data) {
    const email = readEmailFromProfileRow(row);
    if (row?.id && email) map.set(row.id, email);
  }

  return map;
}

function filterRows(rows, filters) {
  return rows.filter((row) => {
    const day = pickEventDay(row);
    if (!inRange(day, filters.startDate, filters.endDate)) return false;
    if (filters.workspace && pickWorkspaceId(row) !== filters.workspace) return false;
    if (filters.customer && pickCustomerId(row) !== filters.customer) return false;
    if (filters.planTier && pickPlanTier(row) !== filters.planTier) return false;
    return true;
  });
}

function toUiRow(base) {
  const grossMargin = base.revenue_prorated - base.api_cost_total;
  return {
    ...base,
    gross_margin: grossMargin,
    roi: roiSafe(grossMargin, base.api_cost_total)
  };
}

function recomputeRowFinancials(row) {
  row.gross_margin = row.revenue_prorated - row.api_cost_total;
  row.roi = roiSafe(row.gross_margin, row.api_cost_total);
}

async function applyVendorActualDailyCosts(rows, config) {
  if (!rows.length) return { vendorTotals: {}, vendorCostDays: 0, vendorCostEur: 0 };
  const days = rows.map((row) => row.day).sort();
  const startDay = days[0];
  const endDay = days[days.length - 1];
  const dailyCosts = await fetchVendorDailyCosts({ startDay, endDay, config });
  if (!dailyCosts.size) return { vendorTotals: {}, vendorCostDays: 0, vendorCostEur: 0 };

  const byDay = new Map();
  for (const row of rows) {
    const list = byDay.get(row.day) || [];
    list.push(row);
    byDay.set(row.day, list);
  }

  const vendorTotals = {};
  let vendorCostDays = 0;
  let vendorCostEur = 0;

  for (const [day, dayBucket] of dailyCosts.entries()) {
    const dayRows = byDay.get(day) || [];
    if (!dayRows.length || !(dayBucket.totalEur > 0)) continue;
    allocateVendorCostsToRows(dayRows, dayBucket);
    for (const row of dayRows) recomputeRowFinancials(row);
    vendorCostDays += 1;
    vendorCostEur += Number(dayBucket.totalEur || 0);
    for (const [vendor, amount] of Object.entries(dayBucket.byVendor || {})) {
      vendorTotals[vendor] = (vendorTotals[vendor] || 0) + Number(amount || 0);
    }
  }

  return { vendorTotals, vendorCostDays, vendorCostEur };
}

export function parseFilters(url) {
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  return {
    startDate: startDate || null,
    endDate: endDate || null,
    workspace: url.searchParams.get('workspace') || null,
    customer: url.searchParams.get('customer') || null,
    planTier: (url.searchParams.get('planTier') || '').toLowerCase() || null
  };
}

export async function getRoiDataset(filters) {
  const config = getRoiConfig();
  const cached = getCached(filters, config);
  if (cached) return cached;

  const [eventsRaw, sessionsRaw] = await Promise.all([fetchEventsRaw(), fetchSessionsRaw()]);
  const excludedEmails = new Set((config.excludedAdminEmails || []).map((email) => String(email).toLowerCase()));
  const excludedUserIds = new Set((config.excludedAdminUserIds || []).map((id) => String(id)));
  const excludedIdsFromEmails = await fetchAuthUserIdsByEmails([...excludedEmails]);
  for (const [, userId] of excludedIdsFromEmails.entries()) {
    excludedUserIds.add(String(userId));
  }

  const events = filterRows(eventsRaw, filters);

  const sessionRuntimeByEvent = new Map();
  for (const session of sessionsRaw) {
    const eventId = session?.event_id || session?.eventId;
    if (!eventId) continue;
    const prev = sessionRuntimeByEvent.get(eventId) || 0;
    sessionRuntimeByEvent.set(eventId, prev + extractRuntimeSecondsFromSession(session));
  }

  const rows = [];

  for (const event of events) {
    const day = pickEventDay(event);
    if (!day) continue;

    const eventId = event.id;
    const workspaceId = pickWorkspaceId(event);
    const customerId = pickCustomerId(event);
    const customerEmail = pickCustomerEmail(event);
    if (excludedUserIds.has(String(customerId))) continue;
    if (customerEmail && excludedEmails.has(String(customerEmail).toLowerCase())) continue;

    const planTier = pickPlanTier(event);
    const targetLanguageCount = pickTargetLanguageCount(event);
    const eventRuntimeFallback = readNumber(event, ['total_elapsed_seconds', 'elapsed_seconds', 'duration_seconds'], 0);
    const sessionRuntime = sessionRuntimeByEvent.get(eventId) || 0;
    const runtimeSeconds = sessionRuntime > 0 ? sessionRuntime : eventRuntimeFallback;
    const usedRuntimeFallback = sessionRuntime <= 0;
    const costs = extractCosts(event);
    const providerUsageCosts = !costs.hasExplicitCost ? estimateCostsFromProviderUsage(event, config) : null;
    const runtimeEstimatedCosts = !costs.hasExplicitCost && !providerUsageCosts ? estimateCostsFromRuntime(runtimeSeconds, config) : null;
    const effectiveCosts = costs.hasExplicitCost ? costs : providerUsageCosts || runtimeEstimatedCosts;
    const revenueInfo = estimateUsageRevenue(event, runtimeSeconds, planTier, targetLanguageCount, config);
    const eventLabel = pickEventLabel(event);

    rows.push(
      toUiRow({
        day,
        workspace_id: workspaceId,
        customer_id: customerId,
        customer_email: customerEmail,
        event_id: eventId,
        event_title: eventLabel,
        plan_tier: planTier,
        target_language_count: targetLanguageCount,
        runtime_seconds: runtimeSeconds,
        session_runtime_seconds: sessionRuntime,
        fallback_runtime_seconds: eventRuntimeFallback,
        used_runtime_fallback: usedRuntimeFallback,
        api_cost_asr: effectiveCosts.asr,
        api_cost_translation: effectiveCosts.translation,
        api_cost_tts: effectiveCosts.tts,
        api_cost_llm: effectiveCosts.llm,
        api_cost_total: effectiveCosts.apiCostTotal,
        cost_source: costs.hasExplicitCost ? 'actual' : providerUsageCosts ? 'provider_usage' : 'estimated',
        deepl_chars: providerUsageCosts?.deeplChars || 0,
        revenue_prorated: revenueInfo.revenue,
        revenue_source: revenueInfo.revenueSource
      })
    );
  }

  // Allocate DeepL subscription base fee across daily rows.
  const deeplBasePerMonth = Number(config?.deeplPricing?.base_eur_per_month || 0);
  const deeplBillingDays = Math.max(1, Number(config?.deeplPricing?.billing_period_days || 31));
  const deeplBasePerDay = deeplBasePerMonth > 0 ? deeplBasePerMonth / deeplBillingDays : 0;
  if (deeplBasePerDay > 0) {
    const allocationMode = String(config?.deeplPricing?.base_allocation_mode || 'all_rows');
    const rowsByDay = new Map();
    for (const row of rows) {
      const qualifiesForDeeplOnlyMode = (row.deepl_chars || 0) > 0 && row.cost_source.includes('provider_usage');
      const includeRow = allocationMode === 'deepl_only' ? qualifiesForDeeplOnlyMode : true;
      if (!includeRow) continue;
      const list = rowsByDay.get(row.day) || [];
      list.push(row);
      rowsByDay.set(row.day, list);
    }

    for (const [, dayRows] of rowsByDay.entries()) {
      const perRowBase = deeplBasePerDay / dayRows.length;
      for (const row of dayRows) {
        row.api_cost_translation += perRowBase;
        row.api_cost_total += perRowBase;
        if (row.cost_source.includes('provider_usage')) {
          row.cost_source = 'provider_usage_with_deepl_base';
        } else {
          row.cost_source = `${row.cost_source}_with_deepl_base`;
        }
        row.deepl_base_allocated = perRowBase;
        row.gross_margin = row.revenue_prorated - row.api_cost_total;
        row.roi = roiSafe(row.gross_margin, row.api_cost_total);
      }
    }
  }

  const customerIdsWithoutEmail = Array.from(new Set(rows.filter((row) => !row.customer_email).map((row) => row.customer_id)));
  if (customerIdsWithoutEmail.length > 0) {
    const [profileEmailMap, authEmailMap] = await Promise.all([
      fetchProfileEmailsByUserIds(customerIdsWithoutEmail),
      fetchAuthEmailsByUserIds(customerIdsWithoutEmail)
    ]);
    for (const row of rows) {
      if (!row.customer_email) {
        row.customer_email = profileEmailMap.get(row.customer_id) || authEmailMap.get(row.customer_id) || null;
      }
    }
  }

  const filteredRows = rows.filter((row) => {
    if (excludedUserIds.has(String(row.customer_id))) return false;
    if (row.customer_email && excludedEmails.has(String(row.customer_email).toLowerCase())) return false;
    return true;
  });

  const vendorMeta = await applyVendorActualDailyCosts(filteredRows, config);

  const payload = {
    rows: filteredRows,
    generated_at: new Date().toISOString(),
    filters,
    vendor_costs: {
      total_eur: vendorMeta.vendorCostEur || 0,
      days_with_actuals: vendorMeta.vendorCostDays || 0,
      by_vendor: vendorMeta.vendorTotals || {}
    }
  };
  setCached(filters, payload);
  return payload;
}

export function aggregateDaily(rows) {
  const byDay = new Map();
  for (const row of rows) {
    const day = row.day;
    const existing = byDay.get(day) || {
      day,
      runtime_seconds: 0,
      api_cost_total: 0,
      api_cost_asr: 0,
      api_cost_translation: 0,
      api_cost_tts: 0,
      api_cost_llm: 0,
      revenue_prorated: 0,
      gross_margin: 0,
      fallback_rows: 0,
      total_rows: 0,
      estimated_cost_rows: 0,
      openai_actual_cost_rows: 0,
      vendor_actual_cost_rows: 0,
      usage_estimated_revenue_rows: 0,
      usage_overage_revenue_rows: 0
    };
    existing.runtime_seconds += row.runtime_seconds;
    existing.api_cost_total += row.api_cost_total;
    existing.api_cost_asr += row.api_cost_asr;
    existing.api_cost_translation += row.api_cost_translation;
    existing.api_cost_tts += row.api_cost_tts;
    existing.api_cost_llm += row.api_cost_llm;
    existing.revenue_prorated += row.revenue_prorated;
    existing.gross_margin += row.gross_margin;
    existing.total_rows += 1;
    if (String(row.cost_source || '').includes('estimated')) existing.estimated_cost_rows = (existing.estimated_cost_rows || 0) + 1;
    if (String(row.cost_source || '').includes('openai_actual'))
      existing.openai_actual_cost_rows = (existing.openai_actual_cost_rows || 0) + 1;
    if (String(row.cost_source || '').includes('vendor_actual')) {
      existing.vendor_actual_cost_rows = (existing.vendor_actual_cost_rows || 0) + 1;
    }
    if (row.revenue_source === 'usage_estimated') {
      existing.usage_estimated_revenue_rows = (existing.usage_estimated_revenue_rows || 0) + 1;
    }
    if (row.revenue_source === 'usage_estimated_overage') {
      existing.usage_overage_revenue_rows = (existing.usage_overage_revenue_rows || 0) + 1;
    }
    if (row.used_runtime_fallback) existing.fallback_rows += 1;
    byDay.set(day, existing);
  }

  return Array.from(byDay.values())
    .map((row) => ({
      ...row,
      roi: roiSafe(row.gross_margin, row.api_cost_total),
      fallback_share: row.total_rows > 0 ? row.fallback_rows / row.total_rows : 0,
      estimated_cost_share: row.total_rows > 0 ? (row.estimated_cost_rows || 0) / row.total_rows : 0,
      openai_actual_cost_share: row.total_rows > 0 ? (row.openai_actual_cost_rows || 0) / row.total_rows : 0,
      vendor_actual_cost_share: row.total_rows > 0 ? (row.vendor_actual_cost_rows || 0) / row.total_rows : 0,
      usage_estimated_revenue_share: row.total_rows > 0 ? (row.usage_estimated_revenue_rows || 0) / row.total_rows : 0,
      usage_overage_revenue_share: row.total_rows > 0 ? (row.usage_overage_revenue_rows || 0) / row.total_rows : 0
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function aggregateCustomers(rows) {
  const byCustomer = new Map();
  for (const row of rows) {
    const key = row.customer_id;
    const existing = byCustomer.get(key) || {
      customer_id: key,
      customer_email: row.customer_email || null,
      runtime_seconds: 0,
      api_cost_total: 0,
      revenue_prorated: 0,
      gross_margin: 0,
      events_count: 0,
      fallback_rows: 0
    };
    existing.runtime_seconds += row.runtime_seconds;
    existing.api_cost_total += row.api_cost_total;
    existing.revenue_prorated += row.revenue_prorated;
    existing.gross_margin += row.gross_margin;
    existing.events_count += 1;
    if (!existing.customer_email && row.customer_email) existing.customer_email = row.customer_email;
    if (row.used_runtime_fallback) existing.fallback_rows += 1;
    byCustomer.set(key, existing);
  }

  const aggregated = Array.from(byCustomer.values()).map((row) => ({
    ...row,
    roi: roiSafe(row.gross_margin, row.api_cost_total),
    fallback_share: row.events_count > 0 ? row.fallback_rows / row.events_count : 0
  }));

  const hasRevenue = aggregated.some((row) => row.revenue_prorated > 0);
  return aggregated.sort((a, b) => {
    if (hasRevenue) return b.revenue_prorated - a.revenue_prorated;
    return b.runtime_seconds - a.runtime_seconds;
  });
}

export function aggregateEvents(rows) {
  return [...rows].sort((a, b) => {
    const byRevenue = Number(b.revenue_prorated || 0) - Number(a.revenue_prorated || 0);
    if (byRevenue !== 0) return byRevenue;
    const byRuntime = Number(b.runtime_seconds || 0) - Number(a.runtime_seconds || 0);
    if (byRuntime !== 0) return byRuntime;
    return String(b.day || '').localeCompare(String(a.day || ''));
  });
}

export function buildReconciliation(rows) {
  const withSessions = rows.filter((row) => row.session_runtime_seconds > 0);
  const withFallback = rows.filter((row) => row.used_runtime_fallback);

  const deltas = withSessions
    .map((row) => ({
      day: row.day,
      event_id: row.event_id,
      event_title: row.event_title,
      session_runtime_seconds: row.session_runtime_seconds,
      fallback_runtime_seconds: row.fallback_runtime_seconds,
      delta_seconds: row.session_runtime_seconds - row.fallback_runtime_seconds
    }))
    .sort((a, b) => Math.abs(b.delta_seconds) - Math.abs(a.delta_seconds))
    .slice(0, 20);

  const sample = rows.slice(0, 20).map((row) => ({
    day: row.day,
    customer_id: row.customer_id,
    event_id: row.event_id,
    event_title: row.event_title,
    runtime_seconds: row.runtime_seconds,
    session_runtime_seconds: row.session_runtime_seconds,
    fallback_runtime_seconds: row.fallback_runtime_seconds,
    api_cost_total: row.api_cost_total,
    revenue_prorated: row.revenue_prorated
  }));

  return {
    counts: {
      total_events: rows.length,
      events_using_sessions: withSessions.length,
      events_using_fallback: withFallback.length,
      fallback_share: rows.length > 0 ? withFallback.length / rows.length : 0
    },
    top_deltas: deltas,
    sampled_events: sample
  };
}
