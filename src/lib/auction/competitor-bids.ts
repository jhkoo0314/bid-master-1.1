// src/lib/auction/competitor-bids.ts

export type CompetitorParams = {
  n: number; // 경쟁자 수
  fmv: number; // 시장가(예상 거래가, FMV)
  appraisal: number; // 감정가
  lowestBid: number; // 최저가
  userBid: number; // 사용자(내) 입찰가
  difficulty?: "easy" | "normal" | "hard";
  overheatScore?: number; // 0~1: 과열 강도 (입찰 시나리오에서 계산)
  tick?: number; // 호가 단위
};

const clamp = (x: number, lo: number, hi: number) =>
  Math.min(Math.max(x, lo), hi);

// 절단 정규 샘플링 (Box-Muller, 간단 구현)
function sampleTruncatedNormal(
  mean: number,
  sd: number,
  lo: number,
  hi: number
): number {
  for (let i = 0; i < 12; i++) {
    // 표준정규 근사 (합성법)
    let z = 0;
    for (let k = 0; k < 12; k++) z += Math.random(); // [0,12)
    z = z - 6; // 대략 N(0,1)
    const v = mean + sd * z;
    if (v >= lo && v <= hi) return v;
  }
  // 실패 시 중앙값 반환
  return clamp(mean, lo, hi);
}

export function generateCompetitorBids(p: CompetitorParams): number[] {
  const {
    n,
    fmv,
    appraisal,
    lowestBid,
    userBid,
    difficulty = "normal",
    overheatScore = 0,
    tick = 10000,
  } = p;

  // 1) 분포 기준(평균): FMV를 중심으로, 난이도별 약간 상향
  const diffBias =
    difficulty === "easy" ? -0.02 : difficulty === "hard" ? 0.03 : 0.0;
  let mean = fmv * (1.0 + diffBias);

  // 2) 과열일수록 평균을 살짝 올리되, 하드캡 내에서만
  //    평균 상승폭은 최대 +3% (overheatScore=1일 때)
  mean *= 1 + 0.03 * overheatScore;

  // 3) 분산(표준편차): FMV의 4~8% 범위에서 난이도·과열에 따라 조정
  let sd =
    fmv * (0.05 + 0.02 * overheatScore) * (difficulty === "hard" ? 1.1 : 0.9);

  // 4) 하단/상단 절단 경계 설정
  //    - 하단: 최저가 + 2% 이상
  //    - 상단: FMV * 1.05 와 감정가 * 0.99 중 작은 값
  //    - 추가 하드캡: 사용자 입찰가를 절대 따라가지 않음 (userBid * 0.985)
  const lo = Math.max(lowestBid * 1.02, fmv * 0.85);
  const capByFMV = fmv * 1.05;
  const capByAppr = appraisal * 0.99;
  const capByUser = userBid * 0.985; // 사용자보다 낮게 형성
  const hi = Math.min(capByFMV, capByAppr, capByUser);

  // mean이 경계 밖이면 경계 안으로
  mean = clamp(mean, lo + tick, hi - tick);

  // 5) 샘플링
  const bids: number[] = [];
  for (let i = 0; i < n; i++) {
    const v = sampleTruncatedNormal(mean, sd, lo, hi);
    // 호가 단위 반올림 + 동점 회피
    const rounded = Math.round(v / tick) * tick;
    const jitter =
      (i % 2 === 0 ? -1 : 1) * (Math.floor(Math.random() * 3) * (tick / 2));
    bids.push(clamp(rounded + jitter, lo, hi));
  }

  // 6) 상단 꼬리("과열의 체감")를 소수만 부여: 평균 위쪽으로 약간 밀어주기
  //    단, 절대 userBid를 넘지 않음
  const tailCount = Math.min(
    Math.max(Math.round(n * 0.1 * overheatScore), 0),
    Math.floor(n / 3)
  );
  for (let i = 0; i < tailCount; i++) {
    const idx = Math.floor(Math.random() * bids.length);
    const bump = Math.max(tick, sd * 0.8);
    bids[idx] = clamp(Math.round((bids[idx] + bump) / tick) * tick, lo, hi);
  }

  // 7) 사용자와 동일/상회 방지: 동률 제거 및 안전 여백
  for (let i = 0; i < bids.length; i++) {
    if (Math.abs(bids[i] - userBid) < tick) {
      bids[i] = clamp(bids[i] - tick, lo, hi);
    }
    if (bids[i] >= userBid) {
      bids[i] = clamp(userBid - tick, lo, hi);
    }
  }

  // 낮은→높은 순 정렬 반환
  return bids.sort((a, b) => a - b);
}
