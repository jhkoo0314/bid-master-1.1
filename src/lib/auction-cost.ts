/**
 * Bid Master AI - 경매 총인수금액 및 세금 계산 모듈
 * 매물유형 9가지, 권리유형 13가지, 매물별 위험도를 반영한 정확한 계산
 */

import type { RightRow } from "@/types/property";

/** 용도 구분 */
export type PropertyUse = "RESIDENTIAL" | "COMMERCIAL" | "LAND";

/** 매물 유형 (9가지) */
export type PropertyType =
  | "아파트"
  | "오피스텔"
  | "단독주택"
  | "빌라"
  | "원룸"
  | "주택"
  | "다가구주택"
  | "근린주택"
  | "도시형생활주택"
  | "상가"
  | "토지";

/** 위험도 레벨 */
export type RiskLevel = "low" | "mid" | "high";

/** 세금 계산 시 입력(필수) */
export interface TaxInput {
  use: PropertyUse; // 용도
  price: number; // 과세표준(보통 낙찰가, B)
  region?: string; // 선택: 지자체명(표시에만 사용)
  // 주택 세율 가중치 관련(필요시 사용)
  householdHomes?: number; // 세대 보유주택수(1,2,3…)
  regulatedArea?: boolean; // 조정대상지역 여부
}

/** 세금 프리셋/옵션 (필요 시 덮어쓰기) */
export interface TaxOptions {
  // 기본 세율
  acquisitionTaxRate?: number; // 취득세율
  localEduOnAcqRate?: number; // 취득세 부가 지방교육세율(보통 10%)
  ruralSpecialTaxRate?: number; // 농어촌특별세율(토지/상가 상황에 따라 적용)
  registryTaxRate?: number; // 등록면허세율(보통 0.2%)
  localEduOnRegistryRate?: number; // 등록면허세 부가 지방교육세율(보통 20%)

  // 인지세(인지대) 구간표
  stampDutyTable?: Array<{ lt: number; duty: number }>;

  // 실비/수수료(세금은 아니지만 총투입비 반영 목적)
  lawFirmFee?: number; // 법무사 등기대행 수수료
  courtFees?: number; // 법원 인지/송달 등 경매 절차 비용(필요 시)
}

/** 세금 계산 결과(내역 분해) */
export interface TaxBreakdown {
  acquisitionTax: number; // 취득세
  localEduOnAcq: number; // 취득세 부가 지방교육세
  ruralSpecialTax: number; // 농어촌특별세
  registryTax: number; // 등록면허세
  localEduOnRegistry: number; // 등록면허세 부가 지방교육세
  stampDuty: number; // 인지세(인지대)
  lawFirmFee: number; // 법무사 수수료(옵션)
  courtFees: number; // 법원비용(옵션)
  totalTaxesAndFees: number; // 위 항목 합계
}

/** 총인수금액/안전마진을 위한 입력 */
export interface AcquisitionInput {
  bidPrice: number; // B: 입찰가(낙찰가 가정)
  rights: number; // R: 인수권리 총합
  capex: number; // C: 수리/개보수
  eviction: number; // E: 명도비
  carrying: number; // K: 보유/이자/관리비(예상 보유기간 기준)
  contingency: number; // U: 예비비
  marketValue: number; // V: 시세(보수적)
  taxInput: TaxInput; // 세금 산출용
  taxOptions?: TaxOptions; // 세율/표/수수료 덮어쓰기
}

/** 총액/마진 결과 */
export interface AcquisitionResult {
  tax: TaxBreakdown;
  totalAcquisition: number; // A = B + R + T + C + E + K + U
  marginAmount: number; // V - A
  marginRate: number; // (V - A) / V
}

/** 금액 반올림 도우미 */
const roundTo = (n: number, unit: number) => Math.round(n / unit) * unit;

/** 기본 인지세 테이블
 *  - 1억 이하: 50,000
 *  - 1억 초과~10억: 150,000
 *  - 10억 초과: 350,000
 */
const DEFAULT_STAMP_DUTY_TABLE: Array<{ lt: number; duty: number }> = [
  { lt: 100_000_000, duty: 50_000 },
  { lt: 1_000_000_000, duty: 150_000 },
  { lt: Infinity, duty: 350_000 },
];

