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

/**
 * AI 시세 예측 입력 파라미터
 */
export interface AIMarketPriceParams {
  appraised: number; // 감정가
  area?: number; // 전용면적 (㎡)
  regionCode?: string; // 지역 코드
  yearBuilt?: number; // 준공연도
  propertyType?: "APT" | "OFFICETEL" | "VILLA" | "ETC"; // 매물 유형
  minimumBidPrice?: number; // 선택: 최저가 (FMV 하한 클램프에 사용)
}

/**
 * AI 시세 예측 결과
 */
export interface AIMarketPriceResult {
  min: number; // 예측 하한가 (보수적)
  max: number; // 예측 상한가 (낙관적)
  center: number; // 모델 중심값 (내부 기준)
  fairCenter: number; // ✅ FMV: 공정시세(=MoS 계산에 사용)
  auctionCenter: number; // ✅ 경매가 가이드 중심값(입찰전략용)
  confidence: number; // 신뢰도 (0~1)
  volatility: number; // 변동성 (0~1)
  model: string; // 모델 버전 정보
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
// 타입 매핑 유틸리티 함수
// ============================================

/**
 * SimulationScenario의 propertyType을 AIMarketPriceParams의 propertyType으로 변환
 *
 * @param propertyType 매물 유형 문자열 (예: "아파트", "오피스텔", "빌라" 등)
 * @returns AI 시세 예측에 사용할 매물 유형 ("APT" | "OFFICETEL" | "VILLA" | "ETC")
 *
 * @example
 * ```ts
 * mapPropertyTypeToAIMarketPriceType("아파트") // "APT"
 * mapPropertyTypeToAIMarketPriceType("오피스텔") // "OFFICETEL"
 * mapPropertyTypeToAIMarketPriceType("단독주택") // "VILLA"
 * ```
 */
export function mapPropertyTypeToAIMarketPriceType(
  propertyType: string
): "APT" | "OFFICETEL" | "VILLA" | "ETC" {
  const normalized = propertyType.toLowerCase().trim();
  if (normalized.includes("아파트") || normalized === "apt") return "APT";
  if (
    normalized.includes("오피스텔") ||
    normalized.includes("오피스") ||
    normalized === "officetel"
  )
    return "OFFICETEL";
  if (
    normalized.includes("빌라") ||
    normalized.includes("단독") ||
    normalized === "villa"
  )
    return "VILLA";
  return "ETC";
}

// ============================================
// AI 시세 예측 함수 (시뮬레이션 기반)
// ============================================

/**
 * AI 시뮬레이션 기반 시세 예측
 *
 * v0.1: AI 시뮬레이션 스캐폴드 (MVP) - 2025-01 완료
 * - 감정가를 기준으로 지역/면적/연식/유형을 반영한 AI 추정 중심값 생성
 * - 보수/낙관 편차를 적용하여 min/max 범위 제공
 * - confidence는 초기값 0.55 고정 (향후 모델 학습 데이터로 대체 예정)
 * - volatility는 지역 기반 기본값 (0.06 = ±6%)
 *
 * @param params AI 시세 예측 입력 파라미터
 * @returns AI 시세 예측 결과 (범위, 신뢰도, 변동성 포함)
 *
 * @example
 * ```ts
 * const result = estimateAIMarketPrice({
 *   appraised: 500_000_000,
 *   area: 84,
 *   regionCode: "서울특별시 강남구",
 *   propertyType: "APT",
 *   yearBuilt: 2015
 * });
 * // 반환: { min: 470_000_000, max: 530_000_000, confidence: 0.55, volatility: 0.06, model: "v0.1-ai-simulation" }
 * ```
 */
export function estimateAIMarketPrice(
  params: AIMarketPriceParams
): AIMarketPriceResult {
  console.log("🤖 [AI 시세 예측] AI 시뮬레이션 기반 범위 예측 시작");
  console.log(`  - 감정가: ${params.appraised.toLocaleString()}원`);
  console.log(`  - 매물 유형: ${params.propertyType || "ETC"}`);
  console.log(`  - 면적: ${params.area ? params.area + "㎡" : "미제공"}`);
  console.log(`  - 지역: ${params.regionCode || "미제공"}`);
  console.log(`  - 준공연도: ${params.yearBuilt || "미제공"}`);

  const {
    appraised,
    area,
    regionCode,
    yearBuilt,
    propertyType = "ETC",
  } = params;

  // 1. 지역 계수 (예시: 강남권 > 일반권 > 지방)
  // 실제로는 지역별 시세 데이터 기반으로 계산되어야 함
  const getRegionFactor = (code?: string): number => {
    if (!code) return 1.0;
    // 강남/서초 등 프리미엄 지역: 1.05~1.15
    if (code.includes("강남") || code.includes("서초")) return 1.08;
    // 서울 주요 지역: 1.02~1.05
    if (code.includes("서울")) return 1.03;
    // 기타: 1.0 (기본값)
    return 1.0;
  };

  // 2. 면적 계수 (면적이 클수록 단위당 가격이 낮아지는 경향)
  const getAreaFactor = (areaM2?: number): number => {
    if (!areaM2 || areaM2 <= 0) return 1.0;
    // 면적이 클수록 단가가 약간 하락 (80㎡ 이상: 0.98, 120㎡ 이상: 0.95)
    if (areaM2 >= 120) return 0.95;
    if (areaM2 >= 80) return 0.98;
    return 1.0;
  };

  // 3. 연식 계수 (연식이 오래될수록 가격 하락)
  const getAgeFactor = (year?: number): number => {
    if (!year) return 1.0;
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    // 10년 이하: 1.0, 10~20년: 0.97, 20~30년: 0.94, 30년 이상: 0.91
    if (age <= 10) return 1.0;
    if (age <= 20) return 0.97;
    if (age <= 30) return 0.94;
    return 0.91;
  };

  // 4. 매물 유형 계수
  const getTypeFactor = (type: string): number => {
    switch (type) {
      case "APT":
        return 1.05; // 아파트는 일반적으로 프리미엄
      case "OFFICETEL":
        return 0.92; // 오피스텔은 아파트 대비 낮음
      case "VILLA":
        return 0.95; // 빌라는 아파트 대비 약간 낮음
      default:
        return 1.0;
    }
  };

  // 5. AI 추정 중심값 계산
  const regionFactor = getRegionFactor(regionCode);
  const areaFactor = getAreaFactor(area);
  const ageFactor = getAgeFactor(yearBuilt);
  const typeFactor = getTypeFactor(propertyType);

  const center = appraised * regionFactor * areaFactor * ageFactor * typeFactor;

  console.log(`  - 지역 계수: ${regionFactor.toFixed(3)}`);
  console.log(`  - 면적 계수: ${areaFactor.toFixed(3)}`);
  console.log(`  - 연식 계수: ${ageFactor.toFixed(3)}`);
  console.log(`  - 유형 계수: ${typeFactor.toFixed(3)}`);
  console.log(`  - AI 추정 중심값: ${center.toLocaleString()}원`);

  // 6. 변동성 설정 (기본값 0.06 = ±6%)
  const volatility = 0.06;

  // 7. 보수/낙관 편차 계산
  // min = center * (1 - volatility), max = center * (1 + volatility)
  let min = Math.floor(center * (1 - volatility));
  let max = Math.floor(center * (1 + volatility));

  // 8. 품질 관리: min ≤ max 보장, 음수 금지
  min = Math.max(0, min);
  max = Math.max(min, max);

  // 9. 범위 검증: 너무 좁지 않게 (≥ ±5%), 너무 넓지 않게 (≤ ±12%)
  const rangeRatio = (max - min) / center;
  if (rangeRatio < 0.1) {
    // 최소 ±5% 범위 보장
    const targetRange = center * 0.1;
    min = Math.floor(center - targetRange / 2);
    max = Math.floor(center + targetRange / 2);
  } else if (rangeRatio > 0.24) {
    // 최대 ±12% 범위 제한
    const targetRange = center * 0.24;
    min = Math.floor(center - targetRange / 2);
    max = Math.floor(center + targetRange / 2);
  }

  // 10. 신뢰도 설정 (초기값 0.55 고정, 향후 모델 학습 데이터로 대체 예정)
  const confidence = 0.55;

  // 11. FMV(공정시세) 클램프: MoS 비교 기준. 지나치게 낮게 떨어지는 것 방지
  const lowerClampFromAppraisal = appraised * 0.90; // 감정가의 90%는 보장
  const lowerClampFromMinBid =
    typeof params.minimumBidPrice === "number"
      ? params.minimumBidPrice * 1.07 // 최저가 +7% 하한
      : 0;
  const fmvLower = Math.max(lowerClampFromAppraisal, lowerClampFromMinBid, 0);
  const fmvUpper = appraised * 1.15; // 과도 상승 억제
  const fairCenter = Math.round(Math.min(Math.max(center, fmvLower), fmvUpper));

  // 12. 경매가 가이드 중심값(입찰전략용). MoS에는 사용하지 않음.
  const auctionDiscount = 0.88; // 일반시세 대비 평균 12% 할인 가정
  const auctionCenter = Math.round(fairCenter * auctionDiscount);

  console.log(
    `  ✅ [AI 시세 예측] 범위: ${min.toLocaleString()} ~ ${max.toLocaleString()}`
  );
  console.log(`  - 신뢰도: ${(confidence * 100).toFixed(1)}%`);
  console.log(`  - 변동성: ${(volatility * 100).toFixed(1)}%`);
  console.log(`  - 모델: v0.1-ai-simulation`);
  console.log(`  - center(모델): ${center.toLocaleString()}`);
  console.log(`  - fairCenter(FMV, MoS용): ${fairCenter.toLocaleString()}`);
  console.log(`  - auctionCenter(입찰가 가이드용): ${auctionCenter.toLocaleString()}`);

  return {
    min,
    max,
    center,
    fairCenter,
    auctionCenter,
    confidence,
    volatility,
    model: "v0.1-ai-simulation",
  };
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
