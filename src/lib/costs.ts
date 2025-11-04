/**
 * Bid Master AI - Costs 레이어
 * 
 * 목적: 세금·명도·부대비용 산출 후 총인수금액 계산
 * 참조 문서: docs/auction-engine-v0.2.md
 * 작성일: 2025-01-XX
 */

import {
  ACQ_TAX_RATE_BY_TYPE,
  EDU_TAX_RATE,
  SPC_TAX_RATE,
  BASE_EVICTION_BY_TYPE,
  BASE_MISC_COST,
  RISK_EVICTION_ADD,
  RISK_MISC_ADD,
} from "@/lib/constants.auction";
import { CostBreakdown, CostInput } from "@/types/auction";


export function calcCosts(input: CostInput): CostBreakdown {
  console.log("💰 [비용계산] 총인수금액 계산 시작", {
    bidPrice: input.bidPrice.toLocaleString(),
    assumedRightsAmount: input.assumedRightsAmount.toLocaleString(),
    propertyType: input.propertyType || "미지정",
    hasOverrides: !!input.overrides,
  });

  const notes: string[] = [];
  const {
    bidPrice,
    assumedRightsAmount,
    propertyType,
    riskFlags = [],
    overrides,
  } = input;

  // 세율 결정
  const baseAcqRate = ACQ_TAX_RATE_BY_TYPE[propertyType];
  if (baseAcqRate === undefined) {
    console.warn("⚠️ [비용계산] 알 수 없는 매물유형 (취득세율)", {
      propertyType,
      availableTypes: Object.keys(ACQ_TAX_RATE_BY_TYPE),
    });
  }
  
  const acqRate =
    overrides?.acquisitionTaxRate ?? baseAcqRate ?? ACQ_TAX_RATE_BY_TYPE["아파트"];
  const eduRate = overrides?.educationTaxRate ?? EDU_TAX_RATE;
  const spcRate = overrides?.specialTaxRate ?? SPC_TAX_RATE;

  console.log("💰 [비용계산] 세율 설정", {
    propertyType,
    acquisitionTaxRate: (acqRate * 100).toFixed(2) + "%",
    educationTaxRate: (eduRate * 100).toFixed(2) + "%",
    specialTaxRate: (spcRate * 100).toFixed(2) + "%",
    source: overrides?.acquisitionTaxRate ? "overrides" : baseAcqRate ? "유형별 기본값" : "기본값(아파트)",
  });

  // 세금 계산
  const acquisitionTax = Math.round(bidPrice * acqRate);
  const educationTax = Math.round(bidPrice * eduRate);
  const specialTax = Math.round(bidPrice * spcRate);
  const totalTax = acquisitionTax + educationTax + specialTax;

  console.log("💰 [비용계산] 세금 계산 완료", {
    acquisitionTax: acquisitionTax.toLocaleString(),
    educationTax: educationTax.toLocaleString(),
    specialTax: specialTax.toLocaleString(),
    totalTax: totalTax.toLocaleString(),
  });

  // 기본 명도비 및 기타비용
  const baseEvictionForType = BASE_EVICTION_BY_TYPE[propertyType];
  if (baseEvictionForType === undefined) {
    console.warn("⚠️ [비용계산] 알 수 없는 매물유형", {
      propertyType,
      availableTypes: Object.keys(BASE_EVICTION_BY_TYPE),
    });
  }
  
  let evictionCost =
    overrides?.evictionCost ?? baseEvictionForType ?? BASE_EVICTION_BY_TYPE["아파트"]; // 기본값으로 아파트 사용
  let miscCost = overrides?.miscCost ?? BASE_MISC_COST;

  console.log("💰 [비용계산] 명도비 설정", {
    propertyType,
    baseEviction: (baseEvictionForType ?? BASE_EVICTION_BY_TYPE["아파트"]).toLocaleString(),
    appliedEviction: evictionCost.toLocaleString(),
    source: overrides?.evictionCost ? "overrides" : baseEvictionForType ? "유형별 기본값" : "기본값(아파트)",
  });

  console.log("💰 [비용계산] 기타비용 설정", {
    baseMisc: BASE_MISC_COST.toLocaleString(),
    appliedMisc: miscCost.toLocaleString(),
    source: overrides?.miscCost ? "overrides" : "기본값",
  });

  // 위험 가산 비용 적용
  const evictionAdds: string[] = [];
  const miscAdds: string[] = [];

  for (const flag of riskFlags) {
    const evictionAdd = RISK_EVICTION_ADD[flag] ?? 0;
    const miscAdd = RISK_MISC_ADD[flag] ?? 0;

    if (evictionAdd > 0) {
      evictionCost += evictionAdd;
      evictionAdds.push(`${flag}: +${evictionAdd.toLocaleString()}원`);
    }

    if (miscAdd > 0) {
      miscCost += miscAdd;
      miscAdds.push(`${flag}: +${miscAdd.toLocaleString()}원`);
    }
  }

  if (evictionAdds.length > 0 || miscAdds.length > 0) {
    const baseEvictionForCalc = overrides?.evictionCost ?? baseEvictionForType ?? BASE_EVICTION_BY_TYPE["아파트"];
    console.log("💰 [비용계산] 위험 가산 비용 적용", {
      riskFlags,
      evictionAdds,
      miscAdds,
      totalEvictionAdd: evictionCost - baseEvictionForCalc,
      totalMiscAdd: miscCost - (overrides?.miscCost ?? BASE_MISC_COST),
    });
  }

  // 총인수금액 계산
  const totalAcquisition =
    bidPrice + assumedRightsAmount + totalTax + evictionCost + miscCost;

  console.log("💰 [비용계산] 총인수금액 계산", {
    bidPrice: bidPrice.toLocaleString(),
    assumedRightsAmount: assumedRightsAmount.toLocaleString(),
    totalTax: totalTax.toLocaleString(),
    evictionCost: evictionCost.toLocaleString(),
    miscCost: miscCost.toLocaleString(),
    totalAcquisition: totalAcquisition.toLocaleString(),
  });

  notes.push(
    `세율: 취득 ${(
      acqRate * 100
    ).toFixed(2)}%, 교육 ${(eduRate * 100).toFixed(2)}%, 농특 ${(spcRate * 100).toFixed(2)}%`
  );

  if (evictionAdds.length > 0) {
    notes.push(`명도비 위험 가산: ${evictionAdds.join(", ")}`);
  }
  if (miscAdds.length > 0) {
    notes.push(`기타비용 위험 가산: ${miscAdds.join(", ")}`);
  }

  const result: CostBreakdown = {
    taxes: {
      acquisitionTax,
      educationTax,
      specialTax,
      totalTax,
    },
    evictionCost,
    miscCost,
    totalAcquisition,
    notes,
  };

  console.log("💰 [비용계산] 계산 완료", {
    totalAcquisition: result.totalAcquisition.toLocaleString(),
    breakdown: {
      bidPrice: bidPrice.toLocaleString(),
      rights: assumedRightsAmount.toLocaleString(),
      taxes: totalTax.toLocaleString(),
      eviction: evictionCost.toLocaleString(),
      misc: miscCost.toLocaleString(),
    },
  });

  return result;
}

