import { RightRow } from "@/types/property";

/**
 * 권리인수/리스크 기반 최소 안전마진 및 인수금액 산출
 * @param rights - 해당 매물의 권리 배열
 * @returns { safetyMargin: number, totalAssumedAmount: number }
 */
export function calculateSafetyMargin(rights: RightRow[]) {
  // 소멸되지 않는 권리 유형(=매수인 인수대상)
  const inheritableTypes = [
    "전세권",
    "주택임차권",
    "상가임차권",
    "법정지상권",
    "가처분",
    "유치권",
    "분묘기지권",
  ];
  // 총 인수 금액(=보증금 등 청구액 합산)
  let totalAssumedAmount = rights
    .filter((r) => inheritableTypes.includes(r.type))
    .map((r) => r.claim || 0)
    .reduce((sum, amt) => sum + amt, 0);

  // 위험도 결정(최고등급 1개만 반영, 없으면 low)
  const severityRank = { high: 2, mid: 1, low: 0 };
  let maxSeverity: "high" | "mid" | "low" = "low";
  for (const r of rights) {
    if (
      severityRank[r.severity as keyof typeof severityRank] >
      severityRank[maxSeverity]
    ) {
      maxSeverity = r.severity as "high" | "mid" | "low";
    }
  }
  // 위험도별 마진 배수
  let marginFactor = 1;
  if (maxSeverity === "high") marginFactor = 1.5;
  else if (maxSeverity === "mid") marginFactor = 1.2;
  // low면 1

  // 결과 반환
  return {
    safetyMargin: Math.round(totalAssumedAmount * marginFactor),
    totalAssumedAmount,
  };
}

/**
 * 고도화 계산: 매물유형/위험도/난이도 기반 인수금액·최소 안전마진 산정
 * - 인수대상 권리 합계(assumedAmountRaw)
 * - 유형 가중치(typeFactor), 위험도(riskFactor), 난이도(difficultyFactor)
 * - 유형별 바닥노출(exposureFloor)로 최소 안전마진 강제
 */
export type RiskLevel = "low" | "mid" | "high";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface AdvancedAssumptionInput {
  rights: RightRow[];
  propertyType: string; // 아파트/빌라/단독/다가구/오피스텔/상가/토지/기타
  lowestPrice: number; // 최저매각가격
  riskLevel: RiskLevel;
  difficulty: DifficultyLevel;
}

export interface AdvancedAssumptionResult {
  assumedAmount: number;
  minSafetyMargin: number;
  trace: string[]; // 산출근거 라인
}

export function calculateAdvancedAssumption(
  input: AdvancedAssumptionInput
): AdvancedAssumptionResult {
  const { rights, propertyType, lowestPrice, riskLevel, difficulty } = input;
  console.log("⚖️ [권리분석] 고도화 계산 시작", {
    propertyType,
    lowestPrice,
    riskLevel,
    difficulty,
  });

  // 1) 인수 가능성이 높은 권리 유형 집합 (등기된 임차/전세/지상권/유치권/가처분 등)
  const inheritableTypes = new Set<string>([
    "전세권",
    "주택임차권",
    "상가임차권",
    "법정지상권",
    "유치권",
    "분묘기지권",
    "가처분",
    "소유권이전청구권가등기",
    "담보가등기",
  ]);

  // 2) 인수대상 권리 합계(보수적: claim 합)
  const assumedAmountRaw = rights
    .filter((r) => inheritableTypes.has(r.type))
    .reduce((sum, r) => sum + (r.claim || 0), 0);

  // 3) 유형 가중치
  const typeFactorMap: Record<string, number> = {
    아파트: 1.0,
    빌라: 1.05,
    연립: 1.05,
    단독주택: 1.1,
    다가구: 1.1,
    오피스텔: 1.05,
    상가: 1.15,
    토지: 1.2,
    기타: 1.08,
  };
  const typeFactor = typeFactorMap[propertyType] ?? 1.08;

  // 4) 위험도/난이도 가중치
  const riskFactor = riskLevel === "high" ? 1.25 : riskLevel === "mid" ? 1.1 : 1.0;
  const difficultyFactor =
    difficulty === "beginner" ? 1.2 : difficulty === "intermediate" ? 1.1 : 1.0;

  // 5) 유형별 바닥노출(최저가의 일정 %) — 법원 리스크 실무 관행을 보수적으로 반영
  const exposureFloorRateMap: Record<string, number> = {
    아파트: 0.03,
    빌라: 0.035,
    연립: 0.035,
    단독주택: 0.04,
    다가구: 0.04,
    오피스텔: 0.035,
    상가: 0.05,
    토지: 0.06,
    기타: 0.04,
  };
  const exposureFloorRate = exposureFloorRateMap[propertyType] ?? 0.04;
  const exposureFloor = Math.max(0, Math.floor(lowestPrice * exposureFloorRate));

  // 6) 가중치 적용 및 안전마진 산정
  const assumedAmount = Math.floor(assumedAmountRaw * typeFactor);
  const baseExposure = Math.max(assumedAmount, exposureFloor);
  const minSafetyMarginRaw = baseExposure * riskFactor * difficultyFactor;
  const minSafetyMargin = roundToTenThousands(minSafetyMarginRaw);

  // 7) 산출 근거 트레이스
  const trace: string[] = [
    `인수대상 권리 합계(원): ${assumedAmountRaw.toLocaleString()}`,
    `유형 가중치: ${typeFactor} → 적용 후 ${assumedAmount.toLocaleString()}원`,
    `바닥노출(최저가×${(exposureFloorRate * 100).toFixed(1)}%): ${exposureFloor.toLocaleString()}원`,
    `기준 노출(max): ${baseExposure.toLocaleString()}원`,
    `위험도 가중치: ${riskFactor}, 난이도 가중치: ${difficultyFactor}`,
    `최소 안전마진(반올림 적용): ${minSafetyMargin.toLocaleString()}원`,
  ];

  console.log("⚖️ [권리분석] 고도화 계산 완료", {
    assumedAmount,
    minSafetyMargin,
  });

  return { assumedAmount, minSafetyMargin, trace };
}

function roundToTenThousands(value: number): number {
  // 1만원 단위 반올림
  const unit = 10000;
  return Math.round(value / unit) * unit;
}