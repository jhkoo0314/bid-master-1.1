import { SimulationScenario } from "@/types/simulation";

// ============================================
// 인터페이스 정의
// ============================================

/**
 * 시세 예측 입력 파라미터
 */
export interface MarketPriceParams {
  appraised: number; // 감정가
  area?: number; // 전용면적 등 (㎡)
  regionCode?: string; // 지역 코드
  recentDeals?: Array<{ price: number; date: string }>; // 선택: 실거래 스냅샷
}

/**
 * 시세 예측 결과
 */
export interface MarketPriceResult {
  min: number; // 예측 하한가 (보수적)
  max: number; // 예측 상한가 (낙관적)
  confidence: number; // 신뢰도 (0~1)
  volatility: number; // 변동성 (0~1)
  sources: string[]; // 근거: ["rules", "kb", "deals", "auctions", "ai"]
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 중위값(median) 계산
 */
function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * 표준편차 계산
 */
function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
  const variance = squaredDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;

  return Math.sqrt(variance);
}

// ============================================
// 시세 예측 함수 (범위 및 메타데이터 포함)
// ============================================

/**
 * 시세 예측 (범위 및 신뢰도 포함)
 *
 * v0: 규칙 기반 스캐폴드 (MVP)
 * - 실거래가가 있으면 중위값±편차, 없으면 감정가에 보수/낙관 계수 적용
 */
export function estimateMarketPriceRange(
  p: MarketPriceParams
): MarketPriceResult {
  console.log("💰 [시세 예측] 범위 예측 시작");
  console.log(`  - 감정가: ${p.appraised.toLocaleString()}원`);
  console.log(`  - 실거래 건수: ${p.recentDeals?.length || 0}건`);

  const hasRecentDeals = p.recentDeals && p.recentDeals.length > 0;

  let base: number;
  let confidence: number;
  let volatility: number;
  let sources: string[];

  if (hasRecentDeals) {
    // 실거래 데이터 기반
    const prices = p.recentDeals!.map((d) => d.price).filter((p) => p > 0);
    base = median(prices);
    const stdDev = standardDeviation(prices);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    // 변동성: 표준편차 / 평균 (최대 0.3으로 제한)
    volatility = Math.min(0.3, stdDev / mean || 0.06);

    // 신뢰도: 데이터 개수에 비례 (최소 0.5, 최대 0.8)
    confidence = Math.min(0.8, Math.max(0.5, 0.5 + prices.length * 0.03));

    sources = ["deals"];

    console.log(`  - 실거래 중위값: ${base.toLocaleString()}원`);
    console.log(`  - 표준편차: ${stdDev.toLocaleString()}원`);
  } else {
    // 감정가 기반 (규칙 기반)
    base = p.appraised;
    volatility = 0.06; // 기본값
    confidence = 0.5; // 기본값
    sources = ["rules"];

    console.log(`  - 감정가 기반: ${base.toLocaleString()}원`);
  }

  // min/max 계산
  // 실거래가 있으면: 중위값 ± (표준편차 또는 중위값의 5%)
  // 실거래가 없으면: 감정가 × 0.95 ~ 1.05
  let min: number;
  let max: number;

  if (hasRecentDeals) {
    const prices = p.recentDeals!.map((d) => d.price).filter((p) => p > 0);
    const stdDev = standardDeviation(prices);
    const adjustment = Math.max(stdDev, base * 0.03); // 최소 3% 범위

    min = Math.floor(base - adjustment);
    max = Math.floor(base + adjustment);

    // 최소 범위 보장: ±3%
    const minRange = base * 0.03;
    if (max - min < minRange * 2) {
      min = Math.floor(base - minRange);
      max = Math.floor(base + minRange);
    }
  } else {
    // 감정가 기반: ±5%
    min = Math.floor(base * 0.95);
    max = Math.floor(base * 1.05);
  }

  // 품질 관리: min ≤ max 보장, 음수 금지
  min = Math.max(0, min);
  max = Math.max(min, max);

  // 범위 검증: 너무 좁지 않게 (≥ ±3%), 너무 넓지 않게 (≤ ±15%)
  const rangeRatio = (max - min) / base;
  if (rangeRatio < 0.06) {
    // 최소 ±3% 범위
    const targetRange = base * 0.06;
    const center = (min + max) / 2;
    min = Math.floor(center - targetRange / 2);
    max = Math.floor(center + targetRange / 2);
  } else if (rangeRatio > 0.3) {
    // 최대 ±15% 범위
    const targetRange = base * 0.3;
    const center = (min + max) / 2;
    min = Math.floor(center - targetRange / 2);
    max = Math.floor(center + targetRange / 2);
  }

  console.log(
    `  ✅ 시세 범위: ${min.toLocaleString()}원 ~ ${max.toLocaleString()}원`
  );
  console.log(`  - 신뢰도: ${(confidence * 100).toFixed(1)}%`);
  console.log(`  - 변동성: ${(volatility * 100).toFixed(1)}%`);
  console.log(`  - 근거: ${sources.join(", ")}`);

  return {
    min,
    max,
    confidence,
    volatility,
    sources,
  };
}

// ============================================
// 하위 호환성 함수 (기존 API 유지)
// ============================================

/**
 * 시장가 추정: 유사매각사례, 유찰추세, 최저가 대비 보정 반영
 *
 * @deprecated estimateMarketPriceRange를 사용하는 것을 권장합니다.
 * 이 함수는 하위 호환성을 위해 유지되며, 내부적으로 estimateMarketPriceRange의 max 값을 반환합니다.
 */
export function estimateMarketPrice(scenario: SimulationScenario): number {
  console.log("💰 [시세 예측] 단일값 예측 (레거시)");

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

  console.log(`  ✅ 단일 시세: ${rounded.toLocaleString()}원`);

  // 로그는 소비처(컴포넌트)에서 남기도록 값을 반환만 함
  return rounded;
}
