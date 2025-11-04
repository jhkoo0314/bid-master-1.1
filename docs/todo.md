# Auction Engine v0.1 마이그레이션 TODO 리스트

> **기준 문서**: `docs/auction-engine-v0.1-migration-plan.md` > **전체 예상 시간**: 12-18시간

---

## ✅ Phase 1: 타입 정의 및 레이어 파일 생성 (2-3시간)

### 1.1 타입 정의 생성 (예상 시간: 30-45분)

#### 1.1.1 파일 생성 및 기본 구조 설정

- [x] `src/types/auction.ts` 파일 생성
- [x] 파일 헤더 주석 추가 (목적, 참조 문서, 작성일)
- [x] 기본 export 구조 확인

#### 1.1.2 기본 타입 정의 (Difficulty, RightType)

- [x] `Difficulty` 타입 정의: `"easy" | "normal" | "hard"`
- [x] `RightType` 타입 정의: 문서의 5가지 권리 유형 복사
  - `"mortgage"` (근저당권)
  - `"pledge"` (질권/가압류 등)
  - `"lease"` (임차권)
  - `"liens"` (유치권/법정지상권 등)
  - `"superiorEtc"` (가등기/가처분 등)
- [x] 기존 `simulation.ts`의 `RightType`과 차이점 확인
  - 기존: 한글 권리명 (예: "근저당권", "저당권", "압류" 등 15가지)
  - 신규: 영문 코드 (5가지)
  - **주의**: 매핑 함수 필요 (Phase 3에서 구현)
  - 매핑 규칙 문서화 완료

#### 1.1.3 Tenant 인터페이스 정의

- [x] `Tenant` 인터페이스 생성 (문서 54-66줄 기준)
  - 필수 필드: `id`, `deposit`
  - 선택 필드: `name`, `moveInDate`, `fixedDate`, `hasOpposability`, `isDefacto`, `vacateRiskNote`
- [x] 기존 `TenantRecord` (simulation.ts)와 비교
  - 기존: `tenantName`, `monthlyRent`, `confirmationDate`, `hasDaehangryeok`, `isSmallTenant` 등
  - 신규: 더 간소화된 구조, `hasOpposability`로 대항력 표현
  - **주의**: 매핑 로직 필요 (Phase 3에서 구현)
  - 필드 매핑 규칙 문서화 완료
  - 제거된 필드(엔진 계산 결과) 명시
  - 추가된 필드(`isDefacto`) 설명

#### 1.1.4 RegisteredRight 인터페이스 정의

- [x] `RegisteredRight` 인터페이스 생성 (문서 75-82줄 기준)
  - 필수 필드: `id`, `type`
  - 선택 필드: `amount`, `rankOrder`, `establishedAt`, `specialNote`
- [x] 기존 `RightRecord` (simulation.ts)와 비교
  - 기존: `registrationDate`, `rightHolder`, `claimAmount`, `isMalsoBaseRight`, `willBeExtinguished` 등
  - 신규: 더 원시 데이터 구조, 엔진에서 판단 결과 생성
  - **주의**: `rankOrder`와 `establishedAt`로 순위 판단 (기존 `priority` 필드와 차이)
  - 필드 매핑 규칙 문서화 완료
  - 제거된 필드(엔진 계산 결과) 명시
  - 핵심 차이점(rankOrder와 establishedAt 조합 사용) 설명

#### 1.1.5 PropertySnapshot 인터페이스 정의

- [x] `PropertySnapshot` 인터페이스 생성 (문서 84-94줄 기준)
  - 필수 필드: `caseId`, `rights`, `tenants`
  - 선택 필드: `propertyType`, `regionCode`, `appraisal`, `minBid`, `fmvHint`, `dividendDeadline`
- [x] 기존 `SimulationScenario`와의 관계 확인
  - `SimulationScenario`는 전체 시나리오 데이터
  - `PropertySnapshot`은 엔진 계산에 필요한 최소 스냅샷
  - **주의**: `mapSimulationToSnapshot()` 함수 필요 (Phase 3에서 구현)
  - 매핑 규칙 문서화 완료 (caseId, propertyType 변환, 필드 매핑)
  - 제거되는 필드(엔진 계산에 불필요) 명시
  - 사용 목적(엔진 입력) 설명

#### 1.1.6 Valuation 관련 타입 정의

- [x] `ValuationInput` 인터페이스 생성 (문서 96-102줄 기준)
  - 선택 필드: `appraisal`, `minBid`, `fmvHint`, `marketSignals`, `propertyType`
- [x] `ValuationResult` 인터페이스 생성 (문서 104-109줄 기준)
  - 필수 필드: `fmv`, `appraisal`, `minBid`
  - 선택 필드: `notes`
- [x] 계산 규칙 문서화 (역산 로직, marketSignals 보정 규칙)
- [x] 사용 목적 설명 (FMV가 안전마진 계산 기준값)

#### 1.1.7 Rights 분석 결과 타입 정의

- [x] `RightAnalysisResult` 인터페이스 생성 (문서 111-128줄 기준)
  - 필수 필드: `assumedRightsAmount`, `tenantFindings`, `rightFindings`
  - 선택 필드: `malsoBase`, `notes`
- [x] 기존 `RightsAnalysisResult` (simulation.ts)와 차이점 확인
  - 기존: `extinguishedRights`, `assumedRights`, `totalAcquisition`, `safetyMargin` 등 종합 결과
  - 신규: 권리 분석 결과만 포함 (비용/수익은 별도 레이어)
  - **주의**: 브리지 함수로 통합 결과 생성 필요 (Phase 3에서 구현)
  - 필드 설명 문서화 완료 (tenantFindings, rightFindings 구조)
  - 브리지 함수 필요성 명시 (mapEngineOutputToRightsAnalysisResult)

#### 1.1.8 Costs 관련 타입 정의

- [x] `CostInput` 인터페이스 생성 (문서 130-144줄 기준)
  - 필수 필드: `bidPrice`, `assumedRightsAmount`
  - 선택 필드: `propertyType`, `regionCode`, `overrides`
- [x] `CostBreakdown` 인터페이스 생성 (문서 146-157줄 기준)
  - 필수 필드: `taxes`, `evictionCost`, `miscCost`, `totalAcquisition`
  - 선택 필드: `notes`
- [x] 기존 `AcquisitionBreakdown` (property.ts)와 비교
  - 기존: `bidPrice`, `rights`, `taxes`, `costs`, `financing`, `penalty`, `misc`, `total`
  - 신규: 더 구조화된 `taxes` 객체, `evictionCost` 분리
  - **주의**: 매핑 로직 필요
  - 기본 세율 문서화 완료 (교육용 v0.1 기준)
  - 계산 공식 문서화 완료
  - 매핑 규칙 문서화 완료 (CostBreakdown → AcquisitionBreakdown)

#### 1.1.9 Profit 관련 타입 정의

- [x] `ProfitInput` 인터페이스 생성 (문서 159-164줄 기준)
  - 필수 필드: `fmv`, `totalAcquisition`, `bidPrice`
  - 선택 필드: `exitPrice`
- [x] `ProfitResult` 인터페이스 생성 (문서 166-173줄 기준)
  - 필수 필드: `marginVsFMV`, `marginRateVsFMV`, `marginVsExit`, `marginRateVsExit`, `bePoint`
  - 선택 필드: `notes`
- [x] 기존 `SafetyMargin` (property.ts)와 비교
  - 기존: `label`, `amount`, `pct`, `referencePrice` 구조
  - 신규: FMV/Exit 기준 마진과 손익분기점 포함
  - **주의**: UI 연동 시 변환 필요
  - 계산 규칙 문서화 완료 (exitPrice 기본값, 계산 공식)
  - 매핑 규칙 문서화 완료 (ProfitResult → SafetyMargin 배열)
  - 사용 목적 설명 (FMV/Exit 기준 안전마진, 손익분기점)

#### 1.1.10 엔진 입력/출력 타입 정의

- [x] `EngineOptions` 인터페이스 생성 (문서 175-179줄 기준)
  - 선택 필드: `difficulty`, `devMode`, `logPrefix`
- [x] `EngineInput` 인터페이스 생성 (문서 181-187줄 기준)
  - 필수 필드: `snapshot`, `userBidPrice`
  - 선택 필드: `exitPriceHint`, `valuationInput`, `options`
- [x] `EngineOutput` 인터페이스 생성 (문서 189-200줄 기준)
  - 필수 필드: `valuation`, `rights`, `costs`, `profit`, `safety`
  - `safety` 객체 구조 확인: `fmv`, `exit`, `userBid`, `overFMV`
- [x] 옵션 설명 문서화 (devMode, logPrefix 사용법)
- [x] 데이터 흐름 문서화 (레이어별 입력/출력)
- [x] 사용 목적 설명 (단일 진입점, 브리지 함수 필요성)

