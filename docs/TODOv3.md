# Auction Engine v3 구현 계획

## 개요

Auction Engine v3는 분산된 계산 로직을 단일 엔진으로 통합하여 **100% 예측 가능·재사용 가능한 분석 결과(JSON)**를 보장하는 것을 목표로 합니다.

**핵심 원칙:**

- Single Source of Truth: 계산은 오직 엔진에서만 수행
- 단일 Output Payload: 모든 리포트/점수/화면은 하나의 결과 JSON만 참조
- Pure Function 기반: 입력이 같으면 언제나 동일 결과
- Layered Pipeline: 매물 → 시세 → 권리 → 비용 → 입찰 → 수익

---

## Phase 1: 타입 시스템 및 폴더 구조 구축

### 1.1 v3 타입 시스템 정의

**파일:** `src/lib/engines/types.ts`

**작업 내용:**

- [ ] PropertySeed, Property 타입 정의 (13.1 매물 유형 표준)
- [ ] ValuationInput, Valuation 타입 정의
- [ ] CourtDocsInput, CourtDocs 타입 정의
- [ ] RightsInput, Rights 타입 정의 (13.3 권리 유형 표준)
- [ ] CostInput, Costs 타입 정의
- [ ] CompetitorInput, Competition 타입 정의
- [ ] ProfitInput, Profit 타입 정의
- [ ] RunInput, AuctionAnalysisResult 타입 정의
- [ ] PropertyType, RightType enum 및 Label Map 정의 (13.1, 13.3)
- [ ] 기존 v0.2 타입과의 매핑 헬퍼 타입 정의

**참조:**

- 문서 섹션 6 (엔진별 I/O 스키마)
- 문서 섹션 7 (최종 결과 JSON)
- 문서 섹션 13 (도메인 표준 정의)

### 1.2 Policy 시스템 구축

**파일:** `src/lib/engines/policy.ts`

**작업 내용:**

- [ ] 기본 Policy 타입 정의
- [ ] defaultPolicy 객체 구현:
  - [ ] lowestBidRateDefault: 0.7
  - [ ] fmvClamp: { minRate, maxRate }
  - [ ] difficultyWeights: { easy, normal, hard }
  - [ ] evictionCostBands: { low, medium, high }
  - [ ] acquisitionTaxRates: { base, localEdu, special }
  - [ ] 매물 유형별 기본값 매핑
- [ ] Policy 병합 유틸리티 함수

**참조:**

- 문서 섹션 6.2, 6.4, 6.5

### 1.3 폴더 구조 생성

**작업 내용:**

- [ ] `src/lib/engines/` 폴더 생성
- [ ] 각 엔진 파일 스캐폴딩:
  - [ ] `property-engine.ts`
  - [ ] `valuation-engine.ts`
  - [ ] `court-docs-layer.ts`
  - [ ] `rights-engine.ts`
  - [ ] `cost-engine.ts`
  - [ ] `competitor-engine.ts`
  - [ ] `profit-engine.ts`
  - [ ] `auction-engine.ts` (오케스트레이터)
  - [ ] `payload-builder.ts`
  - [ ] `types.ts`
  - [ ] `policy.ts`

**참조:**

- 문서 섹션 10.1, 14.1

---

## Phase 2: 엔진 구현 (순차적)

### 2.1 PropertyEngine 구현

**파일:** `src/lib/engines/property-engine.ts`

**작업 내용:**

- [ ] `normalize()` 함수 구현:
  - [ ] PropertySeed → Property 변환
  - [ ] 필수 필드 검증 (sizeM2 > 0, yearBuilt ∈ [1960, now])
  - [ ] auctionStep 표준화
  - [ ] 매물 유형 매핑 (기존 한글 → v3 enum, 13.2 참조)
  - [ ] 기본값 채우기 (address, sizeM2, yearBuilt)
- [ ] 단위 테스트 작성 (10개 케이스)

**입력/출력:**

- Input: PropertySeed
- Output: Property

**참조:**

- 문서 섹션 6.1
- 기존 코드: `src/lib/property/` 폴더

### 2.2 ValuationEngine 구현

**파일:** `src/lib/engines/valuation-engine.ts`

