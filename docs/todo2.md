# Auction Engine v0.2 마이그레이션 상세 계획

> **목적**: v0.1 통합 엔진을 확장하여 **매물유형 9종 × 권리유형 15종**을 계산·리포트에 반영
> **핵심**: 유형별 FMV 보정(κ), 취득세율/명도비 기본값, 권리유형별 인수/소멸/리스크 판정, 위험 배지(`riskFlags`) 출력

---

## 📋 작업 개요

### 변경 사항 요약

- ✅ 매물유형 9종 반영: 아파트 / 오피스텔 / 단독주택 / 빌라 / 원룸 / 주택 / 다가구주택 / 근린주택 / 도시형생활주택
- ✅ 권리유형 15종 반영: 근저당권 / 저당권 / 압류 / 가압류 / 담보가등기 / 소유권이전청구권가등기 / 가등기 / 예고등기 / 전세권 / 주택임차권 / 상가임차권 / 가처분 / 유치권 / 법정지상권 / 분묘기지권
- ✅ 위험 배지 시스템: `riskFlags` 배열로 위험 요소 표시
- ✅ 0원 방지 레이어: `assumedRightsAmount`가 0원이 되지 않도록 fallback 적용

---

## 🔧 단계별 작업 계획

### Phase 1: 상수 파일 생성 (신규)

#### 1.1 `src/lib/constants.auction.ts` 생성

**목적**: 모든 매물유형, 권리유형, 위험 배지, 그리고 각종 계산 규칙을 상수로 관리하는 중앙 집중식 상수 파일 생성

**작업 단계**:

1. **타입 정의** (3개)

   - [x] `PropertyTypeKorean` 타입 정의 (9종)
     - 값: `"아파트" | "오피스텔" | "단독주택" | "빌라" | "원룸" | "주택" | "다가구주택" | "근린주택" | "도시형생활주택"`
   - [x] `RightTypeKorean` 타입 정의 (15종)
     - 값: `"근저당권" | "저당권" | "압류" | "가압류" | "담보가등기" | "소유권이전청구권가등기" | "가등기" | "예고등기" | "전세권" | "주택임차권" | "상가임차권" | "가처분" | "유치권" | "법정지상권" | "분묘기지권"`
   - [x] `RiskFlagKey` 타입 정의 (7종)
     - 값: `"소유권분쟁" | "상가임차" | "유치권" | "법정지상권" | "분묘" | "배당불명확" | "임차다수"`

2. **FMV 보정 계수 (κ) 정의**

   - [x] `FMV_KAPPA_BY_TYPE` 상수 정의 (`Record<PropertyTypeKorean, number>`)
     - 아파트: 0.91
     - 오피스텔: 0.88
     - 단독주택: 0.87
     - 빌라: 0.89
     - 원룸: 0.88
     - 주택: 0.90
     - 다가구주택: 0.87
     - 근린주택: 0.86
     - 도시형생활주택: 0.90
   - [x] `MINBID_ALPHA_DEFAULT` 상수 정의 (기본값: 0.8)

3. **세율 상수 정의**

   - [x] `ACQ_TAX_RATE_BY_TYPE` 상수 정의 (`Record<PropertyTypeKorean, number>`)
     - 아파트: 0.011 (1.1%)
     - 오피스텔: 0.046 (4.6%)
     - 단독주택: 0.012 (1.2%)
     - 빌라: 0.012 (1.2%)
     - 원룸: 0.012 (1.2%)
     - 주택: 0.012 (1.2%)
     - 다가구주택: 0.013 (1.3%)
     - 근린주택: 0.020 (2.0%)
     - 도시형생활주택: 0.013 (1.3%)
   - [x] `EDU_TAX_RATE` 상수 정의 (0.001, 0.1%)
   - [x] `SPC_TAX_RATE` 상수 정의 (0.002, 0.2%)

