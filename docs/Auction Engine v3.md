# 🧩 Auction Engine v3 – 통합 설계 문서  
**(Bid Master AI · 2025 기준 / Core Calculation Architecture)**  
버전: Draft v0.1  
작성 목적: 분산된 계산 로직을 단일 엔진으로 통합하여 **100% 예측 가능·재사용 가능한 분석 결과(JSON)** 를 보장하기 위함  
대상: 개발자, 기획자, 데이터 구조 설계자, 리포트·UI 개발자

---

## 1. 왜 v3 엔진 통합이 필요한가

현재 Bid Master는 다음과 같은 문제를 갖고 있음:

| 문제 유형 | 발생 위치 | 영향 |
|-----------|-----------|-------|
| 계산 로직이 파일마다 분산 | `profit-calculator.ts`, `auction-cost.ts`, `valuation.ts`, `rights-engine.ts`, etc. | 로직 수정 시 UI·리포트 전부 깨짐 |
| 동일한 데이터가 서로 다른 로직으로 재계산됨 | 수익·권리·포인트 엔진이 각자 계산 | 값 불일치, 디버깅 난이도 증가 |
| “매물 생성 → 권리 → 비용 → 입찰 → 수익” 흐름이 단일 체계가 아님 | 각 영역이 독립적 | 엔진 연결 구조가 없음 |
| 결과가 UI/리포트 기준으로 가공됨 (단일 JSON 부재) | `AuctionAnalysisReport.tsx` / `RightsReportModal.tsx` 등 | 백엔드·프론트 계산 중복 |
| 리팩토링 시 도미노 붕괴 | 실제로 v0.1 → v0.2 → v1.2 → v2.0 모두 붕괴 발생 | 계산 엔진 신뢰성 확보 불가 |

➡️ **v3의 목적은 "엔진을 중심에 두고, UI·리포트·포인트를 엔진 출력값 기반으로만 작동시키는 구조"로 전환하는 것**  
➡️ UI가 계산을 하지 않게 만들고, “엔진 → JSON → 표시” 원칙 확립  
➡️ 이후 모델 교체·비즈니스 모델 확장·실거래 DB 연동에도 그대로 확장 가능하도록 설계

---

## 2. v3 엔진의 핵심 원칙

| 원칙 | 설명 |
|-------|-------|
| **Single Source of Truth** | 계산은 오직 엔진에서만 수행. UI는 가공 X, 표시만 |
| **단일 Output Payload** | 모든 리포트/점수/화면은 하나의 결과 JSON만 참조 |
| **Pure Function 기반** | 입력이 같으면 언제나 동일 결과. 상태/랜덤성 제거 |
| **Layered Pipeline** | ①매물 → ②시세 → ③권리 → ④비용 → ⑤입찰 → ⑥수익 |
| **테스트 가능한 구조** | 모든 단계는 독립 단위테스트 + 통합 스냅샷 테스트 가능 |
| **레거시 Zero Merge 전략** | 기존 파일 점진 삭제가 아니라 “흡수 후 제거” 방식 |
| **역추적 가능성 보장** | 결과 JSON → 입력/중간 계산 추적 가능 형태 유지 |

---

## 3. v3 엔진이 해결하는 것

| 기존 문제 | v3 해결 방식 |
|-----------|--------------|
| UI가 계산 중복 | UI는 `analysis.result`만 표시 |
| 수익/권리/입찰 계산 불일치 | 통합 엔진에서 계층별 계산 후 1회 반환 |
| 리포트마다 계산 로직 따로 존재 | PDF/리포트 생성은 엔진 출력을 그대로 사용 |
| “어디서 값이 잘못됐는지” 추적 불가 | 엔진 내부 단계별 Debug Payload 자동 출력 |
| 매각물건명세서/권리/명도/수익이 서로 따로 노는 구조 | 병합된 Domain Model 설계 적용 |

---

```
## 4. 엔진 전체 구조도 (Layer Diagram)

```

[UI / Reports / PDF / Point]
▲
│  reads only
│
┌─────────────────────────────────────────┐
│           Auction Engine v3            │
│  (단일 호출, 단일 JSON 결과 반환)       │
├─────────────────────────────────────────┤
│ 6. ProfitEngine     (수익/ROI/BEP)     │
│ 5. CompetitorEngine (참여자/분포/낙찰)  │
│ 4. CostEngine       (취득/대출/보유)   │
│ 3. RightsEngine     (권리/총인수금액)  │
│ 3-B. CourtDocsLayer (명세서/현황/등기) │
│ 2. ValuationEngine  (FMV/감정/최저가)  │
│ 1. PropertyEngine   (매물 생성/정규화) │
└─────────────────────────────────────────┘
│
▼
[Data Sources / Mocks]

```

- CourtDocsLayer는 계산 엔진과 분리된 “문서 원본/파싱” 레이어로 존재하며, RightsEngine은 CourtDocsLayer가 제공하는 구조화 데이터를 참조하여 판정 로직을 수행합니다.
- v3는 각 엔진이 순서대로 실행되는 Pipeline이며, 모든 중간 산출물은 최종 JSON에 `debug` 섹션으로 선택적 포함 가능합니다.

---

## 5. 실행 파이프라인 (Sequence)

```

runAuctionAnalysis(input)

