// src/lib/auction/overheat.ts

/**
 * 입찰가 대비 과열 점수를 계산합니다.
 * FMV 대비 과열과 감정가 대비 과열을 함께 고려하여 0~1 사이의 점수를 반환합니다.
 *
 * @param bidPrice - 입찰가
 * @param fmv - 시장가(Fair Market Value)
 * @param appraisal - 감정가
 * @returns 0~1 사이의 과열 점수 (0: 정상, 1: 최대 과열)
 */
export function computeOverheatScore(
  bidPrice: number,
  fmv: number,
  appraisal: number
): number {
  // FMV 대비 과열, 감정가 대비 과열을 함께 고려 (0~1로 스케일)
  const r1 = Math.max(0, bidPrice / fmv - 0.95) / 0.1; // 0.95~1.05 구간을 0~1
  const r2 = Math.max(0, bidPrice / appraisal - 0.9) / 0.12; // 0.90~1.02 구간을 0~1

  return Math.max(0, Math.min(1, Math.max(r1, r2))); // 보수적으로 더 큰 값 사용
}
