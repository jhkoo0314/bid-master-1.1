# 🛠 권리 인수 계산 로직 정밀도 개선 & 수익률 정상화 패치 (v1.1)

## 📌 문제 요약

현재 모든 매물의 예상 수익률이 음수로 표기되는 문제 발생 → 원인은 `총인수금액(R)` 계산 시 **말소권리까지 포함**되는 구조 때문.

## 🎯 해결 방향

* 권리 인수 계산을 별도 엔진으로 분리 (`rights-engine.ts`)
* 말소권리 / 인수권리 / 임차권 미배당잔액 / 확률가중권리 분리 처리
* `auction-cost.ts` 에서 R 계산을 새 엔진을 통해 가져오도록 교체

---

## ✅ STEP 1 — 새 파일 생성: `src/lib/rights-engine.ts`

📍 목적

* 권리 인수 대상 금액 계산을 단일 책임 파일로 분리
* 말소권리 제외 / 임차 보증금 미배당 잔액만 인수 / 유치권‧법정지상권 확률 가중 적용

📌 작업

```
CREATE FILE: src/lib/rights-engine.ts
```

📌 삽입 코드
(👈 아래 코드 전체를 그대로 새 파일에 붙여 넣기)

```ts
// src/lib/rights-engine.ts
// 경매 권리 인수액 계산 엔진 (정밀 로직)

export type RightType =
  | "근저당권" | "저당권" | "압류" | "가압류" | "담보가등기" | "소유권이전청구권가등기" | "가처분"
  | "전세권" | "주택임차권" | "상가임차권"
  | "유치권" | "법정지상권" | "지상권" | "분묘기지권"
  | "기타";

export interface BaseRight {
  type: RightType;
  amount?: number;
  hasDahang?: boolean;
  hasPriority?: boolean;
  distributed?: number;
  extinguishable?: boolean;
  likelihood?: number;
  note?: string;
}

export interface RightsEngineInput {
  rights: BaseRight[];
  tenantResidualFactor?: number;
  defaultLikelihood?: {
    유치권?: number;
    법정지상권?: number;
    분묘기지권?: number;
    지상권?: number;
  };
  debug?: boolean;
}

export interface RightsEngineOutput {
  assumableTotal: number;
  extinguishedTotal: number;
  disputedWeightedTotal: number;
  breakdown: {
    assumable: BaseRight[];
    extinguished: BaseRight[];
    disputed: (BaseRight & { weighted: number })[];
    tenants: (BaseRight & { residual: number })[];
  };
}

const EXTINGUISHED_SET: Set<RightType> = new Set([
  "근저당권", "저당권", "압류", "가압류", "담보가등기", "소유권이전청구권가등기", "가처분",
]);

const TENANT_SET: Set<RightType> = new Set([
  "전세권", "주택임차권", "상가임차권",
]);

const DISPUTED_SET: Set<RightType> = new Set([
  "유치권", "법정지상권",
]);

const ALWAYS_ASSUMABLE_SET: Set<RightType> = new Set([
  "지상권", "분묘기지권",
]);

const KRW = (v?: number) => Math.max(0, Math.floor(v ?? 0));

export function computeAssumableCost(input: RightsEngineInput): RightsEngineOutput {
  const {
    rights,
    tenantResidualFactor = 1.0,
    defaultLikelihood = { 유치권: 0.6, 법정지상권: 0.7, 분묘기지권: 1.0, 지상권: 1.0 },
    debug = false,
  } = input;

  const extinguished: BaseRight[] = [];
  const tenants: (BaseRight & { residual: number })[] = [];
  const disputed: (BaseRight & { weighted: number })[] = [];
  const assumable: BaseRight[] = [];

  for (const r of rights) {
    const amount = KRW(r.amount);
    const distributed = KRW(r.distributed);
    const explicitExtinguish = r.extinguishable === true;

    if (explicitExtinguish || EXTINGUISHED_SET.has(r.type)) {
      extinguished.push({ ...r, amount });
      continue;
    }

    if (TENANT_SET.has(r.type)) {
      const residual = Math.max(0, amount - distributed);
      const adjusted = Math.floor(residual * tenantResidualFactor);
      if (adjusted > 0) tenants.push({ ...r, amount, distributed, residual: adjusted });
      continue;
    }

    if (DISPUTED_SET.has(r.type)) {
      const base =
        r.type === "유치권" ? (defaultLikelihood.유치권 ?? 0.6)
        : r.type === "법정지상권" ? (defaultLikelihood.법정지상권 ?? 0.7)
        : 1.0;
      const likelihood = r.likelihood ?? base;
      const weighted = Math.floor(amount * Math.min(Math.max(likelihood, 0), 1));
      if (weighted > 0) disputed.push({ ...r, amount, weighted, likelihood });
      continue;
    }

    if (ALWAYS_ASSUMABLE_SET.has(r.type)) {
      assumable.push({ ...r, amount });
      continue;
    }

    extinguished.push({ ...r, amount });
  }

  const tenantsTotal = tenants.reduce((s, t) => s + KRW(t.residual), 0);
  const disputedTotal = disputed.reduce((s, d) => s + KRW(d.weighted), 0);
  const assumableTotal = assumable.reduce((s, a) => s + KRW(a.amount), 0) + tenantsTotal + disputedTotal;
  const extinguishedTotal = extinguished.reduce((s, e) => s + KRW(e.amount), 0);

  if (debug) {
    console.table([
      { key: "assumableTotal", value: assumableTotal },
      { key: "tenantsTotal(residual)", value: tenantsTotal },
      { key: "disputedWeightedTotal", value: disputedTotal },
      { key: "extinguishedTotal", value: extinguishedTotal },
    ]);
  }

  return {
    assumableTotal,
    extinguishedTotal,
    disputedWeightedTotal: disputedTotal,
    breakdown: { assumable, extinguished, disputed, tenants },
  };
}
```

