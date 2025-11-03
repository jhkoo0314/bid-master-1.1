/**
 * Bid Master AI - 경매 총인수금액 및 세금 계산 모듈
 * 매물유형 9가지, 권리유형 13가지, 매물별 위험도를 반영한 정확한 계산
 */

import type { RightRow, PayoutRow } from "@/types/property";
import { computeAssumableCost, type BaseRight, type RightType } from "./rights-engine";

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
  marketValue?: string | number; // V: 시세(보수적) - 문자열('522,550,000원') 또는 숫자 (marketPriceRange 사용 시 선택)
  marketPriceRange?: { min: number; max: number }; // AI 시세 예측 범위 (입찰가 가이드용, MoS에는 사용하지 않음)
  fairMarketValue?: number; // ✅ FMV: 공정시세 (MoS 계산에 사용. fairCenter 값)
  marketPriceScenario?: "conservative" | "neutral" | "optimistic"; // 시나리오 선택 (기본값: neutral)
  minimumBidPrice?: number; // 최저매각가격 (MoS < 0일 때 입찰가 제한 계산용)
  taxInput: TaxInput; // 세금 산출용
  taxOptions?: TaxOptions; // 세율/표/수수료 덮어쓰기
}

/** 총액/마진 결과 */
export interface AcquisitionResult {
  tax: TaxBreakdown;
  totalAcquisition: number; // A = B + R + T + C + E + K + U
  marginAmount: number; // V - A
  marginRate: number; // (V - A) / V
  marketPriceUsed?: number; // 실제 계산에 사용된 시세 값
  marketPriceScenario?: string; // 적용된 시나리오
  recommendedMaxBidPrice?: number; // MoS < 0일 때 추천 최대 입찰가 (시세 95% 또는 최저가 105% 중 작은 값)
}

/** 금액 반올림 도우미 */
const roundTo = (n: number, unit: number) => Math.round(n / unit) * unit;

/** 한국 원화 금액을 숫자로 변환 (모든 비숫자 문자 제거) */
export function toKRWNumber(v: string | number | undefined | null): number {
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
}

/** 금액 문자열을 숫자로 파싱 (콤마와 '원' 제거) */
export function parseMoneyValue(
  value: string | number | undefined | null
): number {
  // 숫자인 경우 바로 반환
  if (typeof value === "number") {
    if (isNaN(value)) {
      console.error(`❌ [파싱] 입력값이 NaN입니다: ${value}`);
      return 0;
    }
    return value;
  }

  // null, undefined, 빈 문자열 처리
  if (!value) {
    return 0;
  }

  // 문자열인 경우 파싱
  const strValue = String(value).trim();
  
  // 숫자, 점(.), 마이너스(-)만 남기고 나머지 모두 제거
  // 콤마, 공백, '원' 문자 등 모든 비숫자 문자를 처리
  const parsed = toKRWNumber(strValue);

  // NaN 검증
  if (isNaN(parsed)) {
    console.error(`❌ [파싱] 숫자 변환 실패 - NaN: 원본="${strValue}", 파싱 결과=${parsed}`);
    return 0;
  }

  // 0으로 변환된 경우 경고 (단, 원본이 "0"이 아닌 경우)
  if (
    parsed === 0 &&
    strValue !== "0" &&
    strValue !== "" &&
    !strValue.match(/^[0\s,원-]*$/)
  ) {
    console.warn(`⚠️ [파싱] 숫자 변환 결과가 0입니다. 원본: "${strValue}"`);
  } else if (typeof value === "string") {
    console.log(
      `💰 [파싱] 금액 문자열 변환: "${strValue}" → ${parsed.toLocaleString()}원`
    );
  }

  return parsed;
}

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

/**
 * 권리 타입 문자열을 RightType으로 안전하게 변환
 */