1. property = PropertyEngine.normalize(input.propertySeed)
2. valuation = ValuationEngine.evaluate(property)
3. courtDocs = CourtDocsLayer.attach(property, input.courtDocRefs)
4. rights = RightsEngine.assess({ property, valuation, courtDocs })
5. costs  = CostEngine.compute({ property, rights, valuation, params })
6. competition = CompetitorEngine.simulate({ valuation, property, params })
7. profit = ProfitEngine.evaluate({ costs, competition, valuation, params })
8. payload = PayloadBuilder.merge({
   property, valuation, courtDocs, rights, costs,
   competition, profit
   })
   return payload

````

- 입력은 최소한의 시드(매물/문서 레퍼런스/환경 파라미터)만 받습니다.
- 모든 계산은 순수 함수로 수행하며, UI는 결과(JSON)만 참조합니다.

---

## 6. 엔진별 역할 & I/O 스키마

### 6.1 PropertyEngine

**역할**: 생성된 매물 데이터의 표준화(타입·단위·필수필드), 결측치/유효성 검증.

**Input**
```ts
type PropertySeed = {
  id: string;
  type: "아파트" | "오피스텔" | "다가구" | "토지" | "근린" | string;
  region: string;           // 행정구역명
  address?: string;
  sizeM2?: number;          // m²
  yearBuilt?: number;
  court?: string;
  caseNumber?: string;
  auctionStep?: "1회차" | "2회차" | "재경매" | string;
  rightsDifficulty?: "easy" | "normal" | "hard";
};
````

**Output**

```ts
type Property = Required<
  Omit<PropertySeed, "sizeM2" | "address" | "yearBuilt"> &
  { sizeM2: number; address: string; yearBuilt: number }