**작업 내용:**

- [ ] `evaluate()` 함수 구현:
  - [ ] Property, Policy 입력 받기
  - [ ] lowestBidPrice = appraisalValue \* lowestBidRateDefault
  - [ ] marketPriceFMV 계산 (감정가 대비 클램프 + 난이도 가중치)
  - [ ] method 기록 ("fmv-weighted" | "appraisal-ratio")
  - [ ] notes 배열에 계산 과정 기록
- [ ] 기존 `valuation.ts` 로직 분석 및 v3 규칙 적용
- [ ] 단위 테스트 작성

**입력/출력:**

- Input: { property: Property, policy: Policy }
- Output: Valuation

**참조:**

- 문서 섹션 6.2
- 기존 코드: `src/lib/valuation.ts`

### 2.3 CourtDocsLayer 구현

**파일:** `src/lib/engines/court-docs-layer.ts`

**작업 내용:**

- [ ] `attach()` 함수 구현:
  - [ ] Property, refs/parsed 입력 받기
  - [ ] 문서 원문 저장 (raw.meagak, raw.hyeonhwang, raw.deunggi)
  - [ ] 구조화 데이터 파싱 (hasDividendRequest, occupancyStatus 등)
  - [ ] 추정 금지 원칙 적용 (값이 없으면 undefined)
  - [ ] documentFlags 배열 생성
- [ ] 기존 시나리오 데이터에서 CourtDocs 추출 로직
- [ ] 단위 테스트 작성

**입력/출력:**

- Input: { property: Property, refs?, parsed? }
- Output: CourtDocs

**참조:**

- 문서 섹션 6.3
- 기존 코드: `src/types/simulation.ts` (SimulationScenario)

### 2.4 RightsEngine 구현

**파일:** `src/lib/engines/rights-engine.ts`

**작업 내용:**

- [ ] `assess()` 함수 구현:
  - [ ] Property, Valuation, CourtDocs, Policy 입력 받기
  - [ ] 권리 인수/소멸 판정 매트릭스 적용 (13.5 참조):
    - [ ] ASSUME: 인수 (말소 불가)
    - [ ] EXPIRE: 소멸 (등기 말소 확정)
    - [ ] UNCERTAIN: 불확정 (케이스별)
  - [ ] 총인수금액 계산 (assumableRightsTotal)
  - [ ] 명도비용 산정 (evictionCostEstimated, evictionRisk)
  - [ ] 위험도 점수화 (0~5점, 13.6 참조)
  - [ ] riskFlags 배열 생성
  - [ ] breakdown 배열 생성 (권리별 상세 정보)
- [ ] 기존 `rights-engine.ts` 로직 분석 및 v3 규칙 적용
- [ ] 15종 권리 유형별 판정 로직 구현 (13.4, 13.5 참조)
- [ ] 단위 테스트 작성 (12개 권리 케이스)

**입력/출력:**

- Input: { property: Property, valuation: Valuation, courtDocs: CourtDocs, policy: Policy }
- Output: Rights

**참조:**

- 문서 섹션 6.4, 13.3~13.7
- 기존 코드: `src/lib/rights/rights-engine.ts`

### 2.5 CostEngine 구현

**파일:** `src/lib/engines/cost-engine.ts`

**작업 내용:**

- [ ] `compute()` 함수 구현:
  - [ ] Property, Valuation, Rights, Params 입력 받기
  - [ ] 취득세 계산 (bidPrice 기준, 세율은 policy에서)
  - [ ] 부대비용 계산 (legalFees, repairCost)
  - [ ] 총인수금액 계산 (totalAcquisition = bidPrice + rights.assumableRightsTotal + taxes + evictionCost + misc)
  - [ ] 대출 계산 (loanPrincipal, ownCash, interestCost)
  - [ ] 보유비용 계산 (holdingCost)
  - [ ] 총비용 계산 (totalCost = totalAcquisition + totalHoldingFinance)
- [ ] 기존 `costs.ts` 로직 분석 및 v3 규칙 적용
- [ ] 단위 테스트 작성

**입력/출력:**

- Input: { property: Property, valuation: Valuation, rights: Rights, params: CostParams }
- Output: Costs

