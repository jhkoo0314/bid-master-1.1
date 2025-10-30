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