>;
```

**검증 규칙**

* `sizeM2 > 0`, `yearBuilt ∈ [1960, now]`, `auctionStep` 표준화.

---

### 6.2 ValuationEngine

**역할**: 감정가/AI FMV/최저가 산출 및 방식 기록.

**Input**

```ts
type ValuationInput = {
  property: Property;
  policy: {
    lowestBidRateDefault: number;  // ex) 0.7
    fmvClamp?: { minRate: number; maxRate: number }; // 감정가 대비
    difficultyWeights?: Record<"easy"|"normal"|"hard", number>; // FMV 조정 가중치
  };
};
```

**Output**

```ts
type Valuation = {
  appraisalValue: number;       // 감정가
  marketPriceFMV: number;       // 시세
  lowestBidPrice: number;       // 최저가
  method: "fmv-weighted" | "appraisal-ratio" | string;
  notes?: string[];
};
```

**규칙**

* `lowestBidPrice = appraisalValue * lowestBidRateDefault`
* `marketPriceFMV`는 감정가 대비 클램프 및 난이도 가중치 적용 후 반올림.

---

### 6.3 CourtDocsLayer

**역할**: 매각물건명세서/현황조사서/등기부등본 등의 원문/파싱 데이터를 제공.

**Input**

```ts
type CourtDocsInput = {
  property: Property;
  refs?: {
    meagakUrl?: string;       // 매각물건명세서
    hyeonhwangUrl?: string;   // 현황조사서
    deunggiUrl?: string;      // 등기부등본
  };
  parsed?: Partial<CourtDocs>; // 이미 파싱된 JSON 주입 가능
};
```

**Output**

```ts
type CourtDocs = {
  hasDividendRequest?: boolean;    // 문서 명시 시 true/false, 미상은 undefined
  occupancyStatus?: string;        // 점유상태 (임차인 거주, 공실 등)
  possessionType?: "점유자 있음" | "공실" | string;
  leaseType?: "주임법" | "상임법" | "전세권" | string;
  registeredRights?: Array<{ type: string; amount?: number; priority?: number }>;
  documentFlags?: string[];        // “명도소송 가능성 있음” 등
  raw?: {
    meagak?: string;    // url or base64
    hyeonhwang?: string;
    deunggi?: string;
  };
};
```

**규칙**

* 값이 문서상 명확하지 않으면 `undefined`로 둔다(추정으로 채우지 않음).
* RightsEngine은 `CourtDocs`를 참고하되, 계산 불확실성은 `riskFlags`에 표기.

---

### 6.4 RightsEngine

**역할**: 권리관계 판정(인수/소멸), 총인수금액, 명도비용·위험도 산정.

**Input**

```ts
type RightsInput = {
  property: Property;
  valuation: Valuation;
  courtDocs: CourtDocs;
  policy: {
    evictionCostBands: { low: number; medium: number; high: number };
    defaultEvictionCost?: number;
    inferenceRules?: boolean; // 문서가 비었을 때 추정 규칙 사용 여부
  };
};
```

**Output**

```ts
type Rights = {
  assumableRightsTotal: number;
  evictionRisk: "low" | "medium" | "high";
  evictionCostEstimated: number;
  tenantSummary?: string;
  riskFlags: string[]; // ["대항력", "배당요구 없음", ...]
  breakdown?: Array<{
    kind: "근저당" | "전세권" | "임차권" | "유치권" | "가압류" | string;
    holder?: string;
    amount?: number;
    assumed: boolean;  // 인수 여부
    note?: string;
  }>;
};
```

**규칙**

* `CourtDocs.hasDividendRequest === false`이고 대항력 추정 시 → 임차보증금 인수.
* 불확실성은 금액에 반영하지 않고 `riskFlags`로 노출(엔진은 보수적).

---

### 6.5 CostEngine

**역할**: 취득세/부대비/대출/보유비용 계산 및 총취득 합산.

**Input**

```ts
type CostInput = {
  property: Property;
  valuation: Valuation;
  rights: Rights;
  params: {
    bidPrice: number;             // 사용자 입찰가(or 낙찰가)
    acquisitionFees?: number;     // 법무/등기/인지 등
    acquisitionTaxRates: {
      base: number; localEdu?: number; special?: number;
    };
    loan: { ratio: number; rate: number; months: number; origFee?: number; origFeeRate?: number; };
    holding: { monthly: number; months: number; };
    repairCost?: number;
  };
};
```

**Output**

```ts
type Costs = {
  bidPrice: number;
  acquisitionTax: number;
  legalFees: number;
  repairCost: number;
  totalAcquisition: number;      // A + R + T + C1 + K + E
  loanPrincipal: number;
  ownCash: number;
  interestCost: number;
  holdingCost: number;
  totalHoldingFinance: number;   // interest + holding
  totalCost: number;             // totalAcquisition + totalHoldingFinance
};
```

**규칙**

* 취득세 과표는 원칙적으로 `bidPrice` 기준(세목 특례는 v3.1로).
* `ownCash = totalAcquisition - loanPrincipal + origFee(abs or rate)`.

---

### 6.6 CompetitorEngine

**역할**: 참여자수/과열도/입찰가 분포/낙찰자 판정.

**Input**

```ts
type CompetitorInput = {
  property: Property;
  valuation: Valuation;
  params: {
    participantCount: number;
    overheatScore: number; // 0~100
    tick: number;          // 입찰 최소단위(원)
    strategy: "A-wide" | "B-two-peak" | "C-right-tail";
    myBid: number;
  };
};
```

**Output**

```ts
type Competition = {
  participantCount: number;
  overheatScore: number;
  bidders: Array<{ name: string; bid: number; isWinner: boolean }>;
  finalWinningBid: number;
  myRank: number;
};
```

**규칙**

* 분포 전략과 `overheatScore`에 따라 분산폭/꼬리 분포 제어.
* 동일가 몰림 방지: 최소 간격 보정(`tick`, jitter).

---

### 6.7 ProfitEngine

**역할**: Exit/수수료/순이익/ROI/연환산/손익분기/안전마진.

**Input**

```ts
type ProfitInput = {
  costs: Costs;
  valuation: Valuation;
  params: {
    exitPrice: number;       // FMV 또는 시나리오 값
    sellBrokerRate: number;
    sellMiscFees?: number;
  };
};
```

**Output**

```ts
type Profit = {
  exitPrice: number;
  totalCost: number;
  netProfit: number;
  roi: number;
  annualizedRoi: number;
  breakevenExit: number;
  safetyMargin: number; // exit - totalAcquisition (보수적 지표)
  constraints?: {
    meetsTargetMargin?: boolean;
    meetsTargetROI?: boolean;
  };
};
```

**규칙**

* `breakevenExit = (totalCost + sellMisc) / (1 - sellBrokerRate)`
* `roi = netProfit / ownCash` (분모 0 보호)
* `annualizedRoi = (1+roi)^(12/holdMonths) - 1`

---

## 7. 최종 결과 JSON (단일 Output Schema)

```ts
export type AuctionAnalysisResult = {
  propertyId: string;
  generatedAt: string;

  property: Property;
  valuation: Valuation;
  courtDocs: CourtDocs;
  rights: Rights;

  costs: Costs;
  competition: Competition;
  profit: Profit;

  summary: {
    isProfitable: boolean;
    grade: "S" | "A" | "B" | "C" | "D";
    riskLabel: string;
    recommendedBidRange: [number, number];
  };

  debug?: {
    // 각 단계의 원시 입력/중간 합계/클램프/분포 파라미터 등
    valuationNotes?: string[];
    rightsNotes?: string[];
    costBreakdown?: Record<string, number>;
    competitorParams?: Record<string, unknown>;
  };
};
```

* UI, 리포트, 포인트, PDF는 **이 타입 하나만** 참조합니다.
* “추천 입찰 범위”는 `valuation`, `rights`, `costs` 기반의 보수적 규칙으로 산출합니다(예: FMV 하위 3~8%, 최저가 상위 5~15% 등 정책화).

---

## 8. UI / 리포트 / 게임 연결 방식 (Data Contract)

### 8.1 참조 원칙

* 모든 화면/문서는 `AuctionAnalysisResult` 하나만 읽는다.
* 계산 로직은 UI에서 금지. 숫자 가공은 엔진 단계에서 완료.

### 8.2 리포트 출력 구조 (v3 기준)

v3 엔진은 단일 실행 결과(JSON)에서 5종의 리포트를 생성할 수 있도록 설계한다.

| 리포트 종류 | 사용 데이터 섹션 | 출력 상태 |
|-------------|------------------|-----------|
| 권리분석 리포트 | rights / courtDocs / valuation | 기존 구현 유지 (v2 → v3 데이터 전환) |
| 경매분석 리포트 | valuation / competition / summary | 기존 구현 유지, v3 데이터 변경 필요 |
| **수익분석 리포트 (NEW)** | profit / costs / valuation / summary | v3 엔진에서 최초 정식 제공 |
| 상세분석 리포트 | property / valuation / rights / costs / profit | UI 및 템플릿 확장 예정 |
| 매각물건명세서 뷰 | courtDocs.raw / flags / registeredRights | 기존 UI 재활용, 데이터만 v3 연결 |

📌 수익분석 리포트는 기존 v0.2 로직에서 “수익표 · 투자비용표 · ROI 계산”이 분산되어 있던 구조를
v3에서 통합하여 단일 JSON 형태로 공급한다.


### 8.3 게임(포인트) 연결

* `profit`, `competition`, `valuation`에서 필요한 지표만 입력으로 사용.
* 정확도(Accuracy) 계산은 `recommendedBidRange` 대비 `myBid` 오차로 산출.

---

## 9. 테스트 전략

* **단위 테스트**: 각 엔진 모듈별 고정 벡터(Case 1/2/3) 스냅샷.
* **통합 스냅샷**: 동일 입력에 대해 최종 JSON이 bit-for-bit 동일.
* **프로퍼티 테스트**:

  * `exitPrice < breakevenExit ⇒ netProfit < 0`
  * `sellBrokerRate=0 ⇒ breakevenExit = totalCost + sellMisc`
  * `loanRatio=0 ⇒ ownCash = totalAcquisition (+ origFee)`

---

## 10. 레거시 흡수 계획 / 마이그레이션

### 10.1 폴더 구조

```
src/lib/engines/
  property-engine.ts
  valuation-engine.ts
  court-docs-layer.ts
  rights-engine.ts
  cost-engine.ts
  competitor-engine.ts
  profit-engine.ts
  auction-engine.ts        // orchestrator (runAuctionAnalysis)
  payload-builder.ts

