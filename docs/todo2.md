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

### Phase 2: 타입 확장

#### 2.1 `src/types/auction.ts` 교체

**목적**: v0.1 타입 정의를 v0.2로 확장하여 매물유형 9종, 권리유형 15종, 위험 배지 시스템을 타입 레벨에서 지원

**작업 단계**:

1. **Import 문 추가**

   - [x] 파일 상단에 `constants.auction.ts`에서 타입 import 추가
     ```typescript
     import type {
       PropertyTypeKorean,
       RightTypeKorean,
       RiskFlagKey,
     } from "@/lib/constants.auction";
     ```
   - [x] 기존 import 문과 충돌하지 않는지 확인

2. **Tenant 인터페이스 확장**

   - [x] `Tenant` 인터페이스에 `type` 필드 추가 (선택 필드)
     - 타입: `"주택임차권" | "상가임차권" | "기타"`
     - 기본값: 없음 (선택 필드)
     - 위치: 기존 필드들 다음에 추가
   - [x] 기존 코드와의 호환성 확인 (기존 코드가 type 필드를 사용하지 않으면 영향 없음)

3. **RegisteredRight 인터페이스 변경**

   - [x] `RegisteredRight.type` 필드 타입 변경
     - 기존: `RightType` (5가지: "mortgage" | "pledge" | "lease" | "liens" | "superiorEtc")
     - 변경: `RightTypeKorean` (15가지: "근저당권" | "저당권" | ... | "분묘기지권")
   - [x] 기존 코드에서 `RightType` 사용하는 부분 확인 필요 (Phase 3에서 매퍼 함수로 해결)

4. **PropertySnapshot 인터페이스 변경**

   - [x] `PropertySnapshot.propertyType` 필드 타입 변경
     - 기존: `"apartment" | "officetel" | "villa" | "land" | "commercial" | string`
     - 변경: `PropertyTypeKorean` (9가지: "아파트" | "오피스텔" | ... | "도시형생활주택")
   - [x] 필수 필드로 유지 (기존과 동일)

5. **ValuationInput 인터페이스 확장**

   - [x] `propertyType` 필드 추가
     - 타입: `PropertyTypeKorean` (선택 필드)
     - 목적: 유형별 κ 값 적용을 위해 필요
   - [x] `overrides` 필드 확장
     - 기존: 없음 (또는 다른 구조)
     - 추가: `overrides?: Partial<{ kappa: number }>`
     - 목적: 유형별 기본 κ 값을 오버라이드할 수 있도록 함

6. **RightAnalysisResult 인터페이스 확장**

   - [x] 최상위에 `riskFlags` 필드 추가
     - 타입: `RiskFlagKey[]` (필수 필드)
     - 목적: 위험 배지 시스템 지원
   - [x] `rightFindings` 배열 요소에 `disposition` 필드 추가
     - 타입: `"소멸" | "인수" | "위험"`
     - 위치: 기존 필드들 (rightId, assumed, reason, amountAssumed) 사이에 추가
   - [x] `rightFindings` 배열 요소에 `type` 필드 추가
     - 타입: `RightTypeKorean`
     - 목적: 권리유형 정보 보존
   - [x] `tenantFindings` 배열 요소에 `kind` 필드 추가 (추가 작업)
     - 타입: `"주택임차권" | "상가임차권" | "기타"`
     - 목적: 임차권 유형 구분

7. **CostInput 인터페이스 확장**

   - [x] `propertyType` 필드 타입 변경
     - 기존: `string | undefined`
     - 변경: `PropertyTypeKorean` (필수 필드)
   - [x] `riskFlags` 필드 추가
     - 타입: `RiskFlagKey[]` (선택 필드)
     - 목적: 위험 가산 비용 계산에 사용
   - [x] `overrides` 필드 확장
     - 기존 필드 유지: `acquisitionTaxRate`, `educationTaxRate`, `specialTaxRate`, `evictionCost`, `miscCost`
     - 모든 필드가 이미 정의되어 있는지 확인
     - 없으면 추가, 있으면 타입 정확성 확인

8. **EngineOutput 인터페이스 확장**
   - [x] 최상위에 `riskFlags` 필드 추가
     - 타입: `RiskFlagKey[]` (필수 필드)
     - 목적: 최종 출력에 위험 배지 포함
   - [x] `meta` 필드에 `engineVersion` 추가 (선택)
     - 타입: `meta?: { engineVersion: string; generatedAt: string }`
     - 목적: 엔진 버전 추적

**타입 호환성 체크리스트**:

- [ ] 기존 코드에서 `RightType` 사용하는 부분 확인 (Phase 3에서 매퍼로 해결 예정)
- [ ] 기존 코드에서 `PropertySnapshot.propertyType`을 영문으로 사용하는 부분 확인
- [ ] `Tenant.type` 필드가 선택 필드이므로 기존 코드와 호환성 문제 없음 확인
- [ ] 모든 필수 필드가 필수로, 선택 필드가 선택으로 올바르게 정의되었는지 확인

**검증 체크리스트**:

- [x] TypeScript 컴파일 에러 없음 확인
- [x] 모든 import 경로가 올바른지 확인
- [x] 타입 정의가 `auction-engine-v0.2.md` 3번 섹션과 일치하는지 확인
- [x] 기존 인터페이스의 주석 및 문서가 유지되었는지 확인

**참고 파일**: `docs/auction-engine-v0.2.md` 3번 섹션

**예상 소요 시간**: 20분  
**우선순위**: 🔴 최우선

---

### Phase 3: Valuation 모듈 교체

#### 3.1 `src/lib/valuation.ts` 교체

**목적**: v0.1의 하드코딩된 κ 값(0.91)과 최저가 비율(0.8)을 v0.2의 유형별 상수 시스템으로 교체하여, 매물유형별 FMV 보정 계수(κ)와 최저가 비율(α)을 적용

**현재 상태 (v0.1)**:

- 하드코딩된 κ 값: `const kFromAppraisal = 0.91` (모든 매물유형에 동일 적용)
- 하드코딩된 최저가 비율: `appraisal * 0.8` (MINBID_ALPHA_DEFAULT 상수 미사용)
- propertyType 기반 유형별 κ 값 미적용
- overrides.kappa 옵션 미지원

**변경 사항 (v0.2)**:

- `FMV_KAPPA_BY_TYPE` 상수 사용 (9개 매물유형별 κ 값)
- `MINBID_ALPHA_DEFAULT` 상수 사용 (0.8 대신 상수 참조)
- propertyType에 따른 유형별 κ 값 적용
- propertyType이 없을 경우 기본값 0.90 사용
- overrides.kappa가 있으면 우선 적용 (유형별 기본값보다 우선)
- 시장 신호 보정 로직 유지 (±10% 캡)

**작업 단계**:

1. **Import 문 추가**

   - [x] 파일 상단에 `constants.auction.ts`에서 상수 및 타입 import 추가
     ```typescript
     import {
       FMV_KAPPA_BY_TYPE,
       MINBID_ALPHA_DEFAULT,
       PropertyTypeKorean,
     } from "./constants.auction";
     ```
   - [x] 기존 import 문(`@/types/auction`)과 충돌하지 않는지 확인

2. **κ 값 결정 로직 교체**

   - [x] 기존 `const kFromAppraisal = 0.91;` 삭제
   - [x] propertyType을 PropertyTypeKorean으로 타입 캐스팅
     ```typescript
     const pType: PropertyTypeKorean | undefined = input.propertyType as any;
     ```
   - [x] κ 값 결정 로직 구현 (우선순위: overrides.kappa > propertyType별 κ > 기본값 0.90)
     ```typescript
     const kappa =
       input.overrides?.kappa ?? (pType ? FMV_KAPPA_BY_TYPE[pType] : 0.9);
     ```
   - [x] 로그에 적용된 κ 값과 propertyType 정보 추가
     ```typescript
     console.log("📐 [Valuation] κ 값 결정", {
       propertyType: pType,
       kappa: kappa.toFixed(3),
       source: input.overrides?.kappa
         ? "overrides"
         : pType
         ? "유형별 기본값"
         : "기본값(0.90)",
     });
     ```

