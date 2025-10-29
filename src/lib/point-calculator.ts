/**
 * Bid Master AI - 포인트 계산 엔진
 * pointplan_v1.1.md 문서의 포인트 계산 공식 구현
 *
 * 핵심 로그: 포인트 계산 과정의 주요 단계에 로그 추가
 */

import {
  SimulationScenario,
  DifficultyLevel,
  PropertyType,
} from "@/types/simulation";
import { analyzeRights } from "./rights-analysis-engine";

/**
 * 포인트 계산 입력 데이터
 */
export interface PointCalculationInput {
  scenario: SimulationScenario;
  userBidPrice: number;
  winningBidPrice: number;
  isSuccess: boolean; // 낙찰 성공 여부
  roi: number; // 투자수익률 (%)
  rightsAnalysisResult?: {
    totalAssumedAmount: number;
    safetyMargin: number;
    recommendedRange: {
      min: number;
      max: number;
      optimal: number;
    };
  };
}

/**
 * 포인트 계산 결과
 */
export interface PointCalculationResult {
  base: number;
  multipliers: {
    D: number; // 난이도 배수
    S: number; // 희소성 배수
    C: number; // 복잡도 배수
    A: number; // 정확도 배수
    V: number; // 수익률 배수
    R: number; // 낙찰 성공 배수
  };
  bonus: number;
  penalty: number;
  totalPoints: number;
  xp: number; // 획득 XP (포인트와 동일)
}

/**
 * 기본 포인트 계산 (난이도별)
 */
function getBasePoints(difficulty: DifficultyLevel): number {
  const basePoints = {
    초급: 100,
    중급: 200,
    고급: 300,
  };
  return basePoints[difficulty];
}

/**
 * 난이도 배수 계산 (D)
 */
function getDifficultyMultiplier(difficulty: DifficultyLevel): number {
  const multipliers = {
    초급: 1.0,
    중급: 1.5,
    고급: 2.0,
  };
  return multipliers[difficulty];
}

/**
 * 희소성 배수 계산 (S)
 * 매물 유형별 희소성 평가
 */
function getScarcityMultiplier(propertyType: PropertyType): number {
  // 일반적인 매물 유형: 1.0
  // 희귀한 매물 유형: 1.2
  const rareTypes: PropertyType[] = ["상가", "도시형생활주택", "근린주택"];
  return rareTypes.includes(propertyType) ? 1.2 : 1.0;
}

/**
 * 복잡도 배수 계산 (C)
 * 권리 개수에 따른 복잡도 평가
 */
function getComplexityMultiplier(rightsCount: number): number {
  // 권리 개수에 따른 복잡도 배수
  // 0개: 1.0, 1-2개: 1.1, 3-4개: 1.2, 5개 이상: 1.3
  if (rightsCount === 0) return 1.0;
  if (rightsCount <= 2) return 1.1;
  if (rightsCount <= 4) return 1.2;
  return 1.3;
}

/**
 * 정확도 배수 계산 (A)
 * 사용자 입찰가가 권장 입찰가 범위에 얼마나 가까운지 평가
 */
function getAccuracyMultiplier(
  userBidPrice: number,
  recommendedRange: { min: number; max: number; optimal: number } | undefined
): number {
  // recommendedRange가 undefined인 경우 기본값 제공
  if (!recommendedRange) {
    console.log("⚠️ [정확도 배수] 권장 범위가 없어 기본값 사용");
    return 1.0; // 기본 배수
  }

  const { min, max, optimal } = recommendedRange;

  // 최적 입찰가와의 차이 계산
  const distanceFromOptimal = Math.abs(userBidPrice - optimal);
  const range = max - min;
  const normalizedDistance = range > 0 ? distanceFromOptimal / range : 1;

  // 정확도 배수: 0.5 ~ 1.5
  // 최적가에 가까울수록 높은 배수
  if (normalizedDistance <= 0.1) return 1.5; // 최적가 ±10% 이내
  if (normalizedDistance <= 0.2) return 1.3; // 최적가 ±20% 이내
  if (normalizedDistance <= 0.3) return 1.1; // 최적가 ±30% 이내
  if (normalizedDistance <= 0.5) return 1.0; // 최적가 ±50% 이내
  if (normalizedDistance <= 0.7) return 0.8; // 최적가 ±70% 이내
  return 0.5; // 그 외
}

