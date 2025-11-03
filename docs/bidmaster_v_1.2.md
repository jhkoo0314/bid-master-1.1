# Bid Master v1.2 – Full System Build Guide (2025-11)

## 1. 목적 및 개정 범위

Bid Master v1.2는 기존 v1.1에서 분산되어 있던 **권리분석·총인수금액·시세예측·입찰추천 로직**을 통합 정비하여, 단일 계산 엔진(`auction-engine.ts`) 기반으로 재구성하는 버전이다.

본 문서는 **Cursor 기반 개발 실행 문서**이며, 아래 내용을 모두 포함한다.

- 생성엔진 / 계산엔진 / UI 변환 레이어 구조 명확화
- 기존 레거시 분산 함수 통합 및 재구성
- **공격적·중립·보수적 3단계 입찰 추천표 공식 반영**
- 전체 TypeScript 타입 정의 확정
- 지역분석·유사사례·권리리스크 변환 구조 문서화
- v1.2 이후 v2.0 전환 시 준비 요소 기록

---

## 2. 시스템 전체 흐름도

```
[OpenAI Property Generator] → Scenario(시뮬레이션) →
  → RightsAnalysisEngine
  → AIMarketPriceEngine
  → AcquisitionCostEngine
  → SafetyMarginEngine
  → BidStrategyEngine(3-Stage: Aggressive / Neutral / Conservative)
  → mapSimulationToPropertyDetail() → UI 화면 반영
```

---

## 3. 필수 타입 정의 (확정)

### ✅ 이미 구현됨 (수정 필요 없음)

- `SimulationScenario`
- `CaseBasicInfo`, `RightRecord`, `TenantRecord`, `RegionalAnalysis`, `EducationalContent`
- `AIMarketPriceResult`, `MarketPriceResult`
- `RightsAnalysisResult`

### ✅ 신규/확장 타입

| Layer      | Type                                                  | Status    | 구현 위치                                    |
| ---------- | ----------------------------------------------------- | --------- | -------------------------------------------- |
| 계산엔진   | `AcquisitionResult`                                   | ✅ 완료   | `src/lib/auction-cost.ts`                    |
| 계산엔진   | `BidStrategyResult`                                   | ⏳ 미착수 | `src/lib/bid-strategy.ts` (파일 미생성)      |
| 계산엔진   | `RiskLevel`, `DifficultyLevel`                        | ✅ 완료   | `src/lib/property/safety-calc.ts`            |
| 계산엔진   | `AIMarketPriceResult`                                 | ✅ 완료   | `src/lib/property/market-price.ts`           |
| 계산엔진   | `AdvancedAssumptionInput`, `AdvancedAssumptionResult` | ✅ 완료   | `src/lib/property/safety-calc.ts`            |
| 변환레이어 | `PropertyDetail`                                      | ✅ 완료   | `src/types/property.ts`, v1.2 필드 확장 예정 |

---

## 4. 엔진 구조 (v1.2 고정)

```
/src/lib
  ├─ auction-engine.ts                    ⏳ 통합 계산 엔진 (최상위) - 예제 코드만 존재
  ├─ property/
  │   ├─ market-price.ts                  ✅ AI 시세예측 모듈
  │   ├─ safety-calc.ts                   ✅ 고도화 안전마진 계산 모듈
  │   ├─ formatters.ts                    ✅ Simulation → PropertyDetail 변환
  │   ├─ fetchers.ts                      ✅ 매물 데이터 가져오기
  │   └─ generateSimilarCases.ts          ✅ 유사낙찰사례 생성
  ├─ rights-analysis-engine.ts            ✅ 권리/임차인 분석 엔진 (v1.1 유지, 최소 보완)
  ├─ auction-cost.ts                      ✅ 취득세/중개비/취등록세 계산 (기존 유지)
  ├─ bid-strategy.ts                      ⏳ 3단계 입찰전략 생성 모듈 (신규, 미생성)
  ├─ regional-analysis.ts                 ✅ 지역기관 매핑
  └─ rights-engine.ts                     ✅ 권리 인수금액 계산 엔진
```

