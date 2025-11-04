/**
 * Bid Master AI - 타입 매핑 유틸리티
 * 
 * 목적: 기존 타입(SimulationScenario, RightRecord, TenantRecord 등)을 
 *      새 엔진 타입(PropertySnapshot, RegisteredRight, Tenant 등)으로 변환
 * 참조 문서: docs/auction-engine-v0.1.md, docs/auction-engine-v0.1-migration-plan.md
 * 작성일: 2025-01-XX
 * 
 * ## 매핑 함수 목록
 * 
 * ### 기본 타입 매핑
 * - `mapDifficultyLevelToDifficulty()`: DifficultyLevel → Difficulty
 * - `mapRightTypeToAuctionType()`: RightType (simulation) → RightType (auction)
 * - `mapPropertyTypeToAuctionType()`: PropertyType (simulation) → propertyType (auction)
 * 
 * ### 데이터 레코드 매핑
 * - `mapRightRecordToRegisteredRight()`: RightRecord → RegisteredRight
 * - `mapTenantRecordToTenant()`: TenantRecord → Tenant
 * - `mapSimulationToSnapshot()`: SimulationScenario → PropertySnapshot
 * 
 * ### 브리지 함수 (하위 호환성)
 * - `mapEngineOutputToRightsAnalysisResult()`: EngineOutput → RightsAnalysisResult
 * - `mapCostBreakdownToAcquisitionBreakdown()`: CostBreakdown → AcquisitionBreakdown
 * - `mapProfitResultToSafetyMargin()`: ProfitResult → SafetyMargin[]
 * 
 * ## 사용 가이드
 * 
 * ### 기본 사용법
 * ```typescript
 * // 1. 시나리오를 스냅샷으로 변환
 * const snapshot = mapSimulationToSnapshot(scenario);
 * 
 * // 2. 엔진 실행
 * const output = auctionEngine({ snapshot, userBidPrice: 400000000 });
 * 
 * // 3. 기존 컴포넌트 형식으로 변환 (브리지 함수)
 * const rightsAnalysis = mapEngineOutputToRightsAnalysisResult(output, scenario);
 * ```
 * 
 * ### 검증 함수
 * ```typescript
 * // 모든 매핑 함수 단위 검증
 * const results = validateAllMappers();
 * 
 * // 통합 플로우 검증 (별도 파일: mappers-integration-validation.ts)
 * const integrationResults = await validateAllIntegrationFlows();
 * ```
 * 
 * ## 기존 타입과의 차이점
 * 
 * ### RightRecord vs RegisteredRight
 * - **기존**: `isMalsoBaseRight`, `willBeExtinguished`, `willBeAssumed` 등 엔진 계산 결과 포함
 * - **신규**: 원시 데이터만 포함 (엔진이 계산 결과 생성)
 * - **매핑**: 엔진 계산 결과 필드는 제외하고 원시 데이터만 변환
 * 
 * ### TenantRecord vs Tenant
 * - **기존**: `isSmallTenant`, `priorityPaymentAmount`, `willBeAssumed` 등 엔진 계산 결과 포함
 * - **신규**: 더 간소화된 구조, `hasOpposability`로 대항력 표현
 * - **매핑**: `hasDaehangryeok` → `hasOpposability`, 엔진 계산 결과 필드 제외
 * 
 * ### SimulationScenario vs PropertySnapshot
 * - **기존**: 전체 시나리오 데이터 (UI, 교육 콘텐츠, 주변 매각 사례 등 포함)
 * - **신규**: 엔진 계산에 필요한 최소 스냅샷만 포함
 * - **매핑**: 엔진 계산에 불필요한 필드는 제외
 * 
 * ### RightsAnalysisResult (기존) vs RightAnalysisResult (신규)
 * - **기존**: 종합 분석 결과 (권리 + 비용 + 수익 + 리스크 포함)
 * - **신규**: 권리 분석 결과만 포함 (비용/수익은 별도 레이어)
 * - **브리지**: `mapEngineOutputToRightsAnalysisResult()`로 통합 결과 생성
 * 
 * ### CostBreakdown vs AcquisitionBreakdown
 * - **기존**: `bidPrice`, `rights`, `taxes`, `costs`, `financing`, `penalty`, `misc`, `total`
 * - **신규**: 구조화된 `taxes` 객체, `evictionCost` 분리
 * - **매핑**: `taxes.totalTax`, `evictionCost` → `costs`, `financing`/`penalty`는 0
 * 
 * ### ProfitResult vs SafetyMargin[]
 * - **기존**: SafetyMargin 배열 (FMV/EXIT/USER 기준)
 * - **신규**: ProfitResult 객체 (FMV/Exit 기준 마진, 손익분기점 포함)
 * - **매핑**: ProfitResult를 SafetyMargin 배열로 변환 (2-3개 요소)
 */

// ============================================
// 타입 Import
// ============================================

// Auction Engine v0.1 타입 (새 엔진)
import type {
  PropertySnapshot,
  RegisteredRight,
  Tenant,
  EngineOutput,
  Difficulty,
  RightType,
  CostBreakdown,
  ProfitResult,
  ValuationResult,
} from "@/types/auction";

// 기존 시뮬레이션 타입
import type {
  SimulationScenario,
  RightRecord,
  TenantRecord,
  RightsAnalysisResult,
  DifficultyLevel,
} from "@/types/simulation";

// 기존 매물 타입
import type {
  AcquisitionBreakdown,
  SafetyMargin,
} from "@/types/property";

// ============================================
// 매핑 함수 목록 (Phase 3 구현 완료)
// ============================================

/**
 * 매핑 함수 목록 및 사용 가이드:
 * 
 * ## 기본 타입 매핑
 * 
 * 1. `mapDifficultyLevelToDifficulty(level: DifficultyLevel): Difficulty`
 *    - "초급" → "easy", "중급" → "normal", "고급" → "hard"
 *    - 알 수 없는 값은 "normal" 반환
 * 
 * 2. `mapRightTypeToAuctionType(rightType: string): RightType`
 *    - 15가지 한글 권리명 → 5가지 영문 코드
 *    - 알 수 없는 값은 "pledge" 반환 (보수적)
 * 
 * 3. `mapPropertyTypeToAuctionType(propertyType: string): string`
 *    - 한글 매물 유형 → 영문 코드
 *    - 알 수 없는 값은 "apartment" 반환
 * 
 * ## 데이터 레코드 매핑
 * 
 * 4. `mapRightRecordToRegisteredRight(record: RightRecord): RegisteredRight`
 *    - RightType 변환 포함, 엔진 계산 결과 필드 제외
 * 
 * 5. `mapTenantRecordToTenant(record: TenantRecord): Tenant`
 *    - 필드명 변환 (hasDaehangryeok → hasOpposability), 엔진 계산 결과 필드 제외
 * 
 * 6. `mapSimulationToSnapshot(scenario: SimulationScenario): PropertySnapshot`
 *    - 권리/임차인 배열 변환 포함, 엔진 계산에 불필요한 필드 제외
 * 
 * ## 브리지 함수 (하위 호환성)
 * 
 * 7. `mapEngineOutputToRightsAnalysisResult(output: EngineOutput, scenario: SimulationScenario): RightsAnalysisResult`
 *    - 새 엔진 결과를 기존 컴포넌트 형식으로 변환
 *    - 권리/임차인 배열 복원, 권장 입찰가/리스크 분석 추정 포함
 * 
 * 8. `mapCostBreakdownToAcquisitionBreakdown(costs: CostBreakdown, bidPrice: number, assumedRightsAmount: number): AcquisitionBreakdown`
 *    - 비용 구조 변환, financing/penalty는 0 (v0.1 간소화)
 * 
 * 9. `mapProfitResultToSafetyMargin(profit: ProfitResult, valuation: ValuationResult, exitPrice?: number, userBidPrice?: number): SafetyMargin[]`
 *    - FMV/Exit/User 기준 마진 배열 생성 (2-3개 요소)
 * 
 * ## 검증 함수
 * 
 * 10. `validateAllMappers(): ValidationResult[]`
 *     - 모든 매핑 함수 단위 검증 실행
 * 
 * 통합 플로우 검증은 `mappers-integration-validation.ts` 참조
 */

// ============================================
// 매핑 함수 시그니처 정의 (Phase 3에서 순차적으로 구현)
// ============================================

/**
 * DifficultyLevel을 Difficulty로 변환
 * 
 * 매핑 규칙:
 * - "초급" → "easy"
 * - "중급" → "normal"
 * - "고급" → "hard"
 * 
 * 기본값: 알 수 없는 값은 "normal" 반환
 * 
 * @param level - 기존 DifficultyLevel ("초급" | "중급" | "고급")
 * @returns 변환된 Difficulty ("easy" | "normal" | "hard")
 */
export function mapDifficultyLevelToDifficulty(level: DifficultyLevel): Difficulty {
  console.log("🔄 [매핑] DifficultyLevel → Difficulty 변환 시작", { level });

  let result: Difficulty;

  switch (level) {
    case "초급":
      result = "easy";
      break;
    case "중급":
      result = "normal";
      break;
    case "고급":
      result = "hard";
      break;
    default:
      // 알 수 없는 값은 기본값 "normal" 반환
      console.log("🔄 [매핑] 알 수 없는 DifficultyLevel 값 → 기본값 'normal' 사용", { level });
      result = "normal";
      break;
  }

  console.log("🔄 [매핑] DifficultyLevel → Difficulty 변환 완료", {
    input: level,
    output: result,
  });

  return result;
}