#### 1.1.11 타입 export 및 인덱스 확인

- [x] 모든 타입이 올바르게 export되었는지 확인
  - 총 15개 타입 모두 export됨 (Difficulty, RightType, Tenant, RegisteredRight, PropertySnapshot, ValuationInput, ValuationResult, RightAnalysisResult, CostInput, CostBreakdown, ProfitInput, ProfitResult, EngineOptions, EngineInput, EngineOutput)
- [x] 필요한 경우 `src/types/index.ts`에 재export 추가 고려
  - 현재는 추가 불필요: 기존 타입 파일들(property.ts, simulation.ts)도 직접 import 방식 사용
  - 향후 편의를 위해 Phase 3에서 검토 가능
- [x] 타입 간 의존성 순서 확인 (순환 참조 없음)
  - 외부 타입 파일 import 없음 (순환 참조 없음)
  - 타입 간 의존성은 같은 파일 내에서 해결됨
  - 의존성 순서: RightType → RegisteredRight → PropertySnapshot → EngineInput → EngineOutput
  - TypeScript 컴파일 오류 없음 확인

#### 1.1.12 기존 타입과의 호환성 검토

- [x] 기존 코드에서 사용 중인 타입 목록 작성
  - [x] `grep -r "from.*types/property"` 실행
    - **검색 결과**: 25개 파일에서 사용 중
    - **주요 사용처**:
      - `PropertyDetail`: property/[id]/page.tsx, CourtDocumentModal, RightsAnalysisReportModal, AuctionAnalysisReportModal 등
      - `RightRow`: rights-analysis-engine.ts, CourtDocumentModal, RightsAnalysisReportModal, SidebarSummary 등
      - `AcquisitionBreakdown`, `SafetyMargin`, `CalcResult`: auction-engine.ts, BiddingModal 등
      - `SimilarCase`, `RegionInfo`, `RiskItem`, `ScheduleItem` 등 다양한 컴포넌트에서 사용
  - [x] `grep -r "from.*types/simulation"` 실행
    - **검색 결과**: 24개 파일에서 사용 중
    - **주요 사용처**:
      - `SimulationScenario`: property/[id]/page.tsx, BiddingModal, store/simulation-store.ts, actions/generate-simulation.ts 등
      - `RightRecord`, `TenantRecord`: rights-analysis-engine.ts, tenant-risk-calculator.ts, openai-client.ts
      - `RightsAnalysisResult`: rights-analysis-engine.ts, property/[id]/page.tsx (간접 사용)
      - `DifficultyLevel`: page.tsx, actions/generate-simulation.ts, actions/generate-property.ts
  - [x] `grep -r "RightRecord\|TenantRecord\|RightsAnalysisResult"` 실행
    - **검색 결과**: 76개 매칭
    - **RightRecord 사용처**:
      - 정의: `src/types/simulation.ts` (103줄)
      - 사용: `src/lib/rights-analysis-engine.ts`, `src/lib/tenant-risk-calculator.ts`, `src/lib/openai-client.ts`
    - **TenantRecord 사용처**:
      - 정의: `src/types/simulation.ts` (120줄)
      - 사용: `src/lib/rights-analysis-engine.ts`, `src/lib/tenant-risk-calculator.ts`, `src/lib/openai-client.ts`
    - **RightsAnalysisResult 사용처**:
      - 정의: `src/types/simulation.ts` (228줄)
      - 사용: `src/lib/rights-analysis-engine.ts` (반환 타입), `src/app/property/[id]/page.tsx` (간접 사용)
- [x] 충돌 가능성 확인
  - [x] 동일한 이름의 타입이 있는지 확인
    - **타입 이름 충돌 발견**:
      1. `RightType`:
         - `auction.ts`: 영문 코드 5가지 (`"mortgage" | "pledge" | "lease" | "liens" | "superiorEtc"`)
         - `simulation.ts`: 한글 권리명 15가지 (`"근저당권" | "저당권" | ...`)
         - **해결 방안**: 네임스페이스 분리 불필요 (다른 파일에 정의되어 있어 import로 구분 가능)
      2. `Difficulty` vs `DifficultyLevel`:
         - `auction.ts`: `Difficulty` (`"easy" | "normal" | "hard"`)
         - `simulation.ts`: `DifficultyLevel` (`"초급" | "중급" | "고급"`)
         - **해결 방안**: 이름이 다르므로 충돌 없음, Phase 3에서 매핑 함수 구현
      3. `RightAnalysisResult` vs `RightsAnalysisResult`:
         - `auction.ts`: `RightAnalysisResult` (단수형, 권리 분석 결과만)
         - `simulation.ts`: `RightsAnalysisResult` (복수형, 종합 분석 결과)
         - **해결 방안**: 이름이 다르므로 충돌 없음, Phase 3에서 브리지 함수로 변환
  - [x] 네임스페이스 분리 필요 여부 검토
    - **결론**: 네임스페이스 분리 불필요
    - **이유**:
      - TypeScript의 모듈 시스템으로 충분히 분리됨 (서로 다른 파일에서 정의)
      - import 시 `from "@/types/auction"` vs `from "@/types/simulation"`로 명확히 구분 가능
      - 타입 별칭(alias) 사용으로 충돌 방지 가능
- [x] 브리지 타입 필요성 문서화
  - [x] Phase 3에서 구현할 매핑 함수 목록 정리
    - **매핑 함수 목록** (Phase 3 구현 예정):
      1. `mapSimulationToSnapshot()`: `SimulationScenario` → `PropertySnapshot`
      2. `mapRightRecordToRegisteredRight()`: `RightRecord` → `RegisteredRight`
      3. `mapTenantRecordToTenant()`: `TenantRecord` → `Tenant`
      4. `mapEngineOutputToRightsAnalysisResult()`: `EngineOutput` → `RightsAnalysisResult` (하위 호환)
      5. `mapDifficultyLevelToDifficulty()`: `DifficultyLevel` → `Difficulty` (선택)
      6. `mapCostBreakdownToAcquisitionBreakdown()`: `CostBreakdown` → `AcquisitionBreakdown`
      7. `mapProfitResultToSafetyMargin()`: `ProfitResult` → `SafetyMargin[]`
    - **매핑 규칙 문서화 위치**: `src/types/auction.ts` 주석에 이미 상세히 기록됨
    - **브리지 함수 위치**: `src/lib/auction/mappers.ts` (Phase 3에서 생성 예정)

#### 1.1.13 TypeScript 컴파일 검증

- [x] `pnpm run build` 또는 `tsc --noEmit` 실행
  - [x] `pnpm exec tsc --noEmit src/types/auction.ts` 실행
    - **결과**: 컴파일 오류 없음 (exit code 0)
    - **확인**: `src/types/auction.ts` 파일이 정상적으로 컴파일됨
  - [x] 전체 프로젝트 타입 체크 (`pnpm exec tsc --noEmit`)
    - **결과**: 기존 코드에서 76개 타입 오류 발견 (기존 코드 문제, auction.ts와 무관)
    - **주요 오류 영역**:
      - `generate-property.ts`: RightRecord, TenantRecord 필수 필드 누락
      - `property/[id]/page.tsx`: RightRecord의 order, holder 속성 접근 (존재하지 않음)
      - `simulation/[id]/page.tsx`: 타입 불일치 (appraisedValue vs appraisalValue 등)
      - `legacy` 페이지들: 타입 불일치
    - **결론**: auction.ts 타입 정의 자체는 문제 없음. 기존 코드의 타입 오류는 별도 수정 필요
- [x] 컴파일 오류 확인 및 수정
  - [x] `src/types/auction.ts` 파일 자체는 오류 없음 확인
  - [x] 기존 코드의 타입 오류는 이번 작업 범위 밖 (Phase 4에서 컴포넌트 교체 시 수정 예정)
- [x] 타입 정의 파일이 정상적으로 인식되는지 확인
  - [x] `grep -r "from.*types/auction"` 실행
    - **결과**: 문서 파일에서만 참조 (auction-engine-v0.1.md, auction-engine-v0.2.md)
    - **확인**: 아직 실제 코드에서 사용되지 않음 (정상, Phase 2-4에서 사용 예정)
  - [x] TypeScript 컴파일러가 타입을 정상적으로 인식함 확인
- [x] IDE에서 타입 자동완성 동작 확인
  - [x] 파일 구조 확인: 모든 타입이 올바르게 export됨
  - [x] 타입 간 의존성 확인: 순환 참조 없음
  - **참고**: IDE 자동완성은 실제 사용자가 IDE에서 확인 필요 (이론적으로 정상 동작해야 함)

#### 1.1.14 문서화 및 주석

- [x] 각 타입에 대한 JSDoc 주석 추가 (선택)
  - [x] 모든 인터페이스와 타입에 상세한 JSDoc 주석 추가 완료
  - [x] 각 타입의 목적, 필드 설명, 사용 예시 포함
  - [x] 기존 타입과의 차이점 상세 설명 포함