**참조:**

- 문서 섹션 6.5
- 기존 코드: `src/lib/costs.ts`, `src/lib/auction-cost.ts`

### 2.6 CompetitorEngine 구현

**파일:** `src/lib/engines/competitor-engine.ts`

**작업 내용:**

- [ ] `simulate()` 함수 구현:
  - [ ] Property, Valuation, Params 입력 받기
  - [ ] 참여자수, 과열도, 분포 전략 파라미터 받기
  - [ ] 입찰가 분포 생성 (A-wide, B-two-peak, C-right-tail)
  - [ ] 동일가 몰림 방지 (tick, jitter 적용)
  - [ ] 낙찰자 판정 (finalWinningBid)
  - [ ] 사용자 순위 계산 (myRank)
- [ ] 기존 `competitor-bids.ts` 로직 분석 및 v3 규칙 적용
- [ ] 단위 테스트 작성

**입력/출력:**

- Input: { property: Property, valuation: Valuation, params: CompetitorParams }
- Output: Competition

**참조:**

- 문서 섹션 6.6
- 기존 코드: `src/lib/auction/competitor-bids.ts`

### 2.7 ProfitEngine 구현

**파일:** `src/lib/engines/profit-engine.ts`

**작업 내용:**

- [ ] `evaluate()` 함수 구현:
  - [ ] Costs, Valuation, ExitParams 입력 받기
  - [ ] breakevenExit 계산: (totalCost + sellMisc) / (1 - sellBrokerRate)
  - [ ] netProfit 계산: exitPrice - (totalCost + exitCosts)
  - [ ] ROI 계산: netProfit / ownCash (분모 0 보호)
  - [ ] annualizedRoi 계산: (1+roi)^(12/holdMonths) - 1
  - [ ] safetyMargin 계산: exitPrice - totalAcquisition
  - [ ] constraints 계산 (meetsTargetMargin, meetsTargetROI)
- [ ] 기존 `profit-engine.ts`, `profit.ts` 로직 분석 및 v3 규칙 적용
- [ ] 단위 테스트 작성

**입력/출력:**

- Input: { costs: Costs, valuation: Valuation, params: ProfitParams }
- Output: Profit

**참조:**

- 문서 섹션 6.7
- 기존 코드: `src/lib/profit-engine.ts`, `src/lib/profit.ts`

---

## Phase 3: 통합 및 오케스트레이션

### 3.1 PayloadBuilder 구현

**파일:** `src/lib/engines/payload-builder.ts`

**작업 내용:**

- [ ] `buildPayload()` 함수 구현:
  - [ ] 모든 엔진 출력을 AuctionAnalysisResult로 병합
  - [ ] summary 생성:
    - [ ] isProfitable: netProfit > 0
    - [ ] grade: S/A/B/C/D (리스크 점수 기반, 13.6 참조)
    - [ ] riskLabel: 문자열 생성
    - [ ] recommendedBidRange: [min, max] 계산 (FMV 하위 3~8%, 최저가 상위 5~15%)
  - [ ] debug 섹션 구성 (RUN_ENGINE_DEBUG=true 시)
  - [ ] propertyId, generatedAt 설정
- [ ] 단위 테스트 작성

**참조:**

- 문서 섹션 7, 11

### 3.2 AuctionEngine 오케스트레이터 구현

**파일:** `src/lib/engines/auction-engine.ts`

**작업 내용:**

- [ ] `runAuctionAnalysis()` 함수 구현:
  - [ ] RunInput 받기
  - [ ] Policy 병합 (defaultPolicy + input.policy)
  - [ ] 엔진 순차 실행:
    1. PropertyEngine.normalize()
    2. ValuationEngine.evaluate()
    3. CourtDocsLayer.attach()
    4. RightsEngine.assess()
    5. CostEngine.compute()
    6. CompetitorEngine.simulate()
    7. ProfitEngine.evaluate()
  - [ ] PayloadBuilder.buildPayload() 호출
  - [ ] AuctionAnalysisResult 반환
- [ ] 에러 처리 및 로깅
- [ ] 통합 테스트 작성 (스냅샷 테스트)

**참조:**

- 문서 섹션 5, 14.2, 14.3

