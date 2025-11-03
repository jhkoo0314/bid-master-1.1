# auction-engine-v0.1.md

> **목적**: 파편화된 계산 로직을 제거하고, `auction-engine.ts` 단일 진입점으로 **시세/감정가/최저가 → 권리/임차인 분석 → 세금/명도/부대비용 → 총인수금액 → 안전마진/수익**을 일관되게 산출합니다.
> **모드**: R-Mode(현실형 권리분석).
> **출력**: 본 문서의 코드 블록을 그대로 복사-생성하면 동작합니다.

---

## 1) 개요

* 본 엔진은 다음 4개 레이어로 구성됩니다.

  1. **Valuation**: FMV(공정 시세), 감정가, 최저가 산출
  2. **Rights**: 말소기준권리·대항력·배당요구 종기 고려한 인수권리 계산
  3. **Costs**: 세금·명도·부대비용 산출 후 **총인수금액** 계산
  4. **Profit**: FMV/Exit 기준 안전마진, 손익분기점 등 수익성 평가
* 모든 상위 소비 코드는 `src/lib/auction-engine.ts`만 import하면 됩니다.

---

## 2) 최종 파일 구조

```
src/
├─ lib/
│  ├─ auction-engine.ts          # ★ 단일 진입점(오케스트레이션)
│  ├─ valuation.ts               # 시세/감정가/최저가 레이어
│  ├─ rights/
│  │   └─ rights-engine.ts       # 권리/임차인 분석 레이어(R-Mode)
│  ├─ costs.ts                   # 세금/명도/부대비용 + 총인수금액
│  ├─ profit.ts                  # 수익/ROI/손익 분석
│  └─ (기존 파편 파일 제거: auction-cost.ts, profit-calculator.ts 등)
└─ types/
   └─ auction.ts                 # ★ 통합 타입 정의
```

> **주의**: 기존 `auction-cost.ts`, `profit-calculator.ts`, `rights-analysis-engine.ts`, `property/market-price.ts`, 구(舊) `auction-engine.ts`는 사용 중 참조를 끊고 삭제하십시오.

---

## 3) 엔진 흐름(순서)

1. `estimateValuation()` → **fmv/appraisal/minBid**
2. `analyzeRights()` → **assumedRightsAmount** 및 상세 판정
3. `calcCosts()` → **총인수금액(totalAcquisition)**
4. `evaluateProfit()` → **안전마진/수익**
5. `auctionEngine()`에서 통합 결과와 로그 출력

---

## 4) 통합 타입 정의 — `src/types/auction.ts`

