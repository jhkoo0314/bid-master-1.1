/**
 * Bid Master AI - 경매 지표 계산 모듈
 * 총인수금액, 안전마진, 권장입찰가 범위를 한 번에 계산
 */

import type { TaxInput, TaxOptions, TaxBreakdown } from "./auction-cost";
import { calcTaxes } from "./auction-cost";
import { toKRWNumber } from "./format-utils";
import type { SimulationScenario } from "@/types/simulation";

/** 금액을 숫자로 변환 (문자열 포함 '원' 처리) */
function toNumber(value: string | number | undefined | null): number {
  if (typeof value === "number") {
    return value;
  }
  if (!value) {
    return 0;
  }
  return toKRWNumber(value);
}

/** 경매 지표 계산 입력 */
export interface AuctionMetricsInput {
  /** 입찰가 (B) */
  bidPrice: number;
  /** 인수권리 총합 (R) */
  rights: number;
  /** 수리/개보수비 (C) */
  capex: number;
  /** 명도비 (E) */
  eviction: number;
  /** 보유/이자/관리비 (K) */
  carrying: number;
  /** 예비비 (U) */
  contingency: number;
  /** 시세 (V) - 문자열('522,550,000원') 또는 숫자 */
  marketValue: string | number;
  /** 세금 계산용 입력 */
  taxInput: TaxInput;
  /** 세금 옵션 (선택) */
  taxOptions?: TaxOptions;
  /** 최저가 (권장입찰가 범위 계산용, 선택) */
  minimumBidPrice?: number;
  /** 감정가 (권장입찰가 범위 계산용, 선택) */
  appraisalValue?: number;
}

/** 권장입찰가 범위 */
export interface RecommendedBidRange {
  /** 최소 권장 입찰가 */
  min: number;
  /** 최대 권장 입찰가 */
  max: number;
  /** 최적 입찰가 (안전마진 15% 기준) */
  optimal: number;
}

/** 경매 지표 계산 결과 */
export interface AuctionMetricsResult {
  /** 세금 내역 */
  tax: TaxBreakdown;
  /** 총인수금액 (A = B + R + T + C + E + K + U) */
  totalAcquisition: number;
  /** 안전마진 금액 (V - A) */
  safetyMargin: number;
  /** 안전마진율 ((V - A) / V) */
  safetyRate: number;
  /** 권장입찰가 범위 */
  recommendedBidRange: RecommendedBidRange;
}

/** 금액 반올림 도우미 */
const roundTo = (n: number, unit: number) => Math.round(n / unit) * unit;

/** 목표 마진율을 만족하는 최대 입찰가 계산 */
function findMaxBidByTargetRate(
  V: number,
  R: number,
  C: number,
  E: number,
  K: number,
  U: number,
  taxInput: Omit<TaxInput, "price">,
  targetMarginRate: number,
  taxOptions?: TaxOptions,
  minBid = 1,
  maxBid = V,
  epsilon = 1000
): number {
  let lo = minBid;
  let hi = Math.max(minBid, maxBid);

  const meets = (B: number) => {
    const tax = calcTaxes({ ...taxInput, price: B }, taxOptions);
    const T = tax.totalTaxesAndFees;
    const A = B + R + T + C + E + K + U;
    const mos = V > 0 ? (V - A) / V : -Infinity;
    return mos >= targetMarginRate;
  };

  if (!meets(lo)) return 0;
  if (meets(hi)) return hi;

  while (hi - lo > epsilon) {
    const mid = Math.floor((lo + hi) / 2);
    if (meets(mid)) lo = mid;
    else hi = mid;
  }
  return roundTo(lo, 10);
}

/** 시장가 추정 (유사매각사례, 유찰추세, 최저가 대비 보정 반영) */
function estimateMarketPriceFromScenario(scenario: SimulationScenario): number {
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
  return Math.round(estimated / 10000) * 10000;
}

/**
 * 경매 지표를 한 번에 계산하는 통합 함수
 * 총인수금액, 안전마진, 권장입찰가 범위를 계산합니다.
 */