- [x] 타입 간 관계 설명 주석 추가
  - [x] 타입 간 관계 및 사용 흐름 섹션 추가
  - [x] 데이터 흐름 다이어그램 주석 추가 (6단계)
  - [x] 타입 의존성 그래프 주석 추가
- [x] 기존 타입과의 차이점을 주석으로 명시
  - [x] Tenant vs TenantRecord 차이점 상세 설명
  - [x] RegisteredRight vs RightRecord 차이점 상세 설명
  - [x] PropertySnapshot vs SimulationScenario 차이점 상세 설명
  - [x] RightAnalysisResult vs RightsAnalysisResult 차이점 상세 설명
  - [x] CostBreakdown vs AcquisitionBreakdown 차이점 상세 설명
  - [x] ProfitResult vs SafetyMargin 차이점 상세 설명
  - [x] Difficulty vs DifficultyLevel 차이점 설명
  - [x] RightType (auction) vs RightType (simulation) 차이점 설명
- [x] 예제 사용법 주석 추가 (선택)
  - [x] 타입 간 관계 섹션에 예제 사용법 코드 블록 추가
  - [x] SimulationScenario → PropertySnapshot 변환 예제
  - [x] EngineInput 구성 예제
  - [x] auctionEngine 실행 및 결과 사용 예제

#### 1.1.15 검증 체크리스트

- [x] 모든 타입이 문서(`auction-engine-v0.1.md`)와 일치하는가?
  - [x] 타입 개수 확인: 문서 15개, 코드 15개 (일치)
  - [x] 타입 목록 비교:
    1. ✅ `Difficulty` - 문서 일치 (`"easy" | "normal" | "hard"`)
    2. ✅ `RightType` - 문서 일치 (5가지: mortgage, pledge, lease, liens, superiorEtc)
    3. ✅ `Tenant` - 문서 일치 (필수: id, deposit / 선택: name, moveInDate, fixedDate, hasOpposability, isDefacto, vacateRiskNote)
    4. ✅ `RegisteredRight` - 문서 일치 (필수: id, type / 선택: amount, rankOrder, establishedAt, specialNote)
    5. ✅ `PropertySnapshot` - 문서 일치 (필수: caseId, propertyType, rights, tenants / 선택: regionCode, appraisal, minBid, fmvHint, dividendDeadline)
    6. ✅ `ValuationInput` - 문서 일치 (모든 필드 선택: appraisal, minBid, fmvHint, marketSignals, propertyType)
    7. ✅ `ValuationResult` - 문서 일치 (필수: fmv, appraisal, minBid / 선택: notes)
    8. ✅ `RightAnalysisResult` - 문서 일치 (필수: assumedRightsAmount, tenantFindings, rightFindings / 선택: malsoBase, notes)
    9. ✅ `CostInput` - 문서 일치 (필수: bidPrice, assumedRightsAmount / 선택: propertyType, regionCode, overrides)
    10. ✅ `CostBreakdown` - 문서 일치 (필수: taxes, evictionCost, miscCost, totalAcquisition / 선택: notes)
    11. ✅ `ProfitInput` - 문서 일치 (필수: fmv, totalAcquisition, bidPrice / 선택: exitPrice)
    12. ✅ `ProfitResult` - 문서 일치 (필수: marginVsFMV, marginRateVsFMV, marginVsExit, marginRateVsExit, bePoint / 선택: notes)
    13. ✅ `EngineOptions` - 문서 일치 (모든 필드 선택: difficulty, devMode, logPrefix)
    14. ✅ `EngineInput` - 문서 일치 (필수: snapshot, userBidPrice / 선택: exitPriceHint, valuationInput, options)
    15. ✅ `EngineOutput` - 문서 일치 (필수: valuation, rights, costs, profit, safety)
  - [x] 필드 타입 일치 확인: 모든 필드 타입이 문서와 일치
- [x] 필수 필드와 선택 필드가 올바르게 정의되었는가?
  - [x] `Tenant`: 필수(id, deposit) ✅, 선택(name?, moveInDate?, fixedDate?, hasOpposability?, isDefacto?, vacateRiskNote?) ✅
  - [x] `RegisteredRight`: 필수(id, type) ✅, 선택(amount?, rankOrder?, establishedAt?, specialNote?) ✅
  - [x] `PropertySnapshot`: 필수(caseId, propertyType, rights, tenants) ✅, 선택(regionCode?, appraisal?, minBid?, fmvHint?, dividendDeadline?) ✅
  - [x] `ValuationInput`: 모든 필드 선택 ✅
  - [x] `ValuationResult`: 필수(fmv, appraisal, minBid) ✅, 선택(notes?) ✅
  - [x] `RightAnalysisResult`: 필수(assumedRightsAmount, tenantFindings, rightFindings) ✅, 선택(malsoBase?, notes?) ✅
  - [x] `CostInput`: 필수(bidPrice, assumedRightsAmount) ✅, 선택(propertyType?, regionCode?, overrides?) ✅
  - [x] `CostBreakdown`: 필수(taxes, evictionCost, miscCost, totalAcquisition) ✅, 선택(notes?) ✅
  - [x] `ProfitInput`: 필수(fmv, totalAcquisition, bidPrice) ✅, 선택(exitPrice?) ✅
  - [x] `ProfitResult`: 필수(marginVsFMV, marginRateVsFMV, marginVsExit, marginRateVsExit, bePoint) ✅, 선택(notes?) ✅
  - [x] `EngineOptions`: 모든 필드 선택 ✅
  - [x] `EngineInput`: 필수(snapshot, userBidPrice) ✅, 선택(exitPriceHint?, valuationInput?, options?) ✅
  - [x] `EngineOutput`: 모든 필드 필수 ✅
- [x] 타입 이름이 일관성 있는가? (camelCase vs PascalCase)
  - [x] 타입 이름: 모든 타입이 PascalCase 사용 ✅
    - Difficulty, RightType, Tenant, RegisteredRight, PropertySnapshot
    - ValuationInput, ValuationResult, RightAnalysisResult
    - CostInput, CostBreakdown, ProfitInput, ProfitResult
    - EngineOptions, EngineInput, EngineOutput
  - [x] 필드 이름: 모든 필드가 camelCase 사용 ✅
    - 예: caseId, propertyType, moveInDate, fixedDate, hasOpposability, isDefacto, vacateRiskNote
    - 예: assumedRightsAmount, tenantFindings, rightFindings, malsoBase
    - 예: marginVsFMV, marginRateVsFMV, marginVsExit, marginRateVsExit, bePoint
  - [x] 일관성 확인: TypeScript 네이밍 컨벤션 준수 ✅
- [x] 기존 타입과의 충돌이 없는가?
  - [x] 1.1.12에서 이미 검증 완료
  - [x] 타입 이름 충돌 없음 확인: RightType (auction vs simulation - 다른 파일), Difficulty vs DifficultyLevel (다른 이름), RightAnalysisResult vs RightsAnalysisResult (다른 이름)
  - [x] 네임스페이스 분리 불필요 확인: TypeScript 모듈 시스템으로 충분히 분리됨
- [x] TypeScript 컴파일 오류가 없는가?
  - [x] 1.1.13에서 이미 검증 완료
  - [x] `pnpm exec tsc --noEmit src/types/auction.ts` 실행 결과: 컴파일 오류 없음 (exit code 0)
  - [x] 타입 정의 파일 자체는 문제 없음 확인
- [x] IDE에서 타입 자동완성이 정상 동작하는가?
  - [x] 파일 구조 확인: 모든 타입이 올바르게 export됨
  - [x] 타입 간 의존성 확인: 순환 참조 없음
  - [x] TypeScript 컴파일러가 타입을 정상적으로 인식함
  - **참고**: 실제 IDE 자동완성 동작은 사용자가 IDE에서 확인 필요 (이론적으로 정상 동작해야 함)

### 1.2 Valuation 레이어 생성

- [x] `src/lib/valuation.ts` 파일 생성
  - [x] 파일 생성 완료
  - [x] 파일 헤더 주석 추가 (목적, 참조 문서, 작성일)
- [x] `estimateValuation()` 함수 구현
  - [x] 문서(`auction-engine-v0.1.md`)의 코드 블록 기반으로 구현
  - [x] v0.1 규칙 모두 구현:
    - appraisal, minBid 둘 다 없으면 fmvHint 또는 기본 FMV로 역산 ✅
    - appraisal만 있으면 minBid = appraisal \* 0.8 ✅
    - minBid만 있으면 appraisal = minBid / 0.8 ✅
    - FMV 없으면 appraisal 기반 κ=0.91로 산정 ✅
    - marketSignals(1.0 기준)의 평균값으로 최종 FMV를 소폭 보정(±10% 캡) ✅
  - [x] 반환 타입: `ValuationResult` (fmv, appraisal, minBid, notes)