/**
 * RightType (simulation.ts)을 RightType (auction.ts)로 변환
 * 
 * 매핑 규칙:
 * - "근저당권", "저당권" → "mortgage"
 * - "압류", "가압류", "담보가등기" → "pledge"
 * - "주택임차권", "상가임차권", "전세권" → "lease"
 * - "유치권", "법정지상권", "분묘기지권" → "liens"
 * - "가등기", "예고등기", "소유권이전청구권가등기", "가처분" → "superiorEtc"
 * 
 * 기본값: 알 수 없는 값은 "pledge" 반환 (보수적)
 * 
 * @param rightType - 기존 RightType (simulation.ts)
 * @returns 변환된 RightType (auction.ts)
 */
export function mapRightTypeToAuctionType(rightType: string): RightType {
  console.log("🔄 [매핑] RightType → RightType (auction) 변환 시작", { rightType });

  let result: RightType;

  // mortgage 그룹: 근저당권, 저당권
  if (rightType === "근저당권" || rightType === "저당권") {
    result = "mortgage";
  }
  // pledge 그룹: 압류, 가압류, 담보가등기
  else if (rightType === "압류" || rightType === "가압류" || rightType === "담보가등기") {
    result = "pledge";
  }
  // lease 그룹: 주택임차권, 상가임차권, 전세권
  else if (
    rightType === "주택임차권" ||
    rightType === "상가임차권" ||
    rightType === "전세권"
  ) {
    result = "lease";
  }
  // liens 그룹: 유치권, 법정지상권, 분묘기지권
  else if (rightType === "유치권" || rightType === "법정지상권" || rightType === "분묘기지권") {
    result = "liens";
  }
  // superiorEtc 그룹: 가등기, 예고등기, 소유권이전청구권가등기, 가처분
  else if (
    rightType === "가등기" ||
    rightType === "예고등기" ||
    rightType === "소유권이전청구권가등기" ||
    rightType === "가처분"
  ) {
    result = "superiorEtc";
  }
  // 알 수 없는 값은 기본값 "pledge" 반환 (보수적)
  else {
    console.log("🔄 [매핑] 알 수 없는 RightType 값 → 기본값 'pledge' 사용 (보수적)", {
      rightType,
    });
    result = "pledge";
  }

  console.log("🔄 [매핑] RightType → RightType (auction) 변환 완료", {
    input: rightType,
    output: result,
  });

  return result;
}

/**
 * RightRecord를 RegisteredRight로 변환
 * 
 * 필드 매핑:
 * - id: record.id (그대로)
 * - type: mapRightTypeToAuctionType(record.rightType) 사용
 * - amount: record.claimAmount (0이 아닌 경우만)
 * - rankOrder: record.priority (priority > 0인 경우만)
 * - establishedAt: record.registrationDate (빈 문자열이 아닌 경우만)
 * - specialNote: record.notes (그대로)
 * 
 * 제외되는 필드 (엔진 계산 결과):
 * - isMalsoBaseRight, willBeExtinguished, willBeAssumed (엔진이 계산)
 * - rightHolder (엔진 계산에 불필요)
 * 
 * @param record - 기존 RightRecord
 * @returns 변환된 RegisteredRight
 * 
 * @example
 * ```typescript
 * const rightRecord: RightRecord = {
 *   id: "right-1",
 *   rightType: "근저당권",
 *   claimAmount: 100000000,
 *   priority: 1,
 *   registrationDate: "2024-01-01",
 *   rightHolder: "은행",
 *   isMalsoBaseRight: false,
 *   willBeExtinguished: false,
 *   willBeAssumed: true,
 * };
 * 
 * const registered = mapRightRecordToRegisteredRight(rightRecord);
 * // 결과: { id: "right-1", type: "mortgage", amount: 100000000, rankOrder: 1, establishedAt: "2024-01-01" }
 * ```
 */
export function mapRightRecordToRegisteredRight(record: RightRecord): RegisteredRight {
  console.log("🔄 [매핑] RightRecord → RegisteredRight 변환 시작", {
    rightId: record.id,
    rightType: record.rightType,
    claimAmount: record.claimAmount,
  });

  // 필수 필드 매핑
  const result: RegisteredRight = {
    id: record.id,
    type: mapRightTypeToAuctionType(record.rightType),
  };

  // 선택 필드 매핑
  // amount: claimAmount가 0이 아닌 경우만
  if (record.claimAmount && record.claimAmount > 0) {
    result.amount = record.claimAmount;
  }

  // rankOrder: priority가 있을 경우
  if (record.priority !== undefined && record.priority > 0) {
    result.rankOrder = record.priority;
  }

  // establishedAt: registrationDate (그대로)
  if (record.registrationDate) {
    result.establishedAt = record.registrationDate;
  }

  // specialNote: notes (그대로)
  if (record.notes) {
    result.specialNote = record.notes;
  }

  console.log("🔄 [매핑] RightRecord → RegisteredRight 변환 완료", {
    rightId: result.id,
    type: result.type,
    hasAmount: !!result.amount,
    hasRankOrder: !!result.rankOrder,
    hasEstablishedAt: !!result.establishedAt,
    hasSpecialNote: !!result.specialNote,
  });

  return result;
}

/**
 * TenantRecord를 Tenant로 변환
 * 
 * 필드 매핑:
 * - id: record.id (그대로)
 * - deposit: record.deposit (그대로)
 * - name: record.tenantName (그대로)
 * - moveInDate: record.moveInDate (그대로)
 * - fixedDate: record.confirmationDate (null이 아닌 경우만)
 * - hasOpposability: record.hasDaehangryeok (명칭 변경)
 * - vacateRiskNote: record.notes (그대로)
 * - isDefacto: 기본값 false (엔진이 추정)
 * 
 * 제외되는 필드 (엔진 계산 결과):
 * - isSmallTenant, priorityPaymentAmount, willBeAssumed (엔진이 계산)
 * - monthlyRent (엔진 계산에 불필요)
 * 
 * @param record - 기존 TenantRecord
 * @returns 변환된 Tenant
 * 
 * @example
 * ```typescript
 * const tenantRecord: TenantRecord = {
 *   id: "tenant-1",
 *   tenantName: "홍길동",
 *   deposit: 50000000,
 *   moveInDate: "2023-01-01",
 *   confirmationDate: "2023-01-15",
 *   hasDaehangryeok: true,
 *   isSmallTenant: false,
 *   priorityPaymentAmount: 0,
 *   willBeAssumed: true,
 *   monthlyRent: 500000,
 * };
 * 
 * const tenant = mapTenantRecordToTenant(tenantRecord);
 * // 결과: { id: "tenant-1", deposit: 50000000, name: "홍길동", moveInDate: "2023-01-01", fixedDate: "2023-01-15", hasOpposability: true, isDefacto: false }
 * ```
 */
export function mapTenantRecordToTenant(record: TenantRecord): Tenant {
  console.log("🔄 [매핑] TenantRecord → Tenant 변환 시작", {
    tenantId: record.id,
    tenantName: record.tenantName,
    deposit: record.deposit,
  });

  // 필수 필드 매핑
  const result: Tenant = {
    id: record.id,
    deposit: record.deposit,
  };

  // 선택 필드 매핑
  // name: tenantName (그대로)
  if (record.tenantName) {
    result.name = record.tenantName;
  }

  // moveInDate: moveInDate (그대로)
  if (record.moveInDate) {
    result.moveInDate = record.moveInDate;
  }

  // fixedDate: confirmationDate (null이 아닌 경우만)
  if (record.confirmationDate !== null && record.confirmationDate !== undefined) {
    result.fixedDate = record.confirmationDate;
  }

  // hasOpposability: hasDaehangryeok (명칭 변경)
  if (record.hasDaehangryeok !== undefined) {
    result.hasOpposability = record.hasDaehangryeok;
  }

  // vacateRiskNote: notes (그대로)
  if (record.notes) {
    result.vacateRiskNote = record.notes;
  }

  // isDefacto: 기본값 false (엔진이 추정)
  result.isDefacto = false;

  console.log("🔄 [매핑] TenantRecord → Tenant 변환 완료", {
    tenantId: result.id,
    hasName: !!result.name,
    hasMoveInDate: !!result.moveInDate,
    hasFixedDate: !!result.fixedDate,
    hasOpposability: result.hasOpposability,
    hasVacateRiskNote: !!result.vacateRiskNote,
    isDefacto: result.isDefacto,
  });

  return result;
}

/**
 * PropertyType (simulation.ts)을 PropertySnapshot.propertyType으로 변환
 * 
 * 매핑 규칙:
 * - "아파트" → "apartment"
 * - "오피스텔" → "officetel"
 * - "빌라" → "villa"
 * - "단독주택", "주택", "다가구주택", "근린주택", "도시형생활주택" → "villa"
 * - "원룸" → "apartment" (또는 별도 처리)
 * - 토지/상가 등 → "land" / "commercial" (기본값 처리)
 * 
 * 기본값: 알 수 없는 값은 "apartment" 반환
 * 
 * @param propertyType - 기존 PropertyType (simulation.ts)
 * @returns 변환된 propertyType (string)
 */