📌 예상 커밋 메시지

```
git add src/lib/rights-engine.ts
git commit -m "feat: add rights-engine.ts for precise assumable rights calculation"
```

---

## ✅ STEP 2 — `auction-cost.ts` 수정

📍 목적

* 기존 인수권리 계산을 새 엔진으로 치환
* 말소권리는 합산되지 않도록 조정

📌 수정 대상

```
FILE: src/lib/auction-cost.ts
```

📌 변경 1 — import 추가 (파일 상단)

```ts
import { computeAssumableCost } from "./rights-engine";
```

📌 변경 2 — 기존 R 계산부 제거 → 아래 함수 추가

```ts
function calcRightsAssumableTotal(rights: any[]): number {
  const mapped = (rights ?? []).map((r: any) => ({
    type: r.type,
    amount: r.amount,
    hasDahang: r.hasDahang,
    hasPriority: r.hasPriority,
    distributed: r.distributed,
    extinguishable: r.extinguishable,
    likelihood: r.likelihood,
  }));

  const out = computeAssumableCost({
    rights: mapped,
    tenantResidualFactor: 1.0,
    defaultLikelihood: { 유치권: 0.6, 법정지상권: 0.7, 분묘기지권: 1.0, 지상권: 1.0 },
    debug: false,
  });

  return out.assumableTotal;

```
✅ STEP 3 — 테스트 & 검증 체크리스트 (수익률 정상화)

📍 목적

권리 인수 로직 분리 후, 총인수금액(A)과 예상 수익률이 정상 분포(+/–)로 나오는지 확인

말소권리 포함 오류, 임차 미배당 계산 오류, 확률가중 합산 오류를 조기에 식별

📌 테스트 시나리오 (샘플 데이터 3종 권장)

[ S1 ] 말소권리만 존재
  - 입력: 근저당권/가압류 등만 포함, 임차권 없음
  - 기대: R=0, A=B+세금/비용만으로 산출, 마진은 시세 대비 자연스러운 값


[ S2 ] 임차권만 존재(배당 있음)
  - 입력: 주택임차권 amount=3천, distributed=2천
  - 기대: R=잔액 1천만 원만 반영, 안전마진/수익률 양/음 모두 가능


[ S3 ] 유치권·법정지상권 혼재
  - 입력: 유치권 3천(가능성 0.6), 법정지상권 2천(가능성 0.7)
  - 기대: R에 1,800 + 1,400 = 3,200만 원 가중 반영

📌 수동 검증 포인트

A = B + R + T + C + E + K + U 값이 과대/과소 산출되지 않는지

marginAmount = V - A / marginRate = marginAmount / V (V>0) 일관성

동일 매물에서 R 계산 결과가 이전 대비 합리적으로 감소(말소권리 제외)했는지

📌 로그/스냅샷 검증 (권장)

임시로 computeAssumableCost({ debug:true }) 켜서 합계 테이블 확인

최소 5개 매물에 대해 "이전 vs 이후" 수익률 비교 스프레드시트 작성