**주요 모듈 상태**:

- ✅ 완료: `market-price.ts`, `safety-calc.ts`, `rights-analysis-engine.ts`, `auction-cost.ts`, `regional-analysis.ts`, `formatters.ts`
- ⏳ 미착수: `auction-engine.ts` (통합 엔진), `bid-strategy.ts` (입찰전략)

---

## 5. 생성엔진 Layer (확정)

### 5.1 generateProperty() 핵심 흐름

```
1. OpenAI 기반 매물 생성
2. 권리/임차/감정가/최저가 누락 시 보완값 생성
3. 권리분석 실행 → assumed / extinguished 구분
4. 지역분석 attach
5. 결과 → SimulationScenario 반환
```

✅ 현재 코드 유지 / v1.2 영향 없음

---

## 6. 계산엔진 Layer

### 6.1 AI 시세 예측 (estimateAIMarketPrice)

- 입력: `AIMarketPriceParams`
- 출력: `{ min, max, center, fairCenter, auctionCenter, confidence, volatility }`
- FMV(fairMarketValue) = MoS(안전마진) 계산용 중심값
- auctionCenter = UI 입찰가 가이드 중심값

### 6.2 총인수금액 계산 (`src/lib/auction-cost.ts`)

✅ 구현 완료. 주요 공개 API:

```
calcAcquisitionAndMoS(input: AcquisitionInput): AcquisitionResult
calcTaxes(input: TaxInput, options?: TaxOptions): TaxBreakdown
```

**주요 인터페이스**:

- `AcquisitionInput`: 입찰가, 권리, 세금 입력 등
- `AcquisitionResult`: 총인수금액, 안전마진, 마진율 등

### 6.3 권리 인수금액 + 최소 안전마진 (`src/lib/property/safety-calc.ts`)

✅ 구현 완료:

- 레거시 → `calculateSafetyMargin()` (단순형) - 존재
- v1.2 → `calculateAdvancedAssumption()` (고도형) - ✅ 구현 완료

**최소 안전마진 공식**:

```
minSafetyMargin = max(assumedAmountRaw × typeFactor, lowestPrice × exposureRate)
                × riskFactor × difficultyFactor
```

**함수 시그니처**:

```ts
export function calculateAdvancedAssumption(
  input: AdvancedAssumptionInput
): AdvancedAssumptionResult;
```

**입력 파라미터**:

- `rights`: 권리 배열
- `propertyType`: 매물 유형
- `lowestPrice`: 최저매각가격
- `riskLevel`: "low" | "mid" | "high"
- `difficulty`: "beginner" | "intermediate" | "advanced"

### 6.4 입찰전략 3단계 추천 공식

```
conservative = fairCenter × 0.83
neutral       = fairCenter × 0.89
aggressive    = fairCenter × 0.96
```

출력 예시:

```
{ stage: "보수적",  value: 612,000,000 }
{ stage: "중립",    value: 655,000,000 }
{ stage: "공격적",  value: 702,000,000 }
```

---

## 7. UI 변환 Layer (`src/lib/property/formatters.ts`)

### mapSimulationToPropertyDetail()

✅ 구현 완료. 실제 프로덕션에서 사용 중 (`src/app/property/[id]/page.tsx`, `src/components/BiddingModal.tsx`)

**주요 기능**:

- `SimulationScenario` → `PropertyDetail` 변환
- 리스크 점수 계산 (0~100, `calculateRiskScore` 함수)
- 지역기관 정보 동적 생성 (`generateRegionalAnalysis` 연동)

**v1.2 변경 사항 (예정)**:

- `sim.analysis.marketValue.fairMarketValue` → `price.estimatedMarket`
- `bidStrategy` 필드 추가 (아직 미반영)
- `riskScore` 정규화 적용 (0~100) - ✅ 이미 구현됨