export function mapPropertyTypeToAuctionType(propertyType: string): string {
  console.log("🔄 [매핑] PropertyType → propertyType (auction) 변환 시작", {
    propertyType,
  });

  let result: string;

  // apartment 그룹: 아파트, 원룸
  if (propertyType === "아파트" || propertyType === "원룸") {
    result = "apartment";
  }
  // officetel 그룹
  else if (propertyType === "오피스텔") {
    result = "officetel";
  }
  // villa 그룹: 빌라, 단독주택, 주택, 다가구주택, 근린주택, 도시형생활주택
  else if (
    propertyType === "빌라" ||
    propertyType === "단독주택" ||
    propertyType === "주택" ||
    propertyType === "다가구주택" ||
    propertyType === "근린주택" ||
    propertyType === "도시형생활주택"
  ) {
    result = "villa";
  }
  // 토지/상가 등 (기본값 처리)
  else if (propertyType === "토지") {
    result = "land";
  } else if (propertyType === "상가" || propertyType === "상점") {
    result = "commercial";
  }
  // 알 수 없는 값은 기본값 "apartment" 반환
  else {
    console.log("🔄 [매핑] 알 수 없는 PropertyType 값 → 기본값 'apartment' 사용", {
      propertyType,
    });
    result = "apartment";
  }

  console.log("🔄 [매핑] PropertyType → propertyType (auction) 변환 완료", {
    input: propertyType,
    output: result,
  });

  return result;
}

/**
 * SimulationScenario를 PropertySnapshot으로 변환
 * 
 * 필드 매핑:
 * - caseId: scenario.basicInfo.caseNumber
 * - propertyType: mapPropertyTypeToAuctionType(scenario.basicInfo.propertyType)
 * - rights: scenario.rights.map(mapRightRecordToRegisteredRight)
 * - tenants: scenario.tenants.map(mapTenantRecordToTenant)
 * - regionCode: scenario.regionalAnalysis.court.code (선택, > 0 체크)
 * - appraisal: scenario.basicInfo.appraisalValue (선택, > 0 체크)
 * - minBid: scenario.basicInfo.minimumBidPrice (선택, > 0 체크)
 * - fmvHint: scenario.basicInfo.marketValue (선택, > 0 체크)
 * - dividendDeadline: scenario.schedule.dividendDeadline (그대로)
 * 
 * 제외되는 필드 (엔진 계산에 불필요):
 * - id, type, basicInfo 상세 정보, propertyDetails, schedule의 다른 필드
 * - biddingHistory, similarSales, regionalAnalysis 상세 정보, educationalContent, createdAt
 * 
 * @param scenario - 기존 SimulationScenario
 * @returns 변환된 PropertySnapshot
 * 
 * @example
 * ```typescript
 * const scenario: SimulationScenario = { ... };
 * const snapshot = mapSimulationToSnapshot(scenario);
 * 
 * // 엔진 실행
 * const output = auctionEngine({
 *   snapshot,
 *   userBidPrice: 400000000,
 * });
 * ```
 */
export function mapSimulationToSnapshot(scenario: SimulationScenario): PropertySnapshot {
  console.log("🔄 [매핑] SimulationScenario → PropertySnapshot 변환 시작", {
    caseId: scenario.basicInfo.caseNumber,
    propertyType: scenario.basicInfo.propertyType,
    rightsCount: scenario.rights.length,
    tenantsCount: scenario.tenants.length,
  });

  // 필수 필드 매핑
  const result: PropertySnapshot = {
    caseId: scenario.basicInfo.caseNumber,
    propertyType: mapPropertyTypeToAuctionType(scenario.basicInfo.propertyType),
    rights: scenario.rights.map(mapRightRecordToRegisteredRight),
    tenants: scenario.tenants.map(mapTenantRecordToTenant),
  };

  // 선택 필드 매핑
  // regionCode: regionalAnalysis.court.code (선택)
  if (scenario.regionalAnalysis?.court?.code) {
    result.regionCode = scenario.regionalAnalysis.court.code;
  }

  // appraisal: basicInfo.appraisalValue (그대로)
  if (scenario.basicInfo.appraisalValue !== undefined && scenario.basicInfo.appraisalValue > 0) {
    result.appraisal = scenario.basicInfo.appraisalValue;
  }

  // minBid: basicInfo.minimumBidPrice (그대로)
  if (
    scenario.basicInfo.minimumBidPrice !== undefined &&
    scenario.basicInfo.minimumBidPrice > 0
  ) {
    result.minBid = scenario.basicInfo.minimumBidPrice;
  }

  // fmvHint: basicInfo.marketValue (그대로)
  if (scenario.basicInfo.marketValue !== undefined && scenario.basicInfo.marketValue > 0) {
    result.fmvHint = scenario.basicInfo.marketValue;
  }

  // dividendDeadline: schedule.dividendDeadline (그대로)
  if (scenario.schedule?.dividendDeadline) {
    result.dividendDeadline = scenario.schedule.dividendDeadline;
  }

  console.log("🔄 [매핑] SimulationScenario → PropertySnapshot 변환 완료", {
    caseId: result.caseId,
    propertyType: result.propertyType,
    rightsCount: result.rights.length,
    tenantsCount: result.tenants.length,
    hasRegionCode: !!result.regionCode,
    hasAppraisal: !!result.appraisal,
    hasMinBid: !!result.minBid,
    hasFmvHint: !!result.fmvHint,
    hasDividendDeadline: !!result.dividendDeadline,
  });

  return result;
}

/**
 * EngineOutput을 RightsAnalysisResult로 변환 (하위 호환성 브리지 함수)
 * 
 * 목적: 새 엔진 결과를 기존 컴포넌트가 기대하는 형식으로 변환
 * 
 * ============================================
 * 3.6.1 기존 RightsAnalysisResult 구조 분석
 * ============================================
 * 
 * 기존 RightsAnalysisResult 필수 필드:
 * 1. malsoBaseRight: RightRecord | null
 *    - 말소기준권리 (배당요구종기일 이전 설정된 최선순위 담보성 권리)
 *    - EngineOutput에서: output.rights.malsoBase (RegisteredRight | null)
 *    - 매핑: scenario.rights에서 동일한 id 찾아 RightRecord 반환
 * 
 * 2. extinguishedRights: RightRecord[]
 *    - 소멸되는 권리 (말소기준권리보다 후순위)
 *    - EngineOutput에서: output.rights.rightFindings에서 assumed: false인 권리
 *    - 매핑: scenario.rights에서 해당 권리 RightRecord[] 반환
 * 
 * 3. assumedRights: RightRecord[]
 *    - 인수해야 할 권리 (말소기준권리보다 선순위)
 *    - EngineOutput에서: output.rights.rightFindings에서 assumed: true인 권리
 *    - 매핑: scenario.rights에서 해당 권리 RightRecord[] 반환
 * 
 * 4. totalAssumedAmount: number
 *    - 총 인수금액(권리만) - 등기 권리 금액 합계
 *    - EngineOutput에서: output.rights.rightFindings에서 amountAssumed 합계
 *    - 주의: output.rights.assumedRightsAmount는 등기 권리 + 임차보증금 합계이므로,
 *            등기 권리만 계산하려면 assumedRights의 claimAmount 합계 또는 rightFindings에서 계산
 * 
 * 5. assumedTenants: TenantRecord[]
 *    - 인수해야 할 임차인
 *    - EngineOutput에서: output.rights.tenantFindings에서 assumed: true인 임차인
 *    - 매핑: scenario.tenants에서 해당 임차인 TenantRecord[] 반환
 * 
 * 6. totalTenantDeposit: number
 *    - 임차보증금 총액
 *    - EngineOutput에서: assumedTenants의 deposit 합계 또는
 *                        output.rights.tenantFindings에서 depositAssumed 합계
 * 
 * 7. totalAcquisition: number
 *    - 총인수금액 = bidPrice + rights + taxes + evictionCost + miscCost
 *    - EngineOutput에서: output.costs.totalAcquisition (엔진 계산 결과)
 * 
 * 8. safetyMargin: number
 *    - 안전마진 = FMV - 총인수금액
 *    - EngineOutput에서: output.profit.marginVsFMV 또는 output.safety.fmv.amount
 * 
 * 9. recommendedBidRange: { min: number, max: number, optimal: number }
 *    - 권장 입찰가 범위
 *    - EngineOutput에서: 직접 계산하지 않음 (v0.1에서는 간소화)
 *    - 추정값 사용:
 *      - min: output.valuation.minBid * 0.9 (보수적)
 *      - max: output.valuation.fmv * 1.1 (공격적)
 *      - optimal: output.valuation.fmv * 0.95 (중간값)
 * 
 * 10. riskAnalysis: { overallRiskLevel, riskScore, riskFactors, recommendations }
 *     - 리스크 분석 결과
 *     - EngineOutput에서: 직접 계산하지 않음 (v0.1에서는 간소화)
 *     - 추정값 사용:
 *       - overallRiskLevel: safetyMargin 기반 판단
 *       - riskScore: 0-100 점수 (안전마진률 기반)
 *       - riskFactors: 권리/임차인 리스크 요인 추출
 *       - recommendations: 기본 권장사항
 * 
 * 기존 RightsAnalysisResult 선택 필드:
 * 1. marketValue?: { fairMarketValue, auctionCenter, center }
 *    - 시장가 정보
 *    - EngineOutput에서: output.valuation.fmv 사용
 *    - fairMarketValue: output.valuation.fmv
 *    - auctionCenter, center: 기본값 또는 output.valuation.fmv 사용
 * 
 * 2. advancedSafetyMargin?: { minSafetyMargin, assumedAmount, trace }
 *    - 고도화 안전마진 계산 결과 (v1.2)
 *    - EngineOutput에서: 직접 계산하지 않음 (v0.1에서는 간소화)
 *    - 기본값 undefined 또는 output.profit 기반 계산
 * 
 * 3. tenantRisk?: { riskScore, riskLabel, evictionCostMin, evictionCostMax, ... }
 *    - 점유 리스크 분석 결과 (v1.0)
 *    - EngineOutput에서: 직접 계산하지 않음 (v0.1에서는 간소화)
 *    - 기본값 undefined 또는 output.rights.tenantFindings 기반 추정
 * 
 * ============================================
 * EngineOutput에서 사용 가능한 데이터
 * ============================================
 * 
 * output.valuation: ValuationResult
 *   - fmv: 공정시세 (FMV)
 *   - appraisal: 감정가
 *   - minBid: 최저가
 *   - notes: 계산 과정 메모
 * 
 * output.rights: RightAnalysisResult
 *   - malsoBase: 말소기준권리 (RegisteredRight | null)
 *   - assumedRightsAmount: 인수 권리 총액 (등기 권리 + 임차보증금 합계)
 *   - tenantFindings: 임차인별 분석 결과 배열
 *     - tenantId, opposability, assumed, reason, depositAssumed
 *   - rightFindings: 권리별 인수/소멸 판단 결과 배열
 *     - rightId, assumed, reason, amountAssumed
 *   - notes: 계산 과정 메모
 * 
 * output.costs: CostBreakdown
 *   - taxes: { acquisitionTax, educationTax, specialTax, totalTax }
 *   - evictionCost: 명도 비용
 *   - miscCost: 기타 부대비용
 *   - totalAcquisition: 총인수금액
 *   - notes: 계산 과정 메모
 * 
 * output.profit: ProfitResult
 *   - marginVsFMV: FMV 기준 마진
 *   - marginRateVsFMV: FMV 기준 마진률
 *   - marginVsExit: Exit 기준 마진
 *   - marginRateVsExit: Exit 기준 마진률
 *   - bePoint: 손익분기점 가격
 *   - notes: 계산 과정 메모
 * 
 * output.safety: Safety 객체
 *   - fmv: { amount, rate } - FMV 기준 안전마진
 *   - exit: { amount, rate } - Exit 기준 안전마진
 *   - userBid: { amount, rate } - 사용자 입찰가 기준 마진
 *   - overFMV: 입찰가가 FMV 초과 여부
 * 
 * ============================================
 * 필드 매핑 전략
 * ============================================
 * 
 * 필드 매핑:
 * - malsoBaseRight: output.rights.malsoBase가 있으면 scenario.rights에서 동일한 id 찾기
 * - extinguishedRights: output.rights.rightFindings에서 assumed: false인 권리 찾기
 * - assumedRights: output.rights.rightFindings에서 assumed: true인 권리 찾기
 * - totalAssumedAmount: output.rights.rightFindings에서 amountAssumed 합계 (등기 권리만)
 * - assumedTenants: output.rights.tenantFindings에서 assumed: true인 임차인 찾기
 * - totalTenantDeposit: assumedTenants의 deposit 합계 또는 tenantFindings에서 depositAssumed 합계
 * - totalAcquisition: output.costs.totalAcquisition (엔진 계산 결과)
 * - safetyMargin: output.profit.marginVsFMV (FMV 기준 안전마진)
 * - recommendedBidRange: 기본값 또는 엔진 결과에서 추정
 * - riskAnalysis: 기본값 또는 엔진 결과에서 추정
 * 
 * 선택 필드 (marketValue, advancedSafetyMargin, tenantRisk):
 * - 기본값 undefined 또는 엔진 결과 기반 추정
 * 
 * @param output - 엔진 출력 결과 (EngineOutput)
 * @param scenario - 원본 SimulationScenario (RightRecord[], TenantRecord[] 복원 필요)
 * @returns 변환된 RightsAnalysisResult (기존 컴포넌트 호환)
 * 
 * @example
 * ```typescript
 * // 1. 시나리오를 스냅샷으로 변환
 * const snapshot = mapSimulationToSnapshot(scenario);
 * 
 * // 2. 엔진 실행
 * const output = auctionEngine({
 *   snapshot,
 *   userBidPrice: 400000000,
 *   exitPriceHint: 450000000,
 * });
 * 
 * // 3. 브리지 함수로 기존 형식 변환
 * const rightsAnalysis = mapEngineOutputToRightsAnalysisResult(output, scenario);
 * 
 * // 기존 컴포넌트에서 사용 가능
 * // rightsAnalysis.malsoBaseRight, rightsAnalysis.assumedRights,
 * // rightsAnalysis.totalAcquisition, rightsAnalysis.safetyMargin 등
 * ```
 */