/** 매물유형 → 세금 용도 매핑 */
export function mapPropertyTypeToUse(propertyType: string): PropertyUse {
  const residentialTypes = [
    "아파트",
    "오피스텔",
    "단독주택",
    "빌라",
    "원룸",
    "주택",
    "다가구주택",
    "근린주택",
    "도시형생활주택",
  ];

  if (residentialTypes.includes(propertyType)) {
    return "RESIDENTIAL";
  }
  if (propertyType === "토지") {
    return "LAND";
  }
  // 상가, 근린생활시설 등
  return "COMMERCIAL";
}

/** 매물유형별 가중치 */
export function getPropertyTypeFactor(propertyType: string): number {
  const typeFactorMap: Record<string, number> = {
    아파트: 1.0,
    오피스텔: 1.05,
    단독주택: 1.1,
    빌라: 1.05,
    원룸: 0.85,
    주택: 1.0,
    다가구주택: 1.1,
    근린주택: 1.1,
    도시형생활주택: 0.9,
    상가: 1.15,
    토지: 1.1,
  };
  return typeFactorMap[propertyType] ?? 1.08;
}

/** 위험도별 가중치 */
export function getRiskFactor(riskLevel: RiskLevel): number {
  const riskFactorMap: Record<RiskLevel, number> = {
    high: 1.25,
    mid: 1.1,
    low: 1.0,
  };
  return riskFactorMap[riskLevel] ?? 1.0;
}

/** 유형별 바닥노출률 */
export function getExposureFloorRate(propertyType: string): number {
  const exposureFloorRateMap: Record<string, number> = {
    아파트: 0.03,
    오피스텔: 0.035,
    단독주택: 0.04,
    빌라: 0.035,
    원룸: 0.03,
    주택: 0.03,
    다가구주택: 0.04,
    근린주택: 0.04,
    도시형생활주택: 0.035,
    상가: 0.05,
    토지: 0.06,
  };
  return exposureFloorRateMap[propertyType] ?? 0.04;
}

/** 인수 가능한 권리 유형 (13가지) */
export const ASSUMABLE_RIGHT_TYPES = [
  "근저당권",
  "저당권",
  "압류",
  "가압류",
  "담보가등기",
  "소유권이전청구권가등기",
  "전세권",
  "주택임차권",
  "상가임차권",
  "가처분",
  "유치권",
  "법정지상권",
  "분묘기지권",
] as const;

/** 권리유형별 인수금액 계산 */
export function calculateRightsAmount(
  rights: RightRow[],
  propertyValue: number,
  propertyType?: string
): number {
  console.log("💰 [권리계산] 권리유형별 인수금액 계산 시작");
  console.log(`  - 권리 개수: ${rights.length}개`);
  console.log(`  - 매물 유형: ${propertyType || "미지정"}`);
  console.log(`  - 감정가: ${propertyValue.toLocaleString()}원`);

  const assumableRights = rights.filter((r) =>
    ASSUMABLE_RIGHT_TYPES.includes(r.type as any)
  );

  const totalAmount = assumableRights.reduce((sum, right) => {
    const claimAmount = right.claim || 0;
    console.log(`  - ${right.type}: ${claimAmount.toLocaleString()}원`);
    return sum + claimAmount;
  }, 0);

  console.log(
    `  ✅ 총 인수권리 금액: ${totalAmount.toLocaleString()}원 (${
      assumableRights.length
    }개 권리)`
  );

  return totalAmount;
}