// 레거시 파일
- auction-cost.ts                → cost-engine.ts로 흡수 후 삭제
- rights-analysis-engine.ts      → rights-engine.ts로 흡수 후 삭제
- profit-calculator.ts           → profit-engine.ts 래퍼로 축소
- valuation.ts                   → valuation-engine.ts로 이동
- competitor-bids.ts             → competitor-engine.ts로 흡수
```

### 10.2 점진 전환 체크리스트

* [ ] 엔진 v3 scaffold 추가, 레거시 호출부는 래퍼로 연결
* [ ] `AuctionAnalysisReport`, `RightsAnalysisReportModal`이 v3 결과만 참조하도록 변경
* [ ] `CourtDocumentModal`는 `result.courtDocs`로 데이터 소스 통일
* [ ] 레거시 계산 코드 제거 전 스냅샷 비교 테스트 통과

---

## 11. 런타임/디버그 정책

* `RUN_ENGINE_DEBUG=true` 환경에서 `result.debug` 섹션 포함
* 모든 금액은 원단위 반올림(`Math.round`), UI 포맷만 현지화
* NaN/Infinity 발생 시 원인 키·분모 값 로깅

---

## 12. Definition of Done

* 엔진별 단위 테스트 + 통합 스냅샷 100% 통과
* UI/리포트는 계산 로직 0%
* 레거시 계산 파일 참조 0개
* 동일 입력에 대해 항상 동일한 최종 JSON
* 리포트 4종이 단일 JSON으로만 렌더링

```
# 13. 도메인 표준 정의 (Domain Specifications)

> 이 섹션은 **Auction Engine v3**의 “도메인 기준 규격”이며  
> 매물 생성기, 권리엔진, 비용/수익 엔진, 리포트, 점수/포인트 엔진이  
> **모두 동일한 기준 정의를 사용하도록 통합**하기 위한 표준 문서이다.

> ⚠️ 기존 시스템(v1.x)의 데이터는 “직접 사용”이 아니라  
> **v3 표준 ENUM ← 매핑테이블 ← 기존 레거시 데이터** 방식으로 호환된다.

---

## 13.1 매물 유형 표준 정의 (v3)

v3에서는 아래 매물 유형을 “공식 정의”로 사용하며,  
엔진·리포트·UI 전부가 동일 enum 값을 참조한다.

```ts
export type PropertyType =
  | "apt"                // 아파트
  | "officetel"          // 오피스텔
  | "singleHouse"        // 단독주택
  | "villa"              // 빌라
  | "oneRoom"            // 원룸
  | "house"              // 주택(미분류)
  | "multiHouse"         // 다가구주택
  | "mixedUse"           // 근린주택
  | "urbanResidence";    // 도시형생활주택
```

UI 표시명 매핑:

```ts
export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  apt: "아파트",
  officetel: "오피스텔",
  singleHouse: "단독주택",
  villa: "빌라",
  oneRoom: "원룸",
  house: "주택",
  multiHouse: "다가구주택",
  mixedUse: "근린주택",
  urbanResidence: "도시형생활주택",
};
```

---

## 13.2 기존 매물 9종 → v3 매핑 테이블

| 기존(v1.x) 명칭 | v3 Enum 변환 | 비고 |
|-----------------|--------------|------|
| 아파트 | `apt` | 동일 유지 |
| 오피스텔 | `officetel` | 동일 유지 |
| 단독주택 | `singleHouse` | 동일 |
| 빌라 | `villa` | 동일 |
| 원룸 | `oneRoom` | 동일 |
| 주택 | `house` | ※ UI용: "주택(미분류)" |
| 다가구주택 | `multiHouse` | 그대로 매핑 |
| 근린주택 | `mixedUse` | 주거+상가 복합 반영 |
| 도시형생활주택 | `urbanResidence` | 법 정의 그대로 반영 |

✅ **즉시 호환 가능** — 기존 생성기는 레거시 명칭을 유지해도 되고, 엔진에서 변환 후 처리됨  
✅ v3 이후 새 유형 추가해도 UI/리포트는 수정 없이 확장 가능

---

## 13.3 권리 유형 표준 정의 (v3)

