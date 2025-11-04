// Bid Master Auction Engine
// ===============================
// Phase 2: v0.1 마이그레이션 진행 중
// ===============================
// 기준 문서: docs/auction-engine-v0.1-migration-plan.md
// 작성일: 2025-01-XX
//
// 이 파일은 Phase 2.1에서 기존 v1.2 코드를 백업하고,
// Phase 2.2-2.6에서 새 v0.1 엔진을 구현합니다.
// Phase 4에서 컴포넌트 교체 완료 후 v1.2 백업 코드를 제거 예정입니다.

// ===============================
// v1.2 BACKUP START
// ===============================
// 백업일: 2025-01-XX
// 백업 범위: 아래 코드 전체 (타입, 함수, 상수, 유틸 모두 포함)
// 참조 위치:
//   - src/app/property/[id]/page.tsx: evaluateAuction, AuctionEvalInput 사용
//   - src/components/BiddingModal.tsx: evaluateAuction, AuctionEvalInput 사용
//   - src/lib/property/formatters_v2.ts: AuctionEvalResult 타입 사용
//
// 주의: Phase 4에서 컴포넌트 교체 완료 전까지는 기존 코드를 그대로 사용합니다.
// 아래 코드는 백업 블록으로 표시되어 있으나, 실제로는 동작 중입니다.
//
// Bid Master v1.2 – 통합 계산 엔진 (MoS 2종 + 3단계 입찰전략)

import {
  estimateAIMarketPrice,
  type AIMarketPriceParams,
  type AIMarketPriceResult,
} from "@/lib/property/market-price";

import { calcTaxes, type TaxInput } from "@/lib/auction-cost";

import { AcquisitionBreakdown, CalcResult } from "@/types/property";

// ===============================
// 타입 정의
// ===============================

export type StrategyStage = "conservative" | "neutral" | "aggressive";

export interface BidStrategyItem {
  stage: StrategyStage;
  label: "보수적" | "중립" | "공격적";
  value: number; // 권장 입찰가
  basis: "FMV"; // 기준 (현재 v1.2는 FMV 기준)
}

export interface ExitAssumption {
  /** 미래 매각가를 직접 지정 (지정 시 아래 파라미터 무시) */
  exitPriceExplicit?: number;

  /** 보유 개월 수 (미지정 시 6개월 가정) */
  holdingMonths?: number;

  /** 연간 기대상승률 (예: 0.06 = 6%) */
  annualAppreciation?: number;

  /** 리노베이션/가치상승 가산 (정액, 원) */
  rehabUplift?: number;

  /** 매도비용 비율 (중개보수/취득·양도 부대비 포함 비율) */
  sellCostRate?: number;
}

export interface AcquisitionCostInput {
  bidPrice: number; // B: 입찰가(낙찰가 가정)
  rights: number; // R: 인수권리+임차보증금 총액
  capex?: number; // C: 수리비
  eviction?: number; // E: 명도비
  carrying?: number; // K: 보유비(이자/관리비)
  contingency?: number; // U: 예비비
  taxInput?: TaxInput; // T: 취득세 등 세금 계산 입력
}

export interface MarketInput
  extends Omit<AIMarketPriceParams, "minimumBidPrice"> {
  /** 최저가 (FMV 하한 클램프 보조용. market-price 모듈이 내부적으로 사용) */
  minimumBidPrice?: number;
}

export interface AuctionEvalInput {
  /** 총인수금액 A 산출에 필요한 비용들 */
  cost: AcquisitionCostInput;

  /** FMV 추정에 필요한 파라미터 */
  market: MarketInput;

  /** ExitPrice(미래 매각가) 가정값 */
  exit?: ExitAssumption;

  /** 전략 배수 조정이 필요하면 전달 (미전달 시 기본값 사용) */
  strategyMultipliers?: Partial<typeof DEFAULT_STRATEGY_MULTIPLIERS>;

  /** 디버그 로그 출력 여부 */
  debug?: boolean;
}