/** 용도별 기본 세율 프리셋 */
function presetRates(input: TaxInput): Required<TaxOptions> {
  const { use } = input;

  // 공통 기본값
  let acquisitionTaxRate = 0.04; // 비주택 기본 4%
  let localEduOnAcqRate = 0.1; // 취득세 부가 10%
  let ruralSpecialTaxRate = 0.0; // 상황별
  const registryTaxRate = 0.002; // 등록면허세 0.2%
  const localEduOnRegistryRate = 0.2; // 등록면허 부가 20%
  const stampDutyTable = DEFAULT_STAMP_DUTY_TABLE;
  const lawFirmFee = 400_000; // 실무 평균치 예시
  const courtFees = 100_000; // 경매 절차비 예시

  if (use === "RESIDENTIAL") {
    // [주택] 1세대 1주택 보편 구간 예시: 6억 이하 1%, 6~9억 2%, 9억 초과 3%
    const p = input.price;
    if (p <= 600_000_000) acquisitionTaxRate = 0.01;
    else if (p <= 900_000_000) acquisitionTaxRate = 0.02;
    else acquisitionTaxRate = 0.03;

    // 주택은 보통 농특세 미적용
    ruralSpecialTaxRate = 0.0;
  } else if (use === "COMMERCIAL") {
    acquisitionTaxRate = 0.04;
    ruralSpecialTaxRate = 0.002; // 0.2% 예시(지자체 상이)
  } else if (use === "LAND") {
    acquisitionTaxRate = 0.04;
    ruralSpecialTaxRate = 0.002; // 0.2% 예시
  }

  return {
    acquisitionTaxRate,
    localEduOnAcqRate,
    ruralSpecialTaxRate,
    registryTaxRate,
    localEduOnRegistryRate,
    stampDutyTable,
    lawFirmFee,
    courtFees,
  };
}

/** 인지세(인지대) 계산 */
function calcStampDuty(
  price: number,
  table: Array<{ lt: number; duty: number }>
): number {
  for (const row of table) {
    if (price < row.lt) return row.duty;
  }
  return table[table.length - 1].duty;
}

/** 세금/수수료 계산 */
export function calcTaxes(input: TaxInput, options?: TaxOptions): TaxBreakdown {
  console.log("💰 [세금계산] 세금 계산 시작");
  console.log(`  - 용도: ${input.use}`);
  console.log(`  - 과세표준: ${input.price.toLocaleString()}원`);

  const preset = presetRates(input);
  const opt = { ...preset, ...(options || {}) };

  const P = input.price;

  const acquisitionTax = roundTo(P * opt.acquisitionTaxRate, 10); // 10원 반올림
  const localEduOnAcq = roundTo(acquisitionTax * opt.localEduOnAcqRate, 10);
  const ruralSpecialTax = roundTo(P * opt.ruralSpecialTaxRate, 10);

  const registryTax = roundTo(P * opt.registryTaxRate, 10);
  const localEduOnRegistry = roundTo(
    registryTax * opt.localEduOnRegistryRate,
    10
  );

  const stampDuty = calcStampDuty(P, opt.stampDutyTable);
  const lawFirmFee = opt.lawFirmFee ?? 0;
  const courtFees = opt.courtFees ?? 0;

  const totalTaxesAndFees =
    acquisitionTax +
    localEduOnAcq +
    ruralSpecialTax +
    registryTax +
    localEduOnRegistry +
    stampDuty +
    lawFirmFee +
    courtFees;

  console.log("💰 [세금계산] 세금 계산 결과:");
  console.log(
    `  - 취득세: ${acquisitionTax.toLocaleString()}원 (${(
      opt.acquisitionTaxRate * 100
    ).toFixed(1)}%)`
  );
  console.log(`  - 지방교육세(취득): ${localEduOnAcq.toLocaleString()}원`);
  console.log(`  - 농어촌특별세: ${ruralSpecialTax.toLocaleString()}원`);
  console.log(`  - 등록면허세: ${registryTax.toLocaleString()}원`);
  console.log(`  - 지방교육세(등록): ${localEduOnRegistry.toLocaleString()}원`);
  console.log(`  - 인지세: ${stampDuty.toLocaleString()}원`);
  console.log(`  - 법무사 수수료: ${lawFirmFee.toLocaleString()}원`);
  console.log(`  - 법원 비용: ${courtFees.toLocaleString()}원`);
  console.log(
    `  ✅ 총 세금 및 수수료: ${totalTaxesAndFees.toLocaleString()}원`
  );

  return {
    acquisitionTax,
    localEduOnAcq,
    ruralSpecialTax,
    registryTax,
    localEduOnRegistry,
    stampDuty,
    lawFirmFee,
    courtFees,
    totalTaxesAndFees,
  };
}