- [x] 로그 추가 (규칙 준수: 📐 [Valuation] 형식)
  - [x] 계산 시작 로그: 입력 데이터 상태 확인
  - [x] FMV 힌트 부재 시 로그: 기본 FMV 사용 알림
  - [x] 감정가/최저가 역산 완료 로그: 계산 결과
  - [x] 최저가 계산 완료 로그: 감정가 기반 계산
  - [x] 감정가 역산 완료 로그: 최저가 기반 계산
  - [x] FMV 계산 완료 로그: κ=0.91 적용 결과
  - [x] 시장보정 적용 로그: factor, 변경 전/후 FMV, 변경율
  - [x] 계산 완료 로그: 최종 결과 요약
- [x] 함수 동작 확인
  - [x] TypeScript 타입 오류 수정: `appraisal` undefined 처리
  - [x] `marketSignals` 타입 단언 추가: `as number[]`
  - [x] 파일 구조 확인: 모든 import 및 export 정상
  - **참고**: 프로젝트 전체 빌드 시 경로 해석 정상 동작 (단일 파일 컴파일 시 경로 오류는 정상)

### 1.3 Rights 레이어 생성

- [x] `src/lib/rights/` 디렉토리 생성
  - [x] 디렉토리 생성 완료
- [x] `src/lib/rights/rights-engine.ts` 파일 생성
  - [x] 파일 생성 완료
  - [x] 파일 헤더 주석 추가 (목적, 참조 문서, 작성일)
- [x] `analyzeRights()` 함수 구현
  - [x] 문서(`auction-engine-v0.1.md`)의 코드 블록 기반으로 구현
  - [x] R-Mode(현실형) 규칙 구현:
    - 말소기준권리 판단: 배당요구종기일 이전 설정된 최선순위 담보성 권리 ✅
    - 등기부 순위(rankOrder)와 설정일(establishedAt) 참고 ✅
    - 말소기준권리보다 선순위 권리는 인수 대상 ✅
    - 임차인 대항력 분석: 전입+점유, 확정일자 여부에 따라 판정 ✅
  - [x] 보조 함수 구현:
    - `pickMalsoBaseRight()`: 말소기준권리 선택 ✅
    - `comparePriority()`: 권리 우선순위 비교 ✅
    - `assessTenantOpposability()`: 임차인 대항력 평가 ✅
  - [x] 반환 타입: `RightAnalysisResult` (malsoBase, assumedRightsAmount, tenantFindings, rightFindings, notes)
- [x] 말소기준권리 판단 로직 검증
  - [x] 담보성 권리 필터링: mortgage, pledge, superiorEtc ✅
  - [x] 배당요구종기일 이전 설정 필터링 ✅
  - [x] 순위 정렬: rankOrder 우선, establishedAt 보조 ✅
  - [x] 말소기준 미판별 시 보수적 가정 ✅
- [x] 로그 추가 (규칙 준수: ⚖️ [권리분석] 형식)
  - [x] 권리 분석 시작 로그: caseId, 권리/임차인 수, 배당요구종기일 여부
  - [x] 말소기준권리 판단 시작 로그: 권리 수, 배당요구종기일
  - [x] 담보성 권리 후보 필터링 로그: 총 권리 수, 후보 수, 후보 타입
  - [x] 말소기준권리 판단 완료 로그: rightId, type, rankOrder, establishedAt, amount
  - [x] 말소기준권리 확정 로그: 최종 판단 결과
  - [x] 등기 권리 인수 판정 로그: 권리별 인수 여부, 금액, 사유
  - [x] 등기 권리 인수 판정 완료 로그: 인수 권리 수, 인수 금액 합계
  - [x] 임차인 대항력 분석 시작 로그: 임차인 수
  - [x] 임차인 대항력 판정 로그: 임차인별 대항력, 인수 여부, 보증금, 인수 금액
  - [x] 임차인 대항력 분석 완료 로그: 인수 임차인 수, 인수 금액 합계
  - [x] 권리 분석 완료 로그: 최종 결과 요약

### 1.4 Costs 레이어 생성

- [x] `src/lib/costs.ts` 파일 생성
  - [x] 파일 생성 완료
  - [x] 파일 헤더 주석 추가 (목적, 참조 문서, 작성일)
- [x] `calcCosts()` 함수 구현
  - [x] 문서(`auction-engine-v0.1.md`)의 코드 블록 기반으로 구현
  - [x] 세금 계산 구현:
    - 취득세 계산: bidPrice × 취득세율 ✅
    - 교육세 계산: bidPrice × 교육세율 ✅
    - 농특세 계산: bidPrice × 농특세율 ✅
    - 총 세금: 취득세 + 교육세 + 농특세 ✅
  - [x] 총인수금액 계산: bidPrice + assumedRightsAmount + totalTax + evictionCost + miscCost ✅
  - [x] 반환 타입: `CostBreakdown` (taxes, evictionCost, miscCost, totalAcquisition, notes)
- [x] 세율 기본값 설정 (교육용)
  - [x] `pickBaseAcqTaxRate()` 함수 구현 ✅
  - [x] 주거용 기본 세율: 1.1% ✅
  - [x] 토지/상가 기본 세율: 2.0% ✅
  - [x] 교육세 기본 세율: 0.1% (취득세의 0.1%) ✅
  - [x] 농특세 기본 세율: 0.2% (취득세의 0.2%) ✅
  - [x] overrides 지원: 상위에서 정확한 세율 주입 가능 ✅
- [x] 명도비/기타비용 기본값 설정
  - [x] 명도비 기본값: 3,000,000원 ✅
  - [x] 기타비용 기본값: 1,000,000원 ✅
  - [x] overrides 지원: 상위에서 정확한 비용 주입 가능 ✅
- [x] 세금 계산 정확성 검증
  - [x] 취득세 계산: `Math.round(bidPrice * acqRate)` ✅
  - [x] 교육세 계산: `Math.round(bidPrice * eduRate)` ✅
  - [x] 농특세 계산: `Math.round(bidPrice * spcRate)` ✅
  - [x] 총 세금 합계: `acquisitionTax + educationTax + specialTax` ✅
  - [x] 총인수금액 계산 공식 검증: 모든 항목 합산 ✅
- [x] 로그 추가 (규칙 준수: 💰 [비용계산] 형식)
  - [x] 총인수금액 계산 시작 로그: bidPrice, assumedRightsAmount, propertyType, overrides 여부
  - [x] 세율 설정 로그: 취득세율, 교육세율, 농특세율, overrides 여부
  - [x] 세금 계산 완료 로그: 취득세, 교육세, 농특세, 총 세금
  - [x] 부대비용 설정 로그: 명도비, 기타비용, overrides 여부
  - [x] 총인수금액 계산 로그: 각 항목별 금액 및 총합
  - [x] 계산 완료 로그: 최종 총인수금액 및 내역 요약

### 1.5 Profit 레이어 생성

- [x] `src/lib/profit.ts` 파일 생성
  - [x] 파일 생성 완료
  - [x] 파일 헤더 주석 추가 (목적, 참조 문서, 작성일)
- [x] `evaluateProfit()` 함수 구현
  - [x] 문서(`auction-engine-v0.1.md`)의 코드 블록 기반으로 구현
  - [x] FMV 기준 마진 계산: `marginVsFMV = FMV - 총인수금액` ✅
  - [x] FMV 기준 마진률 계산: `marginRateVsFMV = marginVsFMV / FMV` ✅
  - [x] Exit 기준 마진 계산: `marginVsExit = Exit - 총인수금액` (Exit 없으면 FMV 사용) ✅
  - [x] Exit 기준 마진률 계산: `marginRateVsExit = marginVsExit / Exit` ✅
  - [x] 반환 타입: `ProfitResult` (marginVsFMV, marginRateVsFMV, marginVsExit, marginRateVsExit, bePoint, notes)
- [x] 안전마진 계산 로직 포함
  - [x] FMV 기준 안전마진: FMV 대비 투자 여유도 측정 ✅
  - [x] Exit 기준 안전마진: 실제 처분가 대비 투자 여유도 측정 ✅
  - [x] 마진률 계산: 0으로 나누기 방지 (fmv > 0, exit > 0 체크) ✅
  - [x] 음수 마진 지원: 투자 손실 상황도 표현 가능 ✅
- [x] 손익분기점 계산 확인
  - [x] 손익분기점: `bePoint = totalAcquisition` ✅
  - [x] 의미: 최소한 이 가격에 매도해야 손해 없음 ✅
  - [x] notes에 손익분기점 정보 포함 ✅
