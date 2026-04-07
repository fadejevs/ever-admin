const DEFAULT_PLAN_PRICES = {
  free: 0,
  starter: 49,
  pro: 199,
  business: 499,
  enterprise: 999
};

const DEFAULT_ESTIMATED_COST_PER_MINUTE = {
  asr: 0.02,
  translation: 0.01,
  tts: 0.005,
  llm: 0.003
};

const DEFAULT_PROVIDER_COSTS = {
  deepl_eur_per_million_chars: 20,
  openai_tts_eur_per_million_chars: 15,
  openai_chat_input_eur_per_million_tokens: 5,
  openai_chat_output_eur_per_million_tokens: 15,
  elevenlabs_asr_eur_per_hour: 1.2
};

const DEFAULT_DEEPL_PRICING = {
  base_eur_per_month: 4.99,
  usage_eur_per_million_chars: 20,
  billing_period_days: 31,
  base_allocation_mode: 'all_rows'
};

const DEFAULT_USAGE_REVENUE_PRICING = {
  payg_eur_per_hour_lang: 30,
  bundle_eur_per_hour_lang: 28.26
};

const DEFAULT_FREE_ALLOWANCE = {
  max_minutes: 10,
  max_target_languages: 1
};

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseJsonObject(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch (_error) {
    return fallback;
  }
}

function parseJsonArray(value, fallback = []) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (_error) {
    return fallback;
  }
}

function parseCsvList(value, fallback = []) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function getRoiConfig() {
  const planPrices = parseJsonObject(process.env.ROI_PLAN_MONTHLY_PRICES_JSON, DEFAULT_PLAN_PRICES);
  const estimatedCostPerMinute = parseJsonObject(
    process.env.ROI_ESTIMATED_COST_PER_MINUTE_JSON,
    DEFAULT_ESTIMATED_COST_PER_MINUTE
  );
  const usageRevenuePricing = parseJsonObject(
    process.env.ROI_USAGE_REVENUE_PRICING_JSON,
    DEFAULT_USAGE_REVENUE_PRICING
  );
  const providerCosts = parseJsonObject(process.env.ROI_PROVIDER_COSTS_JSON, DEFAULT_PROVIDER_COSTS);
  const deeplPricing = parseJsonObject(process.env.ROI_DEEPL_PRICING_JSON, DEFAULT_DEEPL_PRICING);
  const freeAllowance = parseJsonObject(process.env.ROI_FREE_ALLOWANCE_JSON, DEFAULT_FREE_ALLOWANCE);
  const excludedAdminEmails = parseCsvList(
    process.env.ROI_EXCLUDED_ADMIN_EMAILS,
    ['ralfsfadejevs@gmail.com', 'alans@linearis.io']
  );
  const excludedAdminUserIds = parseJsonArray(process.env.ROI_EXCLUDED_ADMIN_USER_IDS_JSON, []);
  const openAiProjectIds = parseCsvList(process.env.ROI_OPENAI_PROJECT_IDS, []);
  const openAiLineItemAllowlist = parseCsvList(process.env.ROI_OPENAI_LINE_ITEM_ALLOWLIST, []);
  const openAiCostsEnabled = String(process.env.ROI_OPENAI_COSTS_ENABLED || 'false').toLowerCase() === 'true';
  const openAiUsdToEur = Number.parseFloat(process.env.ROI_OPENAI_USD_TO_EUR || '0.92');
  const freeTierMonthlyValue = Number.parseFloat(process.env.ROI_FREE_TIER_MONTHLY_VALUE || '0');

  return {
    planPrices,
    estimatedCostPerMinute,
    usageRevenuePricing,
    providerCosts,
    deeplPricing,
    freeAllowance,
    excludedAdminEmails,
    excludedAdminUserIds,
    openAiCosts: {
      enabled: openAiCostsEnabled,
      projectIds: openAiProjectIds,
      lineItemAllowlist: openAiLineItemAllowlist,
      usdToEur: Number.isFinite(openAiUsdToEur) ? openAiUsdToEur : 0.92,
      apiKey: process.env.OPENAI_ADMIN_API_KEY || process.env.OPENAI_API_KEY || ''
    },
    freeTierMonthlyValue: Number.isFinite(freeTierMonthlyValue) ? freeTierMonthlyValue : 0,
    cacheTtlMs: parsePositiveInt(process.env.ROI_CACHE_TTL_SECONDS, 600) * 1000
  };
}
