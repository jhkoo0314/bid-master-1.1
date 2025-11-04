/**
 * Bid Master AI - Profit 레이어
 * 
 * 목적: FMV/Exit 기준 안전마진, 손익분기점 등 수익성 평가
 * 참조 문서: docs/auction-engine-v0.1.md
 * 작성일: 2025-01-XX
 */

import { ProfitInput, ProfitResult } from "@/types/auction";

/**
 * v0.1:
 * - marginVsFMV  = FMV  - 총인수금액
 * - marginVsExit = Exit - 총인수금액 (Exit 없으면 FMV 사용)
 * - bePoint = 총인수금액 (손익분기점 가격)
 */
export function evaluateProfit(input: ProfitInput): ProfitResult {
  console.log("📊 [수익분석] 수익 분석 시작", {
    fmv: input.fmv.toLocaleString(),
    totalAcquisition: input.totalAcquisition.toLocaleString(),
    bidPrice: input.bidPrice.toLocaleString(),
    hasExitPrice: !!input.exitPrice,
    exitPrice: input.exitPrice?.toLocaleString(),
  });

  const { fmv, totalAcquisition } = input;
  const exit = input.exitPrice ?? fmv;

  console.log("📊 [수익분석] 기준 가격 설정", {
    fmv: fmv.toLocaleString(),
    exit: exit.toLocaleString(),
    totalAcquisition: totalAcquisition.toLocaleString(),
    usingExitPrice: !!input.exitPrice,
  });

  // FMV 기준 마진 계산
  const marginVsFMV = Math.round(fmv - totalAcquisition);
  const marginRateVsFMV = fmv > 0 ? marginVsFMV / fmv : 0;

  console.log("📊 [수익분석] FMV 기준 마진 계산", {
    marginVsFMV: marginVsFMV.toLocaleString(),
    marginRateVsFMV: (marginRateVsFMV * 100).toFixed(2) + "%",
    isPositive: marginVsFMV > 0,
  });

  // Exit 기준 마진 계산
  const marginVsExit = Math.round(exit - totalAcquisition);
  const marginRateVsExit = exit > 0 ? marginVsExit / exit : 0;

  console.log("📊 [수익분석] Exit 기준 마진 계산", {
    marginVsExit: marginVsExit.toLocaleString(),
    marginRateVsExit: (marginRateVsExit * 100).toFixed(2) + "%",
    isPositive: marginVsExit > 0,
  });

  // 손익분기점 계산
  const bePoint = totalAcquisition;

  console.log("📊 [수익분석] 손익분기점 계산", {
    bePoint: bePoint.toLocaleString(),
    note: "최소한 이 가격에 매도해야 손해 없음",
  });

  const result: ProfitResult = {
    marginVsFMV,
    marginRateVsFMV,
    marginVsExit,
    marginRateVsExit,
    bePoint,
    notes: [
      `손익분기점(매도기준): ${bePoint.toLocaleString()}원`,
      `FMV 대비 마진: ${marginVsFMV.toLocaleString()}원 (${(marginRateVsFMV * 100).toFixed(2)}%)`,
      `Exit 대비 마진: ${marginVsExit.toLocaleString()}원 (${(marginRateVsExit * 100).toFixed(2)}%)`,
    ],
  };

  console.log("📊 [수익분석] 수익 분석 완료", {
    marginVsFMV: result.marginVsFMV.toLocaleString(),
    marginRateVsFMV: (result.marginRateVsFMV * 100).toFixed(2) + "%",
    marginVsExit: result.marginVsExit.toLocaleString(),
    marginRateVsExit: (result.marginRateVsExit * 100).toFixed(2) + "%",
    bePoint: result.bePoint.toLocaleString(),
    isPositiveMargin: result.marginVsFMV > 0,
  });

  return result;
}

