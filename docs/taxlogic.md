// src/lib/auctionCost.ts

/** 용도 구분 */
export type PropertyUse = 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND';

/** 세금 계산 시 입력(필수) */
export interface TaxInput {
  use: PropertyUse;      // 용도
  price: number;         // 과세표준(보통 낙찰가, B)
  region?: string;       // 선택: 지자체명(표시에만 사용)
  // 주택 세율 가중치 관련(필요시 사용)
  householdHomes?: number;      // 세대 보유주택수(1,2,3…)
  regulatedArea?: boolean;      // 조정대상지역 여부
}

/** 세금 프리셋/옵션 (필요 시 덮어쓰기) */
export interface TaxOptions {
  // 기본 세율
  acquisitionTaxRate?: number;         // 취득세율
  localEduOnAcqRate?: number;          // 취득세 부가 지방교육세율(보통 10%)
  ruralSpecialTaxRate?: number;        // 농어촌특별세율(토지/상가 상황에 따라 적용)
  registryTaxRate?: number;            // 등록면허세율(보통 0.2%)
  localEduOnRegistryRate?: number;     // 등록면허세 부가 지방교육세율(보통 20%)

  // 인지세(인지대) 구간표(낙찰가 기준, 금액은 예시. 반드시 지역 최신 고시 확인)
  // 예: [ { lt: 100_000_000, duty: 50_000 }, { lt: 1_000_000_000, duty: 150_000 }, { lt: Infinity, duty: 350_000 } ]
  stampDutyTable?: Array<{ lt: number; duty: number }>;

  // 실비/수수료(세금은 아니지만 총투입비 반영 목적)
  lawFirmFee?: number;       // 법무사 등기대행 수수료
  courtFees?: number;        // 법원 인지/송달 등 경매 절차 비용(필요 시)
}

/** 세금 계산 결과(내역 분해) */
export interface TaxBreakdown {
  acquisitionTax: number;        // 취득세
  localEduOnAcq: number;         // 취득세 부가 지방교육세
  ruralSpecialTax: number;       // 농어촌특별세
  registryTax: number;           // 등록면허세
  localEduOnRegistry: number;    // 등록면허세 부가 지방교육세
  stampDuty: number;             // 인지세(인지대)
  lawFirmFee: number;            // 법무사 수수료(옵션)
  courtFees: number;             // 법원비용(옵션)
  totalTaxesAndFees: number;     // 위 항목 합계
}

/** 총인수금액/안전마진을 위한 입력 */
export interface AcquisitionInput {
  bidPrice: number;    // B: 입찰가(낙찰가 가정)
  rights: number;      // R: 인수권리 총합
  capex: number;       // C: 수리/개보수
  eviction: number;    // E: 명도비
  carrying: number;    // K: 보유/이자/관리비(예상 보유기간 기준)
  contingency: number; // U: 예비비
  marketValue: number; // V: 시세(보수적)
  taxInput: TaxInput;  // 세금 산출용
  taxOptions?: TaxOptions; // 세율/표/수수료 덮어쓰기
}

/** 총액/마진 결과 */
export interface AcquisitionResult {
  tax: TaxBreakdown;
  totalAcquisition: number;   // A = B + R + T + C + E + K + U
  marginAmount: number;       // V - A
  marginRate: number;         // (V - A) / V
}

/** 금액 반올림 도우미 (만원/천원 단위 등 필요 시 교체) */
const roundTo = (n: number, unit: number) =>
  Math.round(n / unit) * unit;

/** 기본 인지세 테이블 (예시) — 반드시 최신 고시 확인 후 교체하세요.
 *  - 1억 이하: 50,000
 *  - 1억 초과~10억: 150,000
 *  - 10억 초과: 350,000
 */
const DEFAULT_STAMP_DUTY_TABLE: Array<{ lt: number; duty: number }> = [
  { lt: 100_000_000, duty: 50_000 },
  { lt: 1_000_000_000, duty: 150_000 },
  { lt: Infinity, duty: 350_000 },
];

