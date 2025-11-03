# auction-engine-v0.2.md

> **목적**: v0.1 통합 엔진을 확장하여 **매물유형 9종 × 권리유형 15종**을 계산·리포트에 반영합니다.
> **핵심**: 유형별 FMV 보정(κ), 취득세율/명도비 기본값, 권리유형별 인수/소멸/리스크 판정, 위험 배지(`riskFlags`) 출력.
> **사용법**: 본 문서의 각 코드블록을 **경로 그대로 생성**하면 됩니다. (덮어쓰기 아님 → 교체 지점 명시)

---

## 0) 변경 요약 (v0.1 → v0.2)

* 매물유형 9종 반영: **아파트 / 오피스텔 / 단독주택 / 빌라 / 원룸 / 주택 / 다가구주택 / 근린주택 / 도시형생활주택**
* 권리유형 15종 반영: **근저당권 / 저당권 / 압류 / 가압류 / 담보가등기 / 소유권이전청구권가등기 / 가등기 / 예고등기 / 전세권 / 주택임차권 / 상가임차권 / 가처분 / 유치권 / 법정지상권 / 분묘기지권**
* `constants.auction.ts` 신설: 유형별 κ/세율/명도비, 권리규칙 테이블 관리
* `valuation.ts`: 유형별 κ 적용
* `rights-engine.ts`: 15개 권리 판정 + 임차권(주택/상가) 규칙 + 위험 배지
* `costs.ts`: 유형별 세율·명도비 + 위험 가산(유치권/법정지상권/분묘 등)
* `auction-engine.ts`: 모든 레이어 결과 + `riskFlags` 병합하여 리포트에 전달

---

## 1) 최종 파일 구조

```
src/
├─ lib/
│  ├─ auction-engine.ts          # (교체) 오케스트레이션 + riskFlags 병합
│  ├─ valuation.ts               # (교체) 유형별 κ 반영
│  ├─ rights/
│  │   └─ rights-engine.ts       # (교체) 15권리 판정 + 임차 규칙 + flags
│  ├─ costs.ts                   # (교체) 유형별 세율/명도비 + 위험 가산
│  ├─ profit.ts                  # (유지) 손익/안전마진
│  └─ constants.auction.ts       # (신규) 모든 규칙 상수
└─ types/
   └─ auction.ts                 # (교체) 타입 확장: PropertyType/RightType/RiskFlags
```

---

## 2) 규칙 테이블 — `src/lib/constants.auction.ts` (신규)

```ts
// src/lib/constants.auction.ts

export type PropertyTypeKorean =
  | "아파트" | "오피스텔" | "단독주택" | "빌라" | "원룸" | "주택" | "다가구주택" | "근린주택" | "도시형생활주택";

export type RightTypeKorean =
  | "근저당권" | "저당권" | "압류" | "가압류" | "담보가등기" | "소유권이전청구권가등기" | "가등기" | "예고등기"
  | "전세권" | "주택임차권" | "상가임차권" | "가처분" | "유치권" | "법정지상권" | "분묘기지권";

// ▶ FMV 보정 κ (감정가×κ ≈ FMV). 교육 목적 기본값.
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

// ▶ 취득세율(교육용 상향보수). 실제 과세와 다를 수 있음.
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

// ▶ 명도/기타 비용 기본값 (권리·임차 리스크 가중 전)
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

// ▶ 위험 배지 키
export type RiskFlagKey =
  | "소유권분쟁" | "상가임차" | "유치권" | "법정지상권" | "분묘" | "배당불명확" | "임차다수";

// ▶ 권리유형별 기본 판정/반영 템플릿
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

// ▶ 위험 가산비용(명도/기타) 계수
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
```

---

## 3) 타입 확장 — `src/types/auction.ts` (교체)

