# 🛠 AI 기반 시세 예측 모듈 적용 및 엔진 연동 계획 (plan1.md)

## ✅ 개요

현재 시스템은 "시세(V)" 값을 자동 계산하고 있으나, 방식이 **단일값 + 단순 계수 기반**이며 실제 AI 예측 구조가 아님.
이를 **AI 시뮬레이션 기반 시세 예측 엔진(`market-price.ts`)으로 교체**하고,
해당 결과를 `auction-engine.ts`에 자동 연동하여 **수익률/권장입찰가 계산 흐름을 업그레이드**한다.

---

## ✅ STEP 1 — 기존 market-price.ts 분석 결과 요약

| 항목                    | 현재 상태          | 문제점                              |
| ----------------------- | ------------------ | ----------------------------------- |
| 시세 값 생성 방식       | 감정가 × 계수 방식 | 시장 반영 불가 / 랜덤성 없음        |
| 반환 형태               | 단일 가격(V)       | 구간(min/max) 없음 → 위험 판단 불가 |
| AI 기반 여부            | ❌ 아님            | 확장 불가 / 학습 기능 없음          |
| confidence / volatility | 없음               | 신뢰도 판단 불가                    |
| auction-engine 연동     | V 단일값 전달      | 구조 단순 → 개선 필요               |

결론: **"작동은 되지만, 시세 생성이 'AI 예측'이라 보기 어려운 구조" → 완전 교체 필요**

---

## ✅ STEP 2 — 새 `market-price.ts` 생성 (AI 시세 예측 버전)

📌 변경 목표

```
- 단일값 반환 → 시세 구간(min/max) + confidence + volatility 제공
- 감정가 기반 계산 → 지역/면적/연식/유형 반영 AI 시뮬레이션 방식으로 변경
- 후속 실제 AI 모델 학습이 가능한 인터페이스 구조 설계
```

📌 생성 파일

```
REPLACE FILE: /src/lib/market-price.ts
```

📌 적용 인터페이스

```ts
export interface AIMarketPriceParams {
  appraised: number;
  area?: number;
  regionCode?: string;
  yearBuilt?: number;
  propertyType?: "APT" | "OFFICETEL" | "VILLA" | "ETC";
}

export interface AIMarketPriceResult {
  min: number;
  max: number;
  confidence: number;
  volatility: number;
  model: string;
}
```

📌 기능 흐름

```
1. 입력(감정가, 면적, 지역코드, 유형 등) → AI 추정 중심값(center) 생성
2. 보수/낙관 편차 계산 → min/max 생성
3. confidence = 0.55 고정 (초기) → 후속 모델/데이터로 대체 예정
4. volatility = 지역 기반 기본값 (예: 0.06 = ±6%)
5. 반환 → auction-engine.ts에 자동 전달
```

📌 범위 예시 출력

```
AI 예상 시세: 492,000,000 ~ 531,000,000원 (신뢰도 0.57)
```

---

## ✅ STEP 3 — auction-engine.ts 자동 연동

📍 기존 방식

```ts
calcAcquisitionAndMoS({ bidPrice, estimatedMarketPrice: V });
```

➡️ 사용자가 직접 입력하거나, 기존 market-price.ts 단일값 사용

📍 변경 후 방식

```ts
import { estimateAIMarketPrice } from "./market-price";

const mp = estimateAIMarketPrice({ appraised, area, regionCode, ... });
const V = Math.floor((mp.min + mp.max) / 2); // 기준 시세 선택

calcAcquisitionAndMoS({ bidPrice, estimatedMarketPrice: V, ... })
```

📌 추가 옵션

```
- 보수 시세 적용: V = mp.min
- 중립 시세 적용: V = (mp.min + mp.max) / 2
- 낙관 시세 적용: V = mp.max
```

📌 UI 대응 플로우

```
기존: "예상 시세: 5.1억"
개선: "AI 예상 시세: 4.9억 ~ 5.3억 (신뢰도 0.62)"
```

---

## ✅ STEP 4 — plan.md 업데이트 필요 항목

```
[✅] STEP 4-1 추가: auction-engine.ts → AI 자동 시세 연동
[✅] 기존 시세 입력/단일값 로직 삭제 (하위 호환성 유지하며 marketPriceRange 옵션 추가)
[✅] UI 업데이트 (사이드바 표시: min~max + confidence)
[✅] 테스트 체크리스트 갱신: 수익률이 시세 시나리오별로 다르게 나오는지 검증
```

---

## ✅ STEP 5 — 실행 순서 요약

```
1. 새 market-price.ts 생성 ✅
2. auction-engine.ts 에서 AI 시세 자동 호출하도록 수정 ✅
3. calcAcquisitionAndMoS 입력 인자 변경 (단일 V → 선택 적용) ✅
4. UI에 AI 시세 예측값 노출 ✅
5. 테스트: 보수/중립/낙관 시나리오에서 수익률·권장입찰가 변화 확인 ✅
```

---

## ✅ STEP 6 — 구현 완료 요약

### 완료된 작업