/** 용도별 기본 세율 프리셋(보편 사례, 지자체·정책에 따라 상이할 수 있음) */
function presetRates(input: TaxInput): Required<TaxOptions> {
  const { use } = input;

  // 공통 기본값
  let acquisitionTaxRate = 0.04;       // 비주택 기본 4%
  let localEduOnAcqRate = 0.10;        // 취득세 부가 10%
  let ruralSpecialTaxRate = 0.0;       // 상황별
  const registryTaxRate = 0.002;       // 등록면허세 0.2%
  const localEduOnRegistryRate = 0.20; // 등록면허 부가 20%
  const stampDutyTable = DEFAULT_STAMP_DUTY_TABLE;
  const lawFirmFee = 400_000;          // 실무 평균치 예시
  const courtFees = 100_000;           // 경매 절차비 예시

  if (use === 'RESIDENTIAL') {
    // [주택] 1세대 1주택 보편 구간 예시: 6억 이하 1%, 6~9억 2%, 9억 초과 3%
    // 실제로는 다주택/조정대상지역 가산세율이 존재. 최소 로직만 반영.
    const p = input.price;
    if (p <= 600_000_000) acquisitionTaxRate = 0.01;
    else if (p <= 900_000_000) acquisitionTaxRate = 0.02;
    else acquisitionTaxRate = 0.03;

    // 주택은 보통 농특세 미적용
    ruralSpecialTaxRate = 0.0;
  } else if (use === 'COMMERCIAL') {
    acquisitionTaxRate = 0.04;
    ruralSpecialTaxRate = 0.002; // 0.2% 예시(지자체 상이)
  } else if (use === 'LAND') {
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

/** 인지세(인지대) 계산 (단순 구간표) */
function calcStampDuty(price: number, table: Array<{ lt: number; duty: number }>): number {
  for (const row of table) {
    if (price < row.lt) return row.duty;
  }
  return table[table.length - 1].duty;
}

/** 세금/수수료 계산 */
export function calcTaxes(input: TaxInput, options?: TaxOptions): TaxBreakdown {
  const preset = presetRates(input);
  const opt = { ...preset, ...(options || {}) };

  const P = input.price;

  const acquisitionTax = roundTo(P * opt.acquisitionTaxRate, 10); // 10원 반올림
  const localEduOnAcq = roundTo(acquisitionTax * opt.localEduOnAcqRate, 10);
  const ruralSpecialTax = roundTo(P * opt.ruralSpecialTaxRate, 10);

  const registryTax = roundTo(P * opt.registryTaxRate, 10);
  const localEduOnRegistry = roundTo(registryTax * opt.localEduOnRegistryRate, 10);

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
export function calcAcquisitionAndMoS(input: AcquisitionInput): AcquisitionResult {
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

  // 세금은 낙찰가(B)를 과세표준으로 계산
  const tax = calcTaxes({ ...taxInput, price: B }, taxOptions);
  const T = tax.totalTaxesAndFees;

  const totalAcquisition = B + R + T + C + E + K + U; // A
  const marginAmount = V - totalAcquisition;
  const marginRate = V > 0 ? marginAmount / V : 0;

  return {
    tax,
    totalAcquisition,
    marginAmount,
    marginRate,
  };
}

/** 목표 마진율을 만족하는 "최대 입찰가" (세금이 B에 따라 변하므로 이분 탐색) */
export function findMaxBidByTargetRate(
  V: number,
  R: number, C: number, E: number, K: number, U: number,
  taxInput: Omit<TaxInput, 'price'>,
  targetMarginRate: number,
  taxOptions?: TaxOptions,
  // 탐색 범위/정밀도
  minBid = 1,               // 최소 1원
  maxBid = V,               // 시세 이하 범위에서 탐색(필요시 확장)
  epsilon = 1000            // 1,000원 정밀도
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

  // 불가능한 목표인지 빠르게 체크
  if (!meets(lo)) return 0; // 최저가도 목표 미달 → 불가능
  if (meets(hi)) return hi; // 최고가도 목표 충족 → 상한 그대로

  // 이분 탐색
  while (hi - lo > epsilon) {
    const mid = Math.floor((lo + hi) / 2);
    if (meets(mid)) lo = mid; else hi = mid;
  }
  return roundTo(lo, 10); // 10원 단위 반올림
}

/** 목표 마진 "금액" 기준 최대 입찰가(세금 의존성 고려, 이분 탐색) */
export function findMaxBidByTargetAmount(
  V: number,
  targetMarginAmount: number,
  R: number, C: number, E: number, K: number, U: number,
  taxInput: Omit<TaxInput, 'price'>,
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
    if (meets(mid)) lo = mid; else hi = mid;
  }
  return roundTo(lo, 10);
}