```ts
// src/types/auction.ts
import type { PropertyTypeKorean, RightTypeKorean, RiskFlagKey } from "@/lib/constants.auction";

export type Difficulty = "easy" | "normal" | "hard";

export interface Tenant {
  id: string;
  name?: string;
  deposit: number;
  moveInDate?: string;   // YYYY-MM-DD
  fixedDate?: string;    // YYYY-MM-DD
  hasOpposability?: boolean;
  isDefacto?: boolean;
  vacateRiskNote?: string;
  type?: "주택임차권" | "상가임차권" | "기타";
}

export interface RegisteredRight {
  id: string;
  type: RightTypeKorean;
  amount?: number;
  rankOrder?: number;
  establishedAt?: string;   // YYYY-MM-DD
  specialNote?: string;
}

export interface PropertySnapshot {
  caseId: string;
  propertyType: PropertyTypeKorean;
  regionCode?: string;
  appraisal?: number;
  minBid?: number;
  fmvHint?: number;
  rights: RegisteredRight[];
  tenants: Tenant[];
  dividendDeadline?: string; // YYYY-MM-DD
}

export interface ValuationInput {
  appraisal?: number;
  minBid?: number;
  fmvHint?: number;
  marketSignals?: Record<string, number>;
  propertyType?: PropertyTypeKorean;
  overrides?: Partial<{
    kappa: number; // 유형 기본 κ 대신 강제 적용
  }>;
}

export interface ValuationResult {
  fmv: number;
  appraisal: number;
  minBid: number;
  notes?: string[];
}

export interface RightAnalysisResult {
  malsoBase?: RegisteredRight | null;
  assumedRightsAmount: number;
  tenantFindings: Array<{
    tenantId: string;
    kind: "주택임차권" | "상가임차권" | "기타";
    opposability: "strong" | "weak" | "none";
    assumed: boolean;
    reason: string;
    depositAssumed: number;
  }>;
  rightFindings: Array<{
    rightId: string;
    type: RightTypeKorean;
    disposition: "소멸" | "인수" | "위험";
    assumed: boolean;
    reason: string;
    amountAssumed: number;
  }>;
  riskFlags: RiskFlagKey[];
  notes?: string[];
}

export interface CostInput {
  bidPrice: number;
  assumedRightsAmount: number;
  propertyType: PropertyTypeKorean;
  regionCode?: string;
  riskFlags?: RiskFlagKey[];
  overrides?: Partial<{
    acquisitionTaxRate: number;
    educationTaxRate: number;
    specialTaxRate: number;
    evictionCost: number;
    miscCost: number;
  }>;
}

export interface CostBreakdown {
  taxes: {
    acquisitionTax: number;
    educationTax: number;
    specialTax: number;
    totalTax: number;
  };
  evictionCost: number;
  miscCost: number;
  totalAcquisition: number;
  notes?: string[];
}

export interface ProfitInput {
  exitPrice?: number;
  fmv: number;
  totalAcquisition: number;
  bidPrice: number;
}

export interface ProfitResult {
  marginVsFMV: number;
  marginRateVsFMV: number;
  marginVsExit: number;
  marginRateVsExit: number;
  bePoint: number;
  notes?: string[];
}

export interface EngineOptions {
  difficulty?: Difficulty;
  devMode?: boolean;
  logPrefix?: string;
}

export interface EngineInput {
  snapshot: PropertySnapshot;
  userBidPrice: number;
  exitPriceHint?: number;
  valuationInput?: ValuationInput;
  options?: EngineOptions;
}

export interface EngineOutput {
  valuation: ValuationResult;
  rights: RightAnalysisResult;
  costs: CostBreakdown;
  profit: ProfitResult;
  safety: {
    fmv: { amount: number; rate: number };
    exit: { amount: number; rate: number };
    userBid: { amount: number; rate: number };
    overFMV: boolean;
  };
  riskFlags: RiskFlagKey[]; // 최종 병합된 위험 배지
  meta?: { engineVersion: string; generatedAt: string };
}
```

---

## 4) Valuation — `src/lib/valuation.ts` (교체)