export function mapEngineOutputToRightsAnalysisResult(
  output: EngineOutput,
  scenario: SimulationScenario
): RightsAnalysisResult {
  console.log("🔄 [브리지] EngineOutput → RightsAnalysisResult 변환 시작", {
    caseId: scenario.basicInfo.caseNumber,
    rightsCount: scenario.rights.length,
    tenantsCount: scenario.tenants.length,
    hasMalsoBase: !!output.rights.malsoBase,
    assumedRightsAmount: output.rights.assumedRightsAmount,
    totalAcquisition: output.costs.totalAcquisition,
  });

  // Phase 3.6.3 - 말소기준권리 및 권리 배열 매핑
  // malsoBaseRight: output.rights.malsoBase가 있으면 scenario.rights에서 동일한 id 찾기
  let malsoBaseRight: RightRecord | null = null;
  if (output.rights.malsoBase) {
    const found = scenario.rights.find((r) => r.id === output.rights.malsoBase?.id);
    if (found) {
      malsoBaseRight = found;
      console.log("🔄 [브리지] 말소기준권리 매핑 완료", {
        rightId: found.id,
        rightType: found.rightType,
        claimAmount: found.claimAmount,
      });
    } else {
      console.log("🔄 [브리지] 말소기준권리 매핑 실패: scenario.rights에서 찾을 수 없음", {
        rightId: output.rights.malsoBase.id,
      });
    }
  }

  // extinguishedRights: output.rights.rightFindings에서 assumed: false인 권리 찾기
  const extinguishedRightIds = output.rights.rightFindings
    .filter((f) => !f.assumed)
    .map((f) => f.rightId);
  const extinguishedRights = scenario.rights.filter((r) =>
    extinguishedRightIds.includes(r.id)
  );

  // assumedRights: output.rights.rightFindings에서 assumed: true인 권리 찾기
  const assumedRightIds = output.rights.rightFindings
    .filter((f) => f.assumed)
    .map((f) => f.rightId);
  const assumedRights = scenario.rights.filter((r) => assumedRightIds.includes(r.id));

  // totalAssumedAmount: rightFindings에서 직접 amountAssumed 합계 계산 (등기 권리만)
  // 주의: output.rights.assumedRightsAmount는 등기 권리 + 임차보증금 합계이므로,
  //       등기 권리만 계산하려면 rightFindings의 amountAssumed 합계를 사용
  // 수정: rightFindings에서 직접 계산하여 ID 매칭 문제 방지 및 엔진 계산 결과 그대로 사용
  const assumedRightFindings = output.rights.rightFindings.filter((f) => f.assumed);
  const totalAssumedAmount = assumedRightFindings.reduce(
    (sum, f) => sum + f.amountAssumed,
    0
  );

  // 🔍 디버깅: 상세 정보 수집
  const rightFindingsDetail = output.rights.rightFindings.map((f) => ({
    rightId: f.rightId,
    assumed: f.assumed,
    amountAssumed: f.amountAssumed,
    reason: f.reason,
  }));

  const assumedRightFindingsDetail = assumedRightFindings.map((f) => ({
    rightId: f.rightId,
    amountAssumed: f.amountAssumed,
    reason: f.reason,
  }));

  console.log("🔄 [브리지] 권리 배열 매핑 완료", {
    malsoBaseRightId: malsoBaseRight?.id || null,
    extinguishedRightsCount: extinguishedRights.length,
    assumedRightsCount: assumedRights.length,
    totalAssumedAmount,
    totalAssumedAmountFromRightFindings: totalAssumedAmount,
    totalAssumedAmountFromEngine: output.rights.assumedRightsAmount,
    assumedRightIds,
    assumedRightIdsCount: assumedRightIds.length,
    assumedRightsFromScenario: assumedRights.map((r) => ({
      id: r.id,
      claimAmount: r.claimAmount,
    })),
    // 🔍 디버깅: rightFindings 상세 정보
    rightFindingsCount: output.rights.rightFindings.length,
    rightFindingsDetail,
    assumedRightFindingsCount: assumedRightFindings.length,
    assumedRightFindingsDetail,
    // 🔍 디버깅: 총합 검증
    sumOfAssumedAmountAssumed: assumedRightFindings.reduce((sum, f) => sum + f.amountAssumed, 0),
    allRightFindingsAssumed: output.rights.rightFindings.every((f) => f.assumed),
    anyRightFindingsAssumed: output.rights.rightFindings.some((f) => f.assumed),
  });

  // Phase 3.6.4 - 임차인 배열 매핑
  // assumedTenants: output.rights.tenantFindings에서 assumed: true인 임차인 찾기
  const assumedTenantIds = output.rights.tenantFindings
    .filter((f) => f.assumed)
    .map((f) => f.tenantId);
  const assumedTenants = scenario.tenants.filter((t) =>
    assumedTenantIds.includes(t.id)
  );

  // totalTenantDeposit: assumedTenants의 deposit 합계 계산
  // 또는 output.rights.tenantFindings에서 depositAssumed 합계 사용
  const totalTenantDeposit = output.rights.tenantFindings
    .filter((f) => f.assumed)
    .reduce((sum, f) => sum + f.depositAssumed, 0);

  console.log("🔄 [브리지] 임차인 배열 매핑 완료", {
    assumedTenantsCount: assumedTenants.length,
    totalTenantDeposit,
    totalTenantDepositFromFindings: totalTenantDeposit,
    assumedTenantIds,
  });

  // Phase 3.6.5 - 총인수금액 및 안전마진 매핑
  // totalAcquisition: output.costs.totalAcquisition 사용 (엔진 계산 결과)
  const totalAcquisition = output.costs.totalAcquisition;

  // safetyMargin: output.profit.marginVsFMV 사용 (FMV 기준 안전마진)
  // 또는 output.safety.fmv.amount 사용 (동일한 값)
  const safetyMargin = output.profit.marginVsFMV;

  console.log("🔄 [브리지] 총인수금액 및 안전마진 매핑 완료", {
    totalAcquisition,
    safetyMargin,
    safetyMarginFromSafety: output.safety.fmv.amount,
    fmv: output.valuation.fmv,
  });

  // Phase 3.6.6 - 권장 입찰가 범위 및 리스크 분석 매핑
  // recommendedBidRange: v0.1 엔진은 권장 입찰가 범위를 직접 계산하지 않으므로, 추정값 사용
  const recommendedBidRange = {
    min: Math.round(output.valuation.minBid * 0.9), // 보수적
    max: Math.round(output.valuation.fmv * 1.1), // 공격적
    optimal: Math.round(output.valuation.fmv * 0.95), // 중간값
  };

  // riskAnalysis: v0.1 엔진은 리스크 분석을 직접 제공하지 않으므로, 안전마진 기반 추정
  // overallRiskLevel: 안전마진 기반 판단
  const safetyMarginRate = output.valuation.fmv > 0 
    ? safetyMargin / output.valuation.fmv 
    : 0;
  
  let overallRiskLevel: "high" | "medium" | "low";
  if (safetyMarginRate < 0.1) {
    overallRiskLevel = "high";
  } else if (safetyMarginRate < 0.2) {
    overallRiskLevel = "medium";
  } else {
    overallRiskLevel = "low";
  }

  // riskScore: 0-100 점수 (안전마진률 기반, 낮을수록 위험)
  // 안전마진률이 0.3 이상이면 0점(최저 위험), 0 미만이면 100점(최고 위험)
  const riskScore = Math.max(0, Math.min(100, Math.round((0.3 - safetyMarginRate) * 333.33)));

  // riskFactors: 권리/임차인 리스크 요인 추출
  const riskFactors: string[] = [];
  if (safetyMargin < 0) {
    riskFactors.push("안전마진이 음수입니다 (총인수금액이 FMV를 초과)");
  }
  if (assumedRights.length > 0) {
    riskFactors.push(`인수 권리 ${assumedRights.length}개 존재`);
  }
  if (assumedTenants.length > 0) {
    riskFactors.push(`인수 임차인 ${assumedTenants.length}명 존재`);
  }
  if (output.safety.overFMV) {
    riskFactors.push("입찰가가 FMV를 초과합니다");
  }
  if (extinguishedRights.length === 0 && assumedRights.length > 0) {
    riskFactors.push("소멸 권리가 없고 인수 권리만 존재");
  }

  // recommendations: 기본 권장사항
  const recommendations: string[] = [];
  if (safetyMarginRate < 0.1) {
    recommendations.push("안전마진이 낮아 신중한 검토가 필요합니다");
  }
  if (assumedTenants.length > 0) {
    recommendations.push("임차인 명도 비용을 고려하여 입찰가를 결정하세요");
  }
  if (output.safety.overFMV) {
    recommendations.push("FMV를 초과하는 입찰가는 리스크가 높습니다");
  }
  if (safetyMarginRate >= 0.2) {
    recommendations.push("충분한 안전마진이 확보되어 안정적인 투자입니다");
  }

  const riskAnalysis = {
    overallRiskLevel,
    riskScore,
    riskFactors,
    recommendations,
  };

  console.log("🔄 [브리지] 권장 입찰가 범위 및 리스크 분석 매핑 완료", {
    recommendedBidRange,
    riskAnalysis: {
      overallRiskLevel,
      riskScore,
      riskFactorsCount: riskFactors.length,
      recommendationsCount: recommendations.length,
    },
    safetyMarginRate,
  });

  // Phase 3.6.7 - 선택 필드 매핑 (marketValue, advancedSafetyMargin, tenantRisk)
  // 선택 필드는 기존 컴포넌트가 사용하지 않을 수 있으므로 기본값 처리 가능

  // marketValue: 시장가 정보 (선택 필드)
  const marketValue = {
    fairMarketValue: output.valuation.fmv,
    auctionCenter: output.valuation.fmv, // 기본값: FMV 사용
    center: output.valuation.fmv, // 기본값: FMV 사용
  };

  // advancedSafetyMargin: 고도화 안전마진 계산 결과 (v1.2, 선택 필드)
  // v0.1에서는 간소화되어 있으므로 기본값 undefined
  // 필요 시 output.profit 기반으로 간단한 계산 가능
  const advancedSafetyMargin = undefined;

  // tenantRisk: 점유 리스크 분석 결과 (v1.0, 선택 필드)
  // v0.1에서는 간소화되어 있으므로 기본값 undefined
  // 필요 시 output.rights.tenantFindings 기반으로 간단한 추정 가능
  const tenantRisk = undefined;

  console.log("🔄 [브리지] 선택 필드 매핑 완료", {
    hasMarketValue: !!marketValue,
    hasAdvancedSafetyMargin: !!advancedSafetyMargin,
    hasTenantRisk: !!tenantRisk,
  });

  // 필수 필드 기본 구조 생성
  const result: RightsAnalysisResult = {
    // Phase 3.6.3에서 구현 완료
    malsoBaseRight,
    extinguishedRights,
    assumedRights,
    totalAssumedAmount, // 기존 호환성 유지 (등기 권리만)
    assumedRightsAmount: output.rights.assumedRightsAmount, // ✅ v0.1: 인수권리 + 임차인 보증금 합계

    // Phase 3.6.4에서 구현 완료
    assumedTenants,
    totalTenantDeposit,

    // Phase 3.6.5에서 구현 완료
    totalAcquisition,
    safetyMargin,

    // Phase 3.6.6에서 구현 완료
    recommendedBidRange,
    riskAnalysis,

    // Phase 3.6.7에서 구현 완료 (선택 필드)
    marketValue,
    advancedSafetyMargin,
    tenantRisk,
  };

  // Phase 3.6.8 - 브리지 함수 완성 및 검증
  // 모든 필수 필드 매핑 완료 확인
  const allRequiredFieldsPresent =
    result.malsoBaseRight !== undefined &&
    Array.isArray(result.extinguishedRights) &&
    Array.isArray(result.assumedRights) &&
    typeof result.totalAssumedAmount === "number" &&
    Array.isArray(result.assumedTenants) &&
    typeof result.totalTenantDeposit === "number" &&
    typeof result.totalAcquisition === "number" &&
    typeof result.safetyMargin === "number" &&
    result.recommendedBidRange !== undefined &&
    result.riskAnalysis !== undefined;

  if (!allRequiredFieldsPresent) {
    console.warn("🔄 [브리지] 필수 필드 매핑 누락 가능성", {
      hasMalsoBaseRight: result.malsoBaseRight !== undefined,
      hasExtinguishedRights: Array.isArray(result.extinguishedRights),
      hasAssumedRights: Array.isArray(result.assumedRights),
      hasTotalAssumedAmount: typeof result.totalAssumedAmount === "number",
      hasAssumedTenants: Array.isArray(result.assumedTenants),
      hasTotalTenantDeposit: typeof result.totalTenantDeposit === "number",
      hasTotalAcquisition: typeof result.totalAcquisition === "number",
      hasSafetyMargin: typeof result.safetyMargin === "number",
      hasRecommendedBidRange: result.recommendedBidRange !== undefined,
      hasRiskAnalysis: result.riskAnalysis !== undefined,
    });
  }

  console.log("🔄 [브리지] EngineOutput → RightsAnalysisResult 변환 완료", {
    caseId: scenario.basicInfo.caseNumber,
    allRequiredFieldsPresent,
    // 권리 관련
    hasMalsoBaseRight: !!result.malsoBaseRight,
    extinguishedRightsCount: result.extinguishedRights.length,
    assumedRightsCount: result.assumedRights.length,
    totalAssumedAmount: result.totalAssumedAmount,
    // 임차인 관련
    assumedTenantsCount: result.assumedTenants.length,
    totalTenantDeposit: result.totalTenantDeposit,
    // 금액 관련
    totalAcquisition: result.totalAcquisition,
    safetyMargin: result.safetyMargin,
    safetyMarginRate: safetyMarginRate,
    // 권장 입찰가 범위
    recommendedBidRange: result.recommendedBidRange,
    // 리스크 분석
    riskAnalysis: {
      overallRiskLevel: result.riskAnalysis.overallRiskLevel,
      riskScore: result.riskAnalysis.riskScore,
      riskFactorsCount: result.riskAnalysis.riskFactors.length,
      recommendationsCount: result.riskAnalysis.recommendations.length,
    },
    // 선택 필드
    hasMarketValue: !!result.marketValue,
    hasAdvancedSafetyMargin: !!result.advancedSafetyMargin,
    hasTenantRisk: !!result.tenantRisk,
  });

  return result;
}