```ts
export type RightType =
  | "mortgage"               // 근저당권
  | "pledge"                 // 저당권
  | "seizure"                // 압류
  | "provisionalSeizure"     // 가압류
  | "collateralPreReg"       // 담보가등기
  | "transferClaimPreReg"    // 소유권이전청구권가등기
  | "preRegistration"        // 가등기
  | "noticeRegistration"     // 예고등기
  | "leaseRight"             // 전세권
  | "residentialLeasehold"   // 주택임차권
  | "commercialLeasehold"    // 상가임차권
  | "injunction"             // 가처분
  | "retentionRight"         // 유치권
  | "statutorySuperficies"   // 법정지상권
  | "graveSiteRight";        // 분묘기지권
```

표시명 매핑:

```ts
export const RIGHT_TYPE_LABEL: Record<RightType, string> = {
  mortgage: "근저당권",
  pledge: "저당권",
  seizure: "압류",
  provisionalSeizure: "가압류",
  collateralPreReg: "담보가등기",
  transferClaimPreReg: "소유권이전청구권가등기",
  preRegistration: "가등기",
  noticeRegistration: "예고등기",
  leaseRight: "전세권",
  residentialLeasehold: "주택임차권",
  commercialLeasehold: "상가임차권",
  injunction: "가처분",
  retentionRight: "유치권",
  statutorySuperficies: "법정지상권",
  graveSiteRight: "분묘기지권",
};
```

---

## 13.4 기존 권리 15종 → v3 매핑 테이블

| 기존 명칭 | v3 Enum | 인수판정 기본값 |
|-----------|---------|-----------------|
| 근저당권 | `mortgage` | 소멸 (배당) |
| 저당권 | `pledge` | 소멸 (배당) |
| 압류 | `seizure` | 소멸 (절차상) |
| 가압류 | `provisionalSeizure` | 소멸 |
| 담보가등기 | `collateralPreReg` | 소멸 가능 (본등기 미이행 시) |
| 소유권이전청구권가등기 | `transferClaimPreReg` | 인수 위험 High |
| 가등기 | `preRegistration` | 케이스별 (본등기 여부) |
| 예고등기 | `noticeRegistration` | 정보 플래그, 금전 영향 없음 |
| 전세권 | `leaseRight` | 인수 (대항력+배당요구 여부) |
| 주택임차권 | `residentialLeasehold` | 케이스별 (★ 핵심) |
| 상가임차권 | `commercialLeasehold` | 케이스별 |
| 가처분 | `injunction` | 소멸 (그러나 소송 리스크 있음) |
| 유치권 | `retentionRight` | High 리스크 (점유권 주장 가능) |
| 법정지상권 | `statutorySuperficies` | 인수 (토지-건물 분리 시 필수) |
| 분묘기지권 | `graveSiteRight` | 인수 / 철거 불가 / 소송 High |

✅ 권리 엔진에서 “인수/소멸/불확실”을 이 Enum을 기준으로 판정  
✅ 리포트, 수익엔진, 안전마진, 점수엔진 전부 동일 기준 사용

---

## 13.5 권리 인수/소멸 판정 매트릭스 (v3 엔진 기준)

> 이 매트릭스는 **권리엔진(RightsEngine)** 이 최종 인수금액·리스크·명도비용을 계산할 때 적용하는  
> “정책 테이블(Policy Table)”이며, 모든 권리유형은 아래 3단계로 분류된다.

| 판정코드 | 의미 | 수익영향 | 리포트 표기 |
|----------|------|----------|-------------|
| `ASSUME` | 인수 (말소 불가) | 총인수금액 + | 🔴 인수 |
| `EXPIRE` | 소멸 (등기 말소 확정) | 금전영향 없음 | 🟢 소멸 |
| `UNCERTAIN` | 소멸/인수 불확정 (케이스별) | 리스크 반영, 금액 제외 | 🟡 불확실 |

### 13.5.1 권리별 기본 판정 매트릭스

| 권리유형 | 판정 | 조건 설명 |
|----------|------|-----------|
| 근저당권 | `EXPIRE` | 배당순위 내이면 말소 / 미달 시 인수 없음 |
| 저당권 | `EXPIRE` | 근저당과 동일 처리 |
| 압류 | `EXPIRE` | 강제집행 절차로 자동 소멸 |
| 가압류 | `EXPIRE` | 본압류 전환 전이면 소멸 |
| 담보가등기 | `UNCERTAIN` → `EXPIRE` | 본등기 미이행 시 소멸, 단 리스크 플래그 유지 |
| 소유권이전청구권가등기 | `ASSUME` | 인수 High, 명도 리스크 있음 |
| 가등기 | `UNCERTAIN` | 본등기 예정 여부 따라 분기 |
| 예고등기 | `EXPIRE` | 금전영향 없고 정보성만 유지 |
| 전세권 | `ASSUME` | 대항력 + 배당요구 無 → 전액 인수 |
| 주택임차권 | `ASSUME` / `UNCERTAIN` | 확정일자 + 점유 + 배당요구 여부 검사 |
| 상가임차권 | `ASSUME` / `UNCERTAIN` | 확정일자 + 점유 여부 기반 |
| 가처분 | `EXPIRE` | 다만 소송 리스크 플래그 유지 |
| 유치권 | `ASSUME` | 금액 불확정 + 점유권 행사 가능 |
| 법정지상권 | `ASSUME` | 강제 인수, 매각후 철거 불가 |
| 분묘기지권 | `ASSUME` | 인수, 이설소송 필요, 장기 리스크 |

⚠️ `UNCERTAIN` 은 **금액은 총인수금액에 넣지 않지만 리스크 점수에 반영된다.**  
⚠️ `ASSUME` 은 금액 산정 + 수익계산 + 안전마진 + 위험등급 전부에 영향.

---

## 13.6 위험 레벨 규칙 + 점수화 기준