### 3.3 마이그레이션 브리지 함수

**파일:** `src/lib/engines/mappers.ts`

**작업 내용:**

- [ ] `mapSimulationToPropertySeed()`: SimulationScenario → PropertySeed
- [ ] `mapAuctionAnalysisResultToEngineOutput()`: AuctionAnalysisResult → EngineOutput (v0.2 호환)
- [ ] `mapAuctionAnalysisResultToRightsAnalysisResult()`: AuctionAnalysisResult → RightsAnalysisResult (리포트 호환)
- [ ] 기존 매퍼 함수와의 통합 확인
- [ ] 단위 테스트 작성

**참조:**

- 기존 코드: `src/lib/auction/mappers.ts`

---

## Phase 4: 테스트 및 검증

### 4.1 단위 테스트 작성

**작업 내용:**

- [ ] PropertyEngine 테스트 (10개 케이스)
- [ ] ValuationEngine 테스트 (10개 케이스)
- [ ] RightsEngine 테스트 (12개 권리 케이스)
- [ ] CostEngine 테스트
- [ ] CompetitorEngine 테스트
- [ ] ProfitEngine 테스트
- [ ] PayloadBuilder 테스트

**테스트 전략:**

- 고정 벡터 사용 (랜덤성 제거)
- 스냅샷 테스트 (기대값 JSON 저장)
- 프로퍼티 테스트 (불변식 검증)

**참조:**

- 문서 섹션 9, 14.6

### 4.2 통합 스냅샷 테스트

**작업 내용:**

- [ ] 10개 통합 케이스 준비 (아파트/오피스텔/근린/토지 등)
- [ ] `runAuctionAnalysis()` 실행 결과 JSON 스냅샷 저장
- [ ] v0.2 출력과 v3 출력 비교 (핵심 KPI: 총인수금액, ROI, 안전마진, 추천입찰)
- [ ] diff 분석 및 문서화

**참조:**

- 문서 섹션 14.5

### 4.3 프로퍼티 테스트

**작업 내용:**

- [ ] `exitPrice < breakevenExit ⇒ netProfit < 0` 검증
- [ ] `sellBrokerRate=0 ⇒ breakevenExit = totalCost + sellMisc` 검증
- [ ] `loanRatio=0 ⇒ ownCash = totalAcquisition (+ origFee)` 검증
- [ ] `overheat↑ ⇒ 분포 분산폭/고가 꼬리 확률 ↑` 검증

**참조:**

- 문서 섹션 9, 14.6

---

## Phase 5: 리포트 및 UI 연결

### 5.1 Feature Flag 시스템

**작업 내용:**

- [ ] 환경 변수 `ENGINE_V3` 추가
- [ ] v0.2와 v3 병행 실행 가능한 래퍼 함수 구현
- [ ] 디버그 화면에 v0.2/v3 비교 섹션 추가 (임시)

**참조:**

- 문서 섹션 14.5, 14.8

### 5.2 리포트 컴포넌트 전환

**작업 내용:**

- [ ] `RightsAnalysisReportModal`: v3 결과 참조하도록 변경
  - [ ] `AuctionAnalysisResult.rights` 사용
  - [ ] `AuctionAnalysisResult.courtDocs` 사용
  - [ ] 계산 로직 제거 (표시만)
- [ ] `AuctionAnalysisReportModal`: v3 결과 참조하도록 변경
  - [ ] `AuctionAnalysisResult.valuation` 사용
  - [ ] `AuctionAnalysisResult.competition` 사용
  - [ ] `AuctionAnalysisResult.profit` 사용
  - [ ] 계산 로직 제거
- [ ] 수익분석 리포트 (NEW): v3에서 최초 정식 제공
  - [ ] `AuctionAnalysisResult.profit` 기반 컴포넌트 생성
  - [ ] `AuctionAnalysisResult.costs` 표시
  - [ ] `AuctionAnalysisResult.summary` 표시
- [ ] 상세분석 리포트: v3 데이터 연결
- [ ] 매각물건명세서 뷰: `AuctionAnalysisResult.courtDocs` 사용

**참조:**

