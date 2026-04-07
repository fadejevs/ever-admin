function toUnixSecondsStart(day) {
  return Math.floor(new Date(`${day}T00:00:00.000Z`).getTime() / 1000);
}

function toUnixSecondsEnd(day) {
  return Math.floor(new Date(`${day}T23:59:59.999Z`).getTime() / 1000);
}

function toIsoDayFromUnix(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function safeAmountToNumber(amountObj) {
  if (!amountObj) return 0;
  const value = Number(amountObj.value ?? amountObj.amount ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function isAllowedLineItem(lineItem, allowlist) {
  if (!allowlist || allowlist.length === 0) return true;
  const normalized = String(lineItem || '').toLowerCase();
  return allowlist.some((allowed) => normalized.includes(allowed));
}

export async function fetchOpenAiDailyCosts({ startDay, endDay, config }) {
  const result = new Map();
  const openAiCfg = config?.openAiCosts;
  if (!openAiCfg?.enabled || !openAiCfg?.apiKey || !startDay || !endDay) return result;

  const startTime = toUnixSecondsStart(startDay);
  const endTime = toUnixSecondsEnd(endDay);
  const params = new URLSearchParams({
    start_time: String(startTime),
    end_time: String(endTime),
    bucket_width: '1d',
    limit: '180'
  });

  for (const projectId of openAiCfg.projectIds || []) params.append('project_ids', projectId);
  if ((openAiCfg.lineItemAllowlist || []).length > 0) params.append('group_by', 'line_item');

  const response = await fetch(`https://api.openai.com/v1/organization/costs?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${openAiCfg.apiKey}`
    },
    cache: 'no-store'
  });

  if (!response.ok) return result;
  const payload = await response.json();
  const buckets = payload?.data || payload?.buckets || [];
  const usdToEur = Number(openAiCfg.usdToEur || 0.92);

  for (const bucket of buckets) {
    const day = toIsoDayFromUnix(bucket.start_time);
    const items = bucket.results || bucket.costs || [];
    if (!Array.isArray(items)) continue;

    let dayTotalUsd = 0;
    for (const item of items) {
      if (!isAllowedLineItem(item.line_item, openAiCfg.lineItemAllowlist || [])) continue;
      dayTotalUsd += safeAmountToNumber(item.amount);
    }

    const dayTotalEur = dayTotalUsd * usdToEur;
    result.set(day, (result.get(day) || 0) + dayTotalEur);
  }

  return result;
}