- [x] 로그 추가 (규칙 준수: 📊 [수익분석] 형식)
  - [x] 수익 분석 시작 로그: FMV, 총인수금액, 입찰가, Exit 가격 여부
  - [x] 기준 가격 설정 로그: FMV, Exit, 총인수금액, Exit 가격 사용 여부
  - [x] FMV 기준 마진 계산 로그: 마진 금액, 마진률, 양수 여부
  - [x] Exit 기준 마진 계산 로그: 마진 금액, 마진률, 양수 여부
  - [x] 손익분기점 계산 로그: 손익분기점 금액 및 설명
  - [x] 수익 분석 완료 로그: 최종 결과 요약 (모든 마진, 손익분기점, 양수 마진 여부)

---

## ✅ Phase 2: 오케스트레이션 엔진 구현 (2-3시간)

### 2.1 기존 v1.2 코드 백업 및 구조 확인

- [x] 기존 v1.2 코드 분석
  - [x] 현재 `auction-engine.ts` 파일의 export 함수 목록 확인
    - [x] `evaluateAuction()` 함수 확인 (v1.2 메인 함수)
    - [x] `calcAcquisitionAndMoS()` 함수 확인
    - [x] 기존 타입 정의 확인: `AuctionEvalInput`, `AuctionEvalResult`, `BidStrategyItem`, `ExitAssumption` 등
  - [x] 기존 코드에서 사용 중인 타입 및 인터페이스 확인
    - [x] `StrategyStage`, `BidStrategyItem`, `ExitAssumption`, `AcquisitionCostInput`, `MarketInput`, `AuctionEvalInput` 등
    - [x] `MarginBlock`, `AcquisitionCostBreakdown` 확인
    - [x] `DEFAULT_STRATEGY_MULTIPLIERS` 상수 확인
  - [x] 기존 코드 참조 위치 확인
    - [x] `src/app/property/[id]/page.tsx`: `evaluateAuction`, `AuctionEvalInput` 사용
    - [x] `src/components/BiddingModal.tsx`: `evaluateAuction`, `AuctionEvalInput` 사용
    - [x] `src/lib/property/formatters_v2.ts`: `AuctionEvalResult` 타입 사용
    - **주의**: Phase 4에서 이들 컴포넌트를 새 엔진으로 교체 예정
- [x] 기존 v1.2 코드 백업
  - [x] 파일 상단에 백업 주석 블록 추가
  - [x] `// ===== v1.2 BACKUP START =====` ~ `// ===== v1.2 BACKUP END =====`
  - [x] 백업 범위 문서화: export된 함수, 타입 정의, 인터페이스 모두 포함
  - [x] 백업 코드 구조 문서화 (파일 끝에 상세 주석 추가)
  - [x] 참조 위치 문서화 (사용 위치 목록)
  - **참고**: Phase 4에서 컴포넌트 교체 완료 후 최종 삭제 예정
  - **주의**: Phase 4까지는 기존 코드를 그대로 사용하므로 코드는 주석 처리하지 않고 백업 블록으로 표시만 함

### 2.2 auctionEngine() 함수 기본 구조 구현

- [x] 파일 헤더 및 import 설정
  - [x] 파일 헤더 주석 추가 (목적, 참조 문서, 작성일)
  - [x] 필요한 타입 import: `EngineInput`, `EngineOutput` from `@/types/auction`
  - [x] 레이어 함수 import:
    - `estimateValuation` from `./valuation`
    - `analyzeRights` from `./rights/rights-engine`
    - `calcCosts` from `./costs`
    - `evaluateProfit` from `./profit`
- [x] `auctionEngine()` 함수 시그니처 작성
  - [x] 함수 선언: `export function auctionEngine(input: EngineInput): EngineOutput`
  - [x] JSDoc 주석 추가 (단일 진입점 설명, 입력/출력 설명, 실행 순서)
- [x] 입력 파라미터 구조 분해
  - [x] `snapshot`, `userBidPrice`, `exitPriceHint`, `valuationInput`, `options` 추출
  - [x] 다음 단계 구현을 위한 TODO 주석 추가

### 2.3 devMode 로그 시스템 구현

- [x] 로그 헬퍼 함수 구현
  - [x] `log()` 함수 생성: `options?.devMode` 체크
  - [x] 로그 접두사 설정: `options?.logPrefix ?? "🧠 [ENGINE]"`
  - [x] `console.log` 호출 (eslint-disable 주석 추가)
  - [x] 선택적 데이터 파라미터 지원
- [x] 로그 포인트 확인
  - [x] 엔진 실행 시작 로그 추가 (caseId, propertyType, userBidPrice, 권리/임차인 수 등)
  - [x] 로그 형식 확인: 이모지 + 레이어명 + 데이터
  - [x] 각 레이어 실행 전/후 로그 포인트는 Phase 2.4에서 구현 예정

### 2.4 레이어별 호출 구현 (순서: Valuation → Rights → Costs → Profit)

- [x] 1단계: Valuation 레이어 호출
  - [x] `estimateValuation()` 호출
  - [x] 입력 데이터 구성: `snapshot.appraisal`, `snapshot.minBid`, `snapshot.fmvHint ?? valuationInput?.fmvHint`, `valuationInput?.marketSignals`, `snapshot.propertyType`
  - [x] 실행 전/후 로그: `log("📐 Valuation 레이어 실행 시작")`, `log("📐 Valuation 레이어 완료", { fmv, appraisal, minBid })`
  - [x] 결과 저장: `const valuation = ...`
- [x] 2단계: Rights 레이어 호출
  - [x] `analyzeRights()` 호출
  - [x] 입력 데이터: `snapshot` (전체)
  - [x] 실행 전/후 로그: `log("⚖️ Rights 레이어 실행 시작")`, `log("⚖️ Rights 레이어 완료", { malsoBaseRightId, assumedRightsAmount, ... })`
  - [x] 결과 저장: `const rights = ...`
- [x] 3단계: Costs 레이어 호출
  - [x] `calcCosts()` 호출
  - [x] 입력 데이터 구성:
    - `bidPrice: userBidPrice`
    - `assumedRightsAmount: rights.assumedRightsAmount`
    - `propertyType: snapshot.propertyType`
    - `regionCode: snapshot.regionCode`
    - `overrides: valuationInput as any` (선택: 상위에서 세율/명도/기타 비용 전달)
  - [x] 실행 전/후 로그: `log("💰 Costs 레이어 실행 시작")`, `log("💰 Costs 레이어 완료", { totalAcquisition, taxes, ... })`
  - [x] 결과 저장: `const costs = ...`
- [x] 4단계: Profit 레이어 호출
  - [x] `evaluateProfit()` 호출
  - [x] 입력 데이터 구성:
    - `exitPrice: exitPriceHint`
    - `fmv: valuation.fmv`
    - `totalAcquisition: costs.totalAcquisition`
    - `bidPrice: userBidPrice`
  - [x] 실행 전/후 로그: `log("📊 Profit 레이어 실행 시작")`, `log("📊 Profit 레이어 완료", { marginVsFMV, marginRateVsFMV, ... })`
  - [x] 결과 저장: `const profit = ...`

### 2.5 Safety 객체 생성 구현

- [x] Safety 객체 구조 정의
  - [x] `fmv`: FMV 기준 안전마진
    - `amount: valuation.fmv - costs.totalAcquisition`
    - `rate: (valuation.fmv - costs.totalAcquisition) / valuation.fmv` (0으로 나누기 방지)
  - [x] `exit`: Exit 기준 안전마진
    - `amount: (exitPriceHint ?? valuation.fmv) - costs.totalAcquisition`
    - `rate: ((exitPriceHint ?? valuation.fmv) - costs.totalAcquisition) / (exitPriceHint ?? valuation.fmv)` (0으로 나누기 방지)
  - [x] `userBid`: 사용자 입찰가 기준 마진
    - `amount: valuation.fmv - userBidPrice`
    - `rate: (valuation.fmv - userBidPrice) / valuation.fmv` (0으로 나누기 방지)
  - [x] `overFMV`: 입찰가가 FMV를 초과하는지 여부
    - `overFMV: userBidPrice > valuation.fmv`
- [x] Safety 객체 로그
  - [x] 생성 시작 로그: `log("🧯 Safety 객체 생성 시작")`
  - [x] 생성 완료 로그: `log("🧯 Safety 객체 생성 완료", { fmv, exit, userBid, overFMV })`
  - [x] 0으로 나누기 방지 헬퍼 함수 `safeDiv()` 구현

### 2.6 EngineOutput 반환 구현

- [x] 반환 객체 구성
  - [x] `valuation`: ValuationResult
  - [x] `rights`: RightAnalysisResult
  - [x] `costs`: CostBreakdown
  - [x] `profit`: ProfitResult
  - [x] `safety`: Safety 객체
- [x] 반환 타입 검증
  - [x] TypeScript 타입 명시: `const output: EngineOutput = { ... }`
  - [x] 반환 로그 추가: 엔진 실행 완료 및 결과 요약 로그
  - [x] `return output` 구현