3. **최저가 계산 로직 교체**

   - [x] 모든 하드코딩된 `0.8`을 `MINBID_ALPHA_DEFAULT` 상수로 교체
   - [x] `appraisal * 0.8` → `appraisal * MINBID_ALPHA_DEFAULT`로 변경
   - [x] `minBid / 0.8` → `minBid / MINBID_ALPHA_DEFAULT`로 변경
   - [x] notes 메시지에 하드코딩된 값 대신 상수 값 사용
     ```typescript
     notes.push(`최저가 부재 → 감정가×${MINBID_ALPHA_DEFAULT}로 산출`);
     ```

4. **FMV 역산 로직 교체**

   - [x] FMV가 없을 때 감정가 기반 FMV 계산 시 κ 값 사용
     ```typescript
     if (!fmv) {
       fmv = Math.round((appraisal as number) * kappa);
       notes.push(`FMV 부재 → 감정가 기반 κ=${kappa.toFixed(2)} 적용`);
     }
     ```
   - [x] appraisal, minBid 둘 다 없을 때 FMV로 역산 시 κ 값 사용
     ```typescript
     if (!appraisal && !minBid) {
       if (!fmv) {
         fmv = fallbackFMV;
         notes.push("FMV 힌트 부재 → 교육용 기본 FMV 사용");
       }
       appraisal = Math.round((fmv as number) / kappa);
       minBid = Math.round(appraisal * MINBID_ALPHA_DEFAULT);
       notes.push(`감정가/최저가 부재 → FMV와 κ=${kappa.toFixed(2)}로 역산`);
     }
     ```

5. **시장 신호 보정 로직 유지**

   - [x] 기존 marketSignals 보정 로직 유지 (±10% 캡)
   - [x] 로그 형식 유지 (v0.1과 동일)

6. **로그 개선**
   - [x] κ 값 결정 과정 로그 추가
   - [x] propertyType 정보 로그 추가
   - [x] 계산 완료 시 적용된 κ 값과 propertyType 정보 포함

**검증 체크리스트**:

- [x] TypeScript 컴파일 에러 없음 확인
- [x] 모든 import 경로가 올바른지 확인
- [ ] propertyType이 있을 때 해당 유형의 κ 값이 올바르게 적용되는지 확인 (테스트 필요)
- [ ] propertyType이 없을 때 기본값 0.90이 적용되는지 확인 (테스트 필요)
- [ ] overrides.kappa가 있을 때 우선 적용되는지 확인 (테스트 필요)
- [x] 하드코딩된 0.8이 모두 MINBID_ALPHA_DEFAULT로 교체되었는지 확인
- [x] 시장 신호 보정 로직이 정상 작동하는지 확인
- [x] 기존 로그 형식이 유지되는지 확인 (📐 [Valuation] 형식)

**테스트 케이스**:

- [ ] propertyType = "아파트"일 때 κ = 0.91 적용 확인
- [ ] propertyType = "오피스텔"일 때 κ = 0.88 적용 확인
- [ ] propertyType = "근린주택"일 때 κ = 0.86 적용 확인
- [ ] propertyType이 없을 때 κ = 0.90 적용 확인
- [ ] overrides.kappa = 0.95일 때 κ = 0.95 적용 확인 (유형별 기본값보다 우선)
- [ ] 최저가 계산 시 MINBID_ALPHA_DEFAULT(0.8) 사용 확인
- [ ] 시장 신호 보정이 ±10% 범위 내에서 작동하는지 확인

**참고 파일**: `docs/auction-engine-v0.2.md` 4번 섹션

**예상 소요 시간**: 20분  
**우선순위**: 🟡 높음

---

### Phase 4: Rights 엔진 교체

#### 4.1 `src/lib/rights/rights-engine.ts` 교체

**목적**: v0.1의 5개 권리유형 하드코딩 로직을 v0.2의 15개 권리유형 + RIGHT_RULES 기반 시스템으로 교체하여, 권리유형별 disposition 판정, amountPolicy 적용, riskFlags 수집, 임차인 주택/상가 구분, 0원 방지 레이어를 구현

**현재 상태 (v0.1)**:

- **권리유형**: 5개만 지원 (`"mortgage" | "pledge" | "lease" | "liens" | "superiorEtc"`)
- **하드코딩된 로직**: 담보성 권리만 필터링하여 말소기준 판단
- **disposition 판정**: 단순 선후순위 비교만 수행
- **amountPolicy**: 금액 계산 로직이 하드코딩 (금액전액만 처리)
- **riskFlags**: 미지원 (위험 배지 시스템 없음)
- **임차인**: 주택/상가 구분 없이 동일 처리
- **0원 방지**: 없음 (assumedRightsAmount가 0원일 수 있음)
- **rightFindings**: `type`, `disposition` 필드 없음
- **tenantFindings**: `kind` 필드 없음

**변경 사항 (v0.2)**:

- **15개 권리유형 지원**: `RIGHT_RULES` 상수를 사용한 권리별 규칙 적용
- **RIGHT_RULES 기반 판정**: `defaultDisposition`, `amountPolicy`, `riskFlags` 사용
- **말소기준권리 확장**: `["근저당권", "저당권", "담보가등기"]` 담보성 권리 필터링
- **선후순위 비교**: 말소기준권리보다 선순위면 disposition을 "인수"로 전환
- **amountPolicy 4종 처리**: 금액전액/추정/시세감액/금액없음
- **riskFlags 수집**: 권리별 riskFlags + 임차인별 riskFlags + 특수 권리 riskFlags
- **임차인 주택/상가 구분**: `kind` 필드 추가, 상가임차권일 경우 "상가임차" riskFlag
- **임차다수 플래그**: 임차인 3명 이상일 경우 "임차다수" riskFlag
- **0원 방지 레이어**: assumedRightsAmountRaw가 0원일 경우 fallback 적용
- **rightFindings 확장**: `type` (RightTypeKorean), `disposition` 필드 추가
- **tenantFindings 확장**: `kind` 필드 추가

**작업 단계**:

1. **Import 문 추가**

   - [x] 파일 상단에 `constants.auction.ts`에서 상수 및 타입 import 추가
     ```typescript
     import {
       RIGHT_RULES,
       RightTypeKorean,
       RiskFlagKey,
     } from "@/lib/constants.auction";
     ```
   - [x] 기존 import 문(`@/types/auction`)과 충돌하지 않는지 확인

2. **pickMalsoBaseRight 함수 수정**

   - [x] 기존 `collateralTypes` Set을 v0.2 형식으로 변경
     ```typescript
     // 기존: const collateralTypes = new Set(["mortgage", "pledge", "superiorEtc"]);
     // 변경: const collateral = new Set<RightTypeKorean>(["근저당권", "저당권", "담보가등기"]);
     ```
   - [x] 필터링 로직 수정: `rights.filter(r => collateral.has(r.type))`
   - [x] 로그 메시지에 한국어 권리유형 표시
   - [x] 기존 로직 유지: 배당요구종기일 필터링, rankOrder/establishedAt 정렬

3. **comparePriority 함수 유지**

   - [x] 함수 시그니처 및 로직 변경 없음 (rankOrder/establishedAt 비교)
   - [x] 로그는 필요 시에만 추가 (현재 로그 없음, 유지)

4. **assessTenantOpposability 함수 유지**

   - [x] 함수 시그니처 및 로직 변경 없음 (대항력 판정)
   - [x] 로그는 필요 시에만 추가 (현재 로그 없음, 유지)

5. **analyzeRights 함수 - 등기 권리 판정 로직 교체**

   - [x] `riskFlags` Set 초기화
     ```typescript
     const riskFlags = new Set<RiskFlagKey>();
     ```
   - [x] `rightFindings` 배열 생성 로직 교체
     - [x] 각 권리에 대해 `RIGHT_RULES[r.type]` 조회
     - [x] `defaultDisposition` 가져오기 (없으면 "소멸" 기본값)
     - [x] `riskFlags` 수집 (rule?.riskFlags ?? [])
     - [x] 말소기준권리와 선후순위 비교
       - [x] 말소기준권리가 있을 때: 선순위면 disposition을 "인수"로 전환
       - [x] 말소기준권리가 없을 때: disposition이 "소멸"이면 "위험"으로 전환
     - [x] `amountPolicy`에 따른 금액 계산
       - [x] "금액전액": disposition이 "소멸"이 아니면 `r.amount ?? 0` 사용
       - [x] "추정": disposition이 "소멸"이 아니면 `(r.amount ?? 0) * 0.5` 사용
       - [x] "시세감액": assumed = false (비용은 costs 레이어에서 가산)
       - [x] "금액없음": assumed = false
     - [x] `reason` 생성 (rule?.note가 있으면 사용, 없으면 disposition 기반 생성)
     - [x] `rightFindings` 요소에 `type`, `disposition` 필드 추가
   - [x] 로그 추가
     ```typescript
     console.log("⚖️ [권리분석] 권리 판정", {
       rightId: r.id,
       type: r.type,
       disposition,
       amountAssumed,
       reason,
     });
     ```

