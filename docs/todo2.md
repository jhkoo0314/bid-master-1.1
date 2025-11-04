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