> 인수/소멸 여부만으로는 “리스크”를 표현할 수 없기 때문에  
> v3 엔진은 **권리별 위험도를 0~5 점수로 정규화**해 총 점수로 환산한다.

| 레벨 | 점수 | 의미 | 예시 |
|-------|-------|-------|------|
| **L0** | 0 | 위험 없음 | 소멸권리, 예고등기 |
| **L1** | 1 | 경미 / 금액 無 | 가압류, 압류 |
| **L2** | 2 | 금액 O / 명도 쉬움 | 근저당 인수 없음 / 소액임차보증금(배당요구 有) |
| **L3** | 3 | 금액 O / 명도 협상 필요 | 대항력 임차권 배당요구 有 |
| **L4** | 4 | 고액 인수 + 점유 리스크 | 대항력 + 배당요구 無 / 유치권 주장 |
| **L5** | 5 | 최악 / 소송 장기화 | 분묘기지권, 법정지상권, 점유확정불가 임차권 |

### 리스크 합산 방식

```
권리 위험도 총점 = Σ(권리별 점수)
전체 리스크 등급 = 
  0~2 → A (안정)
  3~5 → B (주의)
  6~8 → C (경계)
  9~12 → D (고위험)
  13+ → E (매입 부적합)
```

→ 이 평가결과는 리포트·대시보드·포인트 시스템 모두에서 동일하게 사용한다.

---

## 13.7 명도/점유 리스크 판정 기준

| 유형 | 판정 | 엔진 반영 | 리포트 노출 |
|-------|------|-----------|-------------|
| 공실 확인됨 | Low | `evictionCost = 0` | “명도 불필요” |
| 임차인 존재 + 대항력 없음 | Medium | `evictionCost = policy.eviction.low` | “합의 필요” |
| 임차인 + 대항력 + 배당요구 無 | High | `evictionCost = policy.eviction.high` | “강제집행 가능성” |
| 유치권 주장 + 공사잔금 요구 | Very High | `evictionCost = 정책 + 지연손해금` | “장기 점유 위험(소송)” |
| 분묘/법정지상권 | Extreme | `evictionCost = 0` but `resaleDiscount` 적용 | “철거 불가/실사용 제한” |

---

## 13.8 엔진 연결 규칙 & 리포트 매핑

| 엔진 단계 | 참조 도메인 섹션 |
|-----------|-----------------|
| PropertyEngine | 13.1 / 13.2 |
| ValuationEngine | 매물유형별 FMV/감정가 가중치 |
| RightsEngine | 13.3 / 13.4 / 13.5 / 13.6 / 13.7 |
| CostEngine | 총인수금액(Rights) → 취득총액 반영 |
| ProfitEngine | 안전마진 = ExitPrice − TotalAcquisition |
| ReportGenerator | UI Label = Enum → Label Map 기반 |
| PointEngine | 정확도 = 추천입찰가 ± 사용자입찰가 |

---

## ✅ 이 정의서는 “변경 기준”도 포함한다

모든 정책 변경은 아래 규칙을 따라야 한다:

1. **v3 Enum은 변경 금지, 추가만 허용**  
2. 금액/위험도/판정 정책은 `policy.ts` 또는 DB 형태로 externalize 가능  
3. 리포트는 이 정의서를 기준으로 자동 생성되며, UI는 계산 로직을 가질 수 없음  
4. 기존 v1.x 시스템은 “삭제”가 아니라 “매핑 후 점진 폐기” 방식  
5. 이 문서는 `docs/auction-engine-v3-spec.md` 에 포함되어야 함

---

## ✅ Definition of Done (도메인 정의 기준)

| 항목 | 완료조건 |
|-------|---------|
| Enum 정의 완료 | v3 타입 선언 + Label Map 포함 |
| 기존 데이터 호환 | 매핑 테이블 작성 완료 |
| 엔진 반영 | RightsEngine / CostEngine / ProfitEngine 연동 |
| 리포트 반영 | 권리분석/경매분석/상세분석 리포트 모두 v3 참조 |
| 테스트 | 각 권리 유형별 Snapshot 테스트 통과 |
| 레거시 제거 | `rights-analysis-engine.ts` 제거 가능 상태 |

---

### 🔚 End of Section 13

```md
# 14. Auction Engine v3 – 구현 가이드 (Hybrid · Dev 70% / PM 30%)

본 섹션은 **v3 통합 엔진을 실제로 구현·적용**하기 위한 실행 문서입니다.  
대상: 개발자(주), PM/디자이너(보조).  
핵심 목표: **단일 호출 → 단일 JSON 결과**를 안정적으로 제공하고, UI/리포트/포인트는 이 결과만 참조.

---

## 14.1 엔진 구조 & 폴더 아키텍처

```

src/lib/engines/
property-engine.ts          # [1] 매물 정규화/생성
valuation-engine.ts         # [2] 시세/감정/최저가
court-docs-layer.ts         # [3B] 매각물건명세서/현황/등기
rights-engine.ts            # [3] 권리/총인수금액/명도리스크
cost-engine.ts              # [4] 취득/대출/보유/합계
competitor-engine.ts        # [5] 경쟁자분포/낙찰/순위
profit-engine.ts            # [6] Exit/ROI/BEP/안전마진
payload-builder.ts          # 최종 JSON 조립/요약/라벨
auction-engine.ts           # 오케스트레이터(runAuctionAnalysis)
policy.ts                   # 계산 정책(세율/가중치/임차/명도 밴드)
types.ts                    # 공통 타입(AuctionAnalysisResult 등)