/** 총인수금액/안전마진 계산 */
export function calcAcquisitionAndMoS(
  input: AcquisitionInput
): AcquisitionResult {
  console.log("💰 [총인수금액] 총인수금액 계산 시작");

  const {
    bidPrice: B,
    rights: R,
    capex: C,
    eviction: E,
    carrying: K,
    contingency: U,
    marketValue: V,
    taxInput,
    taxOptions,
  } = input;

  // marketValue가 undefined인 경우 기본값 처리
  const safeV = V ?? 0;
  if (!V) {
    console.warn("⚠️ [총인수금액] 시세(V)가 없습니다. 0으로 처리합니다.");
  }

  // 세금은 낙찰가(B)를 과세표준으로 계산
  const tax = calcTaxes({ ...taxInput, price: B }, taxOptions);
  const T = tax.totalTaxesAndFees;

  const totalAcquisition = B + R + T + C + E + K + U; // A
  const marginAmount = safeV - totalAcquisition;
  const marginRate = safeV > 0 ? marginAmount / safeV : 0;

  console.log("💰 [총인수금액] 구성 요소:");
  console.log(`  - 입찰가(B): ${B.toLocaleString()}원`);
  console.log(`  - 인수권리(R): ${R.toLocaleString()}원`);
  console.log(`  - 세금 및 수수료(T): ${T.toLocaleString()}원`);
  console.log(`  - 수리비(C): ${C.toLocaleString()}원`);
  console.log(`  - 명도비(E): ${E.toLocaleString()}원`);
  console.log(`  - 보유비(K): ${K.toLocaleString()}원`);
  console.log(`  - 예비비(U): ${U.toLocaleString()}원`);
  console.log(`  ✅ 총인수금액(A): ${totalAcquisition.toLocaleString()}원`);
  console.log(
    `  - 시세(V): ${safeV.toLocaleString()}원${!V ? " (기본값)" : ""}`
  );
  console.log(
    `  ✅ 안전마진: ${marginAmount.toLocaleString()}원 (${(
      marginRate * 100
    ).toFixed(2)}%)`
  );

  return {
    tax,
    totalAcquisition,
    marginAmount,
    marginRate,
  };
}

/** 매물별 위험도를 반영한 안전마진 계산 */
export interface SafetyMarginInput {
  rights: RightRow[];
  propertyType: string;
  lowestPrice: number;
  riskLevel: RiskLevel;
  propertyValue?: number;
}

export interface SafetyMarginResult {
  assumedAmount: number;
  minSafetyMargin: number;
  trace: string[];
}