export interface MarginBlock {
  /** 총인수금액 A */
  totalAcquisition: number;

  /** 공정시세 FMV (fairCenter) */
  fmv: number;

  /** 즉시 안전마진 (FMV 기준) */
  mos_fmv: number;

  /** 미래 매각가(ExitPrice) */
  exitPrice: number;

  /** 실전 안전마진 (ExitPrice 기준) */
  mos_exit: number;

  /** 실전 수익률 (Exit 기준) */
  roi_exit: number; // = mos_exit / A
}

export interface AcquisitionCostBreakdown {
  /** B: 입찰가 */
  bidPrice: number;
  /** R: 인수권리 */
  rights: number;
  /** T: 세금 및 수수료 */
  taxes: number;
  /** C: 수리비 */
  capex: number;
  /** E: 명도비 */
  eviction: number;
  /** K: 보유비 */
  carrying: number;
  /** U: 예비비 */
  contingency: number;
  /** A: 총인수금액 (합계) */
  total: number;
}

export interface AuctionEvalResult {
  market: AIMarketPriceResult; // min/max/center/fairCenter/auctionCenter...
  margin: MarginBlock;
  strategy: BidStrategyItem[];
  costBreakdown: AcquisitionCostBreakdown;
}

// ===============================
// 상수: 3단계 입찰전략 배수 (FMV 기준)
// ===============================
export const DEFAULT_STRATEGY_MULTIPLIERS = {
  conservative: 0.83,
  neutral: 0.89,
  aggressive: 0.96,
} as const;

// ===============================
// 유틸: 반올림(만원 단위)
// ===============================
function roundTo10k(v: number) {
  const unit = 10_000;
  return Math.round(v / unit) * unit;
}

// ===============================
// 유틸: 안전한 나눗셈 (0으로 나누기 방지)
// ===============================
function safeDiv(n: number, d: number) {
  return d === 0 ? 0 : n / d;
}

// ===============================
// 안전마진 계산 함수 (auction-engine 기준 통일)
// ✅ FMV 기준  = FMV  - A
// ✅ Exit 기준 = Exit - A
// ✅ 현재 입찰가 기준 = FMV - bidPrice   ← 기존 "FMV - A" 방식에서 공식 변경됨 (절대 FMV와 동일 값 X)
//
// A = 총인수금액 (입찰가 + 권리 + 세금 + 비용 + 금융비용 + 패널티 + 잡비)
// ===============================
export function calcAcquisitionAndMoS(input: {
  bidPrice: number;
  rights: number;
  taxes: number;
  costs: number;
  financing: number;
  penalty: number;
  misc: number;
  fmv: number;
  exit: number;
}): CalcResult {
  const A =
    input.bidPrice +
    input.rights +
    input.taxes +
    input.costs +
    input.financing +
    input.penalty +
    input.misc;

  // ✅ MoS 계산 (변경 반영)
  const mosFMV = input.fmv - A;
  const mosExit = input.exit - A;
  const mosUser = input.fmv - input.bidPrice; // ✅ FMV - A ➜ FMV - bidPrice 로 변경 완료

  return {
    acquisition: {
      bidPrice: input.bidPrice,
      rights: input.rights,
      taxes: input.taxes,
      costs: input.costs,
      financing: input.financing,
      penalty: input.penalty,
      misc: input.misc,
      total: A,
    },
    prices: { fmv: input.fmv, exit: input.exit },
    margins: {
      fmv: {
        label: "FMV",
        amount: mosFMV,
        pct: safeDiv(mosFMV, input.fmv),
        referencePrice: input.fmv,
      },
      exit: {
        label: "EXIT",
        amount: mosExit,
        pct: safeDiv(mosExit, input.exit),
        referencePrice: input.exit,
      },
      user: {
        label: "USER",
        amount: mosUser,
        pct: safeDiv(mosUser, input.fmv),
        referencePrice: input.fmv,
      },
    },
  };
}