---

## 8. 실행 체크리스트 ✅

| Step | 작업                                  | 상태      | 구현 위치 / 비고                                                                                                                                                                                                    |
| ---- | ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | v1.2 타입 정의 확정                   | ✅ 완료   | `src/types/simulation.ts` (SimulationScenario), `src/lib/auction-cost.ts` (AcquisitionResult), `src/lib/rights-analysis-engine.ts` (RightsAnalysisResult), `src/lib/property/market-price.ts` (AIMarketPriceResult) |
| 2    | auction-engine.ts 스캐폴드 생성       | ⏳ 미착수 | 현재 `src/lib/auction-engine.ts`에 예제 코드만 존재. 실제 통합 엔진 구현 필요                                                                                                                                       |
| 3    | AI 시세예측 엔진 연결                 | ✅ 완료   | `src/lib/property/market-price.ts` (estimateAIMarketPrice), `src/lib/rights-analysis-engine.ts`에서 이미 사용 중                                                                                                    |
| 4    | 총인수금액 + 안전마진 통합            | ✅ 완료   | `src/lib/auction-cost.ts` (calcAcquisitionAndMoS), `src/lib/property/safety-calc.ts` (calculateAdvancedAssumption)                                                                                                  |
| 5    | 3단계 입찰전략 생성기 구현            | ⏳ 미착수 | `bid-strategy.ts` 파일 미생성. `BidStrategyResult` 타입 및 `recommendBidStrategy` 함수 구현 필요                                                                                                                    |
| 6    | Simulation → PropertyDetail 변환 확정 | ✅ 완료   | `src/lib/property/formatters.ts` (mapSimulationToPropertyDetail), 실제 프로덕션에서 사용 중                                                                                                                         |
| 7    | DevMode 및 로컬 Seed 100개 생성       | ⏳ 미착수 | 구현 미시작                                                                                                                                                                                                         |
| 8    | UI 연결 / 테스트                      | ⏳ 미착수 | 부분 연결됨 (`src/app/property/[id]/page.tsx`, `src/components/BiddingModal.tsx`)                                                                                                                                   |

---

## 9. Pending Decisions (확인 필요)

| 항목                     | 상태     | 메모                          |
| ------------------------ | -------- | ----------------------------- |
| riskLevel 자동 계산 여부 | 결정필요 | 임차인/권리 개수 기반 자동화? |
| 시세예측 v0.2 업그레이드 | 보류     | KB/네이버 API 연동 여부       |
| 입찰참여자 수 자동 생성  | 보류     | 랜덤 or 지역 기반?            |
| 취득세 계산 고도화       | 보류     | 면적/연식/주택 수 포함 여부   |

---

## 10. auction-engine.ts 스캐폴드 (현재 상태: 예제 코드만 존재)

**현재 상태**: `src/lib/auction-engine.ts` 파일에 예제 코드/주석만 존재하며, 실제 통합 엔진 구현은 미완료 상태입니다.

**실제 구현 시 필요한 import 경로**:

```ts
// src/lib/auction-engine.ts
import type { SimulationScenario } from "@/types/simulation";
import type { AIMarketPriceResult } from "@/lib/property/market-price";
import type { AcquisitionResult } from "@/lib/auction-cost";
import type { RightsAnalysisResult } from "@/lib/rights-analysis-engine";
import type { BidStrategyResult } from "@/lib/bid-strategy"; // ⚠️ 아직 미생성

import {
  estimateAIMarketPrice,
  mapPropertyTypeToAIMarketPriceType,
} from "@/lib/property/market-price";
import { analyzeRights } from "@/lib/rights-analysis-engine";
import { calcAcquisitionAndMoS } from "@/lib/auction-cost";
import { recommendBidStrategy } from "@/lib/bid-strategy"; // ⚠️ 아직 미생성
```

**예상 스캐폴드 구조**:

```ts
export interface AuctionEngineInput {
  scenario: SimulationScenario;
  userBid?: number;
}

export interface AuctionEngineOutput {
  market: AIMarketPriceResult;
  acquisition: AcquisitionResult;
  rights: RightsAnalysisResult;
  bidStrategy: BidStrategyResult;
  logs?: string[];
}

export function runAuctionEngine(
  input: AuctionEngineInput
): AuctionEngineOutput {
  const logs: string[] = [];

  // 1. AI 시세 예측
  const market = estimateAIMarketPrice({
    appraised: input.scenario.basicInfo.appraisalValue,
    area: input.scenario.propertyDetails.buildingArea,
    regionCode: input.scenario.basicInfo.location,
    propertyType: mapPropertyTypeToAIMarketPriceType(
      input.scenario.basicInfo.propertyType
    ),
    minimumBidPrice: input.scenario.basicInfo.minimumBidPrice,
  });
  logs.push("💰 [경매 엔진] AI 시세예측 완료");

  // 2. 총인수금액 계산 (calcAcquisitionAndMoS 사용)
  // ⚠️ 실제 구현 시 scenario와 market을 기반으로 적절한 입력값 구성 필요
  const acquisition = calcAcquisition(input.scenario, market);
  logs.push("💰 [경매 엔진] 총인수금액 계산 완료");

  // 3. 권리/임차인 분석
  const rights = analyzeRights(input.scenario);
  logs.push("⚖️ [경매 엔진] 권리/임차인 분석 완료");

  // 4. 입찰전략 계산
  const bidStrategy = recommendBidStrategy(market, acquisition);
  logs.push("🎯 [경매 엔진] 입찰전략 계산 완료");

  return { market, acquisition, rights, bidStrategy, logs };
}
```

**주의사항**:

- `calcAcquisition` 함수는 현재 존재하지 않음. `calcAcquisitionAndMoS`를 사용하되, `AcquisitionInput` 인터페이스에 맞게 scenario 데이터를 변환해야 함
- `bid-strategy.ts` 파일이 아직 생성되지 않아 `BidStrategyResult` 타입과 `recommendBidStrategy` 함수를 먼저 구현해야 함

---

## 11. 3단계 입찰전략 로직 (공격적/중립/보수적)

**현재 상태**: `src/lib/bid-strategy.ts` 파일이 아직 생성되지 않았습니다. `BidStrategyResult` 타입과 `recommendBidStrategy` 함수 구현이 필요합니다.

**비율 값 일관성 확인 필요**:

- 섹션 6.4: `conservative = fairCenter × 0.83`, `neutral = fairCenter × 0.89`, `aggressive = fairCenter × 0.96`
- 섹션 10 예제 코드: `conservative = fairCenter × 0.86`, `neutral = fairCenter × 0.91`, `aggressive = fairCenter × 0.97`
- **결정 필요**: 최종 비율 값을 섹션 6.4 기준(0.83/0.89/0.96)으로 통일 권장

**예상 구현 구조** (`src/lib/bid-strategy.ts`):

```ts
import type { AIMarketPriceResult } from "@/lib/property/market-price";
import type { AcquisitionResult } from "@/lib/auction-cost";

export interface BidStrategyResult {
  conservative: number;
  neutral: number;
  aggressive: number;
  optimal: number;
}

/**
 * 3단계 입찰전략 추천 (보수적/중립/공격적)
 *
 * @param market AI 시세 예측 결과
 * @param acquisition 총인수금액 계산 결과
 * @returns 3단계 입찰가 및 최적 입찰가
 */
export function recommendBidStrategy(
  market: AIMarketPriceResult,
  acquisition: AcquisitionResult
): BidStrategyResult {
  const { fairCenter } = market;
  const { totalAcquisition } = acquisition;

  // 3단계 입찰전략 (fairCenter 기준)
  // ⚠️ 최종 비율 결정 필요: 섹션 6.4 기준 또는 다른 값
  const conservative = Math.round(fairCenter * 0.83);
  const neutral = Math.round(fairCenter * 0.89);
  const aggressive = Math.round(fairCenter * 0.96);

  // 최적 입찰가: 중립 전략과 총인수금액의 105% 중 큰 값
  const optimal = Math.max(neutral, totalAcquisition * 1.05);

  console.log("🎯 [입찰전략] 3단계 입찰전략 계산 완료", {
    conservative: conservative.toLocaleString(),
    neutral: neutral.toLocaleString(),
    aggressive: aggressive.toLocaleString(),
    optimal: optimal.toLocaleString(),
  });

  return { conservative, neutral, aggressive, optimal };
}
```