/** 매물별 위험도를 반영한 안전마진 계산 */
export function calculateSafetyMarginWithRisk(
  input: SafetyMarginInput
): SafetyMarginResult {
  const {
    rights,
    propertyType,
    lowestPrice,
    riskLevel,
    propertyValue = 0,
  } = input;

  console.log("💰 [안전마진] 위험도 반영 계산 시작");
  console.log(`  - 매물 유형: ${propertyType}`);
  console.log(`  - 최저가: ${lowestPrice.toLocaleString()}원`);
  console.log(`  - 위험도: ${riskLevel}`);
  console.log(`  - 권리 개수: ${rights.length}개`);

  // 1) 인수대상 권리 합계
  const assumableRights = rights.filter((r) =>
    ASSUMABLE_RIGHT_TYPES.includes(r.type as any)
  );
  const assumedAmountRaw = assumableRights.reduce(
    (sum, r) => sum + (r.claim || 0),
    0
  );

  console.log(`  - 인수대상 권리: ${assumableRights.length}개`);
  console.log(`  - 인수금액(원시): ${assumedAmountRaw.toLocaleString()}원`);

  // 2) 유형별 가중치 적용
  const typeFactor = getPropertyTypeFactor(propertyType);
  const assumedAmount = Math.floor(assumedAmountRaw * typeFactor);

  console.log(
    `  - 유형 가중치: ${typeFactor} → ${assumedAmount.toLocaleString()}원`
  );

  // 3) 바닥노출 계산
  const exposureFloorRate = getExposureFloorRate(propertyType);
  const exposureFloor = Math.max(
    0,
    Math.floor(lowestPrice * exposureFloorRate)
  );

  console.log(`  - 바닥노출률: ${(exposureFloorRate * 100).toFixed(1)}%`);
  console.log(`  - 바닥노출액: ${exposureFloor.toLocaleString()}원`);

  // 4) 기준 노출 결정
  const baseExposure = Math.max(assumedAmount, exposureFloor);

  // 5) 위험도 가중치 적용
  const riskFactor = getRiskFactor(riskLevel);
  const minSafetyMarginRaw = baseExposure * riskFactor;
  const minSafetyMargin = roundToTenThousands(minSafetyMarginRaw);

  console.log(`  - 기준 노출: ${baseExposure.toLocaleString()}원`);
  console.log(`  - 위험도 가중치: ${riskFactor}`);
  console.log(`  ✅ 최소 안전마진: ${minSafetyMargin.toLocaleString()}원`);

  // 6) 산출 근거 트레이스
  const trace: string[] = [
    `인수대상 권리 합계: ${assumedAmountRaw.toLocaleString()}원 (${
      assumableRights.length
    }개)`,
    `유형 가중치(${typeFactor}) 적용 후: ${assumedAmount.toLocaleString()}원`,
    `바닥노출(최저가×${(exposureFloorRate * 100).toFixed(
      1
    )}%): ${exposureFloor.toLocaleString()}원`,
    `기준 노출(max): ${baseExposure.toLocaleString()}원`,
    `위험도 가중치(${riskFactor}) 적용`,
    `최소 안전마진(1만원 단위 반올림): ${minSafetyMargin.toLocaleString()}원`,
  ];

  return { assumedAmount, minSafetyMargin, trace };
}

/** 1만원 단위 반올림 */
function roundToTenThousands(value: number): number {
  const unit = 10000;
  return Math.round(value / unit) * unit;
}

/** 목표 마진율을 만족하는 최대 입찰가 */
export function findMaxBidByTargetRate(
  V: number,
  R: number,
  C: number,
  E: number,
  K: number,
  U: number,
  taxInput: Omit<TaxInput, "price">,
  targetMarginRate: number,
  taxOptions?: TaxOptions,
  minBid = 1,
  maxBid = V,
  epsilon = 1000
): number {
  let lo = minBid;
  let hi = Math.max(minBid, maxBid);

  const meets = (B: number) => {
    const tax = calcTaxes({ ...taxInput, price: B }, taxOptions);
    const T = tax.totalTaxesAndFees;
    const A = B + R + T + C + E + K + U;
    const mos = V > 0 ? (V - A) / V : -Infinity;
    return mos >= targetMarginRate;
  };

  if (!meets(lo)) return 0;
  if (meets(hi)) return hi;

  while (hi - lo > epsilon) {
    const mid = Math.floor((lo + hi) / 2);
    if (meets(mid)) lo = mid;
    else hi = mid;
  }
  return roundTo(lo, 10);
}

/** 목표 마진 금액 기준 최대 입찰가 */
export function findMaxBidByTargetAmount(
  V: number,
  targetMarginAmount: number,
  R: number,
  C: number,
  E: number,
  K: number,
  U: number,
  taxInput: Omit<TaxInput, "price">,
  taxOptions?: TaxOptions,
  minBid = 1,
  maxBid = V,
  epsilon = 1000
): number {
  let lo = minBid;
  let hi = Math.max(minBid, maxBid);

  const meets = (B: number) => {
    const tax = calcTaxes({ ...taxInput, price: B }, taxOptions);
    const T = tax.totalTaxesAndFees;
    const A = B + R + T + C + E + K + U;
    const mosAmt = V - A;
    return mosAmt >= targetMarginAmount;
  };

  if (!meets(lo)) return 0;
  if (meets(hi)) return hi;

  while (hi - lo > epsilon) {
    const mid = Math.floor((lo + hi) / 2);
    if (meets(mid)) lo = mid;
    else hi = mid;
  }
  return roundTo(lo, 10);
}