````

**원칙**
- 계산은 엔진 내부만. UI/리포트는 가공 금지.
- 모든 함수는 **Pure Function**(입력 동일 → 출력 동일).
- 정책 값(세율/가중치/임차 밴드)은 `policy.ts`에 외부화.

---

## 14.2 전체 실행 흐름 (시퀀스)

```mermaid
sequenceDiagram
  autonumber
  participant UI as UI/Reports
  participant AE as AuctionEngine (runAuctionAnalysis)
  participant P as PropertyEngine
  participant V as ValuationEngine
  participant C as CourtDocsLayer
  participant R as RightsEngine
  participant K as CostEngine
  participant M as CompetitorEngine
  participant F as ProfitEngine
  participant PB as PayloadBuilder

  UI->>AE: runAuctionAnalysis(input)
  AE->>P: normalize(propertySeed)
  P-->>AE: property
  AE->>V: evaluate(property, policy)
  V-->>AE: valuation
  AE->>C: attach(property, courtDocRefs|parsed)
  C-->>AE: courtDocs
  AE->>R: assess({property, valuation, courtDocs}, policy)
  R-->>AE: rights
  AE->>K: compute({property, valuation, rights}, params)
  K-->>AE: costs
  AE->>M: simulate({property, valuation}, params.myBid, overheat)
  M-->>AE: competition
  AE->>F: evaluate({costs, valuation}, exitParams)
  F-->>AE: profit
  AE->>PB: merge(all)
  PB-->>AE: result(AuctionAnalysisResult)
  AE-->>UI: result(JSON)
````

---

## 14.3 핵심 실행 함수 I/O (TypeScript 시그니처)

```ts
// src/lib/engines/types.ts
export interface RunInput {
  propertySeed: PropertySeed;
  courtDocRefs?: { meagakUrl?: string; hyeonhwangUrl?: string; deunggiUrl?: string };
  courtDocsParsed?: Partial<CourtDocs>;
  params: {
    bidPrice: number;
    participantCount: number;
    overheatScore: number;   // 0~100
    tick: number;            // 입찰 단위
    distribution: "A-wide" | "B-two-peak" | "C-right-tail";
    loan: { ratio: number; rate: number; months: number; origFee?: number; origFeeRate?: number };
    holding: { monthly: number; months: number };
    repairCost?: number;
    acquisitionFees?: number;
    acquisitionTaxRates: { base: number; localEdu?: number; special?: number };
    sale: { exitPrice: number; brokerRate: number; misc?: number };
  };
  policy?: Partial<Policy>;   // 미지정 시 기본 정책 사용
}

export type AuctionAnalysisResult = {
  propertyId: string;
  generatedAt: string;
  property: Property;
  valuation: Valuation;
  courtDocs: CourtDocs;
  rights: Rights;
  costs: Costs;
  competition: Competition;
  profit: Profit;
  summary: {
    isProfitable: boolean;
    grade: "S" | "A" | "B" | "C" | "D";
    riskLabel: string;
    recommendedBidRange: [number, number];
  };
  debug?: Record<string, unknown>;
};
```

실행 함수:

```ts
// src/lib/engines/auction-engine.ts
import { normalize } from "./property-engine";
import { evaluate as evalValuation } from "./valuation-engine";
import { attach as attachDocs } from "./court-docs-layer";
import { assess as assessRights } from "./rights-engine";
import { compute as computeCosts } from "./cost-engine";
import { simulate as simulateCompetition } from "./competitor-engine";
import { evaluate as evalProfit } from "./profit-engine";
import { buildPayload } from "./payload-builder";
import { defaultPolicy } from "./policy";
import { RunInput, AuctionAnalysisResult } from "./types";