/**
 * CostBreakdown을 AcquisitionBreakdown으로 변환
 * 
 * 필드 매핑:
 * - bidPrice: 입력 파라미터 (CostBreakdown에는 없음)
 * - rights: assumedRightsAmount (입력 파라미터)
 * - taxes: costs.taxes.totalTax
 * - costs: costs.evictionCost (명도비)
 * - financing: 0 (v0.1에서는 간소화)
 * - penalty: 0 (v0.1에서는 간소화)
 * - misc: costs.miscCost
 * - total: costs.totalAcquisition
 * 
 * @param costs - 엔진 CostBreakdown 결과
 * @param bidPrice - 사용자 입찰가
 * @param assumedRightsAmount - 인수 권리 총액
 * @returns 변환된 AcquisitionBreakdown
 * 
 * @example
 * ```typescript
 * const costs: CostBreakdown = {
 *   taxes: { acquisitionTax: 5500000, educationTax: 550000, specialTax: 1100000, totalTax: 7150000 },
 *   evictionCost: 3000000,
 *   miscCost: 1000000,
 *   totalAcquisition: 500000000,
 * };
 * 
 * const acquisition = mapCostBreakdownToAcquisitionBreakdown(
 *   costs,
 *   400000000, // bidPrice
 *   100000000  // assumedRightsAmount
 * );
 * // 결과: { bidPrice: 400000000, rights: 100000000, taxes: 7150000, costs: 3000000, financing: 0, penalty: 0, misc: 1000000, total: 500000000 }
 * ```
 */