```ts
// src/lib/valuation.ts
import {
  FMV_KAPPA_BY_TYPE,
  MINBID_ALPHA_DEFAULT,
  PropertyTypeKorean,
} from "./constants.auction";
import { ValuationInput, ValuationResult } from "@/types/auction";

export function estimateValuation(input: ValuationInput): ValuationResult {
  const notes: string[] = [];
  const fallbackFMV = 500_000_000;

  const pType: PropertyTypeKorean | undefined = input.propertyType as any;
  const kappa =
    input.overrides?.kappa ??
    (pType ? FMV_KAPPA_BY_TYPE[pType] : 0.90); // 유형별 κ, 없으면 0.90

  let appraisal = input.appraisal;
  let minBid = input.minBid;
  let fmv = input.fmvHint;

  if (!appraisal && !minBid) {
    if (!fmv) {
      fmv = fallbackFMV;
      notes.push("FMV 힌트 부재 → 교육용 기본 FMV 사용");
    }
    appraisal = Math.round((fmv as number) / kappa);
    minBid = Math.round(appraisal * MINBID_ALPHA_DEFAULT);
    notes.push(`감정가/최저가 부재 → FMV와 κ=${kappa.toFixed(2)}로 역산`);
  } else if (appraisal && !minBid) {
    minBid = Math.round(appraisal * MINBID_ALPHA_DEFAULT);
    notes.push(`최저가 부재 → 감정가×${MINBID_ALPHA_DEFAULT}로 산출`);
  } else if (!appraisal && minBid) {
    appraisal = Math.round(minBid / MINBID_ALPHA_DEFAULT);
    notes.push(`감정가 부재 → 최저가/ ${MINBID_ALPHA_DEFAULT} 로 산출`);
  }

  if (!fmv) {
    fmv = Math.round((appraisal as number) * kappa);
    notes.push(`FMV 부재 → 감정가 기반 κ=${kappa.toFixed(2)} 적용`);
  }

  // 시장 신호(1.0 기준) 보정(±10% 캡)
  if (input.marketSignals && Object.keys(input.marketSignals).length > 0) {
    const vals = Object.values(input.marketSignals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const factor = Math.max(0.9, Math.min(1.1, avg));
    fmv = Math.round((fmv as number) * factor);
    notes.push(`시장보정 적용(factor=${factor.toFixed(3)})`);
  }

  return {
    fmv: fmv as number,
    appraisal: appraisal as number,
    minBid: minBid as number,
    notes,
  };
}
```

---

## 5) Rights — `src/lib/rights/rights-engine.ts` (교체)