export function calcAuctionMetrics(
  input: AuctionMetricsInput
): AuctionMetricsResult {
  console.log("💰 [경매지표] 경매 지표 계산 시작");

  const {
    bidPrice: B,
    rights: R,
    capex: C,
    eviction: E,
    carrying: K,
    contingency: U,
    marketValue: V_raw,
    taxInput,
    taxOptions,
    minimumBidPrice,
    appraisalValue,
  } = input;

  // 시세를 숫자로 변환
  console.log("💰 [경매지표] 시세 파싱:", typeof V_raw, V_raw);
  const V = toNumber(V_raw);
  if (!V) {
    console.warn("⚠️ [경매지표] 시세(V)가 없습니다. 0으로 처리합니다.");
  }

  // 세금은 낙찰가(B)를 과세표준으로 계산
  const tax = calcTaxes({ ...taxInput, price: B }, taxOptions);
  const T = tax.totalTaxesAndFees;

  // 총인수금액 계산: A = B + R + T + C + E + K + U
  const totalAcquisition = B + R + T + C + E + K + U;

  // 안전마진 계산: V - A
  const safetyMargin = V - totalAcquisition;

  // 안전마진율 계산: (V - A) / V
  const safetyRate = V > 0 ? safetyMargin / V : 0;

  console.log("💰 [경매지표] 구성 요소:");
  console.log(`  - 입찰가(B): ${B.toLocaleString()}원`);
  console.log(`  - 인수권리(R): ${R.toLocaleString()}원`);
  console.log(`  - 세금 및 수수료(T): ${T.toLocaleString()}원`);
  console.log(`  - 수리비(C): ${C.toLocaleString()}원`);
  console.log(`  - 명도비(E): ${E.toLocaleString()}원`);
  console.log(`  - 보유비(K): ${K.toLocaleString()}원`);
  console.log(`  - 예비비(U): ${U.toLocaleString()}원`);
  console.log(`  ✅ 총인수금액(A): ${totalAcquisition.toLocaleString()}원`);
  console.log(
    `  - 시세(V): ${V.toLocaleString()}원${
      typeof V_raw === "string" ? " (파싱됨)" : !V ? " (기본값)" : ""
    }`
  );
  console.log(
    `  ✅ 안전마진: ${safetyMargin.toLocaleString()}원 (${(
      safetyRate * 100
    ).toFixed(2)}%)`
  );

  // 권장입찰가 범위 계산
  const minBid = minimumBidPrice || Math.max(1, Math.floor(V * 0.7));
  const maxBid = V;
  const taxInputForBid = {
    use: taxInput.use,
    region: taxInput.region,
    householdHomes: taxInput.householdHomes,
    regulatedArea: taxInput.regulatedArea,
  };

  // 최적 입찰가: 안전마진 15%를 만족하는 최대 입찰가
  const optimalBid = findMaxBidByTargetRate(
    V,
    R,
    C,
    E,
    K,
    U,
    taxInputForBid,
    0.15, // 15% 안전마진
    taxOptions,
    minBid,
    maxBid
  );

  // 최소 권장 입찰가: 안전마진 10%를 만족하는 최대 입찰가
  const minRecommendedBid = findMaxBidByTargetRate(
    V,
    R,
    C,
    E,
    K,
    U,
    taxInputForBid,
    0.1, // 10% 안전마진
    taxOptions,
    minBid,
    maxBid
  );

  // 최대 권장 입찰가: 안전마진 20%를 만족하는 최대 입찰가
  const maxRecommendedBid = findMaxBidByTargetRate(
    V,
    R,
    C,
    E,
    K,
    U,
    taxInputForBid,
    0.2, // 20% 안전마진
    taxOptions,
    minBid,
    maxBid
  );

  const recommendedBidRange: RecommendedBidRange = {
    min: minRecommendedBid || minBid,
    max: maxRecommendedBid || optimalBid || maxBid,
    optimal: optimalBid || Math.floor((minBid + maxBid) / 2),
  };

  console.log("💰 [경매지표] 권장입찰가 범위:");
  console.log(
    `  - 최소 권장: ${recommendedBidRange.min.toLocaleString()}원 (안전마진 10%)`
  );
  console.log(
    `  - 최적 입찰가: ${recommendedBidRange.optimal.toLocaleString()}원 (안전마진 15%)`
  );
  console.log(
    `  - 최대 권장: ${recommendedBidRange.max.toLocaleString()}원 (안전마진 20%)`
  );

  return {
    tax,
    totalAcquisition,
    safetyMargin,
    safetyRate,
    recommendedBidRange,
  };
}