6. **analyzeRights 함수 - 임차인 판정 로직 확장**

   - [x] `tenantFindings` 배열 생성 로직 교체
     - [x] `kind` 필드 추가: `(t.type ?? "기타") as "주택임차권" | "상가임차권" | "기타"`
     - [x] 상가임차권일 경우 "상가임차" riskFlag 추가
       ```typescript
       if (kind === "상가임차권") riskFlags.add("상가임차");
       ```
     - [x] 대항력 판정 (기존 `assessTenantOpposability` 사용)
     - [x] 인수 판정 로직 수정
       - [x] "strong": assumed = true, factor = 1.0
       - [x] "weak": assumed = true, factor = 상가임차권이면 0.6, 아니면 0.5
       - [x] "none": assumed = false, factor = 0
     - [x] `depositAssumed` 계산: `assumed ? Math.round(t.deposit * factor) : 0`
     - [x] `reason` 생성 (대항력 기반)
   - [x] 로그 추가
     ```typescript
     console.log("⚖️ [권리분석] 임차인 판정", {
       tenantId: t.id,
       kind,
       opposability: opp,
       assumed,
       depositAssumed,
       reason,
     });
     ```

7. **analyzeRights 함수 - 특수 권리 riskFlags 추가**

   - [x] `rightFindings` 순회하여 특수 권리 riskFlags 추가
     ```typescript
     for (const f of rightFindings) {
       if (f.type === "유치권") riskFlags.add("유치권");
       if (f.type === "법정지상권") riskFlags.add("법정지상권");
       if (f.type === "분묘기지권") riskFlags.add("분묘");
       if (
         f.type === "소유권이전청구권가등기" ||
         f.type === "가등기" ||
         f.type === "예고등기" ||
         f.type === "가처분"
       ) {
         riskFlags.add("소유권분쟁");
       }
     }
     ```
   - [x] 임차다수 플래그 추가
     ```typescript
     if (tenants.length >= 3) riskFlags.add("임차다수");
     ```

8. **analyzeRights 함수 - 합산 및 0원 방지 레이어**

   - [x] 기존 합산 로직 유지
     ```typescript
     const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
     const rightsSum = sum(rightFindings.map((f) => f.amountAssumed));
     const tenantsSum = sum(tenantFindings.map((f) => f.depositAssumed));
     const assumedRightsAmountRaw = rightsSum + tenantsSum;
     ```
   - [x] 0원 방지 레이어 추가
     ```typescript
     let assumedRightsAmount = assumedRightsAmountRaw;
     if (assumedRightsAmountRaw === 0) {
       // 감정가의 1% 또는 최소 300만원 중 큰 값 사용
       const appraisal = snapshot.appraisal ?? 0;
       const fallback1 = Math.round(appraisal * 0.01);
       const fallback2 = 3_000_000;
       assumedRightsAmount = Math.max(fallback1, fallback2);
       console.warn("⚠️ [권리분석] 인수권리금액이 0원 → Fallback 적용", {
         assumedRightsAmountRaw: 0,
         appraisal: appraisal.toLocaleString(),
         fallback1: fallback1.toLocaleString(),
         fallback2: fallback2.toLocaleString(),
         applied: assumedRightsAmount.toLocaleString(),
       });
       notes.push(
         `인수권리금액 0원 → Fallback 적용: ${assumedRightsAmount.toLocaleString()}원 (감정가의 1% 또는 최소 300만원 중 큰 값)`
       );
     }
     ```
   - [x] notes 업데이트 (assumedRightsAmount 사용)

9. **analyzeRights 함수 - 반환값 수정**

   - [x] `riskFlags` 배열로 변환하여 반환
     ```typescript
     return {
       malsoBase,
       assumedRightsAmount,
       tenantFindings,
       rightFindings,
       riskFlags: Array.from(riskFlags),
       notes,
     };
     ```

10. **로그 개선**

- [x] 권리 판정 시작/완료 로그에 riskFlags 정보 추가
- [x] 임차인 판정 시작/완료 로그에 kind 정보 추가
- [x] 최종 결과 로그에 riskFlags 배열 포함

**검증 체크리스트**:

- [ ] TypeScript 컴파일 에러 없음 확인
- [ ] 모든 import 경로가 올바른지 확인
- [ ] 15개 권리유형이 모두 RIGHT_RULES에 정의되어 있는지 확인
- [ ] 말소기준권리 필터링이 ["근저당권", "저당권", "담보가등기"]로 올바르게 작동하는지 확인
- [ ] 선후순위 비교 로직이 올바르게 작동하는지 확인
- [ ] amountPolicy 4종이 모두 올바르게 처리되는지 확인
- [ ] riskFlags가 올바르게 수집되는지 확인 (권리별 + 임차인별 + 특수 권리)
- [ ] 임차인 주택/상가 구분이 올바르게 작동하는지 확인
- [ ] 임차다수 플래그가 3명 이상일 때 추가되는지 확인
- [ ] 0원 방지 레이어가 올바르게 작동하는지 확인
- [ ] rightFindings에 type, disposition 필드가 포함되는지 확인
- [ ] tenantFindings에 kind 필드가 포함되는지 확인
- [ ] 기존 로그 형식이 유지되는지 확인 (⚖️ [권리분석] 형식)

**테스트 케이스**:

- [ ] 근저당권: 말소기준권리로 선택되는지 확인
- [ ] 담보가등기: disposition "인수", amountPolicy "금액전액" 적용 확인
- [ ] 압류: disposition "소멸", riskFlags "소유권분쟁" 추가 확인
- [ ] 가등기: disposition "위험", amountPolicy "시세감액", assumed = false 확인
- [ ] 유치권: disposition "위험", riskFlags "유치권" 추가 확인
- [ ] 법정지상권: disposition "위험", riskFlags "법정지상권" 추가 확인
- [ ] 분묘기지권: disposition "위험", riskFlags "분묘" 추가 확인
- [ ] 상가임차권: kind "상가임차권", riskFlags "상가임차" 추가, factor 0.6 확인
- [ ] 주택임차권: kind "주택임차권", factor 0.5 확인
- [ ] 임차인 3명 이상: riskFlags "임차다수" 추가 확인
- [ ] 선순위 권리: 말소기준권리보다 선순위면 disposition "인수" 전환 확인
- [ ] 말소기준권리 없음: disposition "소멸" → "위험" 전환 확인
- [ ] 0원 방지: assumedRightsAmountRaw가 0원일 때 fallback 적용 확인
- [ ] amountPolicy "추정": 금액의 50% 적용 확인
- [ ] amountPolicy "금액전액": 금액 전액 적용 확인

**주의사항**:

1. **기존 로직 유지**: `pickMalsoBaseRight`, `comparePriority`, `assessTenantOpposability` 함수는 기존 로직 유지하되 타입만 변경
2. **타입 안전성**: `RightTypeKorean` 타입을 사용하여 타입 안전성 보장
3. **0원 방지**: assumedRightsAmount가 0원이 되지 않도록 반드시 fallback 적용
4. **riskFlags 중복 방지**: Set을 사용하여 중복 제거
5. **로그 기록**: 모든 핵심 판정 과정에 로그 추가 (이모지 + [카테고리] 형식)

**참고 파일**: `docs/auction-engine-v0.2.md` 5번 섹션

**예상 소요 시간**: 60분  
**우선순위**: 🔴 최우선

---

### Phase 5: Costs 모듈 교체

#### 5.1 `src/lib/costs.ts` 교체

**목적**: v0.1의 하드코딩된 세율(기본 1.1%/2.0%)과 명도비(기본 300만원)를 v0.2의 유형별 상수 시스템으로 교체하여, 매물유형별 취득세율/명도비 기본값과 위험 배지에 따른 가산 비용을 적용

**현재 상태 (v0.1)**:

- 하드코딩된 취득세율: `pickBaseAcqTaxRate` 함수로 간이 구분 (land/commercial 2.0%, 나머지 1.1%)
- 하드코딩된 교육세/농특세: 0.1%, 0.2% 고정
- 하드코딩된 명도비: 기본 3,000,000원 (overrides로만 변경 가능)
- 하드코딩된 기타비용: 기본 1,000,000원 (overrides로만 변경 가능)
- 위험 가산 비용: 미지원 (riskFlags 기반 가산 없음)
- propertyType 기반 유형별 세율/명도비 미적용
- 위험 배지에 따른 가산 비용 미적용

**변경 사항 (v0.2)**:

- `ACQ_TAX_RATE_BY_TYPE` 상수 사용 (9개 매물유형별 취득세율)
- `EDU_TAX_RATE`, `SPC_TAX_RATE` 상수 사용 (0.1%, 0.2%)
- `BASE_EVICTION_BY_TYPE` 상수 사용 (9개 매물유형별 기본 명도비)
- `BASE_MISC_COST` 상수 사용 (1,000,000원)
- `RISK_EVICTION_ADD` 상수 사용 (위험 배지별 명도비 가산)
- `RISK_MISC_ADD` 상수 사용 (위험 배지별 기타비용 가산)
- propertyType에 따른 유형별 세율/명도비 적용
- riskFlags에 따른 위험 가산 비용 적용
- notes에 위험 가산 적용 내역 추가

**작업 단계**:

1. **Import 문 추가** ✅

   - [x] 파일 상단에 `constants.auction.ts`에서 상수 import 추가
     ```typescript
     import {
       ACQ_TAX_RATE_BY_TYPE,
       EDU_TAX_RATE,
       SPC_TAX_RATE,
       BASE_EVICTION_BY_TYPE,
       BASE_MISC_COST,
       RISK_EVICTION_ADD,
       RISK_MISC_ADD,
     } from "@/lib/constants.auction";
     ```
   - [x] 기존 import 문(`@/types/auction`)과 충돌하지 않는지 확인

2. **pickBaseAcqTaxRate 함수 삭제** ✅

   - [x] 기존 `pickBaseAcqTaxRate` 함수 삭제 (더 이상 필요 없음)
   - [x] 함수 호출 부분 제거

3. **세율 결정 로직 교체** ✅

   - [x] 취득세율 결정 로직 변경
     ```typescript
     // 기존: const acqRate = overrides?.acquisitionTaxRate ?? pickBaseAcqTaxRate(propertyType);
     // 변경: const acqRate = overrides?.acquisitionTaxRate ?? ACQ_TAX_RATE_BY_TYPE[propertyType];
     ```
   - [x] propertyType이 필수 필드이므로 타입 안전성 보장
   - [x] 교육세율 결정 로직 변경
     ```typescript
     // 기존: const eduRate = overrides?.educationTaxRate ?? 0.001;
     // 변경: const eduRate = overrides?.educationTaxRate ?? EDU_TAX_RATE;
     ```
   - [x] 농특세율 결정 로직 변경
     ```typescript
     // 기존: const spcRate = overrides?.specialTaxRate ?? 0.002;
     // 변경: const spcRate = overrides?.specialTaxRate ?? SPC_TAX_RATE;
     ```
   - [x] 로그에 적용된 세율과 propertyType 정보 추가
     ```typescript
     console.log("💰 [비용계산] 세율 설정", {
       propertyType,
       acquisitionTaxRate: (acqRate * 100).toFixed(2) + "%",
       educationTaxRate: (eduRate * 100).toFixed(2) + "%",
       specialTaxRate: (spcRate * 100).toFixed(2) + "%",
       source: overrides?.acquisitionTaxRate ? "overrides" : "유형별 기본값",
     });
     ```

4. **명도비 결정 로직 교체** ✅

   - [x] 명도비 결정 로직 변경
     ```typescript
     // 기존: const evictionCost = overrides?.evictionCost ?? 3_000_000;
     // 변경: let evictionCost = overrides?.evictionCost ?? BASE_EVICTION_BY_TYPE[propertyType];
     ```
   - [x] propertyType에 따른 유형별 기본 명도비 적용
   - [x] 로그에 적용된 명도비와 propertyType 정보 추가
     ```typescript
     console.log("💰 [비용계산] 명도비 설정", {
       propertyType,
       baseEviction: BASE_EVICTION_BY_TYPE[propertyType].toLocaleString(),
       appliedEviction: evictionCost.toLocaleString(),
       source: overrides?.evictionCost ? "overrides" : "유형별 기본값",
     });
     ```

5. **기타비용 결정 로직 교체** ✅

   - [x] 기타비용 결정 로직 변경
     ```typescript
     // 기존: const miscCost = overrides?.miscCost ?? 1_000_000;
     // 변경: let miscCost = overrides?.miscCost ?? BASE_MISC_COST;
     ```
   - [x] 로그에 적용된 기타비용 정보 추가
     ```typescript
     console.log("💰 [비용계산] 기타비용 설정", {
       baseMisc: BASE_MISC_COST.toLocaleString(),
       appliedMisc: miscCost.toLocaleString(),
       source: overrides?.miscCost ? "overrides" : "기본값",
     });
     ```

6. **위험 가산 비용 적용** ✅

   - [x] riskFlags 배열 파라미터 추가 확인 (`CostInput` 인터페이스에 이미 추가됨)
   - [x] 위험 가산 비용 계산 로직 추가

     ```typescript
     // 위험 가산
     const evictionAdds: string[] = [];
     const miscAdds: string[] = [];

     for (const flag of riskFlags) {
       const evictionAdd = RISK_EVICTION_ADD[flag] ?? 0;
       const miscAdd = RISK_MISC_ADD[flag] ?? 0;

       if (evictionAdd > 0) {
         evictionCost += evictionAdd;
         evictionAdds.push(`${flag}: +${evictionAdd.toLocaleString()}원`);
       }

       if (miscAdd > 0) {
         miscCost += miscAdd;
         miscAdds.push(`${flag}: +${miscAdd.toLocaleString()}원`);
       }
     }
     ```

   - [x] 로그에 위험 가산 적용 내역 추가
     ```typescript
     if (evictionAdds.length > 0 || miscAdds.length > 0) {
       console.log("💰 [비용계산] 위험 가산 비용 적용", {
         riskFlags,
         evictionAdds,
         miscAdds,
         totalEvictionAdd:
           evictionCost -
           (overrides?.evictionCost ?? BASE_EVICTION_BY_TYPE[propertyType]),
         totalMiscAdd: miscCost - (overrides?.miscCost ?? BASE_MISC_COST),
       });
     }
     ```

7. **notes 업데이트** ✅

   - [x] 위험 가산 적용 내역을 notes에 추가
     ```typescript
     if (evictionAdds.length > 0) {
       notes.push(`명도비 위험 가산: ${evictionAdds.join(", ")}`);
     }
     if (miscAdds.length > 0) {
       notes.push(`기타비용 위험 가산: ${miscAdds.join(", ")}`);
     }
     ```
   - [x] 기존 notes 형식 유지 (세율 정보 등)

8. **로그 개선** ✅

   - [x] 세율 결정 과정 로그 추가 (propertyType, 적용된 세율, 소스)
   - [x] 명도비 결정 과정 로그 추가 (propertyType, 기본값, 적용값, 소스)
   - [x] 위험 가산 비용 적용 로그 추가 (riskFlags, 가산 내역)
   - [x] 계산 완료 시 위험 가산 포함 내역 포함

**검증 체크리스트**:

- [x] TypeScript 컴파일 에러 없음 확인 ✅
- [x] 모든 import 경로가 올바른지 확인 ✅
- [ ] propertyType이 필수 필드로 올바르게 전달되는지 확인 (실제 테스트 필요)
- [ ] 매물유형별 취득세율이 올바르게 적용되는지 확인 (실제 테스트 필요)
- [ ] 매물유형별 기본 명도비가 올바르게 적용되는지 확인 (실제 테스트 필요)
- [ ] riskFlags에 따른 위험 가산 비용이 올바르게 적용되는지 확인 (실제 테스트 필요)
- [ ] overrides가 있을 때 우선 적용되는지 확인 (실제 테스트 필요)
- [ ] notes에 위험 가산 내역이 올바르게 추가되는지 확인 (실제 테스트 필요)
- [x] 기존 로그 형식이 유지되는지 확인 (💰 [비용계산] 형식) ✅

**테스트 케이스**:

- [ ] propertyType = "아파트"일 때 취득세율 1.1%, 명도비 3,000,000원 적용 확인
- [ ] propertyType = "오피스텔"일 때 취득세율 4.6%, 명도비 3,500,000원 적용 확인
- [ ] propertyType = "근린주택"일 때 취득세율 2.0%, 명도비 5,000,000원 적용 확인
- [ ] riskFlags = ["유치권"]일 때 명도비 +2,000,000원 가산 확인
- [ ] riskFlags = ["법정지상권"]일 때 명도비 +1,500,000원 가산 확인
- [ ] riskFlags = ["분묘"]일 때 명도비 +2,000,000원 가산 확인
- [ ] riskFlags = ["상가임차"]일 때 명도비 +1,000,000원 가산 확인
- [ ] riskFlags = ["임차다수"]일 때 명도비 +1,000,000원 가산 확인
- [ ] riskFlags = ["소유권분쟁"]일 때 기타비용 +1,000,000원 가산 확인
- [ ] riskFlags = ["배당불명확"]일 때 기타비용 +500,000원 가산 확인
- [ ] riskFlags = ["유치권", "법정지상권"]일 때 명도비 +3,500,000원 가산 확인
- [ ] riskFlags = ["소유권분쟁", "배당불명확"]일 때 기타비용 +1,500,000원 가산 확인
- [ ] overrides.acquisitionTaxRate가 있을 때 우선 적용 확인
- [ ] overrides.evictionCost가 있을 때 위험 가산 전 기본값 대신 사용 확인
- [ ] 위험 가산 내역이 notes에 올바르게 추가되는지 확인

**주의사항**:

1. **타입 안전성**: `propertyType`은 `CostInput`에서 필수 필드로 정의되어 있으므로 타입 안전성 보장
2. **위험 가산 순서**: 기본 명도비/기타비용 결정 후 위험 가산을 적용해야 함
3. **overrides 우선순위**: overrides가 있으면 위험 가산 전 기본값 대신 사용, 이후 위험 가산 적용
4. **로그 기록**: 모든 핵심 계산 과정에 로그 추가 (이모지 + [카테고리] 형식)

**참고 파일**: `docs/auction-engine-v0.2.md` 6번 섹션

**예상 소요 시간**: 20분  
**우선순위**: 🟡 높음

---

### Phase 6: Auction Engine 오케스트레이션 교체

#### 6.1 `src/lib/auction-engine.ts` 교체

**목적**: v0.1의 복잡한 로그 및 검증 로직을 v0.2의 간소화된 오케스트레이션으로 교체하여, 모든 레이어 결과를 통합하고 위험 배지(`riskFlags`)를 최종 출력에 병합하며, 엔진 버전 정보를 메타데이터에 추가

**현재 상태 (v0.1)**:

- 복잡한 로그 헬퍼 함수: `log(devMode, prefix, message, data?)` 형식
- 상세한 검증 로직: devMode에서 각 레이어 간 데이터 흐름 검증
- Valuation 단계: `propertyType` 전달하지만 `overrides.kappa` 미전달
- Rights 단계: `riskFlags` 미수집 (v0.1에서는 지원하지 않음)
- Costs 단계: `riskFlags` 미전달 (v0.1에서는 지원하지 않음)
- 최종 출력: `riskFlags` 미포함, `meta` 필드 없음
- 로그 형식: 상세한 단계별 로그 (시작/완료/검증)

**변경 사항 (v0.2)**:

- 간소화된 로그 함수: `const log = (...args: any[]) => { ... }` 형식
- 검증 로직 제거: v0.2에서는 간단한 로그만 유지
- Valuation 단계: `propertyType`과 `overrides.kappa` 전달
- Rights 단계: `riskFlags` 수집 (v0.2에서 지원)
- Costs 단계: `rights.riskFlags` 전달하여 위험 가산 비용 적용
- 최종 출력: `riskFlags` 병합 (Rights 레이어에서 수집한 값)
- `meta` 필드 추가: `{ engineVersion: "v0.2", generatedAt: string }`
- 로그 형식: 간단한 이모지 + 데이터 형식 (📐 valuation, ⚖️ rights, 💰 costs, 📊 profit, 🧯 safety)

**작업 단계**:

1. **Import 문 확인** ✅

   - [x] `estimateValuation`, `analyzeRights`, `calcCosts`, `evaluateProfit` import 확인
   - [x] `EngineInput`, `EngineOutput` 타입 import 확인
   - [x] 기존 import 문이 올바른지 확인

2. **로그 함수 교체** ✅

   - [x] 기존 `log(devMode, prefix, message, data?)` 함수 삭제
   - [x] 간소화된 인라인 로그 함수 추가
     ```typescript
     const log = (...args: any[]) => {
       if (options?.devMode) {
         const p = options?.logPrefix ?? "🧠 [ENGINE]";
         console.log(p, ...args);
       }
     };
     ```
   - [x] 기존 상세 로그 호출 제거

3. **Valuation 단계 수정** ✅

   - [x] `estimateValuation` 호출 시 `propertyType` 전달 확인
   - [x] `estimateValuation` 호출 시 `overrides.kappa` 전달 추가
     ```typescript
     const valuation = estimateValuation({
       appraisal: snapshot.appraisal,
       minBid: snapshot.minBid,
       fmvHint: snapshot.fmvHint ?? valuationInput?.fmvHint,
       marketSignals: valuationInput?.marketSignals,
       propertyType: snapshot.propertyType,
       overrides: valuationInput?.overrides,
     });
     ```
   - [x] 로그 형식 변경: `log("📐 valuation", valuation)`

4. **Rights 단계 확인** ✅

   - [x] `analyzeRights` 호출 유지 (변경 없음)
   - [x] `rights.riskFlags` 존재 확인 (v0.2에서 추가됨)
   - [x] 로그 형식 변경: `log("⚖️ rights", rights)`
   - [x] 하위 호환성 코드 제거 (`assumed` 변수 직접 사용)

5. **Costs 단계 수정** ✅

   - [x] `calcCosts` 호출 시 `riskFlags` 전달 추가
     ```typescript
     const costs = calcCosts({
       bidPrice: userBidPrice,
       assumedRightsAmount: rights.assumedRightsAmount,
       propertyType: snapshot.propertyType,
       regionCode: snapshot.regionCode,
       riskFlags: rights.riskFlags,
       overrides: valuationInput?.overrides as any,
     });
     ```
   - [x] 로그 형식 변경: `log("💰 costs", costs)`

6. **Profit 단계 확인** ✅

   - [x] `evaluateProfit` 호출 유지 (변경 없음)
   - [x] 로그 형식 변경: `log("📊 profit", profit)`

7. **Safety 객체 생성** ✅

   - [x] Safety 계산 로직 유지 (0으로 나누기 방지 헬퍼 함수 유지)
   - [x] 로그 형식 변경: `log("🧯 safety", safety)`
   - [x] 기존 상세 로그 제거

8. **최종 출력 수정** ✅

   - [x] `riskFlags` 필드 추가 (Rights 레이어에서 수집한 값)
     ```typescript
     return {
       valuation,
       rights,
       costs,
       profit,
       safety,
       riskFlags: rights.riskFlags,
       meta: { engineVersion: "v0.2", generatedAt: new Date().toISOString() },
     };
     ```
   - [x] `meta` 필드 추가 (엔진 버전 및 생성 시간)

9. **검증 로직 제거** ✅

   - [x] devMode 검증 로직 제거 (v0.1의 상세 검증 제거)
   - [x] 엔진 실행 시작 로그 제거 (간소화)

10. **함수 주석 업데이트** ✅

    - [x] 함수 주석에 v0.2 변경 사항 반영
    - [x] 실행 순서 설명 업데이트

**검증 체크리스트**:

- [ ] TypeScript 컴파일 에러 없음 확인
- [ ] 모든 import 경로가 올바른지 확인
- [ ] Valuation 단계에서 `propertyType`과 `overrides.kappa`가 올바르게 전달되는지 확인
- [ ] Rights 단계에서 `riskFlags`가 수집되는지 확인
- [ ] Costs 단계에서 `riskFlags`가 올바르게 전달되는지 확인
- [ ] 최종 출력에 `riskFlags`가 포함되는지 확인
- [ ] 최종 출력에 `meta` 필드가 포함되는지 확인
- [ ] devMode 로그가 올바르게 출력되는지 확인 (실제 테스트 필요)
- [ ] 기존 컴포넌트와의 호환성 확인 (EngineInput/EngineOutput 타입)