```ts
// src/lib/rights/rights-engine.ts
import {
  RIGHT_RULES,
  RightTypeKorean,
  RiskFlagKey,
} from "@/lib/constants.auction";
import {
  PropertySnapshot,
  RegisteredRight,
  RightAnalysisResult,
  Tenant,
} from "@/types/auction";

// 말소기준권리 후보 선택(담보성 권리 우선: 근저당/저당/담보가등기 등)
function pickMalsoBaseRight(rights: RegisteredRight[], dividendDeadline?: string) {
  if (!rights || rights.length === 0) return null;
  const collateral = new Set<RightTypeKorean>(["근저당권", "저당권", "담보가등기"]);
  const beforeDeadline = (r: RegisteredRight) => {
    if (!dividendDeadline || !r.establishedAt) return true;
    return r.establishedAt <= dividendDeadline;
  };
  const sorted = rights
    .filter(r => collateral.has(r.type))
    .filter(beforeDeadline)
    .sort((a, b) => {
      const ra = a.rankOrder ?? 9999, rb = b.rankOrder ?? 9999;
      if (ra !== rb) return ra - rb;
      const da = a.establishedAt ?? "9999-12-31";
      const db = b.establishedAt ?? "9999-12-31";
      return da.localeCompare(db);
    });
  return sorted[0] ?? null;
}

function comparePriority(a: RegisteredRight, b: RegisteredRight) {
  const ra = a.rankOrder ?? 9999, rb = b.rankOrder ?? 9999;
  if (ra !== rb) return ra - rb;
  const da = a.establishedAt ?? "9999-12-31";
  const db = b.establishedAt ?? "9999-12-31";
  return da.localeCompare(db);
}

function assessTenantOpposability(t: Tenant): "strong" | "weak" | "none" {
  if (t.hasOpposability) return "strong";
  if (t.moveInDate || t.fixedDate || t.isDefacto) return "weak";
  return "none";
}

export function analyzeRights(snapshot: PropertySnapshot): RightAnalysisResult {
  const { rights, tenants, dividendDeadline } = snapshot;
  const notes: string[] = [];
  const riskFlags = new Set<RiskFlagKey>();

  const malsoBase = pickMalsoBaseRight(rights, dividendDeadline);
  if (malsoBase) notes.push(`말소기준권리 후보: #${malsoBase.id} (${malsoBase.type})`);
  else notes.push("말소기준권리 판별 불가 → 보수적 판단 가중");

  // 1) 등기 권리 판정
  const rightFindings = rights.map(r => {
    const rule = RIGHT_RULES[r.type];
    let disposition = rule?.defaultDisposition ?? "소멸";
    let assumed = false;
    let reason = rule?.note ?? "";

    // 위험 배지 수집
    (rule?.riskFlags ?? []).forEach(flag => riskFlags.add(flag));

    // 말소기준권리와의 선후 판단
    if (malsoBase) {
      const cmp = comparePriority(r, malsoBase);
      if (cmp < 0) {
        // 선순위 → 인수 성향
        if (disposition === "소멸") disposition = "인수";
      }
    } else {
      // 기준 불명확 → 위험/인수 쪽으로 보수적 이동
      if (disposition === "소멸") disposition = "위험";
    }

    let amountAssumed = 0;
    switch (rule?.amountPolicy) {
      case "금액전액":
        assumed = disposition !== "소멸";
        amountAssumed = assumed ? Math.round(r.amount ?? 0) : 0;
        break;
      case "추정":
        // 금액 미정인 경우 0, 있으면 50% 추정(교육용)
        assumed = disposition !== "소멸";
        amountAssumed = assumed ? Math.round((r.amount ?? 0) * 0.5) : 0;
        break;
      case "시세감액":
        // 금전 반영 대신 리스크 플래그로 처리(비용은 costs에서 가산)
        assumed = false;
        break;
      case "금액없음":
      default:
        assumed = false;
    }

    if (!reason) {
      reason =
        disposition === "소멸"
          ? "말소 가정"
          : disposition === "인수"
          ? "선순위 또는 실권리 성향으로 인수"
          : "불확실/위험 권리";
    }

    return {
      rightId: r.id,
      type: r.type,
      disposition,
      assumed,
      reason,
      amountAssumed,
    };
  });

  // 2) 임차인 판정(주택/상가 구분)
  const tenantFindings = tenants.map(t => {
    const opp = assessTenantOpposability(t);
    const kind = (t.type ?? "기타") as "주택임차권" | "상가임차권" | "기타";
    let assumed = false;
    let factor = 0;
    let reason = "";

    if (kind === "상가임차권") riskFlags.add("상가임차");

    if (opp === "strong") {
      assumed = true;
      factor = 1.0;
      reason = "대항력 강함 → 보증금 인수";
    } else if (opp === "weak") {
      assumed = true;
      factor = kind === "상가임차권" ? 0.6 : 0.5; // 상가 조금 보수
      reason = "대항력 불명확 → 일부 인수(교육용 규칙)";
    } else {
      assumed = false;
      factor = 0;
      reason = "대항력 없음 → 배당소멸 가정";
    }

    return {
      tenantId: t.id,
      kind,
      opposability: opp,
      assumed,
      reason,
      depositAssumed: assumed ? Math.round(t.deposit * factor) : 0,
    };
  });

  // 임차 다수 플래그
  if (tenants.length >= 3) riskFlags.add("임차다수");

  // 합산
  const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
  const rightsSum = sum(rightFindings.map(f => f.amountAssumed));
  const tenantsSum = sum(tenantFindings.map(f => f.depositAssumed));
  const assumedRightsAmount = rightsSum + tenantsSum;

  // 위험 표식: 법정지상권/유치권/분묘 등 특정 권리가 존재할 경우
  for (const f of rightFindings) {
    if (f.type === "유치권") riskFlags.add("유치권");
    if (f.type === "법정지상권") riskFlags.add("법정지상권");
    if (f.type === "분묘기지권") riskFlags.add("분묘");
    if (f.type === "소유권이전청구권가등기" || f.type === "가등기" || f.type === "예고등기" || f.type === "가처분") {
      riskFlags.add("소유권분쟁");
    }
  }

  notes.push(
    `인수 권리 합계: 등기권리 ${rightsSum.toLocaleString()}원 + 임차 ${tenantsSum.toLocaleString()}원 = ${assumedRightsAmount.toLocaleString()}원`
  );

  return {
    malsoBase,
    assumedRightsAmount,
    tenantFindings,
    rightFindings,
    riskFlags: Array.from(riskFlags),
    notes,
  };
}
```

---

## 6) Costs — `src/lib/costs.ts` (교체)

```ts
// src/lib/costs.ts
import {
  ACQ_TAX_RATE_BY_TYPE,
  EDU_TAX_RATE,
  SPC_TAX_RATE,
  BASE_EVICTION_BY_TYPE,
  BASE_MISC_COST,
  RISK_EVICTION_ADD,
  RISK_MISC_ADD,
} from "@/lib/constants.auction";
import { CostBreakdown, CostInput } from "@/types/auction";

