/**
 * Bid Master AI - Valuation 레이어
 * 
 * 목적: FMV(공정시세), 감정가, 최저가 산출
 * 참조 문서: docs/auction-engine-v0.1.md
 * 작성일: 2025-01-XX
 */

import { ValuationInput, ValuationResult } from "@/types/auction";

/**
 * v0.1 규칙:
 * - appraisal, minBid 둘 다 없으면 fmvHint 또는 기본 FMV로 역산
 * - appraisal만 있으면 minBid = appraisal * 0.8
 * - minBid만 있으면 appraisal = minBid / 0.8
 * - FMV 없으면 appraisal 기반 κ=0.91로 산정(교육 목적상 보수적)
 * - marketSignals(1.0 기준)의 평균값으로 최종 FMV를 소폭 보정(±10% 캡)
 */
export function estimateValuation(input: ValuationInput): ValuationResult {
  console.log("📐 [Valuation] FMV/감정가/최저가 계산 시작", {
    hasAppraisal: !!input.appraisal,
    hasMinBid: !!input.minBid,
    hasFmvHint: !!input.fmvHint,
    hasMarketSignals: !!input.marketSignals && Object.keys(input.marketSignals).length > 0,
  });

  const notes: string[] = [];
  const kFromAppraisal = 0.91;
  const fallbackFMV = 500_000_000;

  let appraisal = input.appraisal;
  let minBid = input.minBid;
  let fmv = input.fmvHint;

  if (!appraisal && !minBid) {
    if (!fmv) {
      fmv = fallbackFMV;
      notes.push("FMV 힌트 부재 → 교육용 기본 FMV 사용");
      console.log("📐 [Valuation] FMV 힌트 부재 → 교육용 기본 FMV 사용:", fallbackFMV.toLocaleString());
    }
    appraisal = Math.round((fmv as number) / kFromAppraisal);
    minBid = Math.round(appraisal * 0.8);
    notes.push("감정가/최저가 부재 → FMV로 역산(appraisal, minBid)");
    console.log("📐 [Valuation] 감정가/최저가 역산 완료", {
      fmv: (fmv as number).toLocaleString(),
      appraisal: appraisal.toLocaleString(),
      minBid: minBid.toLocaleString(),
    });
  } else if (appraisal && !minBid) {
    minBid = Math.round(appraisal * 0.8);
    notes.push("최저가 부재 → 감정가×0.8로 산출");
    console.log("📐 [Valuation] 최저가 계산 완료", {
      appraisal: appraisal.toLocaleString(),
      minBid: minBid.toLocaleString(),
    });
  } else if (!appraisal && minBid) {
    appraisal = Math.round(minBid / 0.8);
    notes.push("감정가 부재 → 최저가/0.8로 산출");
    console.log("📐 [Valuation] 감정가 역산 완료", {
      minBid: minBid.toLocaleString(),
      appraisal: appraisal.toLocaleString(),
    });
  }

  if (!fmv) {
    // 이 시점에서 appraisal과 minBid는 항상 값이 있음 (위의 if-else에서 보장됨)
    const appraisalValue = appraisal as number;
    fmv = Math.round(appraisalValue * kFromAppraisal);
    notes.push("FMV 부재 → 감정가 기반 κ=0.91 적용");
    console.log("📐 [Valuation] FMV 계산 완료 (κ=0.91)", {
      appraisal: appraisalValue.toLocaleString(),
      fmv: fmv.toLocaleString(),
    });
  }

  // marketSignals 보정(1.0 기준, ±10% 캡)
  if (input.marketSignals && Object.keys(input.marketSignals).length > 0) {
    const vals = Object.values(input.marketSignals) as number[];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const factor = Math.max(0.9, Math.min(1.1, avg));
    const fmvBefore = fmv as number;
    fmv = Math.round(fmvBefore * factor);
    notes.push(`시장보정 적용(factor=${factor.toFixed(3)})`);
    console.log("📐 [Valuation] 시장보정 적용", {
      factor: factor.toFixed(3),
      fmvBefore: fmvBefore.toLocaleString(),
      fmvAfter: (fmv as number).toLocaleString(),
      change: ((factor - 1) * 100).toFixed(1) + "%",
    });
  }

  const result: ValuationResult = {
    fmv: fmv as number,
    appraisal: appraisal as number,
    minBid: minBid as number,
    notes,
  };

  console.log("📐 [Valuation] 계산 완료", {
    fmv: result.fmv.toLocaleString(),
    appraisal: result.appraisal.toLocaleString(),
    minBid: result.minBid.toLocaleString(),
    notesCount: result.notes?.length || 0,
  });

  return result;
}

