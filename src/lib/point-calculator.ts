/**
 * Bid Master AI - 포인트 계산 엔진
 * pointplan_v1.2.md 문서의 포인트 계산 규정 구현
 *
 * 핵심 로그: 포인트 계산 과정의 주요 단계에 로그 추가
 */

import {
  SimulationScenario,
  DifficultyLevel,
  PropertyType,
} from "@/types/simulation";
import { auctionEngine } from "./auction-engine";
import {
  mapSimulationToSnapshot,
  mapEngineOutputToRightsAnalysisResult,
} from "./auction/mappers";

/**
 * 포인트 계산 입력 데이터
 */
export interface PointCalculationInput {
  scenario: SimulationScenario;
  userBidPrice: number;
  winningBidPrice: number;
  isSuccess: boolean; // 낙찰 성공 여부
  roi: number; // 투자수익률 (%)
  hasResponded?: boolean; // 응답 여부 (기본값: true)
  riskNoteLength?: number; // 리스크 노트 길이 (자수)
  sessionParticipants?: number; // 세션 참여자 수 (상위 20% 계산용)
  userRank?: number; // 사용자 순위 (상위 20% 계산용)
  rightsAnalysisResult?: {
    recommendedRange: {
      min: number;
      max: number;
      optimal: number;
    };
  };
}

/**
 * 포인트 계산 결과 (v1.2 규정)
 */
export interface PointCalculationResult {
  basePoints: number; // 원점수 (난이도 계수 적용 전)
  difficultyMultiplier: number; // 난이도 계수 k∈{0.8, 1.0, 1.2}
  breakdown: {
    roundParticipation: number; // 라운드 참여: +2pt
    accurateHit: number; // 정답 적중(±3%): +10pt
    closeHit: number; // 근접 적중(±5%): +6pt
    topPerformance: number; // 상위 20% 성과: +4pt
    riskNote: number; // 리스크 노트: +2pt
    noResponse: number; // 무응답: -3pt (차감)
  };
  totalPoints: number; // 최종 포인트 (원점수 × 난이도 계수)
  xp: number; // 획득 XP (포인트와 동일)
}

/**
 * 난이도 계수 계산 (v1.2 규정)
 * k∈{0.8, 1.0, 1.2}
 */
function getDifficultyMultiplier(difficulty: DifficultyLevel): number {
  const multipliers = {
    초급: 0.8,
    중급: 1.0,
    고급: 1.2,
  };
  console.log(`📊 [난이도 계수] ${difficulty}: ${multipliers[difficulty]}`);
  return multipliers[difficulty];
}

/**
 * 정답 적중 여부 계산 (v1.2 규정)
 * 사용자 입찰가가 낙찰가 범위 ±3% 이내인지 확인
 */
function checkAccurateHit(
  userBidPrice: number,
  winningBidPrice: number
): boolean {
  const diff = Math.abs(userBidPrice - winningBidPrice);
  const threshold = winningBidPrice * 0.03; // ±3%
  return diff <= threshold;
}

/**
 * 근접 적중 여부 계산 (v1.2 규정)
 * 사용자 입찰가가 낙찰가 범위 ±5% 이내인지 확인 (±3% 초과)
 */
function checkCloseHit(userBidPrice: number, winningBidPrice: number): boolean {
  const diff = Math.abs(userBidPrice - winningBidPrice);
  const closeThreshold = winningBidPrice * 0.05; // ±5%
  const accurateThreshold = winningBidPrice * 0.03; // ±3%
  return diff > accurateThreshold && diff <= closeThreshold;
}

/**
 * 상위 20% 성과 여부 계산 (v1.2 규정)
 */
function checkTopPerformance(
  userRank?: number,
  sessionParticipants?: number
): boolean {
  if (!userRank || !sessionParticipants) {
    return false; // 정보가 없으면 false
  }
  const top20PercentThreshold = Math.ceil(sessionParticipants * 0.2);
  return userRank <= top20PercentThreshold;
}

/**
 * 포인트 계산 메인 함수 (v1.2 규정)
 * 규정:
 * - 라운드 참여: +2pt
 * - 정답 낙찰가 범위 적중(±3%): +10pt
 * - 근접 적중(±5%): +6pt
 * - 상위 20% 성과(세션 기준): +4pt
 * - 리스크 노트 제출(200자 이상): +2pt
 * - 무응답: −3pt
 * - 난이도 계수 k∈{0.8, 1.0, 1.2}: 최종 포인트 = 원점수 × k
 */
