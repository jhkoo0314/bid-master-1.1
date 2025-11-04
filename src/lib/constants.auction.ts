// src/lib/constants.auction.ts

export type PropertyTypeKorean =
  | "아파트" | "오피스텔" | "단독주택" | "빌라" | "원룸" | "주택" | "다가구주택" | "근린주택" | "도시형생활주택";

export type RightTypeKorean =
  | "근저당권" | "저당권" | "압류" | "가압류" | "담보가등기" | "소유권이전청구권가등기" | "가등기" | "예고등기"
  | "전세권" | "주택임차권" | "상가임차권" | "가처분" | "유치권" | "법정지상권" | "분묘기지권";

// FMV 보정 계수 (κ): 감정가 × κ ≈ FMV. 교육 목적 기본값.
export const FMV_KAPPA_BY_TYPE: Record<PropertyTypeKorean, number> = {
  아파트: 0.91,
  오피스텔: 0.88,
  단독주택: 0.87,
  빌라: 0.89,
  원룸: 0.88,
  주택: 0.90,
  다가구주택: 0.87,
  근린주택: 0.86,
  도시형생활주택: 0.90,
};

export const MINBID_ALPHA_DEFAULT = 0.8;

// 취득세율 (교육용 상향보수). 실제 과세와 다를 수 있음.
export const ACQ_TAX_RATE_BY_TYPE: Record<PropertyTypeKorean, number> = {
  아파트: 0.011,
  오피스텔: 0.046,        // 주거·업무 혼재 가정
  단독주택: 0.012,
  빌라: 0.012,
  원룸: 0.012,
  주택: 0.012,
  다가구주택: 0.013,
  근린주택: 0.020,        // 상가요소 반영
  도시형생활주택: 0.013,
};

export const EDU_TAX_RATE = 0.001; // 0.1%
export const SPC_TAX_RATE = 0.002; // 0.2%

// 명도/기타 비용 기본값 (권리·임차 리스크 가중 전)
export const BASE_EVICTION_BY_TYPE: Record<PropertyTypeKorean, number> = {
  아파트: 3_000_000,
  오피스텔: 3_500_000,
  단독주택: 4_000_000,
  빌라: 3_500_000,
  원룸: 3_000_000,
  주택: 3_000_000,
  다가구주택: 5_000_000,     // 임차 다수
  근린주택: 5_000_000,       // 상가 세입자
  도시형생활주택: 3_500_000,
};

export const BASE_MISC_COST = 1_000_000; // 법무/등기

// 위험 배지 키
export type RiskFlagKey =
  | "소유권분쟁" | "상가임차" | "유치권" | "법정지상권" | "분묘" | "배당불명확" | "임차다수";

// 권리유형별 기본 판정/반영 템플릿
export interface RightRule {
  defaultDisposition: "소멸" | "인수" | "위험";    // 말소/인수/위험(비금전·불확실)
  amountPolicy: "금액전액" | "금액없음" | "추정" | "시세감액";
  riskFlags?: RiskFlagKey[];
  note?: string;
}

export const RIGHT_RULES: Record<RightTypeKorean, RightRule> = {
  근저당권: { defaultDisposition: "소멸", amountPolicy: "금액없음", note: "말소기준보다 선순위면 인수 전환" },
  저당권:   { defaultDisposition: "소멸", amountPolicy: "금액없음", note: "근저당권과 동일" },
  압류:     { defaultDisposition: "소멸", amountPolicy: "금액없음", riskFlags: ["소유권분쟁"] },
  가압류:   { defaultDisposition: "소멸", amountPolicy: "금액없음" },
  담보가등기: { defaultDisposition: "인수", amountPolicy: "금액전액" },
  소유권이전청구권가등기: { defaultDisposition: "위험", amountPolicy: "시세감액", riskFlags: ["소유권분쟁"] },
  가등기:   { defaultDisposition: "위험", amountPolicy: "시세감액", riskFlags: ["소유권분쟁"] },
  예고등기: { defaultDisposition: "위험", amountPolicy: "금액없음", riskFlags: ["소유권분쟁"] },
  전세권:   { defaultDisposition: "인수", amountPolicy: "금액전액" },
  주택임차권: { defaultDisposition: "인수", amountPolicy: "추정" },
  상가임차권: { defaultDisposition: "인수", amountPolicy: "추정", riskFlags: ["상가임차"] },
  가처분:   { defaultDisposition: "소멸", amountPolicy: "금액없음", riskFlags: ["소유권분쟁"] },
  유치권:   { defaultDisposition: "위험", amountPolicy: "추정", riskFlags: ["유치권"] },
  법정지상권: { defaultDisposition: "위험", amountPolicy: "시세감액", riskFlags: ["법정지상권"] },
  분묘기지권: { defaultDisposition: "위험", amountPolicy: "시세감액", riskFlags: ["분묘"] },
};

// 위험 가산비용 (명도/기타) 계수
export const RISK_EVICTION_ADD: Partial<Record<RiskFlagKey, number>> = {
  유치권: 2_000_000,
  법정지상권: 1_500_000,
  분묘: 2_000_000,
  상가임차: 1_000_000,
  임차다수: 1_000_000,
};

export const RISK_MISC_ADD: Partial<Record<RiskFlagKey, number>> = {
  소유권분쟁: 1_000_000,
  배당불명확: 500_000,
};

