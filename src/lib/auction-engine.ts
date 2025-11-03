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