**출력 예시**:

```
{
  conservative: 612,000,000,
  neutral: 655,000,000,
  aggressive: 702,000,000,
  optimal: 655,000,000
}
```

---

## 12. 총인수금액 + 안전마진 통합 구조 (`src/lib/auction-cost.ts`)

✅ 구현 완료. `calcAcquisitionAndMoS` 함수에서 처리 중.

**계산 공식**:

```
총인수금액 A = B + R + T + C + E + K + U
(B: 낙찰가, R: 인수권리, T: 임차보증금, C: 취득세, E: 중개비, K: 등기/법무비, U: 기타)
안전마진 = V - A   // V = FMV (fair market value)
```

**구현 상태**:

- ✅ `src/lib/auction-cost.ts`: 총인수금액 계산 (`calcAcquisitionAndMoS`)
- ✅ `src/lib/property/safety-calc.ts`: 고도화 안전마진 계산 (`calculateAdvancedAssumption`)
- ✅ `src/lib/rights-engine.ts`: 권리 인수금액 계산 (`computeAssumableCost`)

---

## 13. UI 연동 계약 (Simulation → PropertyDetail)

- 매물카드: 최저가 / 감정가 / 할인율 / 리스크 점수 표시
- 상세페이지: 안전마진 · 입찰전략 · 권리분석 결과 표시
- 시뮬레이터: 사용자 입찰가 → 엔진 재실행 → 결과 갱신

---

## 14. Dev Mode: 100개 자동 시드 생성 규칙

- generateMultipleProperties(초급/중급/고급 × n) 실행
- 결과 → /mock/sim-seed-\*.json 저장 (dev only)
- UI는 DB 없이 해당 JSON 스트림을 목록으로 활용

---

## 15. 다음 작업 요청 가능 항목

```
✔ auction-engine.ts 실제 구현 시작
✔ 세금/취득비 calc 모듈 삽입
✔ MoS + ROI 결과 리포트 출력 스펙 작성
✔ 입찰전략 UI 출력 형식 지정
```

---

## 16. 현재 구현 상태 요약

### ✅ 완료된 항목

#### 타입 정의

- `SimulationScenario` (`src/types/simulation.ts`)
- `AcquisitionResult` (`src/lib/auction-cost.ts`)
- `AIMarketPriceResult` (`src/lib/property/market-price.ts`)
- `RightsAnalysisResult` (`src/lib/rights-analysis-engine.ts`)
- `AdvancedAssumptionInput`, `AdvancedAssumptionResult` (`src/lib/property/safety-calc.ts`)
- `RiskLevel`, `DifficultyLevel` (`src/lib/property/safety-calc.ts`)

#### 계산 엔진

- AI 시세 예측: `estimateAIMarketPrice` (`src/lib/property/market-price.ts`) ✅
- 총인수금액 계산: `calcAcquisitionAndMoS` (`src/lib/auction-cost.ts`) ✅
- 권리 인수금액 계산: `computeAssumableCost` (`src/lib/rights-engine.ts`) ✅
- 권리/임차인 분석: `analyzeRights` (`src/lib/rights-analysis-engine.ts`) ✅
- 고도화 안전마진 계산: `calculateAdvancedAssumption` (`src/lib/property/safety-calc.ts`) ✅