export function calcCosts(input: CostInput): CostBreakdown {
  const notes: string[] = [];
  const {
    bidPrice,
    assumedRightsAmount,
    propertyType,
    riskFlags = [],
    overrides,
  } = input;

  const acqRate =
    overrides?.acquisitionTaxRate ?? ACQ_TAX_RATE_BY_TYPE[propertyType];
  const eduRate = overrides?.educationTaxRate ?? EDU_TAX_RATE;
  const spcRate = overrides?.specialTaxRate ?? SPC_TAX_RATE;

  const acquisitionTax = Math.round(bidPrice * acqRate);
  const educationTax = Math.round(bidPrice * eduRate);
  const specialTax = Math.round(bidPrice * spcRate);
  const totalTax = acquisitionTax + educationTax + specialTax;

  // 기본 명도/기타
  let evictionCost = overrides?.evictionCost ?? BASE_EVICTION_BY_TYPE[propertyType];
  let miscCost = overrides?.miscCost ?? BASE_MISC_COST;

  // 위험 가산
  for (const f of riskFlags) {
    evictionCost += RISK_EVICTION_ADD[f] ?? 0;
    miscCost += RISK_MISC_ADD[f] ?? 0;
  }

  const totalAcquisition =
    bidPrice + assumedRightsAmount + totalTax + evictionCost + miscCost;

  notes.push(
    `세율: 취득 ${(acqRate * 100).toFixed(2)}%, 교육 ${(eduRate * 100).toFixed(2)}%, 농특 ${(spcRate * 100).toFixed(2)}%`
  );
  if (riskFlags.length > 0) {
    notes.push(`위험 가산 적용: ${riskFlags.join(", ")}`);
  }

  return {
    taxes: { acquisitionTax, educationTax, specialTax, totalTax },
    evictionCost,
    miscCost,
    totalAcquisition,
    notes,
  };
}
```

---

## 7) Profit — `src/lib/profit.ts` (유지)

```ts
// src/lib/profit.ts
import { ProfitInput, ProfitResult } from "@/types/auction";

export function evaluateProfit(input: ProfitInput): ProfitResult {
  const { fmv, totalAcquisition } = input;
  const exit = input.exitPrice ?? fmv;

  const marginVsFMV = Math.round(fmv - totalAcquisition);
  const marginRateVsFMV = fmv > 0 ? marginVsFMV / fmv : 0;

  const marginVsExit = Math.round(exit - totalAcquisition);
  const marginRateVsExit = exit > 0 ? marginVsExit / exit : 0;

  const bePoint = totalAcquisition;

  return {
    marginVsFMV,
    marginRateVsFMV,
    marginVsExit,
    marginRateVsExit,
    bePoint,
    notes: [
      `손익분기점(매도기준): ${bePoint.toLocaleString()}원`,
      `FMV 대비 마진: ${marginVsFMV.toLocaleString()}원 (${(marginRateVsFMV * 100).toFixed(2)}%)`,
      `Exit 대비 마진: ${marginVsExit.toLocaleString()}원 (${(marginRateVsExit * 100).toFixed(2)}%)`,
    ],
  };
}
```

---

## 8) Orchestration — `src/lib/auction-engine.ts` (교체)

```ts
// src/lib/auction-engine.ts
import { estimateValuation } from "./valuation";
import { analyzeRights } from "./rights/rights-engine";
import { calcCosts } from "./costs";
import { evaluateProfit } from "./profit";
import {
  EngineInput,
  EngineOutput,
} from "@/types/auction";

/**
 * v0.2: 유형별 κ/세율/명도비, 권리 15종 판정, 위험 배지 병합
 */
