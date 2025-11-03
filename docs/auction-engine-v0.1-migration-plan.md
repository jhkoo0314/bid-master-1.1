# Auction Engine v0.1 마이그레이션 상세 계획

> **목적**: 파편화된 계산 로직을 제거하고 `auction-engine.ts` 단일 진입점으로 통합
> **기준 문서**: `docs/auction-engine-v0.1.md` > **작성일**: 2025-01-XX

---

## 📋 1. 현재 상태 분석

### 1.1 기존 파일 구조

```
src/lib/
├─ auction-engine.ts          # ✅ 존재 (v1.2 버전, 재작성 필요)
├─ auction-cost.ts            # ⚠️ 활발히 사용 중 (제거 대상)
├─ profit-calculator.ts       # ⚠️ 활발히 사용 중 (제거 대상)
├─ rights-analysis-engine.ts  # ⚠️ 활발히 사용 중 (제거 대상)
└─ rights-engine.ts           # ✅ 존재 (다른 목적, 유지)
```

### 1.2 현재 사용 현황 (import 분석)

**`auction-cost.ts` 사용 위치:**

- `src/app/property/[id]/page.tsx`
- `src/components/BiddingModal.tsx`
- `src/lib/rights-analysis-engine.ts`
- `src/lib/auction-engine.ts` (v1.2)
- `src/lib/auction-metrics.ts`

**`profit-calculator.ts` 사용 위치:**

- `src/components/BiddingModal.tsx`
- `src/components/ProfitCalculator.tsx`

**`rights-analysis-engine.ts` 사용 위치:**

- `src/app/property/[id]/page.tsx`
- `src/components/BiddingModal.tsx`
- `src/lib/point-calculator.ts`
- `src/app/actions/generate-simulation.ts`
- `src/app/actions/generate-property.ts`
- `src/app/legacy/property/[caseId]/page.tsx`

### 1.3 타입 정의 현황

**기존 타입 파일:**

- `src/types/property.ts` - `AcquisitionBreakdown`, `SafetyMargin`, `CalcResult` 등
- `src/types/simulation.ts` - `RightsAnalysisResult`, `SimulationScenario` 등

**새로 생성 필요:**

- `src/types/auction.ts` - 통합 타입 정의

---

## 🎯 2. 마이그레이션 목표

1. ✅ **단일 진입점**: `auctionEngine()` 함수 하나로 모든 계산 수행
2. ✅ **4개 레이어 분리**: Valuation → Rights → Costs → Profit
3. ✅ **타입 통합**: `src/types/auction.ts`에 모든 타입 정의
4. ✅ **기존 파일 제거**: `auction-cost.ts`, `profit-calculator.ts`, 구 `rights-analysis-engine.ts`
5. ✅ **하위 호환성**: 기존 컴포넌트들이 정상 동작하도록 유지

---

## 📝 3. 단계별 실행 계획

### ✅ Phase 1: 타입 정의 및 레이어 파일 생성 (순수 작업)

#### 3.1 타입 정의 생성

**파일**: `src/types/auction.ts`

**작업 내용:**

- 문서의 타입 정의를 그대로 복사
- 기존 `property.ts`, `simulation.ts`와의 호환성 고려
- 마이그레이션 브리지 타입 추가 (선택)

**검증:**

- TypeScript 컴파일 오류 없음
- 타입 export 확인

#### 3.2 Valuation 레이어 생성

**파일**: `src/lib/valuation.ts`

**작업 내용:**

- 문서 코드 블록 복사
- `@/types/auction` 타입 import
- 로그 추가 (규칙 준수)

**검증:**

- 단위 테스트 작성 (선택)
- `estimateValuation()` 함수 동작 확인

#### 3.3 Rights 레이어 생성

**파일**: `src/lib/rights/rights-engine.ts`

**작업 내용:**

- 디렉토리 생성 필요
- 문서 코드 블록 복사
- `PropertySnapshot`, `RegisteredRight`, `Tenant` 타입 매핑 로직 포함

**검증:**

- `analyzeRights()` 함수 동작 확인
- 말소기준권리 판단 로직 검증

#### 3.4 Costs 레이어 생성

**파일**: `src/lib/costs.ts`

**작업 내용:**

- 문서 코드 블록 복사
- 세율 기본값 설정 (교육용)
- 명도비/기타비용 기본값 설정

**검증:**

- `calcCosts()` 함수 동작 확인
- 세금 계산 정확성 검증

#### 3.5 Profit 레이어 생성

**파일**: `src/lib/profit.ts`

**작업 내용:**

- 문서 코드 블록 복사
- 안전마진 계산 로직 포함

**검증:**

