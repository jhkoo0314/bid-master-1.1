/**
 * Bid Master AI - Costs 레이어
 * 
 * 목적: 세금·명도·부대비용 산출 후 총인수금액 계산
 * 참조 문서: docs/auction-engine-v0.1.md
 * 작성일: 2025-01-XX
 */

import { CostBreakdown, CostInput } from "@/types/auction";

/**
 * v0.1 세율(교육용 기본값):
 * - 취득세율: 주거 1.1% ~ 4.0% 구간이나, 교육 목적으로 기본 1.1% 적용
 * - 교육세/농특세: 단순화하여 각각 취득세의 0.1%/0.2%로 가정(합 0.3%p)
 * - 명도비: 임차 리스크에 따라 3,000,000 ~ 6,000,000 기본 추천(상위에서 전달 권장)
 * - 기타비용: 1,000,000 (법무/등기 등) 기본
 *
 * 실제 세율과 상이할 수 있으므로, 상위에서 overrides로 정확 데이터 주입 권장.
 */

function pickBaseAcqTaxRate(propertyType?: string): number {
  // 간이 구분(추후 정교화 가능)
  if (propertyType === "land" || propertyType === "commercial") return 0.02; // 2.0%
  return 0.011; // 주거 1.1%
}

export function calcCosts(input: CostInput): CostBreakdown {
  console.log("💰 [비용계산] 총인수금액 계산 시작", {
    bidPrice: input.bidPrice.toLocaleString(),
    assumedRightsAmount: input.assumedRightsAmount.toLocaleString(),
    propertyType: input.propertyType || "미지정",
    hasOverrides: !!input.overrides,
  });

  const notes: string[] = [];
  const { bidPrice, assumedRightsAmount, propertyType, overrides } = input;

  // 세율 결정
  const acqRate =
    overrides?.acquisitionTaxRate ?? pickBaseAcqTaxRate(propertyType); // 기본 1.1% or 2.0%
  const eduRate = overrides?.educationTaxRate ?? 0.001;  // 0.1%
  const spcRate = overrides?.specialTaxRate ?? 0.002;    // 0.2%

  console.log("💰 [비용계산] 세율 설정", {
    acquisitionTaxRate: (acqRate * 100).toFixed(2) + "%",
    educationTaxRate: (eduRate * 100).toFixed(2) + "%",
    specialTaxRate: (spcRate * 100).toFixed(2) + "%",
    hasOverrides: !!overrides,
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

  // 명도비 및 기타비용
  const evictionCost = overrides?.evictionCost ?? 3_000_000; // 기본 300만원
  const miscCost = overrides?.miscCost ?? 1_000_000;          // 기본 100만원

  console.log("💰 [비용계산] 부대비용 설정", {
    evictionCost: evictionCost.toLocaleString(),
    miscCost: miscCost.toLocaleString(),
    hasOverrides: !!overrides,
  });

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