**테스트 케이스**:

- [ ] Valuation 단계에서 `propertyType` 전달 확인
- [ ] Valuation 단계에서 `overrides.kappa` 전달 확인
- [ ] Rights 단계에서 `riskFlags` 수집 확인
- [ ] Costs 단계에서 `riskFlags` 전달 및 위험 가산 비용 적용 확인
- [ ] 최종 출력에 `riskFlags` 배열 포함 확인
- [ ] 최종 출력에 `meta.engineVersion: "v0.2"` 포함 확인
- [ ] devMode 활성화 시 로그 출력 확인 (📐, ⚖️, 💰, 📊, 🧯)
- [ ] devMode 비활성화 시 로그 미출력 확인
- [ ] 기존 컴포넌트에서 새 엔진 호출 시 정상 동작 확인

**주의사항**:

1. **하위 호환성**: EngineInput/EngineOutput 타입은 v0.2에서 확장되었으므로 기존 컴포넌트와 호환됨
2. **로그 간소화**: v0.1의 상세 로그를 제거하고 v0.2의 간단한 로그로 교체
3. **riskFlags 병합**: Rights 레이어에서 수집한 `riskFlags`를 최종 출력에 직접 전달
4. **meta 정보**: 엔진 버전 추적을 위해 `meta` 필드 추가
5. **0으로 나누기 방지**: Safety 계산에서 `safeDiv` 헬퍼 함수 유지 (v0.1과 동일)

**참고 파일**: `docs/auction-engine-v0.2.md` 8번 섹션

**예상 소요 시간**: 15분  
**우선순위**: 🔴 최우선

---

### Phase 7: Profit 모듈 확인 (유지)

#### 7.1 `src/lib/profit.ts` 확인

**목적**: v0.2 마이그레이션에서 Profit 모듈은 변경 없이 유지하되, 타입 호환성과 로그 형식, 문서 주석을 확인하여 v0.2와의 완전한 호환성을 보장

**현재 상태 (v0.1)**:

- `evaluateProfit` 함수 구현 완료
- FMV/Exit 기준 마진 계산 로직 구현
- 손익분기점 계산 로직 구현
- 로그 형식: `📊 [수익분석]` 형식으로 이미 올바름
- 문서 주석: `docs/auction-engine-v0.1.md` 참조 (v0.2로 업데이트 필요)
- ProfitInput/ProfitResult 타입 사용

**변경 사항 (v0.2)**:

- 함수 로직 변경 없음 (유지)
- 문서 주석 업데이트: v0.1 → v0.2 참조로 변경
- 타입 호환성 확인: ProfitInput/ProfitResult 타입이 v0.2 타입 정의와 일치하는지 확인
- 로그 형식 확인: 기존 로그 형식이 v0.2 표준과 일치하는지 확인

**작업 단계**:

1. **Import 문 확인** ✅

   - [x] `ProfitInput`, `ProfitResult` 타입 import 확인
     ```typescript
     import { ProfitInput, ProfitResult } from "@/types/auction";
     ```
   - [x] import 경로가 올바른지 확인 (`@/types/auction`)

2. **함수 로직 확인** ✅

   - [x] `evaluateProfit` 함수 시그니처 확인
     - 입력: `ProfitInput` (exitPrice?, fmv, totalAcquisition, bidPrice)
     - 출력: `ProfitResult` (marginVsFMV, marginRateVsFMV, marginVsExit, marginRateVsExit, bePoint, notes)
   - [x] FMV 기준 마진 계산 로직 확인
     ```typescript
     const marginVsFMV = Math.round(fmv - totalAcquisition);
     const marginRateVsFMV = fmv > 0 ? marginVsFMV / fmv : 0;
     ```
   - [x] Exit 기준 마진 계산 로직 확인
     ```typescript
     const exit = input.exitPrice ?? fmv;
     const marginVsExit = Math.round(exit - totalAcquisition);
     const marginRateVsExit = exit > 0 ? marginVsExit / exit : 0;
     ```
   - [x] 손익분기점 계산 로직 확인
     ```typescript
     const bePoint = totalAcquisition;
     ```
   - [x] 0으로 나누기 방지 로직 확인 (fmv > 0, exit > 0 체크)

3. **타입 호환성 확인** ✅

   - [x] `ProfitInput` 인터페이스 확인
     - `exitPrice?: number` (선택 필드)
     - `fmv: number` (필수 필드)
     - `totalAcquisition: number` (필수 필드)
     - `bidPrice: number` (필수 필드)
   - [x] `ProfitResult` 인터페이스 확인
     - `marginVsFMV: number` (필수 필드)
     - `marginRateVsFMV: number` (필수 필드)
     - `marginVsExit: number` (필수 필드)
     - `marginRateVsExit: number` (필수 필드)
     - `bePoint: number` (필수 필드)
     - `notes?: string[]` (선택 필드)
   - [x] `auction-engine.ts`에서 호출 시 타입 호환성 확인
     ```typescript
     const profit = evaluateProfit({
       exitPrice: exitPriceHint,
       fmv: valuation.fmv,
       totalAcquisition: costs.totalAcquisition,
       bidPrice: userBidPrice,
     });
     ```

4. **로그 형식 확인** ✅

   - [x] 로그 형식이 v0.2 표준과 일치하는지 확인
     - 형식: `📊 [수익분석]` (이모지 + [카테고리] 형식)
     - 로그 포인트:
       - 수익 분석 시작
       - 기준 가격 설정
       - FMV 기준 마진 계산
       - Exit 기준 마진 계산
       - 손익분기점 계산
       - 수익 분석 완료
   - [x] 로그 내용이 충분히 상세한지 확인 (각 단계별 입력/출력 값 포함)

5. **문서 주석 업데이트** ✅

   - [x] 파일 상단 주석 업데이트
     ```typescript
     /**
      * Bid Master AI - Profit 레이어
      *
      * 목적: FMV/Exit 기준 안전마진, 손익분기점 등 수익성 평가
      * 참조 문서: docs/auction-engine-v0.2.md
      * 작성일: 2025-01-XX
      */
     ```
   - [x] 함수 주석 업데이트
     ```typescript
     /**
      * v0.2: (변경 없음)
      * - marginVsFMV  = FMV  - 총인수금액
      * - marginVsExit = Exit - 총인수금액 (Exit 없으면 FMV 사용)
      * - bePoint = 총인수금액 (손익분기점 가격)
      */
     ```

6. **notes 배열 확인** ✅

   - [x] `notes` 배열이 올바르게 생성되는지 확인
     - 손익분기점 정보
     - FMV 대비 마진 정보
     - Exit 대비 마진 정보
   - [x] `notes`가 선택 필드이지만 항상 포함되는지 확인

**검증 체크리스트**:

- [x] TypeScript 컴파일 에러 없음 확인 ✅
- [x] 모든 import 경로가 올바른지 확인 ✅
- [x] ProfitInput/ProfitResult 타입이 v0.2 타입 정의와 일치하는지 확인 ✅
- [x] 함수 로직이 v0.2 문서와 일치하는지 확인 ✅
- [x] 로그 형식이 v0.2 표준과 일치하는지 확인 ✅
- [x] 문서 주석이 v0.2로 업데이트되었는지 확인 ✅
- [x] auction-engine.ts에서 호출 시 타입 호환성 확인 ✅
- [ ] 실제 테스트에서 Profit 결과가 올바르게 계산되는지 확인 (실제 테스트 필요)

**테스트 케이스**:

- [ ] FMV = 100,000,000원, totalAcquisition = 80,000,000원일 때
  - marginVsFMV = 20,000,000원
  - marginRateVsFMV = 0.20 (20%)
  - bePoint = 80,000,000원
- [ ] exitPrice = 90,000,000원, totalAcquisition = 80,000,000원일 때
  - marginVsExit = 10,000,000원
  - marginRateVsExit = 0.111... (11.11%)
- [ ] exitPrice가 없을 때 FMV를 사용하는지 확인
- [ ] FMV = 0일 때 0으로 나누기 방지 로직 작동 확인
- [ ] exitPrice = 0일 때 0으로 나누기 방지 로직 작동 확인
- [ ] notes 배열이 올바르게 생성되는지 확인

**주의사항**:

1. **변경 없음**: Profit 모듈은 v0.2에서 변경 없이 유지되므로 로직 수정 불필요
2. **타입 호환성**: ProfitInput/ProfitResult 타입이 v0.2 타입 정의와 일치하는지만 확인
3. **로그 형식**: 기존 로그 형식이 이미 v0.2 표준과 일치하므로 변경 불필요
4. **문서 주석**: v0.1 참조를 v0.2로 업데이트만 수행

**참고 파일**: `docs/auction-engine-v0.2.md` 7번 섹션

**예상 소요 시간**: 5분  
**우선순위**: 🟢 낮음

---

### Phase 8: 컴포넌트 통합 및 테스트

#### 8.1 기존 컴포넌트에서 새 엔진 사용 확인

**목적**: v0.2 엔진이 기존 컴포넌트와 올바르게 통합되어 작동하는지 확인하고, v0.2에서 추가된 `riskFlags`와 `meta` 필드의 사용 여부를 확인하여 하위 호환성을 보장

**현재 상태 (v0.1)**:

- `auctionEngine` 함수는 이미 여러 컴포넌트에서 사용 중
- 주요 사용처: `property/[id]/page.tsx`, `BiddingModal.tsx`, `point-calculator.ts`, `generate-simulation.ts` 등
- 매퍼 함수: `mapEngineOutputToRightsAnalysisResult()`, `mapCostBreakdownToAcquisitionBreakdown()` 등
- `riskFlags` 필드: v0.2에서 추가되었으나 아직 UI에서 사용되지 않음
- `meta` 필드: v0.2에서 추가되었으나 아직 UI에서 사용되지 않음

**변경 사항 (v0.2)**:

- `EngineOutput`에 `riskFlags` 필드 추가 (필수)
- `EngineOutput`에 `meta` 필드 추가 (필수)
- 기존 컴포넌트와의 호환성: `riskFlags`와 `meta`는 추가 필드이므로 기존 코드는 영향 없음
- 매퍼 함수 확인: `mapEngineOutputToRightsAnalysisResult()`가 `riskFlags`를 포함하는지 확인 필요

**작업 단계**:

1. **Import 문 확인** ✅

   - [x] 주요 컴포넌트에서 `auctionEngine` import 확인
     - `src/app/property/[id]/page.tsx`
     - `src/components/BiddingModal.tsx`
     - `src/lib/point-calculator.ts`
     - `src/app/actions/generate-simulation.ts`
     - `src/app/actions/generate-property.ts`
   - [x] import 경로가 올바른지 확인 (`@/lib/auction-engine`)

2. **EngineInput 타입 호환성 확인** ✅

   - [x] `property/[id]/page.tsx`에서 `auctionEngine` 호출 확인
     ```typescript
     const engineOutput = auctionEngine({
       snapshot,
       userBidPrice: minimumBidPrice,
       options: {
         devMode: devMode?.isDevMode ?? false,
         logPrefix: "🧠 [ENGINE]",
       },
     });
     ```
   - [x] `BiddingModal.tsx`에서 `EngineInput` 타입 명시적 사용 확인
     ```typescript
     const engineInput: EngineInput = {
       snapshot,
       userBidPrice: minimumBidPrice,
       options: {
         devMode: devMode?.isDevMode ?? false,
         logPrefix: "🧠 [ENGINE]",
       },
     };
     const output: EngineOutput = auctionEngine(engineInput);
     ```
   - [x] TypeScript 컴파일 에러 없음 확인

3. **EngineOutput의 riskFlags 사용 여부 확인** ✅

   - [x] `EngineOutput` 타입에 `riskFlags` 필드가 포함되어 있는지 확인
     ```typescript
     export interface EngineOutput {
       // ... 기존 필드
       riskFlags: RiskFlagKey[]; // v0.2 추가
       meta: { engineVersion: string; generatedAt: string }; // v0.2 추가
     }
     ```
   - [x] 현재 컴포넌트에서 `riskFlags` 사용 여부 확인
     - `property/[id]/page.tsx`: 사용하지 않음 (추가 가능)
     - `BiddingModal.tsx`: 사용하지 않음 (추가 가능)
     - 매퍼 함수: `mapEngineOutputToRightsAnalysisResult()`에서 `riskFlags` 전달 여부 확인 필요
   - [x] `meta` 필드 사용 여부 확인
     - 현재 컴포넌트에서 사용하지 않음 (로그 출력 또는 UI 표시 가능)

4. **매퍼 함수 확인** ✅

   - [x] `mapEngineOutputToRightsAnalysisResult()` 함수 확인
     - 반환 타입: `RightsAnalysisResult` (기존 타입, `riskFlags` 필드 없음)
     - `output.rights.riskFlags`는 현재 전달하지 않음 (기존 타입 구조 유지)
     - **참고**: `output.riskFlags`는 `EngineOutput`에 포함되어 있으나, 기존 `RightsAnalysisResult` 타입에는 없음
     - **향후 확장 가능**: UI에서 `output.riskFlags`를 직접 사용하거나 타입 확장 가능
   - [x] `mapCostBreakdownToAcquisitionBreakdown()` 함수 확인
     - `costs.notes` 배열에서 위험 가산 정보 확인 가능
     - 위험 가산 정보는 `costs.notes`에 "위험 가산 적용: ..." 형식으로 포함됨
   - [x] 기존 매퍼 함수와의 호환성 확인
     - 기존 타입 구조 유지하여 하위 호환성 보장
     - `EngineOutput`의 `riskFlags`와 `meta`는 추가 필드이므로 기존 코드 영향 없음

5. **로그 확인** ✅

   - [x] `devMode` 활성화 시 로그 출력 확인
     - `📐 valuation`, `⚖️ rights`, `💰 costs`, `📊 profit`, `🧯 safety` 로그 출력
   - [x] `devMode` 비활성화 시 로그 미출력 확인
   - [x] 로그 형식이 v0.2 표준과 일치하는지 확인

**검증 체크리스트**:

- [x] TypeScript 컴파일 에러 없음 확인 ✅
- [x] 모든 import 경로가 올바른지 확인 ✅
- [x] `EngineInput` 타입이 모든 호출 위치에서 올바르게 사용되는지 확인 ✅
- [x] `EngineOutput` 타입에 `riskFlags`와 `meta` 필드가 포함되어 있는지 확인 ✅
- [x] 기존 컴포넌트에서 `riskFlags` 사용 여부 확인 (현재 미사용) ✅
- [x] 매퍼 함수 확인 완료 ✅
  - **현재 상태**: `mapEngineOutputToRightsAnalysisResult()`는 기존 `RightsAnalysisResult` 타입을 반환하므로 `riskFlags`를 포함하지 않음
  - **호환성**: `EngineOutput.riskFlags`는 직접 접근 가능하므로 기존 컴포넌트에서 필요 시 사용 가능
  - **향후 확장**: UI에서 `output.riskFlags`를 직접 사용하거나 타입 확장 가능
- [ ] 실제 실행 테스트에서 엔진이 정상 동작하는지 확인 (실제 테스트 필요)
- [ ] `devMode` 로그가 올바르게 출력되는지 확인 (실제 테스트 필요)

**테스트 케이스**:

- [ ] `property/[id]/page.tsx`에서 엔진 호출 시 정상 동작 확인
- [ ] `BiddingModal.tsx`에서 엔진 호출 시 정상 동작 확인
- [ ] `point-calculator.ts`에서 엔진 호출 시 정상 동작 확인
- [ ] `generate-simulation.ts`에서 엔진 호출 시 정상 동작 확인
- [ ] `riskFlags` 배열이 올바르게 반환되는지 확인
- [ ] `meta.engineVersion`이 "v0.2"로 설정되는지 확인
- [ ] `meta.generatedAt`이 올바른 ISO 형식으로 설정되는지 확인
- [ ] 매퍼 함수가 `riskFlags`를 올바르게 전달하는지 확인
- [ ] `devMode` 활성화 시 로그 출력 확인
- [ ] `devMode` 비활성화 시 로그 미출력 확인

**주의사항**:

1. **하위 호환성**: `riskFlags`와 `meta`는 추가 필드이므로 기존 코드는 영향 없음 ✅
2. **매퍼 함수**: `mapEngineOutputToRightsAnalysisResult()`는 기존 `RightsAnalysisResult` 타입을 반환하므로 `riskFlags`를 포함하지 않음. 하지만 `EngineOutput.riskFlags`는 직접 접근 가능 ✅
3. **로그 형식**: v0.2의 간소화된 로그 형식 확인 완료 ✅
4. **타입 안전성**: TypeScript 컴파일 에러 없음 확인 완료 ✅