```ts
// src/types/auction.ts
export type Difficulty = "easy" | "normal" | "hard";

export interface Tenant {
  id: string;
  name?: string;
  deposit: number;                // 임차보증금
  moveInDate?: string;            // 전입일 (YYYY-MM-DD)
  fixedDate?: string;             // 확정일자 (YYYY-MM-DD)
  hasOpposability?: boolean;      // 대항력(전입+점유) 여부 (없으면 엔진이 추정)
  isDefacto?: boolean;            // 사실상 임차(추정치)
  vacateRiskNote?: string;        // 명도 리스크 메모
}

export type RightType =
  | "mortgage"        // 근저당권
  | "pledge"          // 질권/가압류 등 금전담보성
  | "lease"           // 임차권(대항력/확정일자 중요)
  | "liens"           // 유치권/법정지상권 등
  | "superiorEtc";    // 가등기/가처분 등 선순위 가능성

export interface RegisteredRight {
  id: string;
  type: RightType;
  amount?: number;               // 피담보채권액/보증금 등
  rankOrder?: number;            // 등기부 순위(작을수록 선순위)
  establishedAt?: string;        // 설정일
  specialNote?: string;          // 특기사항(법정지상권 추정 등)
}

export interface PropertySnapshot {
  caseId: string;
  propertyType: "apartment" | "officetel" | "villa" | "land" | "commercial" | string;
  regionCode?: string;
  appraisal?: number;        // 감정가(있을 경우)
  minBid?: number;           // 최저가(있을 경우)
  fmvHint?: number;          // FMV 힌트(있을 경우)
  rights: RegisteredRight[];
  tenants: Tenant[];
  dividendDeadline?: string; // 배당요구종기일
}

export interface ValuationInput {
  appraisal?: number;
  minBid?: number;
  fmvHint?: number;
  marketSignals?: Record<string, number>; // 외부 지표 보정(선택): 1.0 기준
  propertyType?: string;
}

export interface ValuationResult {
  fmv: number;            // Fair Market Value
  appraisal: number;      // 감정가
  minBid: number;         // 최저가
  notes?: string[];
}

export interface RightAnalysisResult {
  malsoBase?: RegisteredRight | null; // 말소기준권리
  assumedRightsAmount: number;        // 인수 권리 총액(임차보증금 포함)
  tenantFindings: Array<{
    tenantId: string;
    opposability: "strong" | "weak" | "none";
    assumed: boolean;                 // 인수 대상 여부
    reason: string;
    depositAssumed: number;           // 해당 임차인으로 인수되는 금액
  }>;
  rightFindings: Array<{
    rightId: string;
    assumed: boolean;
    reason: string;
    amountAssumed: number;
  }>;
  notes?: string[];
}

export interface CostInput {
  bidPrice: number;           // 사용자 입찰가(또는 낙찰가)
  assumedRightsAmount: number;
  propertyType?: string;
  regionCode?: string;

  // 선택적 오버라이드
  overrides?: Partial<{
    acquisitionTaxRate: number;       // 취득세율(기본은 타입별 내장)
    educationTaxRate: number;
    specialTaxRate: number;
    evictionCost: number;             // 명도비(기본: 리스크 기반 추정)
    miscCost: number;                 // 법무/등기/기타
  }>;
}

export interface CostBreakdown {
  taxes: {
    acquisitionTax: number;
    educationTax: number;
    specialTax: number;
    totalTax: number;
  };
  evictionCost: number;      // 명도 비용(추정)
  miscCost: number;          // 기타 부대비용
  totalAcquisition: number;  // 총인수금액 = bid + rights + taxes.total + eviction + misc
  notes?: string[];
}

export interface ProfitInput {
  exitPrice?: number;     // 보수적 처분가(없으면 FMV 사용)
  fmv: number;            // FMV
  totalAcquisition: number;
  bidPrice: number;
}

export interface ProfitResult {
  marginVsFMV: number;       // FMV - 총인수금액
  marginRateVsFMV: number;   // margin / FMV (음수 가능)
  marginVsExit: number;      // Exit - 총인수금액
  marginRateVsExit: number;
  bePoint: number;           // 손익분기점 가격(총인수금액)
  notes?: string[];
}

export interface EngineOptions {
  difficulty?: Difficulty;
  devMode?: boolean;
  logPrefix?: string; // 로그 접두사
}

export interface EngineInput {
  snapshot: PropertySnapshot;
  userBidPrice: number;         // 사용자 입력 입찰가
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
    userBid: { amount: number; rate: number }; // FMV - bid
    overFMV: boolean;
  };
}
```

---

## 5) Valuation — `src/lib/valuation.ts`