function normalizeRightType(type: string | undefined | null): RightType {
  if (!type) return "기타";
  
  const validTypes: RightType[] = [
    "근저당권", "저당권", "압류", "가압류", "담보가등기", "소유권이전청구권가등기", "가처분",
    "전세권", "주택임차권", "상가임차권",
    "유치권", "법정지상권", "지상권", "분묘기지권",
    "기타",
  ];
  
  // 정확히 일치하는 경우
  if (validTypes.includes(type as RightType)) {
    return type as RightType;
  }
  
  // 부분 일치 검사
  if (type.includes("근저당")) return "근저당권";
  if (type.includes("저당")) return "저당권";
  if (type.includes("압류") && !type.includes("가압류")) return "압류";
  if (type.includes("가압류")) return "가압류";
  if (type.includes("담보가등기")) return "담보가등기";
  if (type.includes("소유권이전청구권")) return "소유권이전청구권가등기";
  if (type.includes("가처분")) return "가처분";
  if (type.includes("전세")) return "전세권";
  if (type.includes("주택임차")) return "주택임차권";
  if (type.includes("상가임차")) return "상가임차권";
  if (type.includes("유치")) return "유치권";
  if (type.includes("법정지상")) return "법정지상권";
  if (type.includes("지상권")) return "지상권";
  if (type.includes("분묘기지")) return "분묘기지권";
  
  return "기타";
}

/**
 * RightRow의 note 필드에서 대항력 여부 추출
 */
function extractHasDahang(note?: string): boolean | undefined {
  if (!note) return undefined;
  return note.includes("대항력") || note.includes("대항") || undefined;
}

/**
 * RightRow를 BaseRight로 매핑 (배당 정보 포함 가능)
 */
function mapRightRowToBaseRight(
  right: RightRow,
  payoutMap?: Map<string, number>
): BaseRight {
  const type = normalizeRightType(right.type);
  const amount = right.claim || 0;
  
  // 배당 정보가 있으면 사용, 없으면 0
  const distributed = payoutMap
    ? payoutMap.get(`${right.holder}-${right.type}`) || payoutMap.get(right.holder) || 0
    : 0;
  
  const hasDahang = extractHasDahang(right.note);
  
  return {
    type,
    amount,
    distributed,
    hasDahang,
    note: right.note,
  };
}

/**
 * PayoutRow 배열을 Map으로 변환 (holder-type 조합으로 조회)
 */
function createPayoutMap(payouts: PayoutRow[]): Map<string, number> {
  const map = new Map<string, number>();
  
  for (const payout of payouts) {
    const key = `${payout.holder}-${payout.type}`;
    const existing = map.get(key) || 0;
    map.set(key, existing + (payout.expected || 0));
    
    // holder만으로도 조회 가능하도록 설정 (임시)
    if (!map.has(payout.holder)) {
      map.set(payout.holder, payout.expected || 0);
    }
  }
  
  return map;
}

/** RightRow를 BaseRight로 매핑하여 권리 인수 총액 계산 (새 엔진 사용) */
function calcRightsAssumableTotal(
  rights: RightRow[],
  payouts?: PayoutRow[]
): number {
  console.log("💰 [권리계산] rights-engine 통합 계산 시작");
  console.log(`  - 입력 권리 개수: ${rights.length}개`);
  console.log(`  - 배당 정보 개수: ${payouts?.length || 0}개`);

  // 배당 정보가 있으면 Map 생성
  const payoutMap = payouts && payouts.length > 0 
    ? createPayoutMap(payouts)
    : undefined;

  // RightRow를 BaseRight로 매핑
  const mapped: BaseRight[] = (rights ?? []).map((r: RightRow) => 
    mapRightRowToBaseRight(r, payoutMap)
  );

  // 매핑 결과 로그
  if (payoutMap) {
    const withDistribution = mapped.filter(r => (r.distributed || 0) > 0);
    if (withDistribution.length > 0) {
      console.log(`  - 배당 정보 적용된 권리: ${withDistribution.length}개`);
    }
  }

  const out = computeAssumableCost({
    rights: mapped,
    tenantResidualFactor: 1.0,
    defaultLikelihood: { 유치권: 0.6, 법정지상권: 0.7, 분묘기지권: 1.0, 지상권: 1.0 },
    debug: false,
  });

  console.log(`  ✅ rights-engine 계산 완료: ${out.assumableTotal.toLocaleString()}원`);
  console.log(`  - 말소 권리 제외: ${out.extinguishedTotal.toLocaleString()}원`);
  if (out.disputedWeightedTotal > 0) {
    console.log(`  - 확률가중 권리: ${out.disputedWeightedTotal.toLocaleString()}원`);
  }

  return out.assumableTotal;
}

