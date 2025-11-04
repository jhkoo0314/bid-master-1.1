// Bid Master Auction Engine v0.1
// ===============================
// 기준 문서: docs/auction-engine-v0.1.md
// 작성일: 2025-01-XX
//
// 목적: 파편화된 계산 로직을 단일 진입점으로 통합
// 레이어 구조: Valuation → Rights → Costs → Profit 순서로 실행

import type { EngineInput, EngineOutput } from "@/types/auction";
import { estimateValuation } from "./valuation";
import { analyzeRights } from "./rights/rights-engine";
import { calcCosts } from "./costs";
import { evaluateProfit } from "./profit";

/**
 * 로그 헬퍼 함수
 * 
 * devMode가 활성화된 경우에만 로그를 출력합니다.
 * 로그 접두사는 options.logPrefix를 사용하며, 없으면 기본값 "🧠 [ENGINE]"을 사용합니다.
 * 
 * @param devMode - 개발자 모드 활성화 여부
 * @param prefix - 로그 접두사
 * @param message - 로그 메시지
 * @param data - 로그 데이터 (선택)
 */
function log(
  devMode: boolean,
  prefix: string,
  message: string,
  data?: unknown
): void {
  if (!devMode) return;
  
  // eslint-disable-next-line no-console
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

/**
 * 경매 엔진 v0.1 - 단일 진입점
 * 
 * 모든 경매 계산을 통합하는 메인 함수.
 * Valuation, Rights, Costs, Profit 레이어를 순차 실행하여 결과를 통합.
 * 
 * @param input - 엔진 입력 데이터 (PropertySnapshot, 입찰가, 옵션 등)
 * @returns 엔진 출력 결과 (모든 레이어 결과 + 통합 안전마진)
 * 
 * 실행 순서:
 * 1. Valuation: FMV, 감정가, 최저가 계산
 * 2. Rights: 권리 인수/소멸 판단, 임차인 대항력 분석
 * 3. Costs: 세금, 명도비, 총인수금액 계산
 * 4. Profit: FMV/Exit 기준 안전마진, 손익분기점 계산
 * 5. Safety: 통합 안전마진 객체 생성
 */
export function auctionEngine(input: EngineInput): EngineOutput {
  const { snapshot, userBidPrice, exitPriceHint, valuationInput, options } = input;
  
  // devMode 로그 설정
  const devMode = options?.devMode ?? false;
  const logPrefix = options?.logPrefix ?? "🧠 [ENGINE]";
  
  // 엔진 실행 시작 로그
  log(devMode, logPrefix, "경매 엔진 실행 시작", {
    caseId: snapshot.caseId,
    propertyType: snapshot.propertyType,
    userBidPrice: userBidPrice.toLocaleString(),
    hasExitPriceHint: !!exitPriceHint,
    exitPriceHint: exitPriceHint?.toLocaleString(),
    rightsCount: snapshot.rights?.length ?? 0,
    tenantsCount: snapshot.tenants?.length ?? 0,
    hasValuationInput: !!valuationInput,
  });
  
  // ===============================
  // 1단계: Valuation 레이어 호출
  // ===============================
  log(devMode, logPrefix, "📐 Valuation 레이어 실행 시작");
  const valuation = estimateValuation({
    appraisal: snapshot.appraisal,
    minBid: snapshot.minBid,
    fmvHint: snapshot.fmvHint ?? valuationInput?.fmvHint,
    marketSignals: valuationInput?.marketSignals,
    propertyType: snapshot.propertyType,
  });
  log(devMode, logPrefix, "📐 Valuation 레이어 완료", {
    fmv: valuation.fmv.toLocaleString(),
    appraisal: valuation.appraisal.toLocaleString(),
    minBid: valuation.minBid.toLocaleString(),
  });
  
  // ===============================
  // 2단계: Rights 레이어 호출
  // ===============================
  log(devMode, logPrefix, "⚖️ Rights 레이어 실행 시작");
  const rights = analyzeRights(snapshot);
  
  // 인수금액 필드명 통합 대응 (하위 호환성)
  const assumed =
    rights.assumedRightsAmount ??
    (rights as any).totalAssumedAmount ??
    0;
  
  log(devMode, logPrefix, "⚖️ Rights 레이어 완료", {
    malsoBaseRightId: rights.malsoBase?.id || null,
    assumedRightsAmount: assumed.toLocaleString(),
    rightsAssumedCount: rights.rightFindings.filter(f => f.assumed).length,
    tenantsAssumedCount: rights.tenantFindings.filter(f => f.assumed).length,
  });
  
  // ===============================
  // 3단계: Costs 레이어 호출
  // ===============================
  log(devMode, logPrefix, "💰 Costs 레이어 실행 시작");
  const costs = calcCosts({
    bidPrice: userBidPrice,
    assumedRightsAmount: assumed,
    propertyType: snapshot.propertyType,
    regionCode: snapshot.regionCode,
    overrides: valuationInput as any, // 선택: 상위에서 세율/명도/기타 비용 전달
  });
  log(devMode, logPrefix, "💰 Costs 레이어 완료", {
    totalAcquisition: costs.totalAcquisition.toLocaleString(),
    taxes: costs.taxes.totalTax.toLocaleString(),
    evictionCost: costs.evictionCost.toLocaleString(),
    miscCost: costs.miscCost.toLocaleString(),
  });
  
  // ===============================
  // 4단계: Profit 레이어 호출
  // ===============================
  log(devMode, logPrefix, "📊 Profit 레이어 실행 시작");
  const profit = evaluateProfit({
    exitPrice: exitPriceHint,
    fmv: valuation.fmv,
    totalAcquisition: costs.totalAcquisition,
    bidPrice: userBidPrice,
  });
  log(devMode, logPrefix, "📊 Profit 레이어 완료", {
    marginVsFMV: profit.marginVsFMV.toLocaleString(),
    marginRateVsFMV: `${(profit.marginRateVsFMV * 100).toFixed(2)}%`,
    marginVsExit: profit.marginVsExit.toLocaleString(),
    marginRateVsExit: `${(profit.marginRateVsExit * 100).toFixed(2)}%`,
    bePoint: profit.bePoint.toLocaleString(),
  });
  
  // ===============================
  // 5단계: Safety 객체 생성
  // ===============================
  log(devMode, logPrefix, "🧯 Safety 객체 생성 시작");
  
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
  
  log(devMode, logPrefix, "🧯 Safety 객체 생성 완료", {
    fmv: {
      amount: fmvAmount.toLocaleString(),
      rate: `${(fmvRate * 100).toFixed(2)}%`,
    },
    exit: {
      amount: exitAmount.toLocaleString(),
      rate: `${(exitRate * 100).toFixed(2)}%`,
    },
    userBid: {
      amount: userBidAmount.toLocaleString(),
      rate: `${(userBidRate * 100).toFixed(2)}%`,
    },
    overFMV,
  });
  
  // ===============================
  // 6단계: EngineOutput 반환
  // ===============================
  log(devMode, logPrefix, "✅ 경매 엔진 실행 완료 - 결과 반환");
  
  // 데이터 흐름 검증 (devMode에서만)
  if (devMode) {
    // snapshot → Valuation 입력 검증
    log(devMode, logPrefix, "🔍 [검증] snapshot → Valuation 입력", {
      snapshotAppraisal: snapshot.appraisal,
      snapshotMinBid: snapshot.minBid,
      snapshotFmvHint: snapshot.fmvHint,
      valuationAppraisal: valuation.appraisal,
      valuationMinBid: valuation.minBid,
      valuationFmv: valuation.fmv,
    });
    
    // valuation.fmv → Profit 입력 검증
    log(devMode, logPrefix, "🔍 [검증] valuation.fmv → Profit 입력", {
      valuationFmv: valuation.fmv,
      profitFmv: profit.marginVsFMV + costs.totalAcquisition, // 역산 검증
      matches: Math.abs(valuation.fmv - (profit.marginVsFMV + costs.totalAcquisition)) < 1,
    });
    
    // rights.assumedRightsAmount → Costs 입력 검증
    log(devMode, logPrefix, "🔍 [검증] rights.assumedRightsAmount → Costs 입력", {
      rightsAssumedRightsAmount: rights.assumedRightsAmount,
      costsInputAssumedRightsAmount: rights.assumedRightsAmount, // calcCosts 호출 시 전달한 값
      matches: true, // 직접 전달하므로 항상 일치
    });
    
    // costs.totalAcquisition → Profit 입력 검증
    log(devMode, logPrefix, "🔍 [검증] costs.totalAcquisition → Profit 입력", {
      costsTotalAcquisition: costs.totalAcquisition,
      profitTotalAcquisition: profit.bePoint, // 손익분기점 = 총인수금액
      matches: Math.abs(costs.totalAcquisition - profit.bePoint) < 1,
    });
    
    // 모든 레이어 결과 → EngineOutput 검증
    log(devMode, logPrefix, "🔍 [검증] 모든 레이어 결과 → EngineOutput", {
      hasValuation: !!valuation,
      hasRights: !!rights,
      hasCosts: !!costs,
      hasProfit: !!profit,
      hasSafety: !!safety,
      safetyFmvAmount: safety.fmv.amount,
      safetyFmvRate: `${(safety.fmv.rate * 100).toFixed(2)}%`,
      overFMV: safety.overFMV,
    });
  }
  
  const output: EngineOutput = {
    valuation,
    rights,
    costs,
    profit,
    safety,
  };
  
  log(devMode, logPrefix, "✅ EngineOutput 반환", {
    fmv: valuation.fmv.toLocaleString(),
    assumedRightsAmount: rights.assumedRightsAmount.toLocaleString(),
    totalAcquisition: costs.totalAcquisition.toLocaleString(),
    marginVsFMV: profit.marginVsFMV.toLocaleString(),
    safetyFmvAmount: safety.fmv.amount.toLocaleString(),
    overFMV: safety.overFMV,
  });
  
  return output;
}