```ts
// src/lib/valuation.ts
import { ValuationInput, ValuationResult } from "@/types/auction";

/**
 * v0.1 규칙:
 * - appraisal, minBid 둘 다 없으면 fmvHint 또는 기본 FMV로 역산
 * - appraisal만 있으면 minBid = appraisal * 0.8
 * - minBid만 있으면 appraisal = minBid / 0.8
 * - FMV 없으면 appraisal 기반 κ=0.91로 산정(교육 목적상 보수적)
 * - marketSignals(1.0 기준)의 평균값으로 최종 FMV를 소폭 보정(±10% 캡)
 */
export function estimateValuation(input: ValuationInput): ValuationResult {
  const notes: string[] = [];
  const kFromAppraisal = 0.91;
  const fallbackFMV = 500_000_000;

  let appraisal = input.appraisal;
  let minBid = input.minBid;
  let fmv = input.fmvHint;

  if (!appraisal && !minBid) {
    if (!fmv) {
      fmv = fallbackFMV;
      notes.push("FMV 힌트 부재 → 교육용 기본 FMV 사용");
    }
    appraisal = Math.round((fmv as number) / kFromAppraisal);
    minBid = Math.round(appraisal * 0.8);
    notes.push("감정가/최저가 부재 → FMV로 역산(appraisal, minBid)");
  } else if (appraisal && !minBid) {
    minBid = Math.round(appraisal * 0.8);
    notes.push("최저가 부재 → 감정가×0.8로 산출");
  } else if (!appraisal && minBid) {
    appraisal = Math.round(minBid / 0.8);
    notes.push("감정가 부재 → 최저가/0.8로 산출");
  }

  if (!fmv) {
    fmv = Math.round((appraisal as number) * kFromAppraisal);
    notes.push("FMV 부재 → 감정가 기반 κ=0.91 적용");
  }

  // marketSignals 보정(1.0 기준, ±10% 캡)
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

## 6) Rights — `src/lib/rights/rights-engine.ts`

```ts
// src/lib/rights/rights-engine.ts
import {
  PropertySnapshot,
  RegisteredRight,
  RightAnalysisResult,
  Tenant,
} from "@/types/auction";

/**
 * R-Mode(현실형):
 * - 말소기준권리: 배당요구종기일 이전 설정된 최선순위 담보성 권리(근저당 등)를 우선 후보
 * - 등기부 순위(rankOrder)와 설정일(establishedAt)을 함께 참고(둘 중 하나만 있어도 작동)
 * - 말소기준권리보다 '선순위' 권리는 인수 대상(소멸 안 됨)으로 가정
 * - 임차인: 대항력(전입+점유)과 확정일자 여부에 따라 인수/배당 구분(간이 규칙)
 * - 세부 판례/예외는 v>0.1에서 확장
 */

function pickMalsoBaseRight(rights: RegisteredRight[], dividendDeadline?: string) {
  if (!rights || rights.length === 0) return null;

  // 담보성 권리 우선 후보
  const collateralTypes = new Set(["mortgage", "pledge", "superiorEtc"]);
  const candidates = rights.filter(r => collateralTypes.has(r.type));

  // 배당요구종기일 이전 설정 + 가장 선순위
  const beforeDeadline = (r: RegisteredRight) => {
    if (!dividendDeadline || !r.establishedAt) return true;
    return r.establishedAt <= dividendDeadline;
  };

  const sorted = candidates
    .filter(beforeDeadline)
    .sort((a, b) => {
      const ra = a.rankOrder ?? 9999;
      const rb = b.rankOrder ?? 9999;
      if (ra !== rb) return ra - rb;
      const da = a.establishedAt ?? "9999-12-31";
      const db = b.establishedAt ?? "9999-12-31";
      return da.localeCompare(db);
    });

  return sorted[0] ?? null;
}

function comparePriority(a: RegisteredRight, b: RegisteredRight) {
  // a가 b보다 선순위이면 음수
  const ra = a.rankOrder ?? 9999;
  const rb = b.rankOrder ?? 9999;
  if (ra !== rb) return ra - rb;

  const da = a.establishedAt ?? "9999-12-31";
  const db = b.establishedAt ?? "9999-12-31";
  return da.localeCompare(db);
}

function assessTenantOpposability(t: Tenant): "strong" | "weak" | "none" {
  // 간이 규칙: 전입일 + 점유(여기서는 hasOpposability true로 대체) 있으면 strong
  if (t.hasOpposability) return "strong";
  // 전입 또는 확정일자 중 1개만 있거나, 사실상 임차 추정이면 weak
  if (t.moveInDate || t.fixedDate || t.isDefacto) return "weak";
  return "none";
}