4. **명도/기타 비용 기본값 정의**

   - [x] `BASE_EVICTION_BY_TYPE` 상수 정의 (`Record<PropertyTypeKorean, number>`)
     - 아파트: 3,000,000원
     - 오피스텔: 3,500,000원
     - 단독주택: 4,000,000원
     - 빌라: 3,500,000원
     - 원룸: 3,000,000원
     - 주택: 3,000,000원
     - 다가구주택: 5,000,000원
     - 근린주택: 5,000,000원
     - 도시형생활주택: 3,500,000원
   - [x] `BASE_MISC_COST` 상수 정의 (1,000,000원, 법무/등기 비용)

5. **권리 규칙 인터페이스 및 테이블 정의**

   - [x] `RightRule` 인터페이스 정의
     - `defaultDisposition: "소멸" | "인수" | "위험"`
     - `amountPolicy: "금액전액" | "금액없음" | "추정" | "시세감액"`
     - `riskFlags?: RiskFlagKey[]` (선택)
     - `note?: string` (선택)
   - [x] `RIGHT_RULES` 상수 정의 (`Record<RightTypeKorean, RightRule>`)
     - 각 권리유형별로 disposition, amountPolicy, riskFlags 설정
     - 특별 규칙:
       - 근저당권/저당권: 말소기준보다 선순위면 인수 전환
       - 압류/가처분/소유권이전청구권가등기/가등기/예고등기: "소유권분쟁" riskFlag
       - 상가임차권: "상가임차" riskFlag
       - 유치권/법정지상권/분묘기지권: 각각 해당 riskFlag

6. **위험 가산 비용 정의**
   - [x] `RISK_EVICTION_ADD` 상수 정의 (`Partial<Record<RiskFlagKey, number>>`)
     - 유치권: +2,000,000원
     - 법정지상권: +1,500,000원
     - 분묘: +2,000,000원
     - 상가임차: +1,000,000원
     - 임차다수: +1,000,000원
   - [x] `RISK_MISC_ADD` 상수 정의 (`Partial<Record<RiskFlagKey, number>>`)
     - 소유권분쟁: +1,000,000원
     - 배당불명확: +500,000원

**검증 체크리스트**:

- [x] 모든 타입이 정확히 정의되었는지 확인
- [x] 9개 매물유형이 모두 포함되었는지 확인
- [x] 15개 권리유형이 모두 포함되었는지 확인
- [x] 7개 위험 배지가 모두 포함되었는지 확인
- [x] 모든 상수 값이 숫자 형식으로 올바르게 정의되었는지 확인 (예: `3_000_000` 형식)
- [x] TypeScript 컴파일 에러 없이 빌드되는지 확인

**참고 파일**: `docs/auction-engine-v0.2.md` 2번 섹션

**예상 소요 시간**: 30분  
**우선순위**: 🔴 최우선

---

### 1.1 `src/lib/constants.auction.ts`

#### 2.1 `src/types/auction.ts` 교체

- [ ] PropertyTypeKorean, RightTypeKorean, RiskFlagKey import 추가
- [ ] Tenant 인터페이스에 `type` 필드 추가 (주택임차권/상가임차권/기타)
- [ ] RegisteredRight 인터페이스의 `type`을 RightTypeKorean으로 변경
- [ ] PropertySnapshot 인터페이스의 `propertyType`을 PropertyTypeKorean으로 변경
- [ ] ValuationInput에 `propertyType`, `overrides.kappa` 추가
- [ ] RightAnalysisResult에 `riskFlags: RiskFlagKey[]` 추가
- [ ] RightAnalysisResult의 `rightFindings`에 `disposition` 필드 확인
- [ ] CostInput에 `riskFlags?: RiskFlagKey[]` 추가
- [ ] CostInput의 `overrides` 확장 (acquisitionTaxRate, educationTaxRate, specialTaxRate, evictionCost, miscCost)
- [ ] EngineOutput에 `riskFlags: RiskFlagKey[]` 추가

**예상 소요 시간**: 20분  
**우선순위**: 🔴 최우선

---

### Phase 3: Valuation 모듈 교체

#### 3.1 `src/lib/valuation.ts` 교체