- 문서 섹션 8.2
- 기존 코드: `src/components/property/RightsAnalysisReportModal.tsx`, `src/components/property/AuctionAnalysisReportModal.tsx`

### 5.3 PropertyPage 전환

**작업 내용:**

- [ ] `src/app/property/[id]/page.tsx` 수정:
  - [ ] `runAuctionAnalysis()` 호출로 변경
  - [ ] `AuctionAnalysisResult` 사용
  - [ ] 기존 `auctionEngine()` 호출 제거
- [ ] BiddingModal 전환:
  - [ ] `runAuctionAnalysis()` 호출로 변경
  - [ ] 리포트 모달에 v3 결과 전달

**참조:**

- 기존 코드: `src/app/property/[id]/page.tsx`, `src/components/BiddingModal.tsx`

---

## Phase 6: 레거시 제거

### 6.1 참조 확인 및 제거

**작업 내용:**

- [ ] `auction-cost.ts` 참조 0 확인 후 삭제
- [ ] `rights-analysis-engine.ts` 참조 0 확인 후 삭제
- [ ] `profit-calculator.ts` 참조 0 확인 후 삭제
- [ ] `competitor-bids.ts` 참조 0 확인 후 삭제
- [ ] 기존 `auction-engine.ts` (v0.2) 처리:
  - [ ] Feature Flag로 v0.2/v3 선택 가능하도록 유지 (단기)
  - [ ] 또는 완전 제거 (장기)

**참조:**

- 문서 섹션 10.1, 14.5

### 6.2 타입 정리

**작업 내용:**

- [ ] `src/types/auction.ts` (v0.2 타입) 처리:
  - [ ] v3 타입으로 완전 전환
  - [ ] 또는 매핑 테이블 유지 (호환성)
- [ ] 사용되지 않는 타입 제거

---

## Phase 7: 문서화 및 최종 검증

### 7.1 문서화

**작업 내용:**

- [ ] 각 엔진 파일에 JSDoc 주석 추가
- [ ] 사용 예시 코드 작성
- [ ] 마이그레이션 가이드 작성
- [ ] API 문서 생성

### 7.2 최종 검증

**작업 내용:**

- [ ] Definition of Done 체크리스트 확인:
  - [ ] 엔진별 단위 테스트 + 통합 스냅샷 100% 통과
  - [ ] UI/리포트는 계산 로직 0%
  - [ ] 레거시 계산 파일 참조 0개
  - [ ] 동일 입력에 대해 항상 동일한 최종 JSON
  - [ ] 리포트 5종이 단일 JSON으로만 렌더링
- [ ] 성능 테스트
- [ ] 에러 케이스 테스트

**참조:**

- 문서 섹션 12

---

## 우선순위 및 일정 추정

### High Priority (필수)

1. Phase 1: 타입 시스템 및 폴더 구조 (기반 작업)
2. Phase 2.1~2.4: 핵심 엔진 (Property, Valuation, CourtDocs, Rights)
3. Phase 2.5~2.7: 보조 엔진 (Cost, Competitor, Profit)
4. Phase 3: 통합 및 오케스트레이션
5. Phase 4: 테스트 및 검증

### Medium Priority (중요)

6. Phase 5: 리포트 및 UI 연결
7. Phase 6: 레거시 제거

### Low Priority (선택)

8. Phase 7: 문서화 및 최종 검증

---

## 주의사항

1. **계산 로직 변경 금지**: 프로젝트 규칙에 따라 계산 로직 변경 시 개발자 허락 필요
2. **로그 기록**: 핵심 기능에 로그 남기기 (이모지 + [카테고리] + 설명)
3. **환경 변수 파일**: `.env`, `.env.local` 등은 AI 컨텍스트에 포함하지 않음
4. **Pure Function 준수**: 모든 엔진 함수는 순수 함수로 구현
5. **기존 시스템 호환**: v0.2와 병행 운영 가능하도록 설계

---

## 참조 문서

- `docs/Auction Engine v3.md`: 메인 설계 문서
- `docs/auction-engine-v0.2.md`: 기존 v0.2 문서
- `src/lib/auction-engine.ts`: 기존 v0.2 구현
- `src/types/auction.ts`: 기존 v0.2 타입
