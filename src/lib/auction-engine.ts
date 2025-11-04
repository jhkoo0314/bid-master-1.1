// Bid Master Auction Engine v0.2
// ===============================
// 기준 문서: docs/auction-engine-v0.2.md
// 작성일: 2025-01-XX
//
// 목적: 파편화된 계산 로직을 단일 진입점으로 통합
// 레이어 구조: Valuation → Rights → Costs → Profit 순서로 실행
// v0.2 변경사항: 유형별 κ/세율/명도비, 권리 15종 판정, 위험 배지 병합

import type { EngineInput, EngineOutput } from "@/types/auction";
import { estimateValuation } from "./valuation";
import { analyzeRights } from "./rights/rights-engine";
import { calcCosts } from "./costs";
import { evaluateProfit } from "./profit";

/**
 * 경매 엔진 v0.2 - 단일 진입점
 *
 * 모든 경매 계산을 통합하는 메인 함수.
 * Valuation, Rights, Costs, Profit 레이어를 순차 실행하여 결과를 통합.
 *
 * v0.2 변경사항:
 * - 유형별 κ 값 적용 (매물유형 9종)
 * - 권리유형 15종 판정 + 위험 배지 시스템
 * - 유형별 취득세율/명도비 기본값 적용
 * - 위험 가산 비용 계산
 * - riskFlags 및 meta 필드 추가
 *
 * @param input - 엔진 입력 데이터 (PropertySnapshot, 입찰가, 옵션 등)
 * @returns 엔진 출력 결과 (모든 레이어 결과 + 통합 안전마진 + 위험 배지)
 *
 * 실행 순서:
 * 1. Valuation: FMV, 감정가, 최저가 계산 (유형별 κ 값 적용)
 * 2. Rights: 권리 인수/소멸 판단, 임차인 대항력 분석, 위험 배지 수집
 * 3. Costs: 세금, 명도비, 총인수금액 계산 (위험 가산 비용 포함)
 * 4. Profit: FMV/Exit 기준 안전마진, 손익분기점 계산
 * 5. Safety: 통합 안전마진 객체 생성
 * 6. Output: 모든 레이어 결과 + riskFlags + meta 통합
 */
export function auctionEngine(input: EngineInput): EngineOutput {
  const { snapshot, userBidPrice, exitPriceHint, valuationInput, options } =
    input;

  // v0.2: 간소화된 로그 함수
  const log = (...args: any[]) => {
    if (options?.devMode) {
      const p = options?.logPrefix ?? "🧠 [ENGINE]";
      // eslint-disable-next-line no-console
      console.log(p, ...args);
    }
  };

  // ===============================
  // 1단계: Valuation 레이어 호출
  // ===============================
  const valuation = estimateValuation({
    appraisal: snapshot.appraisal,
    minBid: snapshot.minBid,
    fmvHint: snapshot.fmvHint ?? valuationInput?.fmvHint,
    marketSignals: valuationInput?.marketSignals,
    propertyType: snapshot.propertyType,
    overrides: valuationInput?.overrides,
  });
  log("📐 valuation", valuation);

  // ===============================
  // 2단계: Rights 레이어 호출
  // ===============================
  const rights = analyzeRights(snapshot);
  log("⚖️ rights", rights);

  // ===============================
  // 3단계: Costs 레이어 호출
  // ===============================
  const costs = calcCosts({
    bidPrice: userBidPrice,
    assumedRightsAmount: rights.assumedRightsAmount,
    propertyType: snapshot.propertyType,
    regionCode: snapshot.regionCode,
    riskFlags: rights.riskFlags,
    overrides: valuationInput as any, // 선택: 상위에서 세율/명도/기타 비용 전달
  });
  log("💰 costs", costs);

  // ===============================
  // 4단계: Profit 레이어 호출
  // ===============================
  const profit = evaluateProfit({
    exitPrice: exitPriceHint,
    fmv: valuation.fmv,
    totalAcquisition: costs.totalAcquisition,
    bidPrice: userBidPrice,
  });
  log("📊 profit", profit);

  // ===============================
  // 5단계: Safety 객체 생성
  // ===============================

  // 0으로 나누기 방지 헬퍼 함수
  const safeDiv = (numerator: number, denominator: number): number => {
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // FMV 기준 안전마진
  const fmvAmount = valuation.fmv - costs.totalAcquisition;
  const fmvRate = safeDiv(fmvAmount, valuation.fmv);

  // Exit 기준 안전마진
  const exitPrice = exitPriceHint ?? valuation.fmv;
  const exitAmount = exitPrice - costs.totalAcquisition;
  const exitRate = safeDiv(exitAmount, exitPrice);

  // 사용자 입찰가 기준 마진
  const userBidAmount = valuation.fmv - userBidPrice;
  const userBidRate = safeDiv(userBidAmount, valuation.fmv);

  // 입찰가가 FMV 초과 여부
  const overFMV = userBidPrice > valuation.fmv;

  const safety = {
    fmv: {
      amount: fmvAmount,
      rate: fmvRate,
    },
    exit: {
      amount: exitAmount,
      rate: exitRate,
    },
    userBid: {
      amount: userBidAmount,
      rate: userBidRate,
    },
    overFMV,
  };
  log("🧯 safety", safety);

  return {
    valuation,
    rights,
    costs,
    profit,
    safety,
    riskFlags: rights.riskFlags,
    meta: { engineVersion: "v0.2", generatedAt: new Date().toISOString() },
  };
}
