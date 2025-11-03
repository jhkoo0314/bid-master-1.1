# Auction Engine v0.1 마이그레이션 TODO 리스트

> **기준 문서**: `docs/auction-engine-v0.1-migration-plan.md` > **전체 예상 시간**: 12-18시간

---

## ✅ Phase 1: 타입 정의 및 레이어 파일 생성 (2-3시간)

### 1.1 타입 정의 생성

- [ ] `src/types/auction.ts` 파일 생성
- [ ] 문서의 타입 정의 복사 (Difficulty, Tenant, RegisteredRight, PropertySnapshot 등)
- [ ] 기존 `property.ts`, `simulation.ts`와의 호환성 검토
- [ ] TypeScript 컴파일 오류 확인

### 1.2 Valuation 레이어 생성

- [ ] `src/lib/valuation.ts` 파일 생성
- [ ] `estimateValuation()` 함수 구현
- [ ] 로그 추가 (규칙 준수: 📐 [Valuation] 형식)
- [ ] 함수 동작 확인

### 1.3 Rights 레이어 생성

- [ ] `src/lib/rights/` 디렉토리 생성
- [ ] `src/lib/rights/rights-engine.ts` 파일 생성
- [ ] `analyzeRights()` 함수 구현
- [ ] 말소기준권리 판단 로직 검증
- [ ] 로그 추가 (규칙 준수: ⚖️ [권리분석] 형식)

### 1.4 Costs 레이어 생성

- [ ] `src/lib/costs.ts` 파일 생성
- [ ] `calcCosts()` 함수 구현
- [ ] 세율 기본값 설정 (교육용)
- [ ] 명도비/기타비용 기본값 설정
- [ ] 세금 계산 정확성 검증
- [ ] 로그 추가 (규칙 준수: 💰 [비용계산] 형식)

### 1.5 Profit 레이어 생성

- [ ] `src/lib/profit.ts` 파일 생성
- [ ] `evaluateProfit()` 함수 구현
- [ ] 안전마진 계산 로직 포함
- [ ] 손익분기점 계산 확인
- [ ] 로그 추가 (규칙 준수: 📊 [수익분석] 형식)

---

## ✅ Phase 2: 오케스트레이션 엔진 구현 (2-3시간)

### 2.1 auction-engine.ts 재작성

- [ ] 기존 v1.2 코드 백업 (주석 처리)
- [ ] `auctionEngine()` 함수 구현
- [ ] `EngineInput` → `EngineOutput` 변환 로직
- [ ] devMode 로그 추가 (🧠 [ENGINE] 형식)
- [ ] Safety 객체 생성 (FMV/Exit/UserBid)
- [ ] 입력 → 출력 플로우 확인

---

## ✅ Phase 3: 기존 타입 매핑 및 브리지 함수 (3-4시간)

### 3.1 타입 매핑 유틸리티 생성

- [ ] `src/lib/auction/` 디렉토리 생성 (필요 시)
- [ ] `src/lib/auction/mappers.ts` 파일 생성
- [ ] `mapSimulationToSnapshot()` 함수 구현
- [ ] `mapRightRecordToRegisteredRight()` 함수 구현
- [ ] `mapTenantRecordToTenant()` 함수 구현
- [ ] `mapEngineOutputToRightsAnalysisResult()` 함수 구현 (하위 호환성)
- [ ] 각 매핑 함수 타입 안전성 확인

---

## ✅ Phase 4: 컴포넌트 연동 (점진적 교체) (4-6시간)

### 4.1 BiddingModal.tsx 교체

- [ ] 기존 import 제거 (analyzeRights, calculateProfit, calcAcquisitionAndMoS, calculateRightsAmount)
- [ ] 새 import 추가 (auctionEngine, mapSimulationToSnapshot)
- [ ] 계산 로직 교체
- [ ] 결과를 기존 UI 구조에 맞게 변환
- [ ] 테스트: 입찰가 입력 → 계산 결과 표시
- [ ] 테스트: 안전마진 카드 표시
- [ ] 테스트: 리포트 모달 동작

### 4.2 property/[id]/page.tsx 교체

- [ ] 기존 import 제거
- [ ] `auctionEngine()` 사용하도록 변경
- [ ] `analyzeRights()` 대신 엔진 결과 사용
- [ ] 테스트: 매물 상세 정보 표시
- [ ] 테스트: 권리분석 리포트 표시
- [ ] 테스트: 경매분석 리포트 표시

### 4.3 기타 컴포넌트 교체

- [ ] `src/components/ProfitCalculator.tsx` 교체
- [ ] `src/lib/point-calculator.ts` 교체
- [ ] `src/app/actions/generate-simulation.ts` 교체
- [ ] `src/app/actions/generate-property.ts` 교체
- [ ] 각 교체 후 개별 테스트 진행

---

## ✅ Phase 5: 기존 파일 제거 및 정리 (1-2시간)

### 5.1 사용되지 않는 파일 제거

- [ ] 모든 참조 제거 확인 (`grep -r "auction-cost"`)
- [ ] `src/lib/auction-cost.ts` 삭제
- [ ] 모든 참조 제거 확인 (`grep -r "profit-calculator"`)
- [ ] `src/lib/profit-calculator.ts` 삭제
- [ ] 모든 참조 제거 확인 (`grep -r "rights-analysis-engine"`)
- [ ] `src/lib/rights-analysis-engine.ts` 삭제
- [ ] Git 커밋으로 백업 확인

### 5.2 구버전 auction-engine.ts 코드 정리

- [ ] v1.2 코드 완전 제거
- [ ] 문서 기준 v0.1 코드만 유지
- [ ] 주석 및 TODO 정리

---

## 🔍 검증 체크리스트

### 단위 레벨 검증

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

### 통합 레벨 검증

- [ ] `auctionEngine()` 전체 플로우 테스트
  - [ ] 입력 → 출력 데이터 정확성
  - [ ] devMode 로그 출력 확인
  - [ ] Safety 객체 계산 정확성

### 컴포넌트 레벨 검증

- [ ] BiddingModal 정상 동작
  - [ ] 입찰가 입력 → 계산 결과 표시
  - [ ] 안전마진 카드 표시
  - [ ] 리포트 모달 동작
- [ ] PropertyPage 정상 동작
  - [ ] 매물 상세 정보 표시
  - [ ] 권리분석 리포트 표시
  - [ ] 경매분석 리포트 표시

### 회귀 테스트 (문서 부록 C 기준)

- [ ] FMV/감정가/최저가 역산 일관성
- [ ] 동일 스냅샷에 입찰가 변경 시 총인수금액 단조 변화
- [ ] `overFMV` 경고가 FMV 초과 구간에서만 켜짐
- [ ] weak 임차인 있을 때 명도비 상향 시 총인수금액 증가
- [ ] 세율/비용 overrides가 결과에 반영됨

---

## ✅ 완료 조건

다음 조건이 모두 만족되면 마이그레이션 완료:

1. [ ] 모든 레이어 파일 생성 완료
2. [ ] `auctionEngine()` 함수가 정상 동작
3. [ ] 모든 컴포넌트가 새 엔진 사용
4. [ ] 기존 파일 제거 완료
5. [ ] 회귀 테스트 통과
6. [ ] TypeScript 컴파일 오류 없음
7. [ ] 개발자 모드에서 로그 정상 출력

---

**마지막 업데이트**: 2025-01-XX
**진행 상황**: 0/40+ 작업 항목 완료