/**
 * 수익률 배수 계산 (V)
 * ROI 기반 배수 계산
 */
function getRoiMultiplier(roi: number): number {
  // ROI가 높을수록 높은 배수
  // 1.0 ~ 1.5 범위
  if (roi >= 20) return 1.5; // ROI 20% 이상
  if (roi >= 15) return 1.4; // ROI 15% 이상
  if (roi >= 10) return 1.3; // ROI 10% 이상
  if (roi >= 5) return 1.2; // ROI 5% 이상
  if (roi >= 0) return 1.1; // ROI 0% 이상
  if (roi >= -5) return 1.0; // ROI -5% 이상
  return 0.9; // ROI -5% 미만
}

/**
 * 낙찰 성공 배수 계산 (R)
 */
function getSuccessMultiplier(isSuccess: boolean): number {
  return isSuccess ? 1.0 : 0.3; // 성공 시 1.0, 실패 시 0.3
}

/**
 * 보너스 포인트 계산
 * 권리분석 정확도 등에 따른 보너스
 */
function calculateBonus(
  scenario: SimulationScenario,
  rightsAnalysisResult: { totalAssumedAmount: number; safetyMargin: number }
): number {
  let bonus = 0;

  // 권리분석 보너스: 복잡한 권리 구조를 정확히 분석한 경우
  if (scenario.rights.length >= 3) {
    bonus += 20; // 복잡한 권리 구조 분석 보너스
  }

  // 임차인 대항력 분석 보너스
  const tenantsWithDaehangryeok = scenario.tenants.filter(
    (t) => t.hasDaehangryeok
  ).length;
  if (tenantsWithDaehangryeok > 0) {
    bonus += 15; // 대항력 있는 임차인 분석 보너스
  }

  return bonus;
}

/**
 * 패널티 계산
 * 최저가 미만 입찰 시 패널티
 */
function calculatePenalty(
  userBidPrice: number,
  minimumBidPrice: number
): number {
  if (userBidPrice < minimumBidPrice) {
    return 50; // 최저가 미만 입찰 시 패널티
  }
  return 0;
}

/**
 * 포인트 계산 메인 함수
 * 공식: P = Base × D × S × C × A × V × R + Bonus − Penalty
 */
export function calculatePoints(
  input: PointCalculationInput
): PointCalculationResult {
  console.log("⭐ [포인트 계산] 포인트 계산 시작");
  console.log(`  - 시나리오 ID: ${input.scenario.id}`);
  console.log(
    `  - 난이도: ${input.scenario.educationalContent?.difficulty || "없음"}`
  );
  console.log(`  - 사용자 입찰가: ${input.userBidPrice.toLocaleString()}원`);
  console.log(`  - 낙찰 성공: ${input.isSuccess ? "예" : "아니오"}`);
  console.log(`  - ROI: ${input.roi.toFixed(2)}%`);

  // 권리분석 결과 가져오기
  const rightsAnalysisResult =
    input.rightsAnalysisResult || analyzeRights(input.scenario);

  const difficulty = input.scenario.educationalContent?.difficulty || "초급";
  const propertyType = input.scenario.basicInfo.propertyType;
  const rightsCount = input.scenario.rights.length;

  // 기본 포인트
  const base = getBasePoints(difficulty);
  console.log(`  - 기본 포인트 (Base): ${base}`);

  // 각 배수 계산
  const D = getDifficultyMultiplier(difficulty);
  const S = getScarcityMultiplier(propertyType);
  const C = getComplexityMultiplier(rightsCount);
  const A = getAccuracyMultiplier(
    input.userBidPrice,
    rightsAnalysisResult.recommendedBidRange
  );
  const V = getRoiMultiplier(input.roi);
  const R = getSuccessMultiplier(input.isSuccess);

  console.log(`  - 난이도 배수 (D): ${D}`);
  console.log(`  - 희소성 배수 (S): ${S}`);
  console.log(`  - 복잡도 배수 (C): ${C}`);
  console.log(`  - 정확도 배수 (A): ${A}`);
  console.log(`  - 수익률 배수 (V): ${V}`);
  console.log(`  - 낙찰 성공 배수 (R): ${R}`);

  // 보너스 및 패널티 계산
  const bonus = calculateBonus(input.scenario, rightsAnalysisResult);
  const penalty = calculatePenalty(
    input.userBidPrice,
    input.scenario.basicInfo.minimumBidPrice
  );

  console.log(`  - 보너스: ${bonus}`);
  console.log(`  - 패널티: ${penalty}`);

  // 최종 포인트 계산
  const totalPoints = Math.round(
    base * D * S * C * A * V * R + bonus - penalty
  );

  // 포인트는 최소 0 이상
  const finalPoints = Math.max(0, totalPoints);
  const xp = finalPoints; // XP는 포인트와 동일

  console.log(`  ✅ 최종 포인트: ${finalPoints} (XP: ${xp})`);

  return {
    base,
    multipliers: { D, S, C, A, V, R },
    bonus,
    penalty,
    totalPoints: finalPoints,
    xp,
  };
}