export function calculatePoints(
  input: PointCalculationInput
): PointCalculationResult {
  console.log("⭐ [포인트 계산] 포인트 계산 시작 (v1.2 규정)");
  console.log(`  - 시나리오 ID: ${input.scenario.id}`);
  console.log(
    `  - 난이도: ${input.scenario.educationalContent?.difficulty || "없음"}`
  );
  console.log(`  - 사용자 입찰가: ${input.userBidPrice.toLocaleString()}원`);
  console.log(`  - 낙찰가: ${input.winningBidPrice.toLocaleString()}원`);
  console.log(`  - 낙찰 성공: ${input.isSuccess ? "예" : "아니오"}`);

  // recommendedRange가 없으면 새 엔진으로 생성
  let recommendedRange = input.rightsAnalysisResult?.recommendedRange;
  if (!recommendedRange) {
    console.log("🔄 [매핑] 권장 입찰가 범위 생성 중...");
    const snapshot = mapSimulationToSnapshot(input.scenario);
    const engineOutput = auctionEngine({
      snapshot,
      userBidPrice: input.userBidPrice,
      options: { devMode: false },
    });
    const rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(
      engineOutput,
      input.scenario
    );
    recommendedRange = rightsAnalysisResult.recommendedBidRange;
    console.log("🔄 [매핑] 권장 입찰가 범위 생성 완료:", {
      min: recommendedRange?.min,
      max: recommendedRange?.max,
      optimal: recommendedRange?.optimal,
    });
  }

  const difficulty = input.scenario.educationalContent?.difficulty || "초급";
  const hasResponded = input.hasResponded ?? true; // 기본값: true
  const riskNoteLength = input.riskNoteLength || 0;

  // 원점수 계산 (난이도 계수 적용 전)
  let basePoints = 0;
  const breakdown = {
    roundParticipation: 0,
    accurateHit: 0,
    closeHit: 0,
    topPerformance: 0,
    riskNote: 0,
    noResponse: 0,
  };

  // 1. 라운드 참여: +2pt
  if (hasResponded) {
    breakdown.roundParticipation = 2;
    basePoints += 2;
    console.log("  ✅ 라운드 참여: +2pt");
  } else {
    // 무응답: -3pt
    breakdown.noResponse = -3;
    basePoints -= 3;
    console.log("  ❌ 무응답: -3pt");
  }

  // 2. 정답 적중 확인 (±3%)
  if (
    hasResponded &&
    checkAccurateHit(input.userBidPrice, input.winningBidPrice)
  ) {
    breakdown.accurateHit = 10;
    basePoints += 10;
    console.log("  🎯 정답 적중(±3%): +10pt");
  } else if (
    hasResponded &&
    checkCloseHit(input.userBidPrice, input.winningBidPrice)
  ) {
    // 3. 근접 적중 확인 (±5%, ±3% 초과)
    breakdown.closeHit = 6;
    basePoints += 6;
    console.log("  🎯 근접 적중(±5%): +6pt");
  }

  // 4. 상위 20% 성과: +4pt
  if (checkTopPerformance(input.userRank, input.sessionParticipants)) {
    breakdown.topPerformance = 4;
    basePoints += 4;
    console.log("  🏆 상위 20% 성과: +4pt");
  }

  // 5. 리스크 노트 제출(200자 이상): +2pt
  if (riskNoteLength >= 200) {
    breakdown.riskNote = 2;
    basePoints += 2;
    console.log(`  📝 리스크 노트(${riskNoteLength}자): +2pt`);
  }

  console.log(`  - 원점수 합계: ${basePoints}pt`);

  // 난이도 계수 적용
  const difficultyMultiplier = getDifficultyMultiplier(difficulty);
  const totalPoints = Math.round(basePoints * difficultyMultiplier);

  // 포인트는 최소 0 이상
  const finalPoints = Math.max(0, totalPoints);
  const xp = finalPoints; // XP는 포인트와 동일

  console.log(
    `  ✅ 최종 포인트: ${finalPoints}pt (원점수 ${basePoints} × 난이도계수 ${difficultyMultiplier})`
  );
  console.log(`  ✅ 획득 XP: ${xp}`);

  return {
    basePoints,
    difficultyMultiplier,
    breakdown,
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

/**
 * 레벨 계산 함수 (v1.2 규정)
 * L1(0–199), L2(200–499), L3(500–999), L4(1000–1999), L5(2000+)
 * @param totalPoints 누적 포인트
 * @returns 레벨 정보
 */
export interface LevelInfo {
  level: number; // 현재 레벨 (L1~L5)
  currentPoints: number; // 현재 포인트
  minPoints: number; // 현재 레벨 최소 포인트
  maxPoints: number; // 현재 레벨 최대 포인트
  nextLevelPoints: number; // 다음 레벨까지 필요한 포인트
  progressPercent: number; // 레벨 진행률 (%)
}

export function updateLevel(totalPoints: number): LevelInfo {
  console.log("📊 [레벨 계산] 레벨 계산 시작");
  console.log(`  - 누적 포인트: ${totalPoints}pt`);

  // 레벨 기준 정의 (v1.2 규정)
  const levelRanges = [
    { level: 1, min: 0, max: 199 },
    { level: 2, min: 200, max: 499 },
    { level: 3, min: 500, max: 999 },
    { level: 4, min: 1000, max: 1999 },
    { level: 5, min: 2000, max: Infinity },
  ];

  // 현재 레벨 찾기
  let currentLevelInfo = levelRanges[0];
  for (const range of levelRanges) {
    if (totalPoints >= range.min && totalPoints <= range.max) {
      currentLevelInfo = range;
      break;
    }
  }

  const { level, min, max } = currentLevelInfo;
  const progressPercent =
    max === Infinity ? 100 : ((totalPoints - min) / (max - min + 1)) * 100;

  // 다음 레벨까지 필요한 포인트
  let nextLevelPoints = 0;
  const currentIndex = levelRanges.findIndex((r) => r.level === level);
  if (currentIndex < levelRanges.length - 1) {
    const nextLevel = levelRanges[currentIndex + 1];
    nextLevelPoints = Math.max(0, nextLevel.min - totalPoints);
  }

  const levelInfo: LevelInfo = {
    level,
    currentPoints: totalPoints,
    minPoints: min,
    maxPoints: max === Infinity ? totalPoints : max,
    nextLevelPoints,
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
  };

  console.log(`  ✅ 현재 레벨: L${level} (${min}~${max}pt)`);
  console.log(`  - 진행률: ${progressPercent.toFixed(1)}%`);
  if (nextLevelPoints > 0) {
    console.log(`  - 다음 레벨까지: ${nextLevelPoints}pt`);
  } else {
    console.log(`  - 최고 레벨 도달!`);
  }

  return levelInfo;
}