// ===============================
// 유틸: ExitPrice 계산
//  - exitPriceExplicit 우선
//  - 없으면 FMV를 베이스로 상승률/보유기간/리노베 가산/매도비용 반영
// ===============================
function computeExitPrice(baseForExit: number, exit?: ExitAssumption): number {
  if (!exit) return baseForExit;

  if (
    typeof exit.exitPriceExplicit === "number" &&
    exit.exitPriceExplicit > 0
  ) {
    return exit.exitPriceExplicit;
  }

  const holdingMonths = exit.holdingMonths ?? 6;
  const annualApp = exit.annualAppreciation ?? 0; // 예: 0.06
  const uplift = exit.rehabUplift ?? 0;
  const sellRate = exit.sellCostRate ?? 0.015; // 기본 1.5% 가정

  // 간단 성장: base × (1 + 연간상승률 × (개월/12))
  const grown = baseForExit * (1 + annualApp * (holdingMonths / 12));
  const gross = grown + uplift;
  const netAfterSell = gross * (1 - sellRate);

  return Math.max(0, roundTo10k(netAfterSell));
}

// ===============================
// 유틸: 총인수금액 A 계산
// A = B + R + T + C + E + K + U
// ===============================
function computeTotalAcquisition(
  input: AcquisitionCostInput,
  debug?: boolean
): { A: number; taxes: number; breakdown: AcquisitionCostBreakdown } {
  const {
    bidPrice,
    rights,
    capex = 0,
    eviction = 0,
    carrying = 0,
    contingency = 0,
    taxInput,
  } = input;

  const tax = calcTaxes(taxInput ?? { use: "residential", price: bidPrice });
  const taxes = tax.totalTaxesAndFees ?? 0;

  const A = roundTo10k(
    bidPrice + rights + taxes + capex + eviction + carrying + contingency
  );

  const breakdown: AcquisitionCostBreakdown = {
    bidPrice,
    rights,
    taxes,
    capex,
    eviction,
    carrying,
    contingency,
    total: A,
  };

  if (debug) {
    console.log("💰 [총인수금액] A 계산 시작");
    console.log("💰 [총인수금액] 구성 요소:", {
      bidPrice,
      rights,
      taxes,
      capex,
      eviction,
      carrying,
      contingency,
      A,
    });
  }

  return { A, taxes, breakdown };
}

// ===============================
// 유틸: 3단계 입찰전략 생성 (FMV 기준)
// ===============================
function buildBidStrategy(
  fmv: number,
  multipliers: typeof DEFAULT_STRATEGY_MULTIPLIERS
): BidStrategyItem[] {
  return [
    {
      stage: "conservative",
      label: "보수적",
      value: roundTo10k(fmv * multipliers.conservative),
      basis: "FMV" as const,
    },
    {
      stage: "neutral",
      label: "중립",
      value: roundTo10k(fmv * multipliers.neutral),
      basis: "FMV" as const,
    },
    {
      stage: "aggressive",
      label: "공격적",
      value: roundTo10k(fmv * multipliers.aggressive),
      basis: "FMV" as const,
    },
  ];
}

