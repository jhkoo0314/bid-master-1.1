/**
 * Bid Master AI - 타입 매핑 유틸리티
 * 
 * 목적: 기존 타입(SimulationScenario, RightRecord, TenantRecord 등)을 
 *      새 엔진 타입(PropertySnapshot, RegisteredRight, Tenant 등)으로 변환
 * 참조 문서: docs/auction-engine-v0.1.md, docs/auction-engine-v0.1-migration-plan.md
 * 작성일: 2025-01-XX
 * 
 * 이 파일은 Phase 3에서 구현할 매핑 함수들을 포함합니다:
 * - 기본 타입 매핑 (Difficulty, RightType, PropertyType)
 * - 데이터 스냅샷 매핑 (SimulationScenario → PropertySnapshot)
 * - 엔진 출력 → 기존 타입 브리지 (EngineOutput → RightsAnalysisResult)
 * - 비용/수익 결과 매핑 (CostBreakdown → AcquisitionBreakdown, ProfitResult → SafetyMargin[])
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
// 매핑 함수 목록 (Phase 3 구현 예정)
// ============================================

/**
 * 매핑 함수 목록:
 * 
 * 1. mapSimulationToSnapshot()
 *    - SimulationScenario → PropertySnapshot
 *    - 권리/임차인 배열 변환 포함
 * 
 * 2. mapRightRecordToRegisteredRight()
 *    - RightRecord → RegisteredRight
 *    - RightType 변환 포함
 * 
 * 3. mapTenantRecordToTenant()
 *    - TenantRecord → Tenant
 *    - 필드명 변환 (hasDaehangryeok → hasOpposability)
 * 
 * 4. mapDifficultyLevelToDifficulty()
 *    - DifficultyLevel → Difficulty
 *    - "초급" → "easy", "중급" → "normal", "고급" → "hard"
 * 
 * 5. mapEngineOutputToRightsAnalysisResult()
 *    - EngineOutput → RightsAnalysisResult (하위 호환성)
 *    - 브리지 함수: 새 엔진 결과를 기존 컴포넌트 형식으로 변환
 * 
 * 6. mapCostBreakdownToAcquisitionBreakdown()
 *    - CostBreakdown → AcquisitionBreakdown
 *    - 비용 구조 변환
 * 
 * 7. mapProfitResultToSafetyMargin()
 *    - ProfitResult → SafetyMargin[]
 *    - FMV/Exit/User 기준 마진 배열 생성
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
 * - rankOrder: record.priority (priority가 있을 경우)
 * - establishedAt: record.registrationDate (그대로)
 * - specialNote: record.notes (그대로)
 * 
 * 제외되는 필드 (엔진 계산 결과):
 * - isMalsoBaseRight, willBeExtinguished, willBeAssumed (엔진이 계산)
 * - rightHolder (엔진 계산에 불필요)
 * 
 * @param record - 기존 RightRecord
 * @returns 변환된 RegisteredRight
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
 * - regionCode: scenario.regionalAnalysis.court.code (선택)
 * - appraisal: scenario.basicInfo.appraisalValue (그대로)
 * - minBid: scenario.basicInfo.minimumBidPrice (그대로)
 * - fmvHint: scenario.basicInfo.marketValue (그대로)
 * - dividendDeadline: scenario.schedule.dividendDeadline (그대로)
 * 
 * 제외되는 필드 (엔진 계산에 불필요):
 * - id, type, basicInfo 상세 정보, propertyDetails, schedule의 다른 필드
 * - biddingHistory, similarSales, regionalAnalysis 상세 정보, educationalContent, createdAt
 * 
 * @param scenario - 기존 SimulationScenario
 * @returns 변환된 PropertySnapshot
 */
export function mapSimulationToSnapshot(scenario: SimulationScenario): PropertySnapshot {
  // TODO: Phase 3.5.2에서 구현
  throw new Error("Not implemented yet");
}

/**
 * EngineOutput을 RightsAnalysisResult로 변환 (하위 호환성 브리지 함수)
 * 
 * 목적: 새 엔진 결과를 기존 컴포넌트가 기대하는 형식으로 변환
 * 
 * 필드 매핑:
 * - malsoBaseRight: output.rights.malsoBase가 있으면 scenario.rights에서 동일한 id 찾기
 * - extinguishedRights: output.rights.rightFindings에서 assumed: false인 권리 찾기
 * - assumedRights: output.rights.rightFindings에서 assumed: true인 권리 찾기
 * - totalAssumedAmount: output.rights.assumedRightsAmount (등기 권리 + 임차보증금 합계)
 * - assumedTenants: output.rights.tenantFindings에서 assumed: true인 임차인 찾기
 * - totalTenantDeposit: assumedTenants의 deposit 합계
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
 */
export function mapEngineOutputToRightsAnalysisResult(
  output: EngineOutput,
  scenario: SimulationScenario
): RightsAnalysisResult {
  // TODO: Phase 3.6에서 구현
  throw new Error("Not implemented yet");
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
 */
export function mapCostBreakdownToAcquisitionBreakdown(
  costs: CostBreakdown,
  bidPrice: number,
  assumedRightsAmount: number
): AcquisitionBreakdown {
  // TODO: Phase 3.7에서 구현
  throw new Error("Not implemented yet");
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
 */
export function mapProfitResultToSafetyMargin(
  profit: ProfitResult,
  valuation: ValuationResult,
  exitPrice?: number,
  userBidPrice?: number
): SafetyMargin[] {
  // TODO: Phase 3.8에서 구현
  throw new Error("Not implemented yet");
}