/** 
 * 권리유형별 인수금액 계산 (하위 호환성 유지 - 새 엔진 사용)
 * @param rights 권리 목록
 * @param propertyValue 감정가 (사용하지 않으나 하위 호환성을 위해 유지)
 * @param propertyType 매물 유형 (사용하지 않으나 하위 호환성을 위해 유지)
 * @param payouts 배당 정보 (선택) - 있으면 임차권 미배당 잔액 계산에 사용
 */
export function calculateRightsAmount(
  rights: RightRow[],
  propertyValue: number,
  propertyType?: string,
  payouts?: PayoutRow[]
): number {
  console.log("💰 [권리계산] 권리유형별 인수금액 계산 시작");
  console.log(`  - 권리 개수: ${rights.length}개`);
  console.log(`  - 매물 유형: ${propertyType || "미지정"}`);
  console.log(`  - 감정가: ${propertyValue.toLocaleString()}원`);

  // 새 엔진을 사용하여 정밀 계산 (배당 정보 포함)
  const totalAmount = calcRightsAssumableTotal(rights, payouts);

  console.log(
    `  ✅ 총 인수권리 금액: ${totalAmount.toLocaleString()}원`
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
  console.log("⚖️ [calcAcquisitionAndMoS] 함수 호출 - 입력값 검증 시작");

  const {
    bidPrice: B,
    rights: R,
    capex: C,
    eviction: E,
    carrying: K,
    contingency: U,
    marketValue: V,
    marketPriceRange,
    marketPriceScenario = "neutral",
    taxInput,
    taxOptions,
  } = input;

  // 1️⃣ 각 입력값 검증 및 NaN 방지
  const safeB = Number(B) || 0;
  const safeR = Number(R) || 0;
  const safeC = Number(C) || 0;
  const safeE = Number(E) || 0;
  const safeK = Number(K) || 0;
  const safeU = Number(U) || 0;

  // 입력값 검증 로그
  console.log("⚖️ [calcAcquisitionAndMoS] 입력값 검증:");
  console.log(`  - bidPrice (B): ${B} (타입: ${typeof B}) → ${safeB.toLocaleString()}원`);
  if (isNaN(safeB) || safeB < 0) {
    console.warn(`  ⚠️ bidPrice가 유효하지 않습니다: ${B}`);
  }

  console.log(`  - rights (R): ${R} (타입: ${typeof R}) → ${safeR.toLocaleString()}원`);
  if (isNaN(safeR)) {
    console.warn(`  ⚠️ rights가 유효하지 않습니다: ${R}`);
  }

  console.log(`  - capex (C): ${C} (타입: ${typeof C}) → ${safeC.toLocaleString()}원`);
  console.log(`  - eviction (E): ${E} (타입: ${typeof E}) → ${safeE.toLocaleString()}원`);
  console.log(`  - carrying (K): ${K} (타입: ${typeof K}) → ${safeK.toLocaleString()}원`);
  console.log(`  - contingency (U): ${U} (타입: ${typeof U}) → ${safeU.toLocaleString()}원`);

  // 2️⃣ 시세(V) 결정: MoS 계산에는 fairMarketValue(FMV) 사용, 없으면 하위 호환성 고려
  let safeV: number;
  let usedScenario: string | undefined;
  
  if (typeof input.fairMarketValue === "number" && input.fairMarketValue > 0) {
    // ✅ FMV(공정시세)가 제공된 경우: MoS 계산에 사용
    safeV = input.fairMarketValue;
    console.log(`💰 [총인수금액] FMV(공정시세) 적용: ${safeV.toLocaleString()}원 (MoS 계산 기준)`);
    usedScenario = "fmv";
  } else if (marketPriceRange) {
    // AI 시세 범위가 제공된 경우: 입찰가 가이드용 (MoS에는 사용하지 않음, 하위 호환성 유지)
    console.log(`💰 [총인수금액] AI 시세 범위 적용 (입찰가 가이드용): ${marketPriceRange.min.toLocaleString()}원 ~ ${marketPriceRange.max.toLocaleString()}원`);
    console.warn(`  ⚠️ [경고] marketPriceRange는 MoS 계산에 사용되지 않습니다. fairMarketValue를 제공해주세요.`);
    
    // 하위 호환성: 중립값으로 사용 (하지만 로그로 경고)
    switch (marketPriceScenario) {
      case "conservative":
        safeV = marketPriceRange.min;
        usedScenario = "conservative";
        break;
      case "optimistic":
        safeV = marketPriceRange.max;
        usedScenario = "optimistic";
        break;
      case "neutral":
      default:
        safeV = Math.floor((marketPriceRange.min + marketPriceRange.max) / 2);
        usedScenario = "neutral";
        break;
    }
    
    console.log(`💰 [총인수금액] 시나리오별 시세 적용: ${usedScenario} → ${safeV.toLocaleString()}원`);
  } else {
    // 기존 방식: marketValue 파싱 (하위 호환성)
    console.log(`⚖️ [calcAcquisitionAndMoS] marketValue 파싱:`);
    console.log(`  - marketValue 원본: ${V} (타입: ${typeof V})`);
    
    const parsedV = parseMoneyValue(V);
    console.log(`  - parseMoneyValue 결과: ${parsedV} (타입: ${typeof parsedV})`);
    
    // NaN 또는 0 체크
    if (isNaN(parsedV)) {
      console.error(`  ❌ [에러] marketValue 파싱 실패 - NaN: ${V}`);
    }
    
    safeV = isNaN(parsedV) || parsedV <= 0 ? 0 : parsedV;
    
    if (!safeV) {
      console.warn(`  ⚠️ [총인수금액] 시세(V)가 없거나 0입니다. 원본: ${V}, 파싱 결과: ${parsedV}`);
    } else {
      console.log(`  ✅ marketValue 파싱 성공: ${safeV.toLocaleString()}원`);
    }
    usedScenario = "legacy";
  }

  // 3️⃣ 세금 계산 (낙찰가 B를 과세표준으로 사용)
  const tax = calcTaxes({ ...taxInput, price: safeB }, taxOptions);
  const T = tax.totalTaxesAndFees;

  // 세금 검증
  if (isNaN(T)) {
    console.error(`  ❌ [에러] 세금 계산 결과가 NaN입니다. bidPrice: ${safeB}`);
  }

  // 4️⃣ 총인수금액 계산: A = B + R + T + C + E + K + U
  // ⚠️ 주의: bidPrice(B)는 한 번만 더해집니다. 외부에서 이미 포함되어 있다면 이중 합산 문제가 발생할 수 있습니다.
  const totalAcquisition = safeB + safeR + T + safeC + safeE + safeK + safeU;
  
  // 계산 검증
  if (isNaN(totalAcquisition)) {
    console.error(`  ❌ [에러] 총인수금액 계산 결과가 NaN입니다!`);
    console.error(`    - B: ${safeB}, R: ${safeR}, T: ${T}, C: ${safeC}, E: ${safeE}, K: ${safeK}, U: ${safeU}`);
  }

  // 5️⃣ 안전마진 계산: marginAmount = V - A
  const marginAmount = Math.round(safeV - totalAcquisition);
  const marginRate = safeV > 0 ? marginAmount / safeV : 0;

  // 안전마진 검증
  if (isNaN(marginAmount)) {
    console.error(`  ❌ [에러] 안전마진 계산 결과가 NaN입니다!`);
    console.error(`    - safeV: ${safeV}, totalAcquisition: ${totalAcquisition}`);
  }

  // MoS 디버그 로그 (FMV 기반)
  const MoS = marginAmount;
  console.log("[MoS DEBUG]", {
    marketPriceUsed: safeV,
    marketPriceSource: usedScenario === "fmv" ? "FMV(공정시세)" : usedScenario,
    totalAcquisition,
    marginOfSafety: MoS,
  });
  if (usedScenario === "fmv") {
    console.log(`  ✅ MoS 계산 기준: FMV(공정시세) = ${safeV.toLocaleString()}원`);
  }

  // MoS < 0일 때 추천 최대 입찰가 계산
  let recommendedMaxBidPrice: number | undefined;
  if (MoS < 0) {
    // ✅ 안전마진이 마이너스일 경우: 입찰가 상한 제한
    const minimumBidPrice = input.minimumBidPrice || safeB; // 최저가가 없으면 현재 입찰가 사용
    const limitByMarket = Math.floor(safeV * 0.95);
    const limitByMinBid = Math.floor(minimumBidPrice * 1.05);
    recommendedMaxBidPrice = Math.min(limitByMarket, limitByMinBid);
    
    console.warn(
      `[⚠️ 안전마진 음수] 총인수금액이 시세보다 높음 → 입찰가 제한: ${recommendedMaxBidPrice.toLocaleString()}원`
    );
  }

  // 6️⃣ 상세 로그 출력 (요청된 모든 항목)
  console.log("💰 [총인수금액] 구성 요소 상세:");
  console.log(`  📊 bidPrice (B): ${safeB.toLocaleString()}원`);
  console.log(`  📊 rights (R): ${safeR.toLocaleString()}원`);
  console.log(`  📊 taxes (T): ${T.toLocaleString()}원`);
  console.log(`  📊 capex (C): ${safeC.toLocaleString()}원`);
  console.log(`  📊 eviction (E): ${safeE.toLocaleString()}원`);
  console.log(`  📊 carrying (K): ${safeK.toLocaleString()}원`);
  console.log(`  📊 contingency (U): ${safeU.toLocaleString()}원`);
  console.log(`  ✅ totalAcquisition (A = B+R+T+C+E+K+U): ${totalAcquisition.toLocaleString()}원`);
  console.log(`  📊 marketValue (V): ${safeV.toLocaleString()}원${typeof V === "string" ? " (문자열에서 파싱됨)" : ""}`);
  console.log(`  ✅ marginAmount (V-A): ${marginAmount.toLocaleString()}원 (${(marginRate * 100).toFixed(2)}%)`);

  // 7️⃣ 계산식 검증 로그
  console.log("⚖️ [calcAcquisitionAndMoS] 계산식 검증:");
  console.log(`  - A = B + R + T + C + E + K + U`);
  console.log(`  - A = ${safeB.toLocaleString()} + ${safeR.toLocaleString()} + ${T.toLocaleString()} + ${safeC.toLocaleString()} + ${safeE.toLocaleString()} + ${safeK.toLocaleString()} + ${safeU.toLocaleString()}`);
  console.log(`  - A = ${totalAcquisition.toLocaleString()}원`);
  console.log(`  - marginAmount = V - A`);
  console.log(`  - marginAmount = ${safeV.toLocaleString()} - ${totalAcquisition.toLocaleString()}`);
  console.log(`  - marginAmount = ${marginAmount.toLocaleString()}원`);

  return {
    tax,
    totalAcquisition,
    marginAmount,
    marginRate,
    marketPriceUsed: safeV,
    marketPriceScenario: usedScenario,
    recommendedMaxBidPrice,
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

/** 안전마진 계산 함수 (시세와 총비용 기반) */
export function calcSafetyMargin(
  marketValue: string | number,
  totalCost: string | number
): { totalCost: number; safetyMargin: number; safetyRate: number } {
  console.log("💰 [안전마진 계산] calcSafetyMargin 시작");
  console.log("marketValue type:", typeof marketValue, marketValue);
  console.log(
    `  - marketValue 입력: ${
      typeof marketValue === "string"
        ? `"${marketValue}"`
        : marketValue.toLocaleString()
    }`
  );
  console.log(
    `  - totalCost 입력: ${
      typeof totalCost === "string"
        ? `"${totalCost}"`
        : totalCost.toLocaleString()
    }`
  );

  // 콤마와 '원' 문자를 모두 제거한 후 숫자로 변환
  const V = toKRWNumber(marketValue);
  const A = toKRWNumber(totalCost);

  console.log(`  - marketValue 파싱 후: ${V.toLocaleString()}원`);
  console.log(`  - totalCost 파싱 후: ${A.toLocaleString()}원`);

  // ✅ 안전마진 계산: marketValue - totalCost (시세에서 총비용을 뺀 값)
  // 양수면 이익, 음수면 손실
  const margin = V - A;
  // ✅ 안전마진율 계산: (안전마진 / 시세) * 100
  const rate = V > 0 ? (margin / V) * 100 : 0;

  console.log(
    `  ✅ 안전마진: ${margin.toLocaleString()}원 (${rate.toFixed(2)}%)`
  );

  return { totalCost: A, safetyMargin: margin, safetyRate: rate };
}