export function analyzeRights(snapshot: PropertySnapshot): RightAnalysisResult {
  const { rights, tenants, dividendDeadline } = snapshot;
  const notes: string[] = [];

  const malsoBase = pickMalsoBaseRight(rights, dividendDeadline);
  if (malsoBase) notes.push(`말소기준권리 후보: #${malsoBase.id} (${malsoBase.type})`);
  else notes.push("말소기준권리 판별 불가 → 보수적(인수 확장) 가정");

  // 1) 등기 권리 인수 판정
  const rightFindings = rights.map(r => {
    let assumed = false;
    let reason = "후순위로 추정되어 소멸";

    if (!malsoBase) {
      // 말소기준 미판별 → 보수적: 담보성/특수권리는 인수로 가중
      const conservative = r.type === "liens" || r.type === "superiorEtc";
      assumed = conservative;
      reason = conservative ? "말소기준 불명확 → 특수/선순위 가능성으로 인수" : "말소 가능성";
    } else {
      // malsoBase보다 선순위면 인수
      const cmp = comparePriority(r, malsoBase);
      if (cmp < 0) {
        assumed = true;
        reason = "말소기준권리보다 선순위 → 인수";
      }
    }

    const amountAssumed = assumed ? (r.amount ?? 0) : 0;
    return { rightId: r.id, assumed, reason, amountAssumed };
  });

  // 2) 임차인 인수 판정(간이 규칙)
  const tenantFindings = tenants.map(t => {
    const opp = assessTenantOpposability(t);
    let assumed = false;
    let reason = "대항력 약함/배당으로 소멸 가정";

    if (opp === "strong") {
      assumed = true;
      reason = "대항력 강함(전입+점유) → 보증금 인수";
    } else if (opp === "weak") {
      // 종기/확정일자 등의 조합이 불충분 → 케이스에 따라 일부 인수 가능성
      // v0.1: 교육 목적상 보수적으로 50% 인수(추정) → 명확 데이터 있으면 개선
      assumed = true;
      reason = "대항력 불명확 → 보수적 일부 인수(교육용 규칙)";
    }

    const depositAssumed =
      assumed ? Math.round(t.deposit * (opp === "weak" ? 0.5 : 1.0)) : 0;

    return {
      tenantId: t.id,
      opposability: opp,
      assumed,
      reason,
      depositAssumed,
    };
  });

  // 합산
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const rightsSum = sum(rightFindings.map(f => f.amountAssumed));
  const tenantsSum = sum(tenantFindings.map(f => f.depositAssumed));
  const assumedRightsAmount = rightsSum + tenantsSum;

  notes.push(
    `인수 권리 합계: 등기권리 ${rightsSum.toLocaleString()}원 + 임차 ${tenantsSum.toLocaleString()}원 = ${assumedRightsAmount.toLocaleString()}원`
  );

  return {
    malsoBase,
    assumedRightsAmount,
    tenantFindings,
    rightFindings,
    notes,
  };
}
```

---

## 7) Costs — `src/lib/costs.ts`

```ts
// src/lib/costs.ts
import { CostBreakdown, CostInput } from "@/types/auction";

/**
 * v0.1 세율(교육용 기본값):
 * - 취득세율: 주거 1.1% ~ 4.0% 구간이나, 교육 목적으로 기본 1.1% 적용
 * - 교육세/농특세: 단순화하여 각각 취득세의 0.1%/0.2%로 가정(합 0.3%p)
 * - 명도비: 임차 리스크에 따라 3,000,000 ~ 6,000,000 기본 추천(상위에서 전달 권장)
 * - 기타비용: 1,000,000 (법무/등기 등) 기본
 *
 * 실제 세율과 상이할 수 있으므로, 상위에서 overrides로 정확 데이터 주입 권장.
 */

function pickBaseAcqTaxRate(propertyType?: string) {
  // 간이 구분(추후 정교화 가능)
  if (propertyType === "land" || propertyType === "commercial") return 0.02; // 2.0%
  return 0.011; // 주거 1.1%
}