export async function runAuctionAnalysis(input: RunInput): Promise<AuctionAnalysisResult> {
  const policy = { ...defaultPolicy, ...(input.policy || {}) };
  const property = normalize(input.propertySeed, policy);
  const valuation = evalValuation({ property, policy });
  const courtDocs = attachDocs({ property, refs: input.courtDocRefs, parsed: input.courtDocsParsed });
  const rights = assessRights({ property, valuation, courtDocs, policy });
  const costs = computeCosts({ property, valuation, rights, params: input.params });
  const competition = simulateCompetition({
    property, valuation,
    params: {
      participantCount: input.params.participantCount,
      overheatScore: input.params.overheatScore,
      tick: input.params.tick,
      strategy: input.params.distribution,
      myBid: input.params.bidPrice,
    },
  });
  const profit = evalProfit({
    costs, valuation,
    params: { exitPrice: input.params.sale.exitPrice, sellBrokerRate: input.params.sale.brokerRate, sellMiscFees: input.params.sale.misc }
  });
  return buildPayload({ property, valuation, courtDocs, rights, costs, competition, profit, policy });
}
```

---

## 14.4 레이어별 역할 & 데이터 연결

| 레이어              | 입력                                     | 출력          | 비고                |
| ---------------- | -------------------------------------- | ----------- | ----------------- |
| PropertyEngine   | PropertySeed                           | Property    | 타입/단위 정규화, 기본값 채움 |
| ValuationEngine  | Property, Policy                       | Valuation   | 감정/시세/최저가, 클램프    |
| CourtDocsLayer   | Property, Refs/Parsed                  | CourtDocs   | 문서 원천 데이터(추정 금지)  |
| RightsEngine     | Property, Valuation, CourtDocs, Policy | Rights      | 총인수금액/명도비용/리스크    |
| CostEngine       | Property, Valuation, Rights, Params    | Costs       | 취득·보유·금융 총합       |
| CompetitorEngine | Property, Valuation, Params            | Competition | 참여자/분포/낙찰/순위      |
| ProfitEngine     | Costs, Valuation, ExitParams           | Profit      | 순이익/ROI/BEP/안전마진  |
| PayloadBuilder   | All                                    | Result      | Summary/라벨/추천입찰   |

**중요 규칙**

* `RightsEngine`은 **CourtDocs를 “사실 데이터”로만 사용**(추정 로직은 Policy 옵션).
* `CostEngine`의 과표/세목 로직은 `policy.ts`로 외부화(지역/시기별 변동 대응).
* `CompetitorEngine`은 동일가 몰림 방지(jitter & min-gap) 기본 내장.

---

## 14.5 v1 → v3 마이그레이션 전략

1. **래퍼 도입**

* 기존 호출부(리포트/컴포넌트)는 `runAuctionAnalysis()`만 호출하도록 래핑.
* 레거시 계산 호출은 래퍼 내부에서 제거.

2. **동일 입력 스냅샷**

* 동일 케이스(JSON)로 v1 출력과 v3 출력 비교(핵심 KPI: 총인수금액, ROI, 안전마진, 추천입찰).

3. **중간 단계 병행 운영(Feature Flag)**

* `ENGINE_V3=true`일 때만 v3 결과 노출.
* 디버그 화면에 v1/v3 주요 수치 비교 섹션 임시 제공.

4. **리포트 전환**

* 권리/경매/상세/명세서 UI를 `AuctionAnalysisResult`만 참조하도록 변경.
* 계산 로직이 UI에 남아 있으면 실패율 급증 → 반드시 제거.

5. **레거시 제거**

* `auction-cost.ts`, `rights-analysis-engine.ts`, `competitor-bids.ts` 등 **참조 0** 확인 후 삭제.

---

## 14.6 테스트 전략

**단위 테스트 (각 엔진)**

* 고정 벡터 10개(아파트/오피스텔/근린/토지…)
* 권리 케이스 12개(대항력/배당요구/유치권/법정지상권/분묘 등)
* 기대값: 총인수금액/evictionCost/lowestBidPrice

**스냅샷(통합)**

* `runAuctionAnalysis()` 결과 JSON을 스냅샷 저장
* 정책 변경 전후 diff 확인(주석으로 이유 기록)

**프로퍼티 테스트(불변식)**

* `exitPrice < breakevenExit ⇒ netProfit < 0`
* `loanRatio=0 ⇒ ownCash = totalAcquisition (+ origFee)`
* `overheat↑ ⇒ 분포 분산폭/고가 꼬리 확률 ↑`

---

## 14.7 UI·리포트·포인트 연결 규칙

* **데이터 소스는 오직 하나:** `AuctionAnalysisResult`
* 권리분석 리포트: `rights` + `courtDocs`
* 경매분석 리포트: `valuation` + `competition` + `profit`
* 수익분석 리포트: `profit` + `cost` + `valuation` + `summary`
* 상세분석 리포트: `property` + `valuation` + `rights` + `costs` + `profit`
* 매각물건명세서: `courtDocs.raw / flags / registeredRights`
* 포인트엔진: `profit`, `competition`, `summary.recommendedBidRange`만 입력으로 사용
  (포인트엔진은 **계산 금지, 점수화만** 수행)

  ---

## 14.8 단계별 적용 로드맵 + 롤백 전략

**롤아웃 단계**

1. v3 스캐폴딩 추가 + 단위 테스트 통과
2. 통합 스냅샷 10케이스 통과
3. Dev 환경에서 `ENGINE_V3=true` A/B 비교 노출
4. 리포트 4종 v3 결과로 전환
5. 포인트엔진 입력을 v3로 교체
6. 레거시 참조 제거 → 파일 삭제

**롤백 전략**

* 환경변수 플래그로 즉시 v1 경로 복구 가능
* v3 결과 캐시 무효화(케이스키: `propertyId:bid:policyHash`)
* 장애 시 스냅샷 비교 리포트로 원인 추적

---

### ✅ 부록: 최소 실행 예시

```ts
import { runAuctionAnalysis } from "@/lib/engines/auction-engine";

const result = await runAuctionAnalysis({
  propertySeed: {
    id: "2025-004871",
    type: "apt",
    region: "서울 중구",
    address: "중구 다산로 32",
    sizeM2: 84.92,
    yearBuilt: 2004,
    court: "서울중앙지방법원",
    caseNumber: "2025타경4871",
    auctionStep: "1회차",
    rightsDifficulty: "hard",
  },
  params: {
    bidPrice: 382_000_000,
    participantCount: 8,
    overheatScore: 72,
    tick: 10000,
    distribution: "B-two-peak",
    loan: { ratio: 0.7, rate: 0.045, months: 6 },
    holding: { monthly: 120000, months: 6 },
    repairCost: 4_000_000,
    acquisitionFees: 1_200_000,
    acquisitionTaxRates: { base: 0.028, localEdu: 0.003, special: 0.001 },
    sale: { exitPrice: 470_000_000, brokerRate: 0.004, misc: 800_000 },
  },
});

console.log(result.summary, result.profit, result.rights);
```

---

### Definition of Done (14장)

* `runAuctionAnalysis()` 단일 엔트리 확정
* 각 엔진 단위 테스트, 통합 스냅샷 통과
* UI/리포트는 계산 0% (표시만)
* 환경 플래그로 안전한 병행/롤백 가능
* 레거시 계산 파일 참조 0개

```
```