export function mapCostBreakdownToAcquisitionBreakdown(
  costs: CostBreakdown,
  bidPrice: number,
  assumedRightsAmount: number
): AcquisitionBreakdown {
  console.log("🔄 [매핑] CostBreakdown → AcquisitionBreakdown 변환 시작", {
    bidPrice,
    assumedRightsAmount,
    totalAcquisition: costs.totalAcquisition,
  });

  const result: AcquisitionBreakdown = {
    bidPrice,
    rights: assumedRightsAmount,
    taxes: costs.taxes.totalTax,
    costs: costs.evictionCost, // 명도비
    financing: 0, // v0.1에서는 간소화
    penalty: 0, // v0.1에서는 간소화
    misc: costs.miscCost,
    total: costs.totalAcquisition,
  };

  // 총합 일치 확인 (검증)
  const calculatedTotal =
    result.bidPrice +
    result.rights +
    result.taxes +
    result.costs +
    result.financing +
    result.penalty +
    result.misc;

  if (Math.abs(calculatedTotal - result.total) > 1) {
    // 1원 오차 허용 (반올림 오차)
    console.warn("🔄 [매핑] 총합 불일치 경고", {
      calculatedTotal,
      engineTotal: result.total,
      difference: calculatedTotal - result.total,
    });
  }

  console.log("🔄 [매핑] CostBreakdown → AcquisitionBreakdown 변환 완료", {
    bidPrice: result.bidPrice,
    rights: result.rights,
    taxes: result.taxes,
    costs: result.costs,
    financing: result.financing,
    penalty: result.penalty,
    misc: result.misc,
    total: result.total,
    calculatedTotal,
    isMatch: Math.abs(calculatedTotal - result.total) <= 1,
  });

  return result;
}

/**
 * ProfitResult를 SafetyMargin[]로 변환
 * 
 * SafetyMargin 배열 생성:
 * - FMV 기준 마진: profit.marginVsFMV, profit.marginRateVsFMV 사용
 * - Exit 기준 마진: profit.marginVsExit, profit.marginRateVsExit 사용
 * - USER 기준 마진 (선택): valuation.fmv - userBidPrice 계산
 * 
 * 0으로 나누기 방지: referencePrice > 0 체크
 * 
 * @param profit - 엔진 ProfitResult
 * @param valuation - ValuationResult (FMV 참조)
 * @param exitPrice - Exit 가격 (선택, 없으면 FMV 사용)
 * @param userBidPrice - 사용자 입찰가 (선택, USER 기준 마진 생성 시 사용)
 * @returns SafetyMargin[] 배열 (2개 또는 3개)
 * 
 * @example
 * ```typescript
 * const profit: ProfitResult = {
 *   marginVsFMV: 50000000,
 *   marginRateVsFMV: 0.1,
 *   marginVsExit: 60000000,
 *   marginRateVsExit: 0.12,
 *   bePoint: 450000000,
 * };
 * 
 * const valuation: ValuationResult = {
 *   fmv: 500000000,
 *   appraisal: 450000000,
 *   minBid: 360000000,
 * };
 * 
 * // FMV, EXIT만 (2개)
 * const margins1 = mapProfitResultToSafetyMargin(profit, valuation);
 * 
 * // USER 포함 (3개)
 * const margins2 = mapProfitResultToSafetyMargin(profit, valuation, undefined, 450000000);
 * ```
 */
export function mapProfitResultToSafetyMargin(
  profit: ProfitResult,
  valuation: ValuationResult,
  exitPrice?: number,
  userBidPrice?: number
): SafetyMargin[] {
  console.log("🔄 [매핑] ProfitResult → SafetyMargin[] 변환 시작", {
    fmv: valuation.fmv,
    hasExitPrice: exitPrice !== undefined,
    hasUserBidPrice: userBidPrice !== undefined,
  });

  const margins: SafetyMargin[] = [];

  // FMV 기준 마진
  if (valuation.fmv > 0) {
    margins.push({
      label: "FMV",
      amount: profit.marginVsFMV,
      pct: profit.marginRateVsFMV,
      referencePrice: valuation.fmv,
    });
  }

  // Exit 기준 마진
  const exitRefPrice = exitPrice ?? valuation.fmv;
  if (exitRefPrice > 0) {
    margins.push({
      label: "EXIT",
      amount: profit.marginVsExit,
      pct: profit.marginRateVsExit,
      referencePrice: exitRefPrice,
    });
  }

  // USER 기준 마진 (선택: userBidPrice가 있는 경우)
  if (userBidPrice !== undefined && valuation.fmv > 0) {
    const userMarginAmount = valuation.fmv - userBidPrice;
    const userMarginRate = valuation.fmv > 0 ? userMarginAmount / valuation.fmv : 0;

    margins.push({
      label: "USER",
      amount: userMarginAmount,
      pct: userMarginRate,
      referencePrice: valuation.fmv,
    });
  }

  console.log("🔄 [매핑] ProfitResult → SafetyMargin[] 변환 완료", {
    marginsCount: margins.length,
    margins: margins.map((m) => ({
      label: m.label,
      amount: m.amount,
      pct: m.pct,
      referencePrice: m.referencePrice,
    })),
  });

  return margins;
}

// ============================================
// 매핑 함수 검증 유틸리티 (Phase 3.9.1)
// ============================================

/**
 * 매핑 함수 검증 결과
 */
