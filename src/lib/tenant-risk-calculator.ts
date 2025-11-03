// src/lib/tenant-risk-calculator.ts
// 점유 리스크 계산 엔진

import type { TenantRecord, RightRecord } from "@/types/simulation";

export interface TenantRiskInput {
  tenants: TenantRecord[];
  malsoBaseRight: RightRecord | null;
  dividendDeadline: string;
  bidFailCount?: number; // 유찰 횟수
  propertyArea?: number; // 면적 (평 또는 m²)
  totalDeposit?: number; // 총 보증금
  expectedDividend?: number; // 예상 배당금
}

export interface TenantRiskResult {
  riskScore: number; // 0~100 점수
  riskLabel: "낮음" | "중간" | "높음";
  evictionCostMin: number; // 명도비용 최저 (원)
  evictionCostMax: number; // 명도비용 최고 (원)
  hasDividendRequest: boolean; // 배당요구 여부
  assumedTenants: number; // 인수 대상 임차인 수
  details: {
    confirmationScore: number; // 확정일자 점수 (0~25)
    moveInScore: number; // 전입일시 점수 (0~25)
    dividendScore: number; // 배당요구 점수 (0~20)
    precedentScore: number; // 판례 리스크 점수 (0~15)
    persistenceScore: number; // 점유 지속 가능성 점수 (0~15)
  };
}

/**
 * 점유 리스크 점수를 계산합니다.
 * 공식:
 * - 확정일자여부 × 0.25
 * - 전입일시 선순위 여부 × 0.25
 * - 배당요구 여부 × 0.20
 * - 최근 판례 리스크 계수 × 0.15
 * - 유찰 횟수 기반 점유 지속 가능성 × 0.15
 */
export function calculateTenantRiskScore(
  input: TenantRiskInput
): TenantRiskResult {
  console.log("⚠️ [점유 리스크] 점수 계산 시작", {
    tenantsCount: input.tenants.length,
    bidFailCount: input.bidFailCount || 0,
  });

  const { tenants, malsoBaseRight, dividendDeadline, bidFailCount = 0 } = input;

  // 1. 확정일자 여부 점수 (0~25)
  // 인수 대상 임차인 중 확정일자가 있는 비율에 따라 점수 결정
  const assumedTenants = tenants.filter((t) => {
    if (!malsoBaseRight) return false;
    const moveInBeforeMalso = t.moveInDate < malsoBaseRight.registrationDate;
    const confirmationBeforeDeadline =
      t.confirmationDate !== null && t.confirmationDate <= dividendDeadline;
    return moveInBeforeMalso && confirmationBeforeDeadline;
  });

  const hasConfirmationCount = assumedTenants.filter(
    (t) => t.confirmationDate !== null
  ).length;
  const confirmationRatio =
    assumedTenants.length > 0
      ? hasConfirmationCount / assumedTenants.length
      : 0;
  const confirmationScore = Math.round(confirmationRatio * 25);

  // 2. 전입일시 선순위 여부 점수 (0~25)
  // 말소기준권리 설정일보다 전입일이 빠른 임차인 비율
  const moveInBeforeMalsoCount = tenants.filter((t) => {
    if (!malsoBaseRight) return false;
    return t.moveInDate < malsoBaseRight.registrationDate;
  }).length;
  const moveInRatio =
    tenants.length > 0 ? moveInBeforeMalsoCount / tenants.length : 0;
  const moveInScore = Math.round(moveInRatio * 25);

  // 3. 배당요구 여부 점수 (0~20)
  // 인수 대상 임차인이 배당요구를 했는지 여부
  // 실제로는 배당요구 여부를 데이터에서 가져와야 하지만, 여기서는 간단히 처리
  // 보증금 > 배당금인 경우 위험으로 간주
  const hasDividendRequest =
    input.totalDeposit && input.expectedDividend
      ? input.totalDeposit > input.expectedDividend
      : false;
  const dividendScore = hasDividendRequest ? 20 : 0;

  // 4. 판례 리스크 계수 점수 (0~15)
  // 보증금 > 배당금인 경우 +20% 추가 위험 (점수로는 +3점)
  let precedentScore = 0;
  if (hasDividendRequest) {
    precedentScore = 15; // 최대 점수
  } else if (assumedTenants.length > 0) {
    // 인수 대상이 있으면 기본 점수 부여
    precedentScore = 8;
  }

  // 5. 유찰 횟수 기반 점유 지속 가능성 점수 (0~15)
  // 유찰 횟수가 많을수록 점유가 지속될 가능성이 높음
  const persistenceScore = Math.min(bidFailCount * 3, 15);

  // 총점 계산
  const totalScore = Math.min(
    100,
    confirmationScore +
      moveInScore +
      dividendScore +
      precedentScore +
      persistenceScore
  );

  // 라벨 결정
  let riskLabel: "낮음" | "중간" | "높음";
  if (totalScore < 40) {
    riskLabel = "낮음";
  } else if (totalScore < 70) {
    riskLabel = "중간";
  } else {
    riskLabel = "높음";
  }

  // 명도비용 계산 (리스크 점수를 먼저 계산했으므로 재귀 호출 방지)
  const evictionCostMin = estimateEvictionCost(input, "min", totalScore);
  const evictionCostMax = estimateEvictionCost(input, "max", totalScore);

  console.log("⚠️ [점유 리스크] 점수 계산 완료", {
    totalScore,
    riskLabel,
    evictionCostMin,
    evictionCostMax,
    details: {
      confirmationScore,
      moveInScore,
      dividendScore,
      precedentScore,
      persistenceScore,
    },
  });

  return {
    riskScore: totalScore,
    riskLabel,
    evictionCostMin,
    evictionCostMax,
    hasDividendRequest,
    assumedTenants: assumedTenants.length,
    details: {
      confirmationScore,
      moveInScore,
      dividendScore,
      precedentScore,
      persistenceScore,
    },
  };
}

/**
 * 명도비용을 추정합니다.
 * 면적, 임차인 수 등을 기반으로 200만~800만원 구간으로 예측합니다.
 */
export function estimateEvictionCost(
  input: TenantRiskInput,
  type: "min" | "max" | "average" = "average",
  riskScore?: number
): number {
  // 리스크 점수가 제공되지 않으면 계산
  const calculatedRiskScore =
    riskScore !== undefined
      ? riskScore
      : calculateTenantRiskScore(input).riskScore;

  // 기본 명도비용 (200만원)
  const baseCost = 2_000_000;

  // 면적 보정 (평당 10만원 추가)
  const areaPyeong = input.propertyArea || 0;
  const areaCost = areaPyeong * 100_000;

  // 임차인 수 보정 (1명당 50만원 추가)
  const tenantCount = input.tenants.length;
  const tenantCost = tenantCount * 500_000;

  // 리스크 점수 보정 (점수가 높을수록 명도 난이도 증가)
  const riskMultiplier = 1 + calculatedRiskScore / 100; // 1.0 ~ 2.0

  // 총 비용 계산
  const totalCost = (baseCost + areaCost + tenantCost) * riskMultiplier;

  // 최소/최대 범위로 조정 (200만~800만원)
  const minCost = 2_000_000;
  const maxCost = 8_000_000;

  if (type === "min") {
    return Math.max(minCost, Math.floor(totalCost * 0.6));
  } else if (type === "max") {
    return Math.min(maxCost, Math.floor(totalCost * 1.4));
  } else {
    return Math.max(minCost, Math.min(maxCost, Math.floor(totalCost)));
  }
}