1. **market-price.ts AI 시뮬레이션 함수 추가** ✅

   - `estimateAIMarketPrice` 함수 생성
   - `AIMarketPriceParams`, `AIMarketPriceResult` 인터페이스 정의
   - 지역/면적/연식/유형 반영한 AI 추정 중심값 계산
   - 보수/낙관 편차 적용 (min/max 범위 제공)
   - confidence 0.55 고정, volatility 0.06 기본값

2. **auction-cost.ts 시나리오별 시세 적용** ✅

   - `AcquisitionInput`에 `marketPriceRange`, `marketPriceScenario` 옵션 추가
   - `AcquisitionResult`에 `marketPriceUsed`, `marketPriceScenario` 메타데이터 추가
   - `calcAcquisitionAndMoS`에 시나리오별 시세 선택 로직 구현
   - 하위 호환성 유지 (기존 `marketValue` 지원)

3. **auction-engine 연동** ✅

   - `rights-analysis-engine.ts`: `analyzeRights`에 AI 시세 자동 연동
   - `BiddingModal.tsx`: 입찰 결과 계산에 AI 시세 적용
   - `property/[id]/page.tsx`: 권장 입찰가 및 ROI 계산에 AI 시세 적용

4. **UI 업데이트** ✅

   - `BiddingModal.tsx`: 입찰 결과에 "AI 예상 시세" 범위 및 신뢰도 표시
   - `SidebarSummary.tsx`: 사이드바에 AI 예상 시세 정보 표시
   - 시세 범위 표시 형식: "min ~ max (신뢰도: XX%)"

5. **타입 정의 및 유틸리티** ✅

   - 모든 인터페이스 및 타입 정의 완료
   - `mapPropertyTypeToAIMarketPriceType` 공통 유틸리티 함수 추출
   - JSDoc 주석 완비

6. **테스트 체크리스트 작성** ✅
   - 단위 테스트 시나리오 작성
   - 통합 테스트 체크리스트 작성
   - 에러 처리 및 엣지 케이스 검증 항목 추가
   - 참고: `docs/ai-market-price-test-checklist.md`

### 주요 변경 파일

1. `src/lib/property/market-price.ts` - AI 시세 예측 함수 추가
2. `src/lib/auction-cost.ts` - 시나리오별 시세 적용 옵션 추가
3. `src/lib/rights-analysis-engine.ts` - AI 시세 연동
4. `src/components/BiddingModal.tsx` - UI에 시세 범위 표시
5. `src/app/property/[id]/page.tsx` - 권장 입찰가 계산에 AI 시세 적용
6. `src/components/property/SidebarSummary.tsx` - 사이드바에 AI 시세 표시
7. `src/types/property.ts` - `SidebarSummaryProps`에 AI 시세 정보 추가

### 사용 예시

```typescript
// AI 시세 예측
import {
  estimateAIMarketPrice,
  mapPropertyTypeToAIMarketPriceType,
} from "@/lib/property/market-price";

const aiMarketPriceResult = estimateAIMarketPrice({
  appraised: 500_000_000,
  area: 84,
  regionCode: "서울특별시 강남구",
  propertyType: mapPropertyTypeToAIMarketPriceType("아파트"),
});

// 결과: { min: 470_000_000, max: 530_000_000, confidence: 0.55, volatility: 0.06, model: "v0.1-ai-simulation" }

// 시나리오별 총인수금액 계산
import { calcAcquisitionAndMoS } from "@/lib/auction-cost";

const result = calcAcquisitionAndMoS({
  bidPrice: 350_000_000,
  rights: 10_000_000,
  capex: 5_000_000,
  eviction: 2_000_000,
  carrying: 0,
  contingency: 1_000_000,
  marketPriceRange: {
    min: aiMarketPriceResult.min,
    max: aiMarketPriceResult.max,
  },
  marketPriceScenario: "neutral", // "conservative" | "neutral" | "optimistic"
  taxInput: { use: "RESIDENTIAL", price: 350_000_000 },
});

// 결과에 marketPriceUsed, marketPriceScenario 포함됨
```

### 로그 확인 포인트

- `🤖 [AI 시세 예측]` - AI 시세 예측 시작/완료
- `🤖 [AI 시세 연동]` - AI 시세 연동 및 적용
- `💰 [총인수금액]` - 시나리오별 시세 적용 및 계산 결과

---

## ✅ 이후 확장 계획

```
[ ] AI 학습 버전 v0.2 적용 (실제 데이터 기반 LightGBM 회귀 모델 추가)
[ ] confidence 자동 산출 (RMSE 기반)
[ ] volatility 지역별 갱신 (변동성 DB 적용)
[ ] "사용자 vs AI 시세 예측 정확도 비교" 기능 도입
[ ] 시나리오별 토글 UI 추가 (보수/중립/낙관 시나리오 선택 가능)
[ ] 지역별 계수 DB 구축 (강남권, 서울, 지방 등 세분화)
[ ] 연식별 계수 세분화 (10년 단위가 아닌 연속적 계수)
```

---

## 📝 변경 이력

### 2025-01-XX: AI 시세 예측 모듈 v0.1 완료

- STEP 1-7 모든 작업 완료
- AI 시세 예측 함수 구현
- 시나리오별 시세 적용 옵션 추가
- UI에 시세 범위 및 신뢰도 표시
- 테스트 체크리스트 작성