interface ValidationResult {
  functionName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 모든 매핑 함수 검증 실행
 * 
 * @returns 검증 결과 배열
 */
export function validateAllMappers(): ValidationResult[] {
  console.log("🧪 [검증] 모든 매핑 함수 검증 시작");

  const results: ValidationResult[] = [];

  // 1. mapDifficultyLevelToDifficulty 검증
  results.push(validateMapDifficultyLevelToDifficulty());

  // 2. mapRightTypeToAuctionType 검증
  results.push(validateMapRightTypeToAuctionType());

  // 3. mapRightRecordToRegisteredRight 검증
  results.push(validateMapRightRecordToRegisteredRight());

  // 4. mapTenantRecordToTenant 검증
  results.push(validateMapTenantRecordToTenant());

  // 5. mapSimulationToSnapshot 검증
  results.push(validateMapSimulationToSnapshot());

  // 6. mapCostBreakdownToAcquisitionBreakdown 검증
  results.push(validateMapCostBreakdownToAcquisitionBreakdown());

  // 7. mapProfitResultToSafetyMargin 검증
  results.push(validateMapProfitResultToSafetyMargin());

  // 검증 결과 요약
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log("🧪 [검증] 모든 매핑 함수 검증 완료", {
    totalTests,
    passedTests,
    failedTests,
    results: results.map((r) => ({
      functionName: r.functionName,
      passed: r.passed,
      errorCount: r.errors.length,
      warningCount: r.warnings.length,
    })),
  });

  return results;
}

/**
 * mapDifficultyLevelToDifficulty 검증
 */
function validateMapDifficultyLevelToDifficulty(): ValidationResult {
  const result: ValidationResult = {
    functionName: "mapDifficultyLevelToDifficulty",
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    // "초급" → "easy" 확인
    const easy = mapDifficultyLevelToDifficulty("초급");
    if (easy !== "easy") {
      result.errors.push(`"초급" → "easy" 실패: ${easy}`);
      result.passed = false;
    }

    // "중급" → "normal" 확인
    const normal = mapDifficultyLevelToDifficulty("중급");
    if (normal !== "normal") {
      result.errors.push(`"중급" → "normal" 실패: ${normal}`);
      result.passed = false;
    }

    // "고급" → "hard" 확인
    const hard = mapDifficultyLevelToDifficulty("고급");
    if (hard !== "hard") {
      result.errors.push(`"고급" → "hard" 실패: ${hard}`);
      result.passed = false;
    }

    // 알 수 없는 값 → "normal" 확인
    const unknown = mapDifficultyLevelToDifficulty("알수없음" as DifficultyLevel);
    if (unknown !== "normal") {
      result.errors.push(`알 수 없는 값 → "normal" 실패: ${unknown}`);
      result.passed = false;
    }
  } catch (error) {
    result.errors.push(`검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  return result;
}

/**
 * mapRightTypeToAuctionType 검증
 */
function validateMapRightTypeToAuctionType(): ValidationResult {
  const result: ValidationResult = {
    functionName: "mapRightTypeToAuctionType",
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    // mortgage 그룹
    const mortgage1 = mapRightTypeToAuctionType("근저당권");
    const mortgage2 = mapRightTypeToAuctionType("저당권");
    if (mortgage1 !== "mortgage" || mortgage2 !== "mortgage") {
      result.errors.push(`mortgage 그룹 매핑 실패: ${mortgage1}, ${mortgage2}`);
      result.passed = false;
    }

    // pledge 그룹
    const pledge1 = mapRightTypeToAuctionType("압류");
    const pledge2 = mapRightTypeToAuctionType("가압류");
    const pledge3 = mapRightTypeToAuctionType("담보가등기");
    if (pledge1 !== "pledge" || pledge2 !== "pledge" || pledge3 !== "pledge") {
      result.errors.push(`pledge 그룹 매핑 실패: ${pledge1}, ${pledge2}, ${pledge3}`);
      result.passed = false;
    }

    // lease 그룹
    const lease1 = mapRightTypeToAuctionType("주택임차권");
    const lease2 = mapRightTypeToAuctionType("상가임차권");
    const lease3 = mapRightTypeToAuctionType("전세권");
    if (lease1 !== "lease" || lease2 !== "lease" || lease3 !== "lease") {
      result.errors.push(`lease 그룹 매핑 실패: ${lease1}, ${lease2}, ${lease3}`);
      result.passed = false;
    }

    // liens 그룹
    const liens1 = mapRightTypeToAuctionType("유치권");
    const liens2 = mapRightTypeToAuctionType("법정지상권");
    const liens3 = mapRightTypeToAuctionType("분묘기지권");
    if (liens1 !== "liens" || liens2 !== "liens" || liens3 !== "liens") {
      result.errors.push(`liens 그룹 매핑 실패: ${liens1}, ${liens2}, ${liens3}`);
      result.passed = false;
    }

    // superiorEtc 그룹
    const superior1 = mapRightTypeToAuctionType("가등기");
    const superior2 = mapRightTypeToAuctionType("예고등기");
    const superior3 = mapRightTypeToAuctionType("가처분");
    if (superior1 !== "superiorEtc" || superior2 !== "superiorEtc" || superior3 !== "superiorEtc") {
      result.errors.push(`superiorEtc 그룹 매핑 실패: ${superior1}, ${superior2}, ${superior3}`);
      result.passed = false;
    }

    // 알 수 없는 값 → "pledge" 확인
    const unknown = mapRightTypeToAuctionType("알수없는권리");
    if (unknown !== "pledge") {
      result.errors.push(`알 수 없는 값 → "pledge" 실패: ${unknown}`);
      result.passed = false;
    }
  } catch (error) {
    result.errors.push(`검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  return result;
}

/**
 * mapRightRecordToRegisteredRight 검증
 */
function validateMapRightRecordToRegisteredRight(): ValidationResult {
  const result: ValidationResult = {
    functionName: "mapRightRecordToRegisteredRight",
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    // 필수 필드 매핑 확인
    const rightRecord: RightRecord = {
      id: "right-1",
      rightType: "근저당권",
      claimAmount: 100000000,
      priority: 1,
      registrationDate: "2024-01-01",
      rightHolder: "은행",
      isMalsoBaseRight: false,
      willBeExtinguished: false,
      willBeAssumed: true,
      notes: "테스트 권리",
    };

    const registered = mapRightRecordToRegisteredRight(rightRecord);

    if (registered.id !== "right-1") {
      result.errors.push(`id 매핑 실패: ${registered.id}`);
      result.passed = false;
    }

    if (registered.type !== "mortgage") {
      result.errors.push(`type 매핑 실패: ${registered.type}`);
      result.passed = false;
    }

    if (registered.amount !== 100000000) {
      result.errors.push(`amount 매핑 실패: ${registered.amount}`);
      result.passed = false;
    }

    if (registered.rankOrder !== 1) {
      result.errors.push(`rankOrder 매핑 실패: ${registered.rankOrder}`);
      result.passed = false;
    }

    if (registered.establishedAt !== "2024-01-01") {
      result.errors.push(`establishedAt 매핑 실패: ${registered.establishedAt}`);
      result.passed = false;
    }

    // 선택 필드 null/undefined 처리 확인
    // Note: RightRecord의 priority와 registrationDate는 필수이므로, 테스트에서는 최소값으로 설정
    const rightRecord2: RightRecord = {
      id: "right-2",
      rightType: "압류",
      claimAmount: 0, // 0이면 amount 제외되어야 함
      priority: 0, // 최소값 사용 (rankOrder 매핑 시 제외됨)
      registrationDate: "", // 빈 문자열 (establishedAt 매핑 시 제외됨)
      rightHolder: "은행",
      isMalsoBaseRight: false,
      willBeExtinguished: false,
      willBeAssumed: false,
      notes: undefined,
    };

    const registered2 = mapRightRecordToRegisteredRight(rightRecord2);

    if (registered2.amount !== undefined) {
      result.warnings.push(`claimAmount가 0일 때 amount가 제외되어야 함: ${registered2.amount}`);
    }

    if (registered2.rankOrder !== undefined) {
      result.warnings.push(`priority가 undefined일 때 rankOrder가 제외되어야 함: ${registered2.rankOrder}`);
    }

    // 엔진 계산 결과 필드 제외 확인 (isMalsoBaseRight, willBeExtinguished 등은 매핑되지 않아야 함)
    // 이는 타입 체크로 확인 가능하므로 경고만 추가
    result.warnings.push("엔진 계산 결과 필드 제외는 타입 레벨에서 확인됨");
  } catch (error) {
    result.errors.push(`검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  return result;
}

/**
 * mapTenantRecordToTenant 검증
 */
function validateMapTenantRecordToTenant(): ValidationResult {
  const result: ValidationResult = {
    functionName: "mapTenantRecordToTenant",
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    // 필수 필드 매핑 확인
    const tenantRecord: TenantRecord = {
      id: "tenant-1",
      tenantName: "홍길동",
      deposit: 50000000,
      moveInDate: "2023-01-01",
      confirmationDate: "2023-01-15",
      hasDaehangryeok: true,
      isSmallTenant: false,
      priorityPaymentAmount: 0,
      willBeAssumed: true,
      monthlyRent: 500000,
      notes: "테스트 임차인",
    };

    const tenant = mapTenantRecordToTenant(tenantRecord);

    if (tenant.id !== "tenant-1") {
      result.errors.push(`id 매핑 실패: ${tenant.id}`);
      result.passed = false;
    }

    if (tenant.deposit !== 50000000) {
      result.errors.push(`deposit 매핑 실패: ${tenant.deposit}`);
      result.passed = false;
    }

    if (tenant.name !== "홍길동") {
      result.errors.push(`name 매핑 실패: ${tenant.name}`);
      result.passed = false;
    }

    if (tenant.moveInDate !== "2023-01-01") {
      result.errors.push(`moveInDate 매핑 실패: ${tenant.moveInDate}`);
      result.passed = false;
    }

    if (tenant.fixedDate !== "2023-01-15") {
      result.errors.push(`fixedDate 매핑 실패: ${tenant.fixedDate}`);
      result.passed = false;
    }

    if (tenant.hasOpposability !== true) {
      result.errors.push(`hasOpposability 매핑 실패: ${tenant.hasOpposability}`);
      result.passed = false;
    }

    // confirmationDate null 처리 확인
    const tenantRecord2: TenantRecord = {
      id: "tenant-2",
      tenantName: "김철수",
      deposit: 30000000,
      moveInDate: "2023-02-01",
      confirmationDate: null, // null이면 fixedDate가 제외되어야 함
      hasDaehangryeok: false,
      isSmallTenant: false,
      priorityPaymentAmount: 0,
      willBeAssumed: false,
      monthlyRent: 300000,
      notes: undefined,
    };

    const tenant2 = mapTenantRecordToTenant(tenantRecord2);

    if (tenant2.fixedDate !== undefined) {
      result.warnings.push(`confirmationDate가 null일 때 fixedDate가 제외되어야 함: ${tenant2.fixedDate}`);
    }

    if (tenant2.isDefacto !== false) {
      result.warnings.push(`isDefacto 기본값이 false여야 함: ${tenant2.isDefacto}`);
    }

    // 엔진 계산 결과 필드 제외 확인
    result.warnings.push("엔진 계산 결과 필드 제외는 타입 레벨에서 확인됨");
  } catch (error) {
    result.errors.push(`검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  return result;
}

/**
 * mapSimulationToSnapshot 검증
 */
function validateMapSimulationToSnapshot(): ValidationResult {
  const result: ValidationResult = {
    functionName: "mapSimulationToSnapshot",
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    // 최소 필수 필드만 있는 시나리오
    const scenario: SimulationScenario = {
      id: "test-1",
      type: "simulation",
      basicInfo: {
        caseNumber: "2025타경52051",
        court: "수원지방법원",
        propertyType: "아파트",
        location: "경기도 성남시",
        locationShort: "성남시",
        marketValue: 500000000,
        appraisalValue: 450000000,
        minimumBidPrice: 360000000,
        startingBidPrice: 360000000,
        bidDeposit: 36000000,
        claimAmount: 300000000,
        debtor: "홍길동",
        owner: "홍길동",
        creditor: "은행",
        auctionType: "부동산임의경매",
        biddingMethod: "기일입찰",
        status: "진행",
        daysUntilBid: 10,
      },
      propertyDetails: {
        landArea: 100,
        landAreaPyeong: 30,
        buildingArea: 80,
        buildingAreaPyeong: 24,
        buildingType: "48평형",
        structure: "철근콘크리트조",
        usage: "아파트",
        floor: "1층",
      },
      schedule: {
        caseFiledDate: "2024-12-01",
        decisionDate: "2024-12-15",
        dividendDeadline: "2025-02-01",
        firstAuctionDate: "2025-03-01",
        currentAuctionDate: "2025-03-01",
      },
      biddingHistory: [],
      rights: [
        {
          id: "right-1",
          rightType: "근저당권",
          claimAmount: 100000000,
          priority: 1,
          registrationDate: "2024-01-01",
          rightHolder: "은행",
          isMalsoBaseRight: false,
          willBeExtinguished: false,
          willBeAssumed: true,
        },
      ],
      tenants: [
        {
          id: "tenant-1",
          tenantName: "홍길동",
          deposit: 50000000,
          moveInDate: "2023-01-01",
          confirmationDate: null,
          hasDaehangryeok: false,
          isSmallTenant: false,
          priorityPaymentAmount: 0,
          willBeAssumed: false,
          monthlyRent: 500000,
        },
      ],
      similarSales: [],
      regionalAnalysis: {
        court: {
          code: "41",
          name: "수원지방법원",
          address: "경기도 수원시",
          phone: "031-123-4567",
          biddingStartTime: "10:00",
          biddingEndTime: "16:00",
          openingTime: "16:00",
          jurisdiction: "경기도",
        },
        registry: {
          name: "수원등기소",
          phone: "031-234-5678",
          fax: "031-234-5679",
          address: "경기도 수원시",
        },
        taxOffice: {
          name: "수원세무서",
          phone: "031-345-6789",
          fax: "031-345-6790",
          address: "경기도 수원시",
        },
        externalLinks: [],
      },
      createdAt: "2025-01-01T00:00:00Z",
    };

    const snapshot = mapSimulationToSnapshot(scenario);

    // 필수 필드 매핑 확인
    if (snapshot.caseId !== "2025타경52051") {
      result.errors.push(`caseId 매핑 실패: ${snapshot.caseId}`);
      result.passed = false;
    }

    if (snapshot.propertyType !== "apartment") {
      result.errors.push(`propertyType 매핑 실패: ${snapshot.propertyType}`);
      result.passed = false;
    }

    if (snapshot.rights.length !== 1) {
      result.errors.push(`rights 배열 매핑 실패: ${snapshot.rights.length}`);
      result.passed = false;
    }

    if (snapshot.tenants.length !== 1) {
      result.errors.push(`tenants 배열 매핑 실패: ${snapshot.tenants.length}`);
      result.passed = false;
    }

    // 선택 필드 매핑 확인
    if (snapshot.appraisal !== 450000000) {
      result.errors.push(`appraisal 매핑 실패: ${snapshot.appraisal}`);
      result.passed = false;
    }

    if (snapshot.minBid !== 360000000) {
      result.errors.push(`minBid 매핑 실패: ${snapshot.minBid}`);
      result.passed = false;
    }

    if (snapshot.regionCode !== "41") {
      result.errors.push(`regionCode 매핑 실패: ${snapshot.regionCode}`);
      result.passed = false;
    }

    if (snapshot.dividendDeadline !== "2025-02-01") {
      result.errors.push(`dividendDeadline 매핑 실패: ${snapshot.dividendDeadline}`);
      result.passed = false;
    }
  } catch (error) {
    result.errors.push(`검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  return result;
}

/**
 * mapCostBreakdownToAcquisitionBreakdown 검증
 */
function validateMapCostBreakdownToAcquisitionBreakdown(): ValidationResult {
  const result: ValidationResult = {
    functionName: "mapCostBreakdownToAcquisitionBreakdown",
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    const costs: CostBreakdown = {
      taxes: {
        acquisitionTax: 5500000,
        educationTax: 550000,
        specialTax: 1100000,
        totalTax: 7150000,
      },
      evictionCost: 3000000,
      miscCost: 1000000,
      totalAcquisition: 500000000,
    };

    const bidPrice = 400000000;
    const assumedRightsAmount = 100000000;

    const acquisition = mapCostBreakdownToAcquisitionBreakdown(costs, bidPrice, assumedRightsAmount);

    // 모든 필드 매핑 확인
    if (acquisition.bidPrice !== bidPrice) {
      result.errors.push(`bidPrice 매핑 실패: ${acquisition.bidPrice}`);
      result.passed = false;
    }

    if (acquisition.rights !== assumedRightsAmount) {
      result.errors.push(`rights 매핑 실패: ${acquisition.rights}`);
      result.passed = false;
    }

    if (acquisition.taxes !== 7150000) {
      result.errors.push(`taxes 매핑 실패: ${acquisition.taxes}`);
      result.passed = false;
    }

    if (acquisition.costs !== 3000000) {
      result.errors.push(`costs 매핑 실패: ${acquisition.costs}`);
      result.passed = false;
    }

    if (acquisition.financing !== 0) {
      result.errors.push(`financing 매핑 실패: ${acquisition.financing}`);
      result.passed = false;
    }

    if (acquisition.penalty !== 0) {
      result.errors.push(`penalty 매핑 실패: ${acquisition.penalty}`);
      result.passed = false;
    }

    if (acquisition.misc !== 1000000) {
      result.errors.push(`misc 매핑 실패: ${acquisition.misc}`);
      result.passed = false;
    }

    if (acquisition.total !== 500000000) {
      result.errors.push(`total 매핑 실패: ${acquisition.total}`);
      result.passed = false;
    }

    // 총합 일치 확인
    const calculatedTotal =
      acquisition.bidPrice +
      acquisition.rights +
      acquisition.taxes +
      acquisition.costs +
      acquisition.financing +
      acquisition.penalty +
      acquisition.misc;

    if (Math.abs(calculatedTotal - acquisition.total) > 1) {
      result.warnings.push(
        `총합 불일치: 계산값=${calculatedTotal}, 엔진값=${acquisition.total}, 차이=${calculatedTotal - acquisition.total}`
      );
    }
  } catch (error) {
    result.errors.push(`검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  return result;
}

/**
 * mapProfitResultToSafetyMargin 검증
 */
function validateMapProfitResultToSafetyMargin(): ValidationResult {
  const result: ValidationResult = {
    functionName: "mapProfitResultToSafetyMargin",
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    const profit: ProfitResult = {
      marginVsFMV: 50000000,
      marginRateVsFMV: 0.1,
      marginVsExit: 60000000,
      marginRateVsExit: 0.12,
      bePoint: 450000000,
    };

    const valuation: ValuationResult = {
      fmv: 500000000,
      appraisal: 450000000,
      minBid: 360000000,
    };

    // FMV, EXIT만 있는 경우 (2개)
    const margins1 = mapProfitResultToSafetyMargin(profit, valuation);

    if (margins1.length !== 2) {
      result.errors.push(`SafetyMargin 배열 길이 실패: ${margins1.length} (기대값: 2)`);
      result.passed = false;
    }

    const fmvMargin = margins1.find((m) => m.label === "FMV");
    if (!fmvMargin) {
      result.errors.push("FMV 기준 마진이 없음");
      result.passed = false;
    } else {
      if (fmvMargin.amount !== 50000000) {
        result.errors.push(`FMV amount 매핑 실패: ${fmvMargin.amount}`);
        result.passed = false;
      }
      if (fmvMargin.pct !== 0.1) {
        result.errors.push(`FMV pct 매핑 실패: ${fmvMargin.pct}`);
        result.passed = false;
      }
      if (fmvMargin.referencePrice !== 500000000) {
        result.errors.push(`FMV referencePrice 매핑 실패: ${fmvMargin.referencePrice}`);
        result.passed = false;
      }
    }

    const exitMargin = margins1.find((m) => m.label === "EXIT");
    if (!exitMargin) {
      result.errors.push("EXIT 기준 마진이 없음");
      result.passed = false;
    } else {
      if (exitMargin.amount !== 60000000) {
        result.errors.push(`EXIT amount 매핑 실패: ${exitMargin.amount}`);
        result.passed = false;
      }
      if (exitMargin.pct !== 0.12) {
        result.errors.push(`EXIT pct 매핑 실패: ${exitMargin.pct}`);
        result.passed = false;
      }
    }

    // USER 기준 마진 포함 (3개)
    const margins2 = mapProfitResultToSafetyMargin(profit, valuation, undefined, 450000000);

    if (margins2.length !== 3) {
      result.errors.push(`SafetyMargin 배열 길이 실패: ${margins2.length} (기대값: 3)`);
      result.passed = false;
    }

    const userMargin = margins2.find((m) => m.label === "USER");
    if (!userMargin) {
      result.errors.push("USER 기준 마진이 없음");
      result.passed = false;
    } else {
      const expectedAmount = 500000000 - 450000000; // 50000000
      if (userMargin.amount !== expectedAmount) {
        result.errors.push(`USER amount 매핑 실패: ${userMargin.amount} (기대값: ${expectedAmount})`);
        result.passed = false;
      }
      const expectedPct = expectedAmount / 500000000; // 0.1
      if (Math.abs(userMargin.pct - expectedPct) > 0.0001) {
        result.errors.push(`USER pct 매핑 실패: ${userMargin.pct} (기대값: ${expectedPct})`);
        result.passed = false;
      }
    }
  } catch (error) {
    result.errors.push(`검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  return result;
}