### 2.7 입력 → 출력 플로우 검증

- [x] 데이터 흐름 검증 로직 구현
  - [x] devMode에서만 실행되는 검증 로그 추가
  - [x] `snapshot` → Valuation 레이어 입력 검증 로그
  - [x] `valuation.fmv` → Profit 레이어 입력 검증 로그 (역산 검증 포함)
  - [x] `rights.assumedRightsAmount` → Costs 레이어 입력 검증 로그
  - [x] `costs.totalAcquisition` → Profit 레이어 입력 검증 로그 (손익분기점 비교)
  - [x] 모든 레이어 결과 → EngineOutput 검증 로그
- [x] devMode 로그 출력 확인
  - [x] devMode 활성화 시 모든 레이어별 로그 출력 확인
  - [x] 로그 접두사 커스터마이징 지원: `options: { devMode: true, logPrefix: "🏗️ [BidMaster]" }`
  - [x] 검증 로그는 devMode에서만 출력되도록 구현
- [ ] 단위 테스트 작성 (선택, Phase 4 이후 진행 가능)
  - [ ] 기본 입력으로 전체 플로우 테스트
  - [ ] 각 레이어 결과가 다음 레이어 입력으로 올바르게 전달되는지 확인
  - [ ] 실제 테스트 코드는 Phase 4 컴포넌트 교체 후 작성 권장

---

## ✅ Phase 3: 기존 타입 매핑 및 브리지 함수 (3-4시간)

### 3.1 타입 매핑 유틸리티 파일 생성 및 기본 구조

#### 3.1.1 디렉토리 및 파일 생성

- [ ] `src/lib/auction/` 디렉토리 생성 확인
  - [ ] 디렉토리 존재 여부 확인 (없으면 생성)
- [ ] `src/lib/auction/mappers.ts` 파일 생성
  - [ ] 파일 헤더 주석 추가 (목적, 참조 문서, 작성일)
  - [ ] 필요한 타입 import 추가:
    - `PropertySnapshot`, `RegisteredRight`, `Tenant`, `EngineOutput` from `@/types/auction`
    - `SimulationScenario`, `RightRecord`, `TenantRecord`, `RightsAnalysisResult` from `@/types/simulation`
    - `AcquisitionBreakdown`, `SafetyMargin` from `@/types/property`
    - `DifficultyLevel` from `@/types/simulation`
    - `Difficulty` from `@/types/auction`

#### 3.1.2 매핑 함수 목록 및 구조 정의

- [ ] 매핑 함수 목록 문서화 (주석으로)
  - [ ] 7개 매핑 함수 목록 작성:
    1. `mapSimulationToSnapshot()`: SimulationScenario → PropertySnapshot
    2. `mapRightRecordToRegisteredRight()`: RightRecord → RegisteredRight
    3. `mapTenantRecordToTenant()`: TenantRecord → Tenant
    4. `mapDifficultyLevelToDifficulty()`: DifficultyLevel → Difficulty
    5. `mapEngineOutputToRightsAnalysisResult()`: EngineOutput → RightsAnalysisResult (하위 호환성)
    6. `mapCostBreakdownToAcquisitionBreakdown()`: CostBreakdown → AcquisitionBreakdown
    7. `mapProfitResultToSafetyMargin()`: ProfitResult → SafetyMargin[]
- [ ] 각 함수 시그니처 작성 (JSDoc 주석 포함)

### 3.2 기본 타입 매핑 함수 구현

#### 3.2.1 Difficulty 매핑 함수

- [ ] `mapDifficultyLevelToDifficulty()` 함수 구현
  - [ ] 매핑 규칙: "초급" → "easy", "중급" → "normal", "고급" → "hard"
  - [ ] 기본값 처리: 알 수 없는 값은 "normal" 반환
  - [ ] 반환 타입: `Difficulty`
  - [ ] JSDoc 주석 추가 (매핑 규칙 설명)
- [ ] 타입 안전성 확인
  - [ ] TypeScript 컴파일 오류 없음 확인
  - [ ] 모든 DifficultyLevel 값이 올바르게 매핑되는지 확인

#### 3.2.2 RightType 매핑 헬퍼 함수

- [ ] `mapRightTypeToAuctionType()` 헬퍼 함수 구현
  - [ ] 매핑 규칙 구현 (auction.ts 주석 참조):
    - "근저당권", "저당권" → "mortgage"
    - "압류", "가압류", "담보가등기" → "pledge"
    - "주택임차권", "상가임차권", "전세권" → "lease"
    - "유치권", "법정지상권", "분묘기지권" → "liens"
    - "가등기", "예고등기", "소유권이전청구권가등기", "가처분" → "superiorEtc"
  - [ ] 기본값 처리: 알 수 없는 값은 "pledge" 반환 (보수적)
  - [ ] 반환 타입: `RightType` (auction.ts)
  - [ ] JSDoc 주석 추가 (매핑 규칙 설명)
- [ ] 로그 추가 (규칙 준수: 🔄 [매핑] 형식)
  - [ ] 알 수 없는 RightType 매핑 시 경고 로그
- [ ] 타입 안전성 확인
  - [ ] 모든 RightType (simulation.ts) 값이 올바르게 매핑되는지 확인

### 3.3 RightRecord → RegisteredRight 매핑 함수

#### 3.3.1 기본 매핑 로직 구현

- [ ] `mapRightRecordToRegisteredRight()` 함수 구현
  - [ ] 필수 필드 매핑:
    - `id`: `record.id` (그대로)
    - `type`: `mapRightTypeToAuctionType(record.rightType)` 사용
  - [ ] 선택 필드 매핑:
    - `amount`: `record.claimAmount` (0이 아닌 경우만)
    - `rankOrder`: `record.priority` (priority가 있을 경우)
    - `establishedAt`: `record.registrationDate` (그대로)
    - `specialNote`: `record.notes` (그대로)
  - [ ] 반환 타입: `RegisteredRight`
  - [ ] JSDoc 주석 추가 (필드 매핑 규칙 설명)
- [ ] 엔진 계산 결과 필드 제외 확인
  - [ ] `isMalsoBaseRight`, `willBeExtinguished`, `willBeAssumed` 제외 (엔진이 계산)
  - [ ] `rightHolder` 제외 (엔진 계산에 불필요)
- [ ] 로그 추가 (규칙 준수: 🔄 [매핑] 형식)
  - [ ] 권리 매핑 시작 로그: rightId, rightType, claimAmount
  - [ ] 매핑 완료 로그: 최종 RegisteredRight 타입, amount, rankOrder 여부
- [ ] 타입 안전성 확인
  - [ ] TypeScript 컴파일 오류 없음 확인
  - [ ] null/undefined 처리 확인

### 3.4 TenantRecord → Tenant 매핑 함수

#### 3.4.1 기본 매핑 로직 구현

- [ ] `mapTenantRecordToTenant()` 함수 구현
  - [ ] 필수 필드 매핑:
    - `id`: `record.id` (그대로)
    - `deposit`: `record.deposit` (그대로)
  - [ ] 선택 필드 매핑:
    - `name`: `record.tenantName` (그대로)
    - `moveInDate`: `record.moveInDate` (그대로)
    - `fixedDate`: `record.confirmationDate` (null이 아닌 경우만)
    - `hasOpposability`: `record.hasDaehangryeok` (명칭 변경)
    - `vacateRiskNote`: `record.notes` (그대로)
    - `isDefacto`: 기본값 `false` (엔진이 추정)
  - [ ] 반환 타입: `Tenant`
  - [ ] JSDoc 주석 추가 (필드 매핑 규칙 설명)
- [ ] 엔진 계산 결과 필드 제외 확인
  - [ ] `isSmallTenant`, `priorityPaymentAmount`, `willBeAssumed` 제외 (엔진이 계산)
  - [ ] `monthlyRent` 제외 (엔진 계산에 불필요)
- [ ] 로그 추가 (규칙 준수: 🔄 [매핑] 형식)
  - [ ] 임차인 매핑 시작 로그: tenantId, tenantName, deposit
  - [ ] 매핑 완료 로그: name, moveInDate, fixedDate, hasOpposability 여부
- [ ] 타입 안전성 확인
  - [ ] TypeScript 컴파일 오류 없음 확인
  - [ ] null/undefined 처리 확인 (confirmationDate null 처리)

### 3.5 SimulationScenario → PropertySnapshot 매핑 함수

#### 3.5.1 PropertyType 변환 로직 구현

- [ ] `mapPropertyTypeToAuctionType()` 헬퍼 함수 구현
  - [ ] 매핑 규칙 구현 (auction.ts 주석 참조):
    - "아파트" → "apartment"
    - "오피스텔" → "officetel"
    - "빌라" → "villa"
    - "단독주택", "주택", "다가구주택", "근린주택", "도시형생활주택" → "villa"
    - "원룸" → "apartment" (또는 별도 처리)
    - 토지/상가 등 → "land" / "commercial" (기본값 처리)
  - [ ] 기본값 처리: 알 수 없는 값은 "apartment" 반환
  - [ ] 반환 타입: `string` (PropertySnapshot.propertyType)
  - [ ] JSDoc 주석 추가 (매핑 규칙 설명)
