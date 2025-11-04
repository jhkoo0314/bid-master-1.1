/**
 * Bid Master AI - Valuation 레이어
 * 
 * 목적: FMV(공정시세), 감정가, 최저가 산출
 * 참조 문서: docs/auction-engine-v0.2.md
 * 작성일: 2025-01-XX
 */

import { ValuationInput, ValuationResult } from "@/types/auction";
import {
  FMV_KAPPA_BY_TYPE,
  MINBID_ALPHA_DEFAULT,
  PropertyTypeKorean,
} from "./constants.auction";

/**
 * v0.2 규칙:
 * - appraisal, minBid 둘 다 없으면 fmvHint 또는 기본 FMV로 역산
 * - appraisal만 있으면 minBid = appraisal * MINBID_ALPHA_DEFAULT (0.8)
 * - minBid만 있으면 appraisal = minBid / MINBID_ALPHA_DEFAULT (0.8)
 * - FMV 없으면 appraisal 기반 κ로 산정 (propertyType별 κ 값 적용, v0.2)
 * - propertyType이 없으면 기본값 0.90 사용
 * - overrides.kappa가 있으면 우선 적용 (유형별 기본값보다 우선)
 * - marketSignals(1.0 기준)의 평균값으로 최종 FMV를 소폭 보정(±10% 캡)
 */
export function estimateValuation(input: ValuationInput): ValuationResult {
  console.log("📐 [Valuation] FMV/감정가/최저가 계산 시작", {
    hasAppraisal: !!input.appraisal,
    hasMinBid: !!input.minBid,
    hasFmvHint: !!input.fmvHint,
    hasMarketSignals: !!input.marketSignals && Object.keys(input.marketSignals).length > 0,
    propertyType: input.propertyType,
  });

  const notes: string[] = [];
  const fallbackFMV = 500_000_000;

  // κ 값 결정 로직 (우선순위: overrides.kappa > propertyType별 κ > 기본값 0.90)
  const pType: PropertyTypeKorean | undefined = input.propertyType as any;
  const kappa =
    input.overrides?.kappa ?? 
    (pType && FMV_KAPPA_BY_TYPE[pType] !== undefined 
      ? FMV_KAPPA_BY_TYPE[pType] 
      : 0.9);

  console.log("📐 [Valuation] κ 값 결정", {
    propertyType: pType,
    kappa: kappa.toFixed(3),
    source: input.overrides?.kappa
      ? "overrides"
      : pType
      ? "유형별 기본값"
      : "기본값(0.90)",
  });

  let appraisal = input.appraisal;
  let minBid = input.minBid;
  let fmv = input.fmvHint;

  if (!appraisal && !minBid) {
    if (!fmv) {
      fmv = fallbackFMV;
      notes.push("FMV 힌트 부재 → 교육용 기본 FMV 사용");
      console.log("📐 [Valuation] FMV 힌트 부재 → 교육용 기본 FMV 사용:", fallbackFMV.toLocaleString());
    }
    appraisal = Math.round((fmv as number) / kappa);
    minBid = Math.round(appraisal * MINBID_ALPHA_DEFAULT);
    notes.push(`감정가/최저가 부재 → FMV와 κ=${kappa.toFixed(2)}로 역산`);
    console.log("📐 [Valuation] 감정가/최저가 역산 완료", {
      fmv: (fmv as number).toLocaleString(),
      kappa: kappa.toFixed(3),
      appraisal: appraisal.toLocaleString(),
      minBid: minBid.toLocaleString(),
    });
  } else if (appraisal && !minBid) {
    minBid = Math.round(appraisal * MINBID_ALPHA_DEFAULT);
    notes.push(`최저가 부재 → 감정가×${MINBID_ALPHA_DEFAULT}로 산출`);
    console.log("📐 [Valuation] 최저가 계산 완료", {
      appraisal: appraisal.toLocaleString(),
      minBid: minBid.toLocaleString(),
      alpha: MINBID_ALPHA_DEFAULT,
    });
  } else if (!appraisal && minBid) {
    appraisal = Math.round(minBid / MINBID_ALPHA_DEFAULT);
    notes.push(`감정가 부재 → 최저가/${MINBID_ALPHA_DEFAULT}로 산출`);
    console.log("📐 [Valuation] 감정가 역산 완료", {
      minBid: minBid.toLocaleString(),
      appraisal: appraisal.toLocaleString(),
      alpha: MINBID_ALPHA_DEFAULT,
    });
  }

  if (!fmv) {
    // 이 시점에서 appraisal과 minBid는 항상 값이 있음 (위의 if-else에서 보장됨)
    const appraisalValue = appraisal as number;
    fmv = Math.round(appraisalValue * kappa);
    notes.push(`FMV 부재 → 감정가 기반 κ=${kappa.toFixed(2)} 적용`);
    console.log("📐 [Valuation] FMV 계산 완료", {
      appraisal: appraisalValue.toLocaleString(),
      kappa: kappa.toFixed(3),
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
    propertyType: pType,
    kappa: kappa.toFixed(3),
    fmv: result.fmv.toLocaleString(),
    appraisal: result.appraisal.toLocaleString(),
    minBid: result.minBid.toLocaleString(),
    notesCount: result.notes?.length || 0,
  });

  return result;
}