export function calcCosts(input: CostInput): CostBreakdown {
  const notes: string[] = [];
  const { bidPrice, assumedRightsAmount, propertyType, overrides } = input;

  const acqRate =
    overrides?.acquisitionTaxRate ?? pickBaseAcqTaxRate(propertyType); // 기본 1.1% or 2.0%
  const eduRate = overrides?.educationTaxRate ?? 0.001;  // 0.1%
  const spcRate = overrides?.specialTaxRate ?? 0.002;    // 0.2%

  const acquisitionTax = Math.round(bidPrice * acqRate);
  const educationTax = Math.round(bidPrice * eduRate);
  const specialTax = Math.round(bidPrice * spcRate);
  const totalTax = acquisitionTax + educationTax + specialTax;

  const evictionCost = overrides?.evictionCost ?? 3_000_000; // 기본 300만원
  const miscCost = overrides?.miscCost ?? 1_000_000;          // 기본 100만원

  const totalAcquisition =
    bidPrice + assumedRightsAmount + totalTax + evictionCost + miscCost;

  notes.push(
    `세율: 취득 ${(
      acqRate * 100
    ).toFixed(2)}%, 교육 ${(eduRate * 100).toFixed(2)}%, 농특 ${(spcRate * 100).toFixed(2)}%`
  );

  return {
    taxes: {
      acquisitionTax,
      educationTax,
      specialTax,
      totalTax,
    },
    evictionCost,
    miscCost,
    totalAcquisition,
    notes,
  };
}
```

---

## 8) Profit — `src/lib/profit.ts`

```ts
// src/lib/profit.ts
import { ProfitInput, ProfitResult } from "@/types/auction";

/**
 * v0.1:
 * - marginVsFMV  = FMV  - 총인수금액
 * - marginVsExit = Exit - 총인수금액 (Exit 없으면 FMV 사용)
 * - bePoint = 총인수금액 (손익분기점 가격)
 */
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

## 9) Orchestration — `src/lib/auction-engine.ts`

```ts
// src/lib/auction-engine.ts
import {
  EngineInput,
  EngineOutput,
} from "@/types/auction";
import { estimateValuation } from "./valuation";
import { analyzeRights } from "./rights/rights-engine";
import { calcCosts } from "./costs";
import { evaluateProfit } from "./profit";

/**
 * 단일 진입점:
 * - 입력: EngineInput(스냅샷, 사용자 입찰가, 옵션/힌트)
 * - 출력: EngineOutput(valuation/rights/costs/profit/safety)
 * - 로그: options.devMode === true 일 때 핵심 로그 출력
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

  // 1) 평가 레이어
  const valuation = estimateValuation({
    appraisal: snapshot.appraisal,
    minBid: snapshot.minBid,
    fmvHint: snapshot.fmvHint ?? valuationInput?.fmvHint,
    marketSignals: valuationInput?.marketSignals,
    propertyType: snapshot.propertyType,
  });
  log("📐 valuation", valuation);

  // 2) 권리/임차인 레이어
  const rights = analyzeRights(snapshot);
  log("⚖️ rights", rights);

  // 3) 비용 레이어(총인수금액)
  const costs = calcCosts({
    bidPrice: userBidPrice,
    assumedRightsAmount: rights.assumedRightsAmount,
    propertyType: snapshot.propertyType,
    regionCode: snapshot.regionCode,
    overrides: valuationInput as any, // 선택: 상위에서 세율/명도/기타 비용을 여기에 넘길 수도 있음
  });
  log("💰 costs", costs);

  // 4) 수익/안전마진
  const profit = evaluateProfit({
    exitPrice: exitPriceHint,
    fmv: valuation.fmv,
    totalAcquisition: costs.totalAcquisition,
    bidPrice: userBidPrice,
  });
  log("📊 profit", profit);

  // Safety 시각화용
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

  return { valuation, rights, costs, profit, safety };
}
```

---

## 10) 로그 규칙 및 DevMode

* 상위에서 `options: { devMode: true, logPrefix: "🏗️ [BidMaster]" }` 로 호출 시,
  모든 핵심 단계가 `console.log`로 출력됩니다.
* 로그 예:

  * `📐 valuation { fmv: 913,800,000, appraisal: 1,006,945,215, minBid: 805,556,172, ... }`
  * `⚖️ rights { assumedRightsAmount: 530,315,911, ... }`
  * `💰 costs { totalAcquisition: 1,234,567,890, taxes: {...} }`
  * `📊 profit { marginVsFMV: -372,226,171, ... }`
  * `🧯 safety { fmv: { amount: -372,226,171, rate: -0.4076 }, overFMV: false }`