- [ ] 로그 추가 (규칙 준수: 🔄 [매핑] 형식)
  - [ ] 알 수 없는 PropertyType 매핑 시 경고 로그

#### 3.5.2 전체 스냅샷 매핑 로직 구현

- [ ] `mapSimulationToSnapshot()` 함수 구현
  - [ ] 필수 필드 매핑:
    - `caseId`: `scenario.basicInfo.caseNumber`
    - `propertyType`: `mapPropertyTypeToAuctionType(scenario.basicInfo.propertyType)`
    - `rights`: `scenario.rights.map(mapRightRecordToRegisteredRight)`
    - `tenants`: `scenario.tenants.map(mapTenantRecordToTenant)`
  - [ ] 선택 필드 매핑:
    - `regionCode`: `scenario.regionalAnalysis.court.code` (선택)
    - `appraisal`: `scenario.basicInfo.appraisalValue` (그대로)
    - `minBid`: `scenario.basicInfo.minimumBidPrice` (그대로)
    - `fmvHint`: `scenario.basicInfo.marketValue` (그대로)
    - `dividendDeadline`: `scenario.schedule.dividendDeadline` (그대로)
  - [ ] 반환 타입: `PropertySnapshot`
  - [ ] JSDoc 주석 추가 (필드 매핑 규칙, 제거되는 필드 설명)
- [ ] 제거되는 필드 확인
  - [ ] 엔진 계산에 불필요한 필드 제외 확인:
    - id, type, basicInfo 상세 정보, propertyDetails, schedule의 다른 필드
    - biddingHistory, similarSales, regionalAnalysis 상세 정보, educationalContent, createdAt
- [ ] 로그 추가 (규칙 준수: 🔄 [매핑] 형식)
  - [ ] 스냅샷 매핑 시작 로그: caseId, propertyType, 권리/임차인 수
  - [ ] 매핑 완료 로그: 최종 PropertySnapshot 필드 요약
- [ ] 타입 안전성 확인
  - [ ] TypeScript 컴파일 오류 없음 확인
  - [ ] 모든 필수 필드가 올바르게 매핑되는지 확인

### 3.6 EngineOutput → RightsAnalysisResult 브리지 함수

#### 3.6.1 기존 RightsAnalysisResult 구조 분석

- [ ] 기존 `RightsAnalysisResult` 타입 필드 확인
  - [ ] 필수 필드 목록 작성:
    - `malsoBaseRight`: RightRecord | null
    - `extinguishedRights`: RightRecord[]
    - `assumedRights`: RightRecord[]
    - `totalAssumedAmount`: number
    - `assumedTenants`: TenantRecord[]
    - `totalTenantDeposit`: number
    - `totalAcquisition`: number
    - `safetyMargin`: number
    - `recommendedBidRange`: { min, max, optimal }
    - `riskAnalysis`: { overallRiskLevel, riskScore, riskFactors, recommendations }
  - [ ] 선택 필드 확인:
    - `marketValue`: { fairMarketValue, auctionCenter, center }
    - `advancedSafetyMargin`: { minSafetyMargin, assumedAmount, trace }
    - `tenantRisk`: { riskScore, riskLabel, evictionCostMin, evictionCostMax, ... }
- [ ] EngineOutput에서 사용 가능한 데이터 확인
  - [ ] `output.valuation`: ValuationResult (FMV, 감정가, 최저가)
  - [ ] `output.rights`: RightAnalysisResult (권리 분석 결과)
  - [ ] `output.costs`: CostBreakdown (총인수금액 포함)
  - [ ] `output.profit`: ProfitResult (안전마진 포함)
  - [ ] `output.safety`: Safety 객체 (FMV/Exit/UserBid 기준 마진)

#### 3.6.2 브리지 함수 기본 구조 구현

- [ ] `mapEngineOutputToRightsAnalysisResult()` 함수 시그니처 작성
  - [ ] 입력 파라미터:
    - `output: EngineOutput` (필수)
    - `scenario: SimulationScenario` (필수, 원본 데이터로 RightRecord[] 복원 필요)
  - [ ] 반환 타입: `RightsAnalysisResult`
  - [ ] JSDoc 주석 추가 (브리지 함수 목적, 하위 호환성 설명)

#### 3.6.3 말소기준권리 및 권리 배열 매핑

- [ ] `malsoBaseRight` 매핑
  - [ ] `output.rights.malsoBase`가 있으면:
    - [ ] `scenario.rights`에서 동일한 `id` 찾기
    - [ ] 해당 `RightRecord` 반환
  - [ ] 없으면 `null` 반환
- [ ] `extinguishedRights` 매핑
  - [ ] `output.rights.rightFindings`에서 `assumed: false`인 권리 찾기
  - [ ] `scenario.rights`에서 해당 권리 `RightRecord[]` 반환
- [ ] `assumedRights` 매핑
  - [ ] `output.rights.rightFindings`에서 `assumed: true`인 권리 찾기
  - [ ] `scenario.rights`에서 해당 권리 `RightRecord[]` 반환
- [ ] `totalAssumedAmount` 매핑
  - [ ] `output.rights.assumedRightsAmount` 사용 (등기 권리 + 임차보증금 합계)
  - [ ] 등기 권리만 계산하려면: `assumedRights`의 `claimAmount` 합계
  - [ ] **주의**: 엔진은 등기 권리 + 임차보증금 합계를 반환하므로, 등기 권리만 필요 시 별도 계산

#### 3.6.4 임차인 배열 매핑

- [ ] `assumedTenants` 매핑
  - [ ] `output.rights.tenantFindings`에서 `assumed: true`인 임차인 찾기
  - [ ] `scenario.tenants`에서 해당 임차인 `TenantRecord[]` 반환
- [ ] `totalTenantDeposit` 매핑
  - [ ] `assumedTenants`의 `deposit` 합계 계산
  - [ ] 또는 `output.rights.tenantFindings`에서 `depositAssumed` 합계

#### 3.6.5 총인수금액 및 안전마진 매핑

- [ ] `totalAcquisition` 매핑
  - [ ] `output.costs.totalAcquisition` 사용 (엔진 계산 결과)
- [ ] `safetyMargin` 매핑
  - [ ] `output.profit.marginVsFMV` 사용 (FMV 기준 안전마진)
  - [ ] 또는 `output.safety.fmv.amount` 사용

#### 3.6.6 권장 입찰가 범위 및 리스크 분석 매핑

- [ ] `recommendedBidRange` 매핑
  - [ ] 기본값 설정 또는 엔진 결과에서 추정:
    - `min`: `output.valuation.minBid * 0.9` (보수적)
    - `max`: `output.valuation.fmv * 1.1` (공격적)
    - `optimal`: `output.valuation.fmv * 0.95` (중간값)
  - [ ] **주의**: v0.1 엔진은 권장 입찰가 범위를 직접 계산하지 않으므로, 추정값 사용
- [ ] `riskAnalysis` 매핑
  - [ ] 기본값 설정 또는 엔진 결과에서 추정:
    - `overallRiskLevel`: 안전마진 기반 판단
    - `riskScore`: 0-100 점수 (안전마진률 기반)
    - `riskFactors`: 권리/임차인 리스크 요인 추출
    - `recommendations`: 기본 권장사항
  - [ ] **주의**: v0.1 엔진은 리스크 분석을 직접 제공하지 않으므로, 기본값 또는 추정값 사용

#### 3.6.7 선택 필드 매핑 (marketValue, advancedSafetyMargin, tenantRisk)

- [ ] `marketValue` 매핑 (선택)
  - [ ] `fairMarketValue`: `output.valuation.fmv`
  - [ ] `auctionCenter`, `center`: 기본값 또는 `output.valuation.fmv` 사용
- [ ] `advancedSafetyMargin` 매핑 (선택)
  - [ ] 기본값 `undefined` 또는 `output.profit` 기반 계산
- [ ] `tenantRisk` 매핑 (선택)
  - [ ] 기본값 `undefined` 또는 `output.rights.tenantFindings` 기반 추정
- [ ] **주의**: 선택 필드는 기존 컴포넌트가 사용하지 않을 수 있으므로 기본값 처리 가능

#### 3.6.8 브리지 함수 완성 및 검증

- [ ] 전체 함수 구현 완료
  - [ ] 모든 필수 필드 매핑 완료
  - [ ] 선택 필드는 기본값 또는 추정값 사용