- `evaluateProfit()` 함수 동작 확인
- 안전마진 계산 정확성 검증

---

### ✅ Phase 2: 오케스트레이션 엔진 구현

#### 3.6 auction-engine.ts 재작성

**파일**: `src/lib/auction-engine.ts`

**작업 내용:**

1. **기존 v1.2 코드 백업** (임시로 주석 처리)
2. 문서의 `auctionEngine()` 함수 구현
3. `EngineInput` → `EngineOutput` 변환 로직
4. devMode 로그 추가
5. Safety 객체 생성 (FMV/Exit/UserBid)

**주요 함수:**

```typescript
export function auctionEngine(input: EngineInput): EngineOutput;
```

**검증:**

- 입력 → 출력 플로우 확인
- devMode 로그 출력 확인

---

### ✅ Phase 3: 기존 타입 매핑 및 브리지 함수

#### 3.7 타입 매핑 유틸리티 생성

**파일**: `src/lib/auction/mappers.ts` (신규)

**작업 내용:**

1. `SimulationScenario` → `PropertySnapshot` 변환
2. `RightRecord` → `RegisteredRight` 변환
3. `TenantRecord` → `Tenant` 변환
4. `EngineOutput` → 기존 결과 타입 변환 (하위 호환성)

**함수 목록:**

```typescript
export function mapSimulationToSnapshot(
  scenario: SimulationScenario
): PropertySnapshot;
export function mapRightRecordToRegisteredRight(
  record: RightRecord
): RegisteredRight;
export function mapTenantRecordToTenant(record: TenantRecord): Tenant;
export function mapEngineOutputToRightsAnalysisResult(
  output: EngineOutput,
  scenario: SimulationScenario
): RightsAnalysisResult;
```

**검증:**

- 각 매핑 함수 단위 테스트
- 타입 안전성 확인

---

### ✅ Phase 4: 컴포넌트 연동 (점진적 교체)

#### 3.8 BiddingModal.tsx 교체

**파일**: `src/components/BiddingModal.tsx`

**작업 내용:**

1. 기존 import 제거:
   ```typescript
   // 제거: analyzeRights, calculateProfit, calcAcquisitionAndMoS, calculateRightsAmount
   ```
2. 새 import 추가:
   ```typescript
   import { auctionEngine } from "@/lib/auction-engine";
   import { mapSimulationToSnapshot } from "@/lib/auction/mappers";
   ```
3. 계산 로직 교체:
   - `auctionEngine()` 호출
   - 결과를 기존 UI 구조에 맞게 변환

**주의사항:**

- 기존 UI 컴포넌트는 그대로 유지
- 결과 데이터만 새 엔진에서 가져오기

#### 3.9 property/[id]/page.tsx 교체

**파일**: `src/app/property/[id]/page.tsx`

**작업 내용:**

1. 기존 import 제거
2. `auctionEngine()` 사용하도록 변경
3. `analyzeRights()` 대신 엔진 결과 사용

#### 3.10 기타 컴포넌트 교체

**파일들:**

- `src/components/ProfitCalculator.tsx`
- `src/lib/point-calculator.ts`
- `src/app/actions/generate-simulation.ts`
- `src/app/actions/generate-property.ts`

**전략:**

- 한 번에 하나씩 교체
- 각 교체 후 테스트 진행

---

### ✅ Phase 5: 기존 파일 제거 및 정리

#### 3.11 사용되지 않는 파일 제거

**제거 대상:**

1. `src/lib/auction-cost.ts` ⚠️

   - 모든 참조 제거 확인 후 삭제
   - 참조 검색: `grep -r "auction-cost"`

2. `src/lib/profit-calculator.ts` ⚠️

   - 모든 참조 제거 확인 후 삭제
   - 참조 검색: `grep -r "profit-calculator"`

3. `src/lib/rights-analysis-engine.ts` ⚠️
   - 모든 참조 제거 확인 후 삭제
   - 참조 검색: `grep -r "rights-analysis-engine"`

**주의:**

- `rights-engine.ts`는 다른 목적으로 사용되므로 유지
- 삭제 전 백업 권장 (Git 커밋)

#### 3.12 구버전 auction-engine.ts 코드 정리

**작업 내용:**

- v1.2 코드 완전 제거
- 문서 기준 v0.1 코드만 유지
- 주석 및 TODO 정리

---

## 🔍 4. 검증 체크리스트

### 4.1 단위 레벨 검증

- [ ] `estimateValuation()` 테스트

  - [ ] appraisal/minBid/fmvHint 조합별 테스트
  - [ ] marketSignals 보정 테스트