#### UI 변환

- `mapSimulationToPropertyDetail` (`src/lib/property/formatters.ts`) ✅
- 리스크 점수 계산 (`calculateRiskScore`) ✅

#### 지역 분석

- `generateRegionalAnalysis` (`src/lib/regional-analysis.ts`) ✅

### ⏳ 미완료 항목

#### 통합 엔진

- `auction-engine.ts` (`src/lib/auction-engine.ts`): 예제 코드만 존재, 실제 통합 엔진 구현 필요
- `runAuctionEngine` 함수: 미구현

#### 입찰전략

- `bid-strategy.ts` (`src/lib/bid-strategy.ts`): 파일 미생성
- `BidStrategyResult` 타입: 미정의
- `recommendBidStrategy` 함수: 미구현

#### 개발 도구

- DevMode 시드 생성 (100개 자동 생성): 미구현

#### UI 연동

- `bidStrategy` 필드 추가: `PropertyDetail` 타입에 미반영
- 입찰전략 UI 출력: 부분 연결됨

---

## 17. 다음 작업 우선순위

### Phase 1: 입찰전략 모듈 구현 (최우선)

1. **`src/lib/bid-strategy.ts` 파일 생성**

   - `BidStrategyResult` 타입 정의
   - `recommendBidStrategy` 함수 구현
   - 입찰전략 비율 최종 결정 (0.83/0.89/0.96 vs 0.86/0.91/0.97)
   - 로그 추가: `🎯 [입찰전략] 3단계 입찰전략 계산 완료`

2. **테스트 작성**
   - 다양한 `fairCenter` 값에 대한 입찰전략 계산 검증
   - `totalAcquisition` 기반 `optimal` 값 검증

### Phase 2: 통합 엔진 구현

3. **`src/lib/auction-engine.ts` 실제 구현**

   - `runAuctionEngine` 함수 구현
   - 기존 모듈들 통합 연결:
     - `estimateAIMarketPrice` 호출
     - `analyzeRights` 호출
     - `calcAcquisitionAndMoS` 호출 (scenario → AcquisitionInput 변환 필요)
     - `recommendBidStrategy` 호출
   - 에러 처리 및 로그 추가
   - 로그 형식: `💰 [경매 엔진]`, `⚖️ [경매 엔진]`, `🎯 [경매 엔진]`

4. **시나리오 → 입력 변환 함수 작성**
   - `SimulationScenario` → `AcquisitionInput` 변환 로직
   - 권리 인수금액 계산 연동
   - 세금 입력 구성

### Phase 3: UI 연동

5. **PropertyDetail 타입 확장**

   - `bidStrategy` 필드 추가 (`BidStrategyResult` 타입)
   - `mapSimulationToPropertyDetail` 함수 업데이트

6. **UI 컴포넌트 업데이트**
   - 입찰전략 표시 컴포넌트 생성/수정
   - 상세 페이지에 입찰전략 섹션 추가
   - 입찰 모달에 입찰전략 표시

### Phase 4: 개발 도구

7. **DevMode 시드 생성**
   - `generateMultipleProperties` 함수 생성 (초급/중급/고급 × n)
   - `/public/mock/sim-seed-*.json` 저장 로직
   - 100개 자동 생성 스크립트 작성

### Phase 5: 테스트 및 검증

8. **전체 엔진 통합 테스트**
   - end-to-end 시나리오 테스트
   - 다양한 난이도 매물에 대한 계산 검증
   - UI 표시 검증

### 작업 순서 요약

```
1. bid-strategy.ts 생성 및 구현
2. auction-engine.ts 통합 엔진 구현
3. PropertyDetail 타입 확장 및 변환 함수 업데이트
4. UI 컴포넌트 업데이트
5. DevMode 시드 생성
6. 전체 테스트
```

### END OF DOCUMENT ✅

(본 문서는 Cursor 기반 개발을 위한 v1.2 최종 설계서입니다.)