- [ ] 로그 추가 (규칙 준수: 🔄 [브리지] 형식)
  - [ ] 브리지 함수 시작 로그: caseId, 권리/임차인 수
  - [ ] 매핑 완료 로그: 주요 필드 요약 (totalAcquisition, safetyMargin 등)
- [ ] 타입 안전성 확인
  - [ ] TypeScript 컴파일 오류 없음 확인
  - [ ] 모든 필수 필드가 올바르게 매핑되는지 확인

### 3.7 CostBreakdown → AcquisitionBreakdown 매핑 함수

#### 3.7.1 기본 매핑 로직 구현

- [ ] `mapCostBreakdownToAcquisitionBreakdown()` 함수 구현
  - [ ] 필드 매핑:
    - `bidPrice`: 입력 파라미터로 받기 (CostBreakdown에는 없음)
    - `rights`: `costs` 파라미터 없음 → `assumedRightsAmount` 사용 (입력 파라미터)
    - `taxes`: `costs.taxes.totalTax`
    - `costs`: `costs.evictionCost` (명도비)
    - `financing`: `0` (v0.1에서는 간소화)
    - `penalty`: `0` (v0.1에서는 간소화)
    - `misc`: `costs.miscCost`
    - `total`: `costs.totalAcquisition`
  - [ ] 입력 파라미터 확인:
    - `costs: CostBreakdown` (필수)
    - `bidPrice: number` (필수)
    - `assumedRightsAmount: number` (필수)
  - [ ] 반환 타입: `AcquisitionBreakdown`
  - [ ] JSDoc 주석 추가 (필드 매핑 규칙 설명)
- [ ] 로그 추가 (규칙 준수: 🔄 [매핑] 형식)
  - [ ] 매핑 시작 로그: bidPrice, assumedRightsAmount, totalAcquisition
  - [ ] 매핑 완료 로그: 각 필드별 금액
- [ ] 타입 안전성 확인
  - [ ] TypeScript 컴파일 오류 없음 확인
  - [ ] 총합 일치 확인: `total` === `bidPrice + rights + taxes + costs + financing + penalty + misc`

### 3.8 ProfitResult → SafetyMargin[] 매핑 함수

#### 3.8.1 SafetyMargin 배열 생성 로직 구현

- [ ] `mapProfitResultToSafetyMargin()` 함수 구현
  - [ ] 입력 파라미터:
    - `profit: ProfitResult` (필수)
    - `valuation: ValuationResult` (필수, FMV 참조)
    - `exitPrice?: number` (선택, Exit 가격)
    - `userBidPrice?: number` (선택, 사용자 입찰가)
  - [ ] SafetyMargin 배열 생성:
    - [ ] FMV 기준 마진:
      - `label: "FMV"`
      - `amount: profit.marginVsFMV`
      - `pct: profit.marginRateVsFMV`
      - `referencePrice: valuation.fmv`
    - [ ] Exit 기준 마진:
      - `label: "EXIT"`
      - `amount: profit.marginVsExit`
      - `pct: profit.marginRateVsExit`
      - `referencePrice: exitPrice ?? valuation.fmv`
    - [ ] USER 기준 마진 (선택):
      - `label: "USER"`
      - `amount: valuation.fmv - (userBidPrice ?? 0)`
      - `pct: (valuation.fmv - (userBidPrice ?? 0)) / valuation.fmv`
      - `referencePrice: valuation.fmv`
  - [ ] 반환 타입: `SafetyMargin[]`
  - [ ] JSDoc 주석 추가 (매핑 규칙 설명)
- [ ] 0으로 나누기 방지
  - [ ] `pct` 계산 시 `referencePrice > 0` 체크
  - [ ] `referencePrice`가 0이면 `pct: 0` 반환
- [ ] 로그 추가 (규칙 준수: 🔄 [매핑] 형식)
  - [ ] 매핑 시작 로그: FMV, Exit, UserBid 가격 여부
  - [ ] 매핑 완료 로그: 각 SafetyMargin의 label, amount, pct
- [ ] 타입 안전성 확인
  - [ ] TypeScript 컴파일 오류 없음 확인
  - [ ] 배열 길이 확인 (2개 또는 3개)

### 3.9 매핑 함수 통합 테스트 및 검증

#### 3.9.1 각 매핑 함수 단위 검증

- [ ] `mapDifficultyLevelToDifficulty()` 검증
  - [ ] "초급" → "easy" 확인
  - [ ] "중급" → "normal" 확인
  - [ ] "고급" → "hard" 확인
  - [ ] 알 수 없는 값 → "normal" 확인
- [ ] `mapRightTypeToAuctionType()` 검증
  - [ ] 모든 RightType (simulation.ts) 값이 올바르게 매핑되는지 확인
  - [ ] 알 수 없는 값 → "pledge" 확인
- [ ] `mapRightRecordToRegisteredRight()` 검증
  - [ ] 필수 필드 매핑 확인
  - [ ] 선택 필드 null/undefined 처리 확인
  - [ ] 엔진 계산 결과 필드 제외 확인
- [ ] `mapTenantRecordToTenant()` 검증
  - [ ] 필수 필드 매핑 확인
  - [ ] confirmationDate null 처리 확인
  - [ ] 엔진 계산 결과 필드 제외 확인
- [ ] `mapSimulationToSnapshot()` 검증
  - [ ] 필수 필드 매핑 확인
  - [ ] 선택 필드 매핑 확인
  - [ ] rights, tenants 배열 매핑 확인
- [ ] `mapEngineOutputToRightsAnalysisResult()` 검증
  - [ ] 필수 필드 매핑 확인
  - [ ] 권리/임차인 배열 매핑 확인
  - [ ] 총인수금액, 안전마진 매핑 확인
- [ ] `mapCostBreakdownToAcquisitionBreakdown()` 검증
  - [ ] 모든 필드 매핑 확인
  - [ ] 총합 일치 확인
- [ ] `mapProfitResultToSafetyMargin()` 검증
  - [ ] SafetyMargin 배열 길이 확인
  - [ ] 각 마진의 amount, pct 계산 확인

#### 3.9.2 통합 플로우 검증

- [ ] 전체 매핑 플로우 테스트
  - [ ] SimulationScenario → PropertySnapshot → EngineOutput → RightsAnalysisResult
  - [ ] 각 단계별 데이터 정확성 확인
- [ ] 엔진 실행 후 브리지 함수 테스트
  - [ ] `auctionEngine()` 실행
  - [ ] `mapEngineOutputToRightsAnalysisResult()` 실행
  - [ ] 기존 컴포넌트가 기대하는 형식과 일치하는지 확인

#### 3.9.3 TypeScript 컴파일 검증

- [ ] `pnpm exec tsc --noEmit src/lib/auction/mappers.ts` 실행
  - [ ] 컴파일 오류 없음 확인
- [ ] 전체 프로젝트 타입 체크 (`pnpm exec tsc --noEmit`)
  - [ ] mappers.ts로 인한 새로운 타입 오류 없음 확인

#### 3.9.4 문서화 및 주석

- [ ] 각 매핑 함수에 상세한 JSDoc 주석 추가
  - [ ] 매핑 규칙 설명
  - [ ] 입력/출력 타입 설명
  - [ ] 사용 예시 (선택)
- [ ] 파일 상단에 매핑 함수 목록 및 사용 가이드 주석 추가
- [ ] 기존 타입과의 차이점 명시 (주석으로)

### 3.10 검증 체크리스트

- [ ] 모든 매핑 함수가 올바르게 구현되었는가?
  - [ ] 7개 매핑 함수 모두 구현 완료
  - [ ] 각 함수의 입력/출력 타입이 올바른가?
- [ ] 타입 안전성이 보장되는가?
  - [ ] TypeScript 컴파일 오류 없음
  - [ ] null/undefined 처리 확인
  - [ ] 0으로 나누기 방지 확인
- [ ] 로그가 올바르게 추가되었는가?
  - [ ] 모든 매핑 함수에 로그 추가 (🔄 [매핑] 또는 🔄 [브리지] 형식)
  - [ ] 로그 내용이 디버깅에 유용한가?
- [ ] 기존 타입과의 호환성이 보장되는가?
  - [ ] `mapEngineOutputToRightsAnalysisResult()`가 기존 컴포넌트가 기대하는 형식과 일치하는가?
  - [ ] `mapCostBreakdownToAcquisitionBreakdown()`이 기존 컴포넌트가 기대하는 형식과 일치하는가?
  - [ ] `mapProfitResultToSafetyMargin()`이 기존 컴포넌트가 기대하는 형식과 일치하는가?
- [ ] 매핑 규칙이 문서화되어 있는가?
  - [ ] auction.ts 주석의 매핑 규칙과 일치하는가?
  - [ ] JSDoc 주석에 매핑 규칙이 명시되어 있는가?

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
**진행 상황**: 1.5 완료 (Profit 레이어 생성) - Phase 1 레이어 파일 생성 완료 ✅