📌 예상 커밋 메시지

git commit -am "test: verify acquisition cost & margin distribution after rights-engine integration"
✅ STEP 4 — market-price.ts 개선 계획 (예상 시세 엔진 스캐폴딩)

📍 목적

수익률/안전마진의 기준값인 시세(V)를 "구간(min/max)+신뢰도+변동성" 구조로 표준화

초기엔 규칙 기반(MVP)으로 시작하고, 이후 AI/실거래/경매사례 결합으로 고도화

📌 작업 범위

UPDATE or CREATE: src/lib/market-price.ts

📌 공개 인터페이스 (프론트/리포트 공용)

export interface MarketPriceParams {
  appraised: number;   // 감정가
  area?: number;       // 전용면적 등 (㎡)
  regionCode?: string; // 지역 코드
  recentDeals?: Array<{ price: number; date: string }>; // 선택: 실거래 스냅샷
}


export interface MarketPriceResult {
  min: number;           // 예측 하한가 (보수적)
  max: number;           // 예측 상한가 (낙관적)
  confidence: number;    // 신뢰도 (0~1)
  volatility: number;    // 변동성 (0~1)
  sources: string[];     // 근거: ["rules", "kb", "deals", "auctions", "ai"]
}


export function estimateMarketPrice(p: MarketPriceParams): MarketPriceResult {
  // v0: 규칙 기반 스캐폴드 (MVP)
  // - 실거래가가 있으면 중위값±편차, 없으면 감정가에 보수/낙관 계수 적용
  const base = p.recentDeals && p.recentDeals.length
    ? median(p.recentDeals.map(d => d.price))
    : p.appraised;


  const min = Math.floor(base * 0.95); // 보수 가정
  const max = Math.floor(base * 1.05); // 낙관 가정
  return {
    min, max,
    confidence: p.recentDeals && p.recentDeals.length ? 0.65 : 0.50,
    volatility: 0.06,
    sources: [p.recentDeals && p.recentDeals.length ? "deals" : "rules"],
  };
}

📌 품질 관리 규칙 (초기)

min ≤ max 보장, 음수 금지

confidence는 데이터 소스 개수/신뢰도에 비례(예: deals>auctions>kb>rules)

volatility는 지역/시점 별 기본값 테이블로 시작(후속 단계에서 동적화)

📌 2단계 고도화(후속 Plan 연결)

실거래·KB·유사 경매 낙찰가를 feature로 결합 → 회귀 모델(예: LightGBM)

RMSE 기반 volatility/confidence 산출, 모델 버전/학습일자 메타 포함

사용자 "시세 예측 훈련" 결과를 역피드백(모델 튜닝 보조)으로 저장

📌 검증 체크리스트

V 구간이 너무 좁지 않은지(≥ ±3%) / 지나치게 넓지 않은지(≤ ±15%)

동일 매물에서 V가 감정가와 완전히 동조되지 않는지(실거래 반영 유도)

📌 예상 커밋 메시지

git add src/lib/market-price.ts
git commit -m "feat(market-price): add price range API (min/max/confidence/volatility)"
✅ STEP 5 — 후속 작업(선택 적용) & 운영 가이드

📌 리포트/UI 확장

사이드바 "예상 시세" 카드: min~max, confidence, volatility 표시

상세 모달: 근거 데이터(sources)와 간단 그래프(최근 실거래 중위/사분위)

리포트: "말소/인수/확률가중/임차잔액" 4분류 합계 + 시세 구간 대비 안전마진

📌 엔진 고도화 로드맵

명도비/세금 자동화 규칙 테이블화 후 auction-cost.ts에 주입

권리 성립 가능성(likelihood) 사전 학습값 테이블 도입(유형/지역별 prior)

market-price.ts에 외부 데이터 어댑터 레이어 추가(KB/국토부/경매DB)

📌 데이터/로그 운영

주요 계산 결과(A, V, margin, R breakdown)를 analysis_logs 테이블에 기록

릴리즈 전/후 7일간 수익률 분포 변화 모니터링(히스토그램)

📌 권장 커밋 단위

chore: scaffold test datasets for rights-engine
feat: integrate rights-engine into auction-cost and add calcRightsAssumableTotal()
feat(market-price): add price range interface and MVP estimator
docs: update plan.md with test checklist and roadmap

📌 롤백 계획

rights-engine 미도입 분기 유지(플래그로 토글) 또는 이전 태그로 즉시 복원