---

## 11) React 연동 가이드 (예시)

```ts
// 예: src/components/BiddingModal.tsx 내에서 사용
import { auctionEngine } from "@/lib/auction-engine";
import { useSimulationStore } from "@/store/simulation-store";

function runEngine(caseSnapshot, userBidPrice, devMode: boolean) {
  const result = auctionEngine({
    snapshot: caseSnapshot,
    userBidPrice,
    options: { devMode, logPrefix: "🏗️ [BidMaster]" },
    valuationInput: {
      // marketSignals: { kbIndex: 0.99, tradeSpeed: 0.97 },
      // overrides 가능(세율/명도/기타):
      // acquisitionTaxRate: 0.011, educationTaxRate: 0.001, specialTaxRate: 0.002,
      // evictionCost: 3_000_000, miscCost: 1_000_000,
    },
    exitPriceHint: undefined, // 없으면 FMV 기준으로도 안전마진 산출됨
  });

  // UI 바인딩 예시
  // result.safety.fmv.amount, result.profit.marginVsExit 등 표시
  return result;
}
```

* **안전마진 카드**는 다음 3축을 그대로 매핑하면 됩니다.

  * `result.safety.fmv` / `result.safety.exit` / `result.safety.userBid`
* **경고 배지**: `result.safety.overFMV === true` 인 경우 노출

---

## 12) Cursor 적용 방법

1. 본 문서의 코드 블록을 **각 파일 경로에 맞게 생성**합니다.
2. 기존 산개 파일(`auction-cost.ts`, `profit-calculator.ts`, 구 `auction-engine.ts`, `property/market-price.ts`, `rights-analysis-engine.ts`)의 **참조를 제거**하고 삭제합니다.
3. 컴포넌트/모달/리포트에서 **`import { auctionEngine } from "@/lib/auction-engine"`** 하나만 사용하도록 교체합니다.
4. 시뮬레이션 실행 경로에서 `devMode` 토글을 활성화하여 로그를 확인합니다.
5. 숫자 포맷, 경고 문구 등은 기존 컴포넌트(`SafetyMarginCard`, `SafetyMarginComparison`)에 그대로 연결하면 됩니다.

---

## 부록 A) 권리/임차 보수적 규칙(교육용) 요약

* **말소기준권리 불명확**: 특수/담보성 권리 인수 가능성을 높게 가정(보수적).
* **임차 대항력 약함(weak)**: 보증금의 50% 인수로 간주(추정).
  실제 데이터가 명확하면 `hasOpposability`, `fixedDate`로 강/약/무를 구체화하십시오.

---

## 부록 B) 자주 변경될 상수(튜닝 지점)

* `valuation.ts`의 `kFromAppraisal = 0.91`
* `costs.ts`의 기본 세율(1.1%/0.1%/0.2%)과 기본 명도/기타 비용
* `rights-engine.ts`의 weak-tenant 50% 인수 가정

> 이 값들은 **docs/taxlogic.md**, **docs/bidmaster_v_1.2.md** 등에 맞춰 쉽게 조정 가능합니다.

---

## 부록 C) 회귀 테스트용 체크리스트(발췌)

* FMV/감정가/최저가 역산이 일관적으로 동작하는가?
* 동일 스냅샷에 대해 입찰가만 변경 시 **총인수금액**과 **안전마진 곡선**이 단조 변화하는가?
* `overFMV` 경고가 FMV 초과 구간에서만 켜지는가?
* weak 임차인이 있을 때 **명도비**를 상향하면 총인수금액이 증가하는가?
* 세율/비용 overrides가 실제 결과에 반영되는가?

---

본 **v0.1**은 “정확한 근거가 없을 때는 보수적”이라는 교육 원칙으로 설계되었습니다.
실측 데이터(배당표, 임차인 관계 증빙, 최신 세율)가 확보되면 **R-Mode 규칙**을 단계적으로 정밀화하십시오.