- [ ] constants.auction.ts에서 FMV_KAPPA_BY_TYPE, MINBID_ALPHA_DEFAULT, PropertyTypeKorean import
- [ ] estimateValuation 함수에 유형별 κ 적용 로직 추가
- [ ] propertyType이 있을 경우 해당 유형의 κ 값 사용
- [ ] propertyType이 없을 경우 기본값 0.90 사용
- [ ] overrides.kappa가 있으면 우선 적용
- [ ] 시장 신호 보정 로직 유지 (±10% 캡)

**예상 소요 시간**: 15분  
**우선순위**: 🟡 높음

---

### Phase 4: Rights 엔진 교체

#### 4.1 `src/lib/rights/rights-engine.ts` 교체

- [ ] constants.auction.ts에서 RIGHT_RULES, RightTypeKorean, RiskFlagKey import
- [ ] pickMalsoBaseRight 함수 유지 (말소기준권리 선택)
- [ ] comparePriority 함수 유지 (선후순위 비교)
- [ ] assessTenantOpposability 함수 유지 (대항력 판정)
- [ ] analyzeRights 함수에 15개 권리 판정 로직 추가
  - [ ] RIGHT_RULES를 사용한 권리별 disposition 판정
  - [ ] 말소기준권리와의 선후순위 비교
  - [ ] amountPolicy에 따른 금액 계산 (금액전액/추정/시세감액/금액없음)
  - [ ] riskFlags 수집 및 추가
- [ ] 임차인 판정 로직 확장
  - [ ] 주택임차권/상가임차권 구분
  - [ ] 상가임차권일 경우 "상가임차" riskFlag 추가
  - [ ] 임차인 3명 이상일 경우 "임차다수" riskFlag 추가
- [ ] 0원 방지 레이어 추가
  - [ ] assumedRightsAmountRaw가 0원일 경우 fallback 적용
  - [ ] 감정가의 1% 또는 최소 300만원 중 큰 값 사용
  - [ ] console.warn 및 notes에 경고 메시지 추가

**예상 소요 시간**: 45분  
**우선순위**: 🔴 최우선

---

### Phase 5: Costs 모듈 교체

#### 5.1 `src/lib/costs.ts` 교체

- [ ] constants.auction.ts에서 관련 상수들 import
  - [ ] ACQ_TAX_RATE_BY_TYPE
  - [ ] EDU_TAX_RATE, SPC_TAX_RATE
  - [ ] BASE_EVICTION_BY_TYPE
  - [ ] BASE_MISC_COST
  - [ ] RISK_EVICTION_ADD, RISK_MISC_ADD
- [ ] calcCosts 함수에 매물유형별 세율 적용
- [ ] 매물유형별 기본 명도비 적용
- [ ] riskFlags에 따른 위험 가산 비용 적용
  - [ ] RISK_EVICTION_ADD를 사용한 명도비 가산
  - [ ] RISK_MISC_ADD를 사용한 기타비용 가산
- [ ] notes에 위험 가산 적용 내역 추가

**예상 소요 시간**: 20분  
**우선순위**: 🟡 높음

---

### Phase 6: Auction Engine 오케스트레이션 교체

#### 6.1 `src/lib/auction-engine.ts` 교체

- [ ] estimateValuation, analyzeRights, calcCosts, evaluateProfit import 확인
- [ ] auctionEngine 함수에 v0.2 로직 적용
- [ ] Valuation 단계에서 propertyType 전달
- [ ] Rights 단계 결과 확인
- [ ] Costs 단계에서 riskFlags 전달
- [ ] 최종 출력에 riskFlags 병합
- [ ] meta에 engineVersion: "v0.2" 추가
- [ ] devMode 로그 확인 (📐 valuation, ⚖️ rights, 💰 costs, 📊 profit, 🧯 safety)

**예상 소요 시간**: 15분  
**우선순위**: 🔴 최우선

---

### Phase 7: Profit 모듈 확인 (유지)

#### 7.1 `src/lib/profit.ts` 확인

- [ ] evaluateProfit 함수 유지 (변경 없음)
- [ ] 인터페이스 호환성 확인

**예상 소요 시간**: 5분  
**우선순위**: 🟢 낮음

---

### Phase 8: 컴포넌트 통합 및 테스트

#### 8.1 기존 컴포넌트에서 새 엔진 사용 확인