- [ ] `analyzeRights()` 테스트

  - [ ] 말소기준권리 판단 테스트
  - [ ] 임차인 대항력 판단 테스트
  - [ ] 인수 권리 금액 계산 테스트

- [ ] `calcCosts()` 테스트

  - [ ] 세금 계산 정확성
  - [ ] 총인수금액 계산 정확성

- [ ] `evaluateProfit()` 테스트
  - [ ] 안전마진 계산 정확성
  - [ ] 손익분기점 계산 정확성

### 4.2 통합 레벨 검증

- [ ] `auctionEngine()` 전체 플로우 테스트
  - [ ] 입력 → 출력 데이터 정확성
  - [ ] devMode 로그 출력 확인
  - [ ] Safety 객체 계산 정확성

### 4.3 컴포넌트 레벨 검증

- [ ] BiddingModal 정상 동작

  - [ ] 입찰가 입력 → 계산 결과 표시
  - [ ] 안전마진 카드 표시
  - [ ] 리포트 모달 동작

- [ ] PropertyPage 정상 동작
  - [ ] 매물 상세 정보 표시
  - [ ] 권리분석 리포트 표시
  - [ ] 경매분석 리포트 표시

### 4.4 회귀 테스트

문서 부록 C 기준:

- [ ] FMV/감정가/최저가 역산 일관성
- [ ] 동일 스냅샷에 입찰가 변경 시 총인수금액 단조 변화
- [ ] `overFMV` 경고가 FMV 초과 구간에서만 켜짐
- [ ] weak 임차인 있을 때 명도비 상향 시 총인수금액 증가
- [ ] 세율/비용 overrides가 결과에 반영됨

---

## ⚠️ 5. 주의사항 및 리스크

### 5.1 타입 호환성

**문제:**

- 기존 `RightsAnalysisResult`와 새 `RightAnalysisResult` 구조 다름
- 기존 컴포넌트가 기대하는 필드명 불일치 가능

**해결책:**

- 브리지 함수로 변환 제공
- 점진적 마이그레이션

### 5.2 계산 로직 차이

**문제:**

- 기존 계산 방식과 문서의 계산 방식이 다를 수 있음
- 세율, 명도비 기본값 차이

**해결책:**

- 문서 기준으로 통일
- 기존 값과 차이가 있으면 문서 반영 후 마이그레이션

### 5.3 성능 영향

**문제:**

- 매번 전체 계산을 수행할 경우 성능 저하

**해결책:**

- 캐싱 전략 검토 (필요 시)
- Memoization 활용

---

## 📅 6. 예상 작업 시간

| Phase    | 작업 내용                     | 예상 시간     |
| -------- | ----------------------------- | ------------- |
| Phase 1  | 타입 정의 및 레이어 파일 생성 | 2-3시간       |
| Phase 2  | 오케스트레이션 엔진 구현      | 2-3시간       |
| Phase 3  | 타입 매핑 및 브리지 함수      | 3-4시간       |
| Phase 4  | 컴포넌트 연동                 | 4-6시간       |
| Phase 5  | 기존 파일 제거 및 정리        | 1-2시간       |
| **총계** |                               | **12-18시간** |

---

## 🚀 7. 실행 순서 권장사항

1. **Phase 1 완료 후 테스트**: 각 레이어 파일이 독립적으로 동작하는지 확인
2. **Phase 2 완료 후 테스트**: `auctionEngine()` 함수가 올바르게 동작하는지 확인
3. **Phase 3 완료 후 테스트**: 매핑 함수들이 정확하게 변환하는지 확인
4. **Phase 4는 점진적으로**: 한 컴포넌트씩 교체하고 테스트
5. **Phase 5는 마지막**: 모든 참조가 제거된 후에만 파일 삭제

---

## 📚 8. 참고 문서

- `docs/auction-engine-v0.1.md` - 본 마이그레이션의 기준 문서
- `docs/taxlogic.md` - 세금 계산 로직 참고
- `docs/bidmaster_v_1.2.md` - 기존 엔진 구조 참고
- `docs/PRD.md` - 전체 요구사항 참고

---

## ✅ 9. 완료 조건

다음 조건이 모두 만족되면 마이그레이션 완료:

1. ✅ 모든 레이어 파일 생성 완료
2. ✅ `auctionEngine()` 함수가 정상 동작
3. ✅ 모든 컴포넌트가 새 엔진 사용
4. ✅ 기존 파일 제거 완료
5. ✅ 회귀 테스트 통과
6. ✅ TypeScript 컴파일 오류 없음
7. ✅ 개발자 모드에서 로그 정상 출력

---

**작성자**: AI Assistant  
**검토 필요**: 개발자 확인 후 실행