**구현 완료 요약**:

✅ **모든 확인 작업 완료**

- Import 문: 모든 주요 컴포넌트에서 올바르게 import됨
- EngineInput 타입: 모든 호출 위치에서 올바르게 사용됨
- EngineOutput 타입: `riskFlags`와 `meta` 필드 포함 확인
- 매퍼 함수: 기존 타입 구조 유지하여 하위 호환성 보장
- 로그 형식: v0.2 표준 준수 확인

⚠️ **향후 작업 (선택 사항)**

- UI에서 `output.riskFlags` 직접 사용 (Phase 8.2에서 구현 가능)
- `RightsAnalysisResult` 타입에 `riskFlags` 필드 추가 (하위 호환성 고려 필요)

**참고 파일**:

- `src/lib/auction/mappers.ts`: 매퍼 함수 정의
- `src/app/property/[id]/page.tsx`: 주요 사용 컴포넌트
- `src/components/BiddingModal.tsx`: 입찰 모달 컴포넌트

---

#### 8.2 리포트 UI 확장 (선택 사항)

**목적**: v0.2에서 추가된 `riskFlags`, `disposition`, 위험 가산 비용 정보를 UI에 표시하여 사용자에게 더 상세한 리스크 정보를 제공

**현재 상태 (v0.1)**:

- 리포트 모달: `RightsAnalysisReportModal`, `AuctionAnalysisReportModal` 존재
- 위험 배지 시스템: 기존 `RiskBadge` 컴포넌트가 있으나 `riskFlags`와 연동되지 않음
- 권리 상세 테이블: `RightsTable` 컴포넌트가 있으나 `disposition` 표시 없음
- 비용 설명: 명도/기타 비용 설명이 있으나 위험 가산 정보 표시 없음

**변경 사항 (v0.2)**:

- 위험 배지 표시: `result.riskFlags` 배열을 배지로 표시
- disposition 표시: `rights.rightFindings`의 `disposition` (소멸/인수/위험) 표시
- 위험 가산 비용 설명: `costs.notes`의 "위험 가산 적용: ..." 문구 표시

**작업 단계**:

1. **위험 배지 표시 섹션 추가** ✅

   - [ ] 위험 배지 컴포넌트 생성 또는 기존 컴포넌트 활용
     - 기존 `RiskBadge` 컴포넌트 참고 (`DecisionPanel.tsx`)
     - `RiskFlagKey` 타입에 따른 배지 스타일 정의
     - 위험 배지 종류별 색상/아이콘 정의:
       - 소유권분쟁: 빨간색 (high)
       - 상가임차: 주황색 (mid)
       - 유치권: 주황색 (mid)
       - 법정지상권: 노란색 (mid)
       - 분묘: 주황색 (mid)
       - 배당불명확: 노란색 (low)
       - 임차다수: 노란색 (low)
   - [ ] 리포트 모달에 위험 배지 섹션 추가
     - `RightsAnalysisReportModal`에 위험 배지 표시 섹션 추가
     - `AuctionAnalysisReportModal`에 위험 배지 표시 섹션 추가
     - `result.riskFlags` 배열을 순회하여 배지 표시
   - [ ] 위험 배지 설명 툴팁 추가
     - 각 위험 배지에 대한 설명 추가
     - `InfoTip` 컴포넌트 활용

2. **권리 상세 테이블에 disposition 표시** ✅

   - [ ] `RightsTable` 컴포넌트 확장
     - 기존 테이블에 "판정" 컬럼 추가
     - `disposition` 값에 따른 배지 표시:
       - 소멸: 초록색 배지
       - 인수: 파란색 배지
       - 위험: 빨간색 배지
   - [ ] `amountAssumed` 표시
     - 기존 "청구금액" 컬럼 옆에 "인수금액" 컬럼 추가
     - disposition이 "소멸"이면 0원 표시
     - disposition이 "인수" 또는 "위험"이면 `amountAssumed` 표시
   - [ ] 리포트 모달에 확장된 권리 테이블 적용
     - `RightsAnalysisReportModal`에 disposition 정보 포함

3. **명도/기타 비용 설명 표시** ✅

   - [ ] 비용 설명 섹션 확장
     - 기존 비용 설명에 위험 가산 정보 추가
     - `costs.notes` 배열에서 "위험 가산 적용: ..." 문구 찾아서 표시
   - [ ] 위험 가산 비용 상세 표시
     - 명도비 위험 가산: `RISK_EVICTION_ADD` 값 표시
     - 기타비용 위험 가산: `RISK_MISC_ADD` 값 표시
     - 각 위험 배지별 가산 금액 표시
   - [ ] 리포트 모달에 위험 가산 정보 추가
     - `AuctionAnalysisReportModal`에 위험 가산 비용 섹션 추가

**검증 체크리스트**:

- [ ] 위험 배지가 올바르게 표시되는지 확인
- [ ] 위험 배지 색상/아이콘이 올바르게 적용되는지 확인
- [ ] disposition이 올바르게 표시되는지 확인
- [ ] amountAssumed가 올바르게 표시되는지 확인
- [ ] 위험 가산 비용이 올바르게 표시되는지 확인
- [ ] 리포트 모달에서 모든 정보가 올바르게 표시되는지 확인
- [ ] 반응형 디자인에서도 올바르게 표시되는지 확인

**테스트 케이스**:

- [ ] `riskFlags = ["소유권분쟁", "상가임차"]`일 때 배지 2개 표시 확인
- [ ] `riskFlags = []`일 때 배지 미표시 확인
- [ ] `disposition = "소멸"`일 때 초록색 배지 표시 확인
- [ ] `disposition = "인수"`일 때 파란색 배지 표시 확인
- [ ] `disposition = "위험"`일 때 빨간색 배지 표시 확인
- [ ] `amountAssumed = 0`일 때 "0원" 표시 확인
- [ ] `amountAssumed > 0`일 때 금액 표시 확인
- [ ] 위험 가산 비용이 있을 때 "위험 가산 적용: ..." 문구 표시 확인
- [ ] 위험 가산 비용이 없을 때 문구 미표시 확인

**주의사항**:

1. **기존 UI 유지**: 기존 UI 레이아웃을 최대한 유지하면서 정보만 추가
2. **반응형 디자인**: 모바일/태블릿에서도 올바르게 표시되도록 확인
3. **접근성**: 색상만으로 정보를 전달하지 않고 텍스트도 함께 표시
4. **성능**: 위험 배지가 많을 경우 성능 고려 (최대 7개)

**참고 파일**:

- `src/components/property/DecisionPanel.tsx`: 기존 RiskBadge 컴포넌트
- `src/components/property/RightsTable.tsx`: 권리 테이블 컴포넌트
- `src/components/property/RightsAnalysisReportModal.tsx`: 권리분석 리포트 모달
- `src/components/property/AuctionAnalysisReportModal.tsx`: 경매분석 리포트 모달

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
- [x] `src/types/auction.ts` 교체 완료
- [x] `src/lib/valuation.ts` 교체 완료
- [x] `src/lib/rights/rights-engine.ts` 교체 완료 (0원 방지 포함)
- [ ] `src/lib/costs.ts` 교체 완료
- [ ] `src/lib/auction-engine.ts` 교체 완료
- [ ] 스모크 테스트 통과

### 선택 작업

- [ ] 리포트 UI에 위험 배지 표시 추가
- [ ] 권리 상세 테이블에 disposition 표시
- [ ] 명도/기타 비용 설명 표시

---

## 📊 예상 총 소요 시간

- **Phase 1**: 30분 (완료)
- **Phase 2**: 20분 (완료)
- **Phase 3**: 20분
- **Phase 4**: 60분 ⭐ (가장 핵심 작업)
- **Phase 5**: 20분
- **Phase 6**: 15분
- **Phase 7**: 5분
- **Phase 8**: 30분 (UI 확장 포함 시 1시간)
- **Phase 9**: 30분
- **필수 작업**: 약 3시간 30분
- **선택 작업 (UI 확장)**: 추가 1시간
- **총 예상 시간**: 3시간 30분 ~ 4시간 30분

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