/**
 * 정확도 계산 함수
 * 사용자 입찰가가 권장 입찰가 범위에 얼마나 가까운지 평가
 * @returns 정확도 (0.0 ~ 1.0)
 */
export function calculateAccuracy(
  userBidPrice: number,
  recommendedRange: { min: number; max: number; optimal: number } | undefined
): number {
  console.log("🎯 [정확도 계산] 정확도 계산 시작");
  console.log(`  - 사용자 입찰가: ${userBidPrice.toLocaleString()}원`);

  // recommendedRange가 undefined인 경우 기본값 제공
  if (!recommendedRange) {
    console.log("⚠️ [정확도 계산] 권장 범위가 없어 기본 정확도 반환");
    return 0.5; // 기본 정확도 50%
  }

  console.log(
    `  - 권장 범위: ${recommendedRange.min.toLocaleString()}원 ~ ${recommendedRange.max.toLocaleString()}원`
  );
  console.log(
    `  - 최적 입찰가: ${recommendedRange.optimal.toLocaleString()}원`
  );

  const { min, max, optimal } = recommendedRange;

  // 범위에 포함되는지 확인
  if (userBidPrice < min || userBidPrice > max) {
    console.log(`  ⚠️ 권장 범위를 벗어남`);
    return 0.0; // 범위 밖이면 0%
  }

  // 최적가와의 거리 계산
  const distanceFromOptimal = Math.abs(userBidPrice - optimal);
  const range = max - min;
  const normalizedDistance = range > 0 ? distanceFromOptimal / range : 1;

  // 정확도 계산: 최적가에 가까울수록 높은 정확도
  // 최적가와의 거리가 0%면 1.0, 50%면 0.5, 100%면 0.0
  const accuracy = Math.max(0, 1 - normalizedDistance * 2);

  console.log(`  ✅ 정확도: ${(accuracy * 100).toFixed(1)}%`);

  return Math.max(0, Math.min(1, accuracy)); // 0.0 ~ 1.0 범위로 제한
}

/**
 * 평균 정확도 계산
 * 여러 시뮬레이션의 정확도를 평균내어 전체 정확도 계산
 */
export function calculateAverageAccuracy(accuracies: number[]): number {
  if (accuracies.length === 0) return 0;

  const sum = accuracies.reduce((a, b) => a + b, 0);
  return sum / accuracies.length;
}

/**
 * 평균 ROI 계산
 * 여러 시뮬레이션의 ROI를 평균내어 전체 ROI 계산
 */
export function calculateAverageRoi(rois: number[]): number {
  if (rois.length === 0) return 0;

  const sum = rois.reduce((a, b) => a + b, 0);
  return sum / rois.length;
}
