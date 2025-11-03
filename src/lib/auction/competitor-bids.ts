// competitor-bids.ts (v1.5) - 3단계 전략 분포 적용

export interface CompetitorParams {
  n: number; // 경쟁자 수
  fmv: number; // AI 시장가(FMV)
  appraisal: number; // 감정가
  lowestBid: number; // 최저 입찰가
  userBid: number; // 사용자가 입력한 입찰가
  difficulty?: "easy" | "normal" | "hard";
  overheatScore?: number; // 과열지수 (0~1)
  tick?: number; // 금액 단위 (기본 1,000)
}

function randomInRange(min: number, max: number, tick = 1000): number {
  const raw = Math.random() * (max - min) + min;
  return Math.round(raw / tick) * tick;
}

export function generateCompetitorBids(params: CompetitorParams): number[] {
  const {
    n,
    fmv,
    appraisal,
    lowestBid,
    difficulty = "normal",
    overheatScore = 0,
    tick = 1000,
  } = params;

  if (n <= 0) return [];

  // ✅ 경쟁자 그룹 분배 (상위 1명, 중위 50~60%, 나머지 하위)
  const topCount = 1;
  const midCount = Math.max(1, Math.floor(n * 0.55));
  const lowCount = Math.max(0, n - topCount - midCount);

  // ✅ 난이도에 따라 분포 영향
  const difficultyBoost =
    difficulty === "hard" ? 1.12 : difficulty === "easy" ? 0.9 : 1.0;

  // ✅ 과열 점수 반영 (입찰가 전체 상승 압력)
  const heat = 1 + (overheatScore ?? 0) * 0.25;

  const bids: number[] = [];

  // ✅ (1) 상위 그룹: 공격형 (FMV +5% ~ +15%)
  const topMin = fmv * 1.05 * difficultyBoost * heat;
  const topMax = fmv * 1.15 * difficultyBoost * heat;

  for (let i = 0; i < topCount; i++) {
    bids.push(randomInRange(topMin, topMax, tick));
  }

  // ✅ (2) 중위 그룹: 실제 시장 평균층 (FMV -2% ~ +4%)
  const midMin = fmv * 0.98 * heat;
  const midMax = fmv * 1.04 * heat;

  for (let i = 0; i < midCount; i++) {
    bids.push(randomInRange(midMin, midMax, tick));
  }

  // ✅ (3) 하위 그룹: 보수형 투자자 (최저가 ~ FMV -8%)
  const lowMin = lowestBid;
  const lowMax = fmv * 0.92;

  for (let i = 0; i < lowCount; i++) {
    bids.push(randomInRange(lowMin, lowMax, tick));
  }

  // ✅ 금액 정렬 (높은 가격 우선)
  const sorted = bids.sort((a, b) => b - a);

  // ✅ 디버그 로그
  console.log("RAW BIDS >>>", sorted);

  return sorted;
}
