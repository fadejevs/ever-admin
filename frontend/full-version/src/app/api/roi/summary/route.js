import 'server-only';

import { assertAdminRequest } from '@/server/roi/auth';
import { aggregateDaily, getRoiDataset, parseFilters } from '@/server/roi/aggregate';

function sumDaily(daily = []) {
  return daily.reduce(
    (acc, row) => {
      acc.runtime_seconds += Number(row.runtime_seconds || 0);
      acc.api_cost_total += Number(row.api_cost_total || 0);
      acc.api_cost_asr += Number(row.api_cost_asr || 0);
      acc.api_cost_translation += Number(row.api_cost_translation || 0);
      acc.api_cost_tts += Number(row.api_cost_tts || 0);
      acc.api_cost_llm += Number(row.api_cost_llm || 0);
      acc.revenue_prorated += Number(row.revenue_prorated || 0);
      acc.gross_margin += Number(row.gross_margin || 0);
      acc.total_rows += Number(row.total_rows || 0);
      acc.estimated_cost_rows += Number(row.estimated_cost_rows || 0);
      acc.openai_actual_cost_rows += Number(row.openai_actual_cost_rows || 0);
      acc.vendor_actual_cost_rows += Number(row.vendor_actual_cost_rows || 0);
      return acc;
    },
    {
      runtime_seconds: 0,
      api_cost_total: 0,
      api_cost_asr: 0,
      api_cost_translation: 0,
      api_cost_tts: 0,
      api_cost_llm: 0,
      revenue_prorated: 0,
      gross_margin: 0,
      total_rows: 0,
      estimated_cost_rows: 0,
      openai_actual_cost_rows: 0,
      vendor_actual_cost_rows: 0
    }
  );
}

function roiSafe(grossMargin, apiCostTotal) {
  if (!Number.isFinite(apiCostTotal) || apiCostTotal <= 0) return null;
  return grossMargin / apiCostTotal;
}

export async function GET(request) {
  const auth = await assertAdminRequest(request);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const filters = parseFilters(url);
    const dataset = await getRoiDataset(filters);
    const daily = aggregateDaily(dataset.rows);
    const totals = sumDaily(daily);
    const period = {
      ...totals,
      roi: roiSafe(totals.gross_margin, totals.api_cost_total),
      estimated_cost_share: totals.total_rows > 0 ? totals.estimated_cost_rows / totals.total_rows : 0,
      openai_actual_cost_share: totals.total_rows > 0 ? totals.openai_actual_cost_rows / totals.total_rows : 0,
      vendor_actual_cost_share: totals.total_rows > 0 ? totals.vendor_actual_cost_rows / totals.total_rows : 0
    };

    return Response.json(
      {
        generated_at: dataset.generated_at,
        filters,
        daily,
        period,
        vendor_costs: dataset.vendor_costs || { total_eur: 0, days_with_actuals: 0, by_vendor: {} }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('ROI summary error:', error);
    return Response.json({ error: 'Failed to load ROI summary' }, { status: 500 });
  }
}