- [ ] `import { auctionEngine } from "@/lib/auction-engine"` 확인
- [ ] EngineInput 타입 호환성 확인
- [ ] EngineOutput의 riskFlags 사용 여부 확인

#### 8.2 리포트 UI 확장 (선택 사항)

- [ ] 위험 배지 표시 섹션 추가
  - [ ] `result.riskFlags` 배열을 배지로 표시
  - [ ] 위험 배지 종류: 소유권분쟁, 상가임차, 유치권, 법정지상권, 분묘, 배당불명확, 임차다수
- [ ] 권리 상세 테이블에 disposition 표시
  - [ ] `rights.rightFindings`의 `disposition` (소멸/인수/위험) 표시
  - [ ] `amountAssumed` 표시
- [ ] 명도/기타 비용 설명 표시
  - [ ] `costs.notes`의 "위험 가산 적용: ..." 문구 표시

**예상 소요 시간**: 30분 (UI 확장 포함 시 1시간)  
**우선순위**: 🟡 높음

---

### Phase 9: 스모크 테스트

#### 9.1 테스트 케이스 작성 및 실행

- [ ] 스모크 테스트 샘플 실행 (auction-engine-v0.2.md 11절 참고)
- [ ] 다양한 매물유형 테스트 (아파트, 오피스텔, 근린주택 등)
- [ ] 다양한 권리유형 테스트 (근저당권, 담보가등기, 상가임차권 등)
- [ ] 위험 배지 생성 확인
- [ ] 0원 방지 레이어 동작 확인
- [ ] devMode 로그 확인

**예상 소요 시간**: 30분  
**우선순위**: 🔴 최우선

---

## ✅ 마이그레이션 체크리스트

### 필수 작업

- [x] `src/lib/constants.auction.ts` 생성 완료
- [ ] `src/types/auction.ts` 교체 완료
- [ ] `src/lib/valuation.ts` 교체 완료
- [ ] `src/lib/rights/rights-engine.ts` 교체 완료 (0원 방지 포함)
- [ ] `src/lib/costs.ts` 교체 완료
- [ ] `src/lib/auction-engine.ts` 교체 완료
- [ ] 스모크 테스트 통과

### 선택 작업

- [ ] 리포트 UI에 위험 배지 표시 추가
- [ ] 권리 상세 테이블에 disposition 표시
- [ ] 명도/기타 비용 설명 표시

---

## 📊 예상 총 소요 시간

- **필수 작업**: 약 2시간 30분
- **선택 작업 (UI 확장)**: 추가 1시간
- **총 예상 시간**: 2시간 30분 ~ 3시간 30분

---

## 🚨 주의사항

1. **기존 코드 백업**: v0.1 코드를 Git에 커밋한 후 작업 시작
2. **타입 호환성**: 기존 컴포넌트와의 타입 호환성 반드시 확인
3. **0원 방지**: rights-engine.ts에 0원 방지 로직 반드시 포함
4. **로그 기록**: 핵심 로직에 로그 추가 (이모지 + [카테고리] 형식)
5. **테스트 우선**: 각 단계별로 테스트를 진행하며 문제 발견 시 즉시 수정

---

## 📝 참고 문서

- `docs/auction-engine-v0.2.md`: 전체 구현 가이드
- 각 Phase의 코드 블록을 해당 경로에 그대로 생성/교체

---

## 🔄 작업 순서 권장사항

1. **Phase 1** (상수 파일) → 가장 먼저 생성
2. **Phase 2** (타입 확장) → 상수 파일과 함께 타입 기반 구축
3. **Phase 4** (Rights 엔진) → 가장 복잡한 로직, 먼저 구현
4. **Phase 3** (Valuation) → Rights 엔진과 독립적
5. **Phase 5** (Costs) → Rights 엔진 결과 사용
6. **Phase 6** (Auction Engine) → 모든 모듈 통합
7. **Phase 9** (테스트) → 각 단계별로 진행

---

**작성일**: 2025-01-XX  
**문서 버전**: 1.0  
**관련 문서**: `docs/auction-engine-v0.2.md`
