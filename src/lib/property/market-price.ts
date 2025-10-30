import { SimulationScenario } from "@/types/simulation";

// 시장가 추정: 유사매각사례, 유찰추세, 최저가 대비 보정 반영
export function estimateMarketPrice(scenario: SimulationScenario): number {
  const appraisalValue = scenario.basicInfo.appraisalValue;
  const minimumBidPrice = scenario.basicInfo.minimumBidPrice;

  // 1) 유사 매각 사례 기반 비율 산출 (없으면 0.92 기본)
  const similarSales = scenario.similarSales || [];
  let ratioFromSimilar = 0.92;
  if (similarSales.length > 0) {
    const ratios = similarSales
      .filter((s) => s.salePrice > 0 && s.appraisalValue > 0)
      .map((s) => s.salePrice / s.appraisalValue);
    if (ratios.length > 0) {
      ratioFromSimilar = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
      // 범위 클램프 (85% ~ 110%)
      ratioFromSimilar = Math.max(0.85, Math.min(1.1, ratioFromSimilar));
    }
  }

  // 2) 유찰 추세 보정: 최근 유찰 많으면 하향 보정 (최대 -5%)
  const biddingHistory = scenario.biddingHistory || [];
  const failedCount = biddingHistory.filter((b) => b.result === "유찰").length;
  const trendAdjustment = Math.max(-0.05, Math.min(0, -0.015 * failedCount));

  // 3) 기초 시장가 (감정가 * 유사사례 비율)
  let estimated = appraisalValue * (ratioFromSimilar + trendAdjustment);

  // 4) 최저가 대비 하한선 보정: 최저가의 +7%는 넘도록 (너무 낮게 나오지 않게)
  const lowerBound = minimumBidPrice * 1.07;
  if (estimated < lowerBound) estimated = lowerBound;

  // 5) 반올림 (만원 단위)
  const rounded = Math.round(estimated / 10000) * 10000;

  // 로그는 소비처(컴포넌트)에서 남기도록 값을 반환만 함
  return rounded;
}