export function auctionEngine(input: EngineInput): EngineOutput {
  const { snapshot, userBidPrice, exitPriceHint, valuationInput, options } = input;
  const log = (...args: any[]) => {
    if (options?.devMode) {
      const p = options?.logPrefix ?? "🧠 [ENGINE]";
      // eslint-disable-next-line no-console
      console.log(p, ...args);
    }
  };

  // 1) Valuation (유형별 κ 반영)
  const valuation = estimateValuation({
    appraisal: snapshot.appraisal,
    minBid: snapshot.minBid,
    fmvHint: snapshot.fmvHint ?? valuationInput?.fmvHint,
    marketSignals: valuationInput?.marketSignals,
    propertyType: snapshot.propertyType,
    overrides: valuationInput?.overrides,
  });
  log("📐 valuation", valuation);

  // 2) Rights (15권리 판정 + 임차 규칙 + riskFlags)
  const rights = analyzeRights(snapshot);
  log("⚖️ rights", rights);

  // 3) Costs (유형별 세율/명도비 + 위험 가산)
  const costs = calcCosts({
    bidPrice: userBidPrice,
    assumedRightsAmount: rights.assumedRightsAmount,
    propertyType: snapshot.propertyType,
    regionCode: snapshot.regionCode,
    riskFlags: rights.riskFlags,
    overrides: valuationInput?.overrides as any,
  });
  log("💰 costs", costs);

  // 4) Profit / Safety
  const profit = evaluateProfit({
    exitPrice: exitPriceHint,
    fmv: valuation.fmv,
    totalAcquisition: costs.totalAcquisition,
    bidPrice: userBidPrice,
  });
  log("📊 profit", profit);

  const safety = {
    fmv: {
      amount: valuation.fmv - costs.totalAcquisition,
      rate: valuation.fmv > 0 ? (valuation.fmv - costs.totalAcquisition) / valuation.fmv : 0,
    },
    exit: {
      amount: (exitPriceHint ?? valuation.fmv) - costs.totalAcquisition,
      rate:
        (exitPriceHint ?? valuation.fmv) > 0
          ? ((exitPriceHint ?? valuation.fmv) - costs.totalAcquisition) /
            (exitPriceHint ?? valuation.fmv)
          : 0,
    },
    userBid: {
      amount: valuation.fmv - userBidPrice,
      rate: valuation.fmv > 0 ? (valuation.fmv - userBidPrice) / valuation.fmv : 0,
    },
    overFMV: userBidPrice > valuation.fmv,
  };
  log("🧯 safety", safety);

  return {
    valuation,
    rights,
    costs,
    profit,
    safety,
    riskFlags: rights.riskFlags,
    meta: { engineVersion: "v0.2", generatedAt: new Date().toISOString() },
  };
}
```

---

## 9) UI 리포트 확장 가이드

* **기존 안전마진 컴포넌트**는 변경 없이 `result.safety` 그대로 사용하시면 됩니다.
* **위험 배지 표시**: `result.riskFlags` 배열을 배지로 노출하십시오.

  * 예: `소유권분쟁`, `상가임차`, `유치권`, `법정지상권`, `분묘`, `배당불명확`, `임차다수`
* **권리 상세 테이블**: `rights.rightFindings`에 `disposition(소멸/인수/위험)`과 `amountAssumed`가 포함됩니다.
* **명도/기타 비용 설명**: `costs.notes`에 “위험 가산 적용: …” 문구가 포함되므로, 하단에 그대로 표시하면 사용자가 원인-결과를 연결해 이해할 수 있습니다.

---

## 10) v0.1 → v0.2 마이그레이션 체크리스트

1. `constants.auction.ts` 추가
2. `types/auction.ts` 교체(유형/권리/flags 확장)
3. `valuation.ts`, `rights/rights-engine.ts`, `costs.ts`, `auction-engine.ts` 교체
4. 컴포넌트에서 **새 엔진만 임포트**: `import { auctionEngine } from "@/lib/auction-engine"`
5. 리포트 UI에 위험 배지(`riskFlags`) 섹션 추가(선택)

---

## 11) 스모크 테스트 샘플

```ts
import { auctionEngine } from "@/lib/auction-engine";

const snapshot = {
  caseId: "2025타경-0001",
  propertyType: "근린주택",
  appraisal: 900_000_000,
  minBid: 720_000_000,
  rights: [
    { id: "r1", type: "근저당권", amount: 300_000_000, rankOrder: 2, establishedAt: "2022-03-01" },
    { id: "r2", type: "담보가등기", amount: 80_000_000, rankOrder: 1, establishedAt: "2021-11-11" },
    { id: "r3", type: "예고등기" },
    { id: "r4", type: "상가임차권", amount: 50_000_000, rankOrder: 3 },
  ],
  tenants: [
    { id: "t1", type: "상가임차권", deposit: 50_000_000, hasOpposability: true },
    { id: "t2", type: "주택임차권", deposit: 30_000_000, moveInDate: "2023-01-10" },
  ],
};

const out = auctionEngine({
  snapshot: snapshot as any,
  userBidPrice: 760_000_000,
  options: { devMode: true, logPrefix: "🏗️ [BidMaster]" },
});

console.log(out.safety, out.riskFlags, out.costs);
```

---

이로써 **v0.2 통합 엔진**이 완성되었습니다.
우선 v0.1을 먼저 빌드해 정상 동작을 확인하신 뒤, 상기 파일들을 적용하시면 **유형/권리 확장판**으로 즉시 전환 가능합니다.
다음 단계로 **테스트 케이스(3~5종)** 와 **UI 배지 디자인 가이드**가 필요하시면 이어서 제공해 드리겠습니다.