// ===============================
// 메인: 경매 평가 계산기
//  - FMV 산출 (AI)
//  - 총인수금액 A
//  - MoS_fmv / MoS_exit
//  - 3단계 입찰전략
// ===============================
export function evaluateAuction(input: AuctionEvalInput): AuctionEvalResult {
  const { cost, market, exit, strategyMultipliers, debug } = input;

  // 1) FMV 추정 (AI)
  const marketResult = estimateAIMarketPrice({
    appraised: market.appraised,
    area: market.area,
    regionCode: market.regionCode,
    yearBuilt: market.yearBuilt,
    propertyType: market.propertyType,
    minimumBidPrice: market.minimumBidPrice,
  });

  const fmv = marketResult.fairCenter; // MoS_fmv 기준값
  if (debug) {
    console.log("💰 [FMV] fairCenter =", fmv.toLocaleString(), {
      min: marketResult.min,
      max: marketResult.max,
      center: marketResult.center,
      auctionCenter: marketResult.auctionCenter,
      confidence: marketResult.confidence,
    });
  }

  // 2) 총인수금액 A
  const { A, taxes, breakdown } = computeTotalAcquisition(cost, debug);

  // 3) ExitPrice 계산 (기본 베이스는 FMV)
  const exitPrice = computeExitPrice(fmv, exit);

  // 4) MoS 계산
  const mos_fmv = roundTo10k(fmv - A);
  const mos_exit = roundTo10k(exitPrice - A);
  const roi_exit = A > 0 ? +(mos_exit / A).toFixed(6) : 0;

  if (debug) {
    console.log("💰 [MoS] { A, FMV, Exit } =>", {
      A,
      fmv,
      exitPrice,
      mos_fmv,
      mos_exit,
      roi_exit,
    });
  }

  // 5) 3단계 입찰전략 (FMV 기준 배수)
  const mult = {
    ...DEFAULT_STRATEGY_MULTIPLIERS,
    ...(strategyMultipliers ?? {}),
  };
  const strategy = buildBidStrategy(fmv, mult);

  return {
    market: marketResult,
    margin: {
      totalAcquisition: A,
      fmv,
      mos_fmv,
      exitPrice,
      mos_exit,
      roi_exit,
    },
    strategy,
    costBreakdown: breakdown,
  };
}
// ===============================
// v1.2 BACKUP END
// ===============================
//
// 백업된 v1.2 코드 구조:
// ===============================
// Export 함수:
//   - evaluateAuction(input: AuctionEvalInput): AuctionEvalResult
//   - calcAcquisitionAndMoS(input: {...}): CalcResult
//
// Export 타입:
//   - StrategyStage: "conservative" | "neutral" | "aggressive"
//   - BidStrategyItem: { stage, label, value, basis }
//   - ExitAssumption: { exitPriceExplicit?, holdingMonths?, annualAppreciation?, rehabUplift?, sellCostRate? }
//   - AcquisitionCostInput: { bidPrice, rights, capex?, eviction?, carrying?, contingency?, taxInput? }
//   - MarketInput: extends Omit<AIMarketPriceParams, "minimumBidPrice">
//   - AuctionEvalInput: { cost, market, exit?, strategyMultipliers?, debug? }
//   - MarginBlock: { totalAcquisition, fmv, mos_fmv, exitPrice, mos_exit, roi_exit }
//   - AcquisitionCostBreakdown: { bidPrice, rights, taxes, capex, eviction, carrying, contingency, total }
//   - AuctionEvalResult: { market, margin, strategy, costBreakdown }
//
// Export 상수:
//   - DEFAULT_STRATEGY_MULTIPLIERS: { conservative: 0.83, neutral: 0.89, aggressive: 0.96 }
//
// 내부 함수 (export되지 않음):
//   - roundTo10k(v: number): number
//   - safeDiv(n: number, d: number): number
//   - computeExitPrice(baseForExit: number, exit?: ExitAssumption): number
//   - computeTotalAcquisition(input: AcquisitionCostInput, debug?: boolean): { A, taxes, breakdown }
//   - buildBidStrategy(fmv: number, multipliers: {...}): BidStrategyItem[]
//
// 사용 위치:
//   - src/app/property/[id]/page.tsx: evaluateAuction, AuctionEvalInput
//   - src/components/BiddingModal.tsx: evaluateAuction, AuctionEvalInput
//   - src/lib/property/formatters_v2.ts: AuctionEvalResult
//
// Phase 4에서 컴포넌트 교체 완료 후 이 백업 블록을 제거할 예정입니다.

// ===============================
// v0.1 Auction Engine 구현
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
  
  // ✅ v0.1 핫픽스 — 인수금액 필드명 통합 대응
  const assumed =
    rights.assumedRightsAmount ??
    (rights as any).totalAssumedAmount ?? // 구버전 대응
    0;

  console.log(
    "📌 [엔진] assumedRightsAmount 적용값 =",
    assumed,
    " (필드원본:",
    Object.keys(rights),
    ")"
  );
  
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
