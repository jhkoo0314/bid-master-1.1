/**
 * Bid Master AI - Auction Engine v0.2 통합 타입 정의
 * 
 * 목적: 파편화된 계산 로직을 제거하고 auction-engine.ts 단일 진입점으로 통합
 * 참조 문서: docs/auction-engine-v0.2.md
 * 작성일: 2025-01-XX
 * 
 * 이 파일은 경매 엔진의 모든 타입 정의를 포함합니다:
 * - 기본 타입 (Difficulty, RightType)
 * - 데이터 스냅샷 (PropertySnapshot, Tenant, RegisteredRight)
 * - 레이어별 입력/출력 (Valuation, Rights, Costs, Profit)
 * - 엔진 입력/출력 (EngineInput, EngineOutput)
 */

import type {
  PropertyTypeKorean,
  RightTypeKorean,
  RiskFlagKey,
} from "@/lib/constants.auction";

// ============================================
// 1. 기본 타입 정의
// ============================================

/**
 * 난이도 레벨
 * 
 * 참고: 기존 코드베이스의 DifficultyLevel("초급" | "중급" | "고급")과는 별개.
 * Phase 3에서 매핑 함수를 통해 변환 필요.
 */
export type Difficulty = "easy" | "normal" | "hard";

/**
 * 권리 유형
 * 
 * 엔진 계산에 필요한 최소 권리 분류. 기존 simulation.ts의 RightType과 차이:
 * 
 * 기존 (simulation.ts):
 * - 한글 권리명 15가지: "근저당권", "저당권", "압류", "가압류", "담보가등기" 등
 * - 등기부 실제 표현에 가까운 세분화 구조
 * 
 * 신규 (auction.ts):
 * - 영문 코드 5가지: 계산 로직에 최적화된 그룹핑
 * - 엔진에서 권리 인수/소멸 판단에 필요한 최소 분류
 * 
 * 매핑 규칙 (Phase 3에서 구현):
 * - "근저당권", "저당권" → "mortgage"
 * - "압류", "가압류", "담보가등기" → "pledge"
 * - "주택임차권", "상가임차권", "전세권" → "lease"
 * - "유치권", "법정지상권", "분묘기지권" → "liens"
 * - "가등기", "예고등기", "소유권이전청구권가등기", "가처분" → "superiorEtc"
 */
export type RightType =
  | "mortgage"        // 근저당권
  | "pledge"          // 질권/가압류 등 금전담보성
  | "lease"           // 임차권(대항력/확정일자 중요)
  | "liens"           // 유치권/법정지상권 등
  | "superiorEtc";    // 가등기/가처분 등 선순위 가능성

// ============================================
// 2. 데이터 스냅샷 타입
// ============================================

/**
 * 임차인 정보
 * 
 * 엔진 계산에 필요한 최소 임차인 데이터. 기존 simulation.ts의 TenantRecord와 차이:
 * 
 * 기존 (simulation.ts - TenantRecord):
 * - 필수 필드: id, tenantName, deposit, moveInDate, confirmationDate, hasDaehangryeok, isSmallTenant, priorityPaymentAmount, willBeAssumed
 * - 추가 필드: monthlyRent, notes
 * - 엔진 계산 결과 포함: hasDaehangryeok, isSmallTenant, priorityPaymentAmount, willBeAssumed
 * 
 * 신규 (auction.ts - Tenant):
 * - 필수 필드: id, deposit
 * - 선택 필드: name, moveInDate, fixedDate, hasOpposability, isDefacto, vacateRiskNote
 * - 엔진 계산 결과 제외: 입력 데이터만 포함, 계산 결과는 RightAnalysisResult에 포함
 * 
 * 필드 매핑 규칙 (Phase 3에서 구현):
 * - tenantName → name (필수 → 선택)
 * - confirmationDate → fixedDate (string | null → string?, null 제거)
 * - hasDaehangryeok → hasOpposability (명칭 변경)
 * - notes → vacateRiskNote (명도 리스크에 특화)
 * - moveInDate (필수 → 선택): 엔진이 추정 가능하므로 선택으로 변경
 * 
 * 제거된 필드 (엔진 계산 결과):
 * - monthlyRent: 엔진 계산에 불필요
 * - isSmallTenant: 엔진이 RightAnalysisResult에서 판단
 * - priorityPaymentAmount: 엔진이 RightAnalysisResult에서 계산
 * - willBeAssumed: 엔진이 RightAnalysisResult.tenantFindings에서 판단
 * 
 * 추가된 필드:
 * - isDefacto: 사실상 임차 추정치 (엔진이 대항력 판단 시 활용)
 */
export interface Tenant {
  id: string;
  name?: string;
  deposit: number;                // 임차보증금
  moveInDate?: string;            // 전입일 (YYYY-MM-DD)
  fixedDate?: string;             // 확정일자 (YYYY-MM-DD)
  hasOpposability?: boolean;      // 대항력(전입+점유) 여부 (없으면 엔진이 추정)
  isDefacto?: boolean;            // 사실상 임차(추정치)
  vacateRiskNote?: string;        // 명도 리스크 메모
  type?: "주택임차권" | "상가임차권" | "기타"; // 임차권 유형 (v0.2 추가)
}

/**
 * 등기부 권리 정보
 * 
 * 엔진 계산에 필요한 최소 권리 데이터. 기존 simulation.ts의 RightRecord와 차이:
 * 
 * 기존 (simulation.ts - RightRecord):
 * - 필수 필드: id, registrationDate, rightType, rightHolder, claimAmount, isMalsoBaseRight, willBeExtinguished, willBeAssumed, priority
 * - 추가 필드: notes
 * - 엔진 계산 결과 포함: isMalsoBaseRight, willBeExtinguished, willBeAssumed
 * - 한글 권리명: rightType (15가지)
 * 
 * 신규 (auction.ts - RegisteredRight):
 * - 필수 필드: id, type
 * - 선택 필드: amount, rankOrder, establishedAt, specialNote
 * - 엔진 계산 결과 제외: 입력 데이터만 포함, 계산 결과는 RightAnalysisResult에 포함
 * - 한글 권리명: type (15가지: v0.2에서 RightTypeKorean으로 변경)
 * 
 * 필드 매핑 규칙 (Phase 3에서 구현):
 * - rightType → type (한글 권리명 그대로 사용, RightTypeKorean 타입 사용)
 * - claimAmount → amount (필수 → 선택)
 * - registrationDate → establishedAt (명칭 변경, 필수 → 선택)
 * - priority → rankOrder (명칭 변경, 필수 → 선택)
 * - notes → specialNote (명칭 변경, 특기사항에 특화)
 * 
 * 제거된 필드 (엔진 계산 결과):
 * - rightHolder: 엔진 계산에 불필요
 * - isMalsoBaseRight: 엔진이 RightAnalysisResult.malsoBase에서 판단
 * - willBeExtinguished: 엔진이 RightAnalysisResult.rightFindings에서 판단
 * - willBeAssumed: 엔진이 RightAnalysisResult.rightFindings에서 판단
 * 
 * 핵심 차이점:
 * - rankOrder와 establishedAt로 순위 판단: 기존 priority 단일 값 대신 등기부 순위와 설정일을 함께 참고
 * - 엔진이 말소기준권리 판단 시 rankOrder와 establishedAt 중 하나만 있어도 작동
 * - amount는 선택 필드: 특수 권리(법정지상권 등)는 금액이 없을 수 있음
 */
export interface RegisteredRight {
  id: string;
  type: RightTypeKorean;        // 한글 권리명 (v0.2에서 RightType에서 변경)
  amount?: number;               // 피담보채권액/보증금 등
  rankOrder?: number;            // 등기부 순위(작을수록 선순위)
  establishedAt?: string;        // 설정일
  specialNote?: string;          // 특기사항(법정지상권 추정 등)
}

/**
 * 매물 스냅샷
 * 
 * 엔진 계산에 필요한 최소 매물 데이터. 기존 simulation.ts의 SimulationScenario와 관계:
 * 
 * 기존 (simulation.ts - SimulationScenario):
 * - 전체 시나리오 데이터: id, type, basicInfo, propertyDetails, schedule, biddingHistory 등
 * - UI 표시용 데이터: similarSales, regionalAnalysis, educationalContent 포함
 * - 한글 권리/임차인 타입: RightRecord[], TenantRecord[]
 * 
 * 신규 (auction.ts - PropertySnapshot):
 * - 엔진 계산에 필요한 최소 필드만 포함
 * - 영문 권리/임차인 타입: RegisteredRight[], Tenant[]
 * - 엔진 계산 결과는 EngineOutput에 포함
 * 
 * 매핑 규칙 (Phase 3에서 mapSimulationToSnapshot() 구현):
 * - caseId: basicInfo.caseNumber
 * - propertyType: basicInfo.propertyType (한글 그대로 사용, PropertyTypeKorean 타입)
 *   - v0.2에서는 한글 매물유형 9종을 그대로 사용: "아파트", "오피스텔", "단독주택", "빌라", "원룸", "주택", "다가구주택", "근린주택", "도시형생활주택"
 * - regionCode: regionalAnalysis에서 추출 (선택)
 * - appraisal: basicInfo.appraisalValue (선택)
 * - minBid: basicInfo.minimumBidPrice (선택)
 * - fmvHint: basicInfo.marketValue (선택)
 * - rights: rights 배열을 RegisteredRight[]로 변환 (mapRightRecordToRegisteredRight)
 * - tenants: tenants 배열을 Tenant[]로 변환 (mapTenantRecordToTenant)
 * - dividendDeadline: schedule.dividendDeadline (선택)
 * 
 * 제거되는 필드 (엔진 계산에 불필요):
 * - id, type: 시나리오 식별용, 엔진 계산 불필요
 * - basicInfo의 상세 정보: 채무자, 채권자, 법원명 등
 * - propertyDetails: 면적, 구조 등 상세 정보
 * - schedule의 다른 필드: caseFiledDate, decisionDate 등
 * - biddingHistory: 입찰 이력
 * - similarSales: 주변 매각 사례
 * - regionalAnalysis: 지역 분석 정보
 * - educationalContent: 교육용 콘텐츠
 * - createdAt: 생성일시
 * 
 * 사용 목적:
 * - 엔진 입력으로 사용: EngineInput.snapshot에 전달
 * - 전체 시나리오 데이터는 유지: UI 표시 및 기타 용도
 */
export interface PropertySnapshot {
  caseId: string;
  propertyType: PropertyTypeKorean; // 한글 매물유형 (v0.2에서 변경)
  regionCode?: string;
  appraisal?: number;        // 감정가(있을 경우)
  minBid?: number;           // 최저가(있을 경우)
  fmvHint?: number;          // FMV 힌트(있을 경우)
  rights: RegisteredRight[];
  tenants: Tenant[];
  dividendDeadline?: string; // 배당요구종기일
}

// ============================================
// 3. Valuation 레이어 타입
// ============================================

/**
 * 평가 입력 데이터
 * 
 * 엔진이 FMV(공정시세), 감정가, 최저가를 산출하기 위한 입력 데이터.
 * 모든 필드가 선택적이며, 엔진이 부족한 정보를 역산하거나 기본값으로 보완.
 * 
 * 계산 규칙 (estimateValuation 함수):
 * - appraisal, minBid 둘 다 없으면: fmvHint 또는 기본 FMV로 역산
 * - appraisal만 있으면: minBid = appraisal * 0.8
 * - minBid만 있으면: appraisal = minBid / 0.8
 * - FMV 없으면: appraisal 기반 κ로 산정 (propertyType에 따라 유형별 κ 값 적용, v0.2)
 * - propertyType이 없으면 기본값 0.90 사용
 * - overrides.kappa가 있으면 우선 적용
 * - marketSignals: 1.0 기준 외부 지표로 최종 FMV를 ±10% 범위 내에서 보정
 * 
 * marketSignals 예시:
 * - { kbIndex: 0.99, tradeSpeed: 0.97 } → 평균 0.98로 FMV를 2% 하향 조정
 * - { kbIndex: 1.02, tradeSpeed: 1.01 } → 평균 1.015로 FMV를 1.5% 상향 조정
 * - 보정 범위: 0.9 ~ 1.1 (10% 캡)
 */
export interface ValuationInput {
  appraisal?: number;        // 감정가 (원)
  minBid?: number;           // 최저가 (원)
  fmvHint?: number;          // FMV 힌트 (원)
  marketSignals?: Record<string, number>; // 외부 지표 보정(선택): 1.0 기준
  propertyType?: PropertyTypeKorean; // 매물 유형 (유형별 κ 값 적용에 사용, v0.2)
  overrides?: Partial<{
    kappa: number; // 유형 기본 κ 대신 강제 적용 (v0.2)
  }>;
}

/**
 * 평가 결과
 * 
 * 엔진이 계산한 FMV, 감정가, 최저가 결과.
 * 모든 필드가 필수이며, 엔진이 부족한 정보를 역산하여 채움.
 * 
 * 계산 결과:
 * - fmv: 공정시세 (Fair Market Value) - 안전마진 계산 기준값
 * - appraisal: 감정가 - 엔진이 역산했을 수 있음
 * - minBid: 최저가 - 엔진이 역산했을 수 있음
 * - notes: 계산 과정 메모 (역산 여부, 보정 적용 등)
 * 
 * 사용 예시:
 * - FMV는 안전마진 계산의 기준값으로 사용
 * - appraisal과 minBid는 비율 관계 유지 (appraisal = minBid / 0.8)
 * - notes는 개발자 모드에서 계산 과정 확인용
 */
export interface ValuationResult {
  fmv: number;            // Fair Market Value (공정시세)
  appraisal: number;      // 감정가
  minBid: number;         // 최저가
  notes?: string[];       // 계산 과정 메모
}

// ============================================
// 4. Rights 분석 레이어 타입
// ============================================

/**
 * 권리 분석 결과
 * 
 * 엔진의 Rights 레이어 출력. 권리 인수/소멸 판단과 임차인 대항력 분석 결과만 포함.
 * 기존 simulation.ts의 RightsAnalysisResult와 차이:
 * 
 * 기존 (simulation.ts - RightsAnalysisResult):
 * - 종합 분석 결과: 권리 분석 + 총인수금액 + 안전마진 + 권장 입찰가 범위 + 리스크 분석
 * - 필수 필드: malsoBaseRight, extinguishedRights, assumedRights, totalAssumedAmount, 
 *   assumedTenants, totalTenantDeposit, totalAcquisition, safetyMargin, recommendedBidRange, riskAnalysis
 * - 추가 필드: advancedSafetyMargin, tenantRisk
 * - RightRecord[], TenantRecord[] 타입 사용
 * 
 * 신규 (auction.ts - RightAnalysisResult):
 * - 권리 분석 결과만: 권리 인수/소멸 판단과 임차인 대항력 분석
 * - 필수 필드: assumedRightsAmount, tenantFindings, rightFindings
 * - 선택 필드: malsoBase, notes
 * - RegisteredRight, Tenant 타입 사용
 * - 비용/수익/안전마진은 별도 레이어 (Costs, Profit)에서 계산
 * 
 * 필드 설명:
 * - malsoBase: 말소기준권리 (배당요구종기일 이전 설정된 최선순위 담보성 권리)
 * - assumedRightsAmount: 인수 권리 총액 (등기 권리 + 임차보증금 합계)
 * - riskFlags: 위험 배지 배열 (v0.2 추가)
 * - tenantFindings: 임차인별 분석 결과
 *   - kind: 임차권 유형 (주택임차권/상가임차권/기타, v0.2 추가)
 *   - opposability: 대항력 강도 (strong/weak/none)
 *   - assumed: 인수 대상 여부
 *   - depositAssumed: 인수되는 보증금 금액 (weak일 경우 50% 인수)
 * - rightFindings: 권리별 인수/소멸 판단 결과
 *   - type: 권리 유형 (RightTypeKorean, v0.2 추가)
 *   - disposition: 판정 결과 (소멸/인수/위험, v0.2 추가)
 *   - assumed: 인수 대상 여부 (말소기준권리보다 선순위면 인수)
 *   - amountAssumed: 인수되는 권리 금액
 * 
 * 브리지 함수 필요 (Phase 3에서 구현):
 * - mapEngineOutputToRightsAnalysisResult(): EngineOutput을 기존 RightsAnalysisResult로 변환
 * - EngineOutput.rights + EngineOutput.costs + EngineOutput.profit을 통합하여
 *   기존 컴포넌트가 기대하는 종합 결과 생성
 */
export interface RightAnalysisResult {
  malsoBase?: RegisteredRight | null; // 말소기준권리
  assumedRightsAmount: number;        // 인수 권리 총액(임차보증금 포함)
  riskFlags: RiskFlagKey[];           // 위험 배지 배열 (v0.2 추가)
  tenantFindings: Array<{
    tenantId: string;
    kind: "주택임차권" | "상가임차권" | "기타"; // 임차권 유형 (v0.2 추가)
    opposability: "strong" | "weak" | "none";
    assumed: boolean;                 // 인수 대상 여부
    reason: string;
    depositAssumed: number;           // 해당 임차인으로 인수되는 금액
  }>;
  rightFindings: Array<{
    rightId: string;
    type: RightTypeKorean;            // 권리 유형 (v0.2 추가)
    disposition: "소멸" | "인수" | "위험"; // 판정 결과 (v0.2 추가)
    assumed: boolean;
    reason: string;
    amountAssumed: number;
  }>;
  notes?: string[];
}

// ============================================
// 5. Costs 레이어 타입
// ============================================

/**
 * 비용 계산 입력 데이터
 * 
 * 엔진의 Costs 레이어 입력. 총인수금액 계산에 필요한 데이터.
 * 
 * 기본 세율 (교육용, v0.2):
 * - 취득세율: 매물유형별 상이 (ACQ_TAX_RATE_BY_TYPE 참조)
 * - 교육세: 취득세의 0.1% (0.001)
 * - 농특세: 취득세의 0.2% (0.002)
 * - 명도비: 매물유형별 기본값 + 위험 가산 (BASE_EVICTION_BY_TYPE + RISK_EVICTION_ADD)
 * - 기타비용: 기본 1,000,000원 + 위험 가산 (BASE_MISC_COST + RISK_MISC_ADD)
 * 
 * overrides로 정확한 세율/비용 주입 권장:
 * - 실제 세율과 상이할 수 있으므로 상위에서 정확 데이터 전달
 * - evictionCost는 위험 가산이 자동 적용되므로 기본값만 지정 가능
 */
export interface CostInput {
  bidPrice: number;           // 사용자 입찰가(또는 낙찰가)
  assumedRightsAmount: number; // Rights 레이어에서 계산된 인수 권리 총액
  propertyType: PropertyTypeKorean; // 매물 유형 (세율/명도비 결정에 사용, v0.2 필수 필드)
  regionCode?: string;        // 지역 코드 (선택)
  riskFlags?: RiskFlagKey[];  // 위험 배지 배열 (명도비/기타비용 가산에 사용, v0.2)

  // 선택적 오버라이드
  overrides?: Partial<{
    acquisitionTaxRate: number;       // 취득세율(기본은 타입별 내장)
    educationTaxRate: number;          // 교육세율 (기본 0.1%)
    specialTaxRate: number;            // 농특세율 (기본 0.2%)
    evictionCost: number;              // 명도비(기본: 타입별 + 위험 가산)
    miscCost: number;                  // 법무/등기/기타 (기본: 1,000,000원 + 위험 가산)
  }>;
}

/**
 * 비용 계산 결과
 * 
 * 엔진의 Costs 레이어 출력. 총인수금액과 세부 비용 내역.
 * 기존 property.ts의 AcquisitionBreakdown과 차이:
 * 
 * 기존 (property.ts - AcquisitionBreakdown):
 * - 필드: bidPrice, rights, taxes, costs, financing, penalty, misc, total
 * - 세금을 단일 값으로 표현: taxes (총 세금)
 * - 명도비가 costs에 포함되어 구분 불가
 * - financing, penalty 포함 (금융비용, 패널티)
 * 
 * 신규 (auction.ts - CostBreakdown):
 * - 세금 구조화: taxes 객체 (acquisitionTax, educationTax, specialTax, totalTax)
 * - 명도비 분리: evictionCost (명도 비용)
 * - 기타비용: miscCost (법무/등기 등)
 * - 총인수금액: totalAcquisition = bidPrice + assumedRightsAmount + taxes.total + evictionCost + miscCost
 * - financing, penalty 제거: v0.1에서는 간소화 (필요 시 v0.2에서 확장)
 * 
 * 계산 공식:
 * - totalAcquisition = bidPrice + assumedRightsAmount + taxes.totalTax + evictionCost + miscCost
 * - taxes.totalTax = acquisitionTax + educationTax + specialTax
 * 
 * 매핑 규칙 (Phase 3에서 구현):
 * - CostBreakdown → AcquisitionBreakdown 변환 시
 *   - taxes → taxes.totalTax
 *   - evictionCost → costs에 포함
 *   - financing, penalty는 0 또는 별도 계산
 */
export interface CostBreakdown {
  taxes: {
    acquisitionTax: number;    // 취득세
    educationTax: number;      // 교육세
    specialTax: number;        // 농특세
    totalTax: number;          // 총 세금
  };
  evictionCost: number;      // 명도 비용(추정)
  miscCost: number;          // 기타 부대비용
  totalAcquisition: number;  // 총인수금액 = bid + rights + taxes.total + eviction + misc
  notes?: string[];          // 계산 과정 메모
}

// ============================================
// 6. Profit 레이어 타입
// ============================================

/**
 * 수익 분석 입력 데이터
 * 
 * 엔진의 Profit 레이어 입력. 안전마진과 손익분기점 계산에 필요한 데이터.
 * 
 * 계산 규칙 (evaluateProfit 함수):
 * - exitPrice가 없으면 FMV를 사용 (보수적 처분가)
 * - marginVsFMV = FMV - 총인수금액
 * - marginVsExit = Exit - 총인수금액
 * - bePoint = 총인수금액 (손익분기점 가격)
 * 
 * 사용 목적:
 * - FMV 기준 안전마진: 시세 대비 투자 여유도 측정
 * - Exit 기준 안전마진: 실제 처분가 대비 투자 여유도 측정
 * - 손익분기점: 최소한 이 가격에 매도해야 손해 없음
 */
export interface ProfitInput {
  exitPrice?: number;     // 보수적 처분가(없으면 FMV 사용)
  fmv: number;            // FMV (Valuation 레이어에서 계산)
  totalAcquisition: number; // 총인수금액 (Costs 레이어에서 계산)
  bidPrice: number;       // 사용자 입찰가
}

/**
 * 수익 분석 결과
 * 
 * 엔진의 Profit 레이어 출력. FMV/Exit 기준 안전마진과 손익분기점.
 * 기존 property.ts의 SafetyMargin과 차이:
 * 
 * 기존 (property.ts - SafetyMargin):
 * - 구조: label, amount, pct, referencePrice
 * - 3가지 기준: FMV, EXIT, USER (FMV - bidPrice)
 * - CalcResult.margins 객체에 포함
 * 
 * 신규 (auction.ts - ProfitResult):
 * - FMV 기준 마진: marginVsFMV, marginRateVsFMV
 * - Exit 기준 마진: marginVsExit, marginRateVsExit
 * - 손익분기점: bePoint (총인수금액)
 * - USER 기준은 EngineOutput.safety.userBid에서 별도 계산
 * 
 * 계산 공식:
 * - marginVsFMV = FMV - totalAcquisition
 * - marginRateVsFMV = marginVsFMV / FMV (음수 가능)
 * - marginVsExit = (exitPrice ?? FMV) - totalAcquisition
 * - marginRateVsExit = marginVsExit / (exitPrice ?? FMV)
 * - bePoint = totalAcquisition (손익분기점은 총인수금액과 동일)
 * 
 * 매핑 규칙 (Phase 3에서 구현):
 * - ProfitResult → SafetyMargin 배열 변환
 *   - marginVsFMV → { label: "FMV", amount, pct, referencePrice: fmv }
 *   - marginVsExit → { label: "EXIT", amount, pct, referencePrice: exitPrice }
 *   - EngineOutput.safety.userBid → { label: "USER", amount, pct, referencePrice: fmv }
 */
export interface ProfitResult {
  marginVsFMV: number;       // FMV - 총인수금액
  marginRateVsFMV: number;   // margin / FMV (음수 가능)
  marginVsExit: number;      // Exit - 총인수금액
  marginRateVsExit: number;  // margin / Exit
  bePoint: number;           // 손익분기점 가격(총인수금액)
  notes?: string[];          // 계산 과정 메모
}

// ============================================
// 7. 엔진 입력/출력 타입
// ============================================

/**
 * 엔진 실행 옵션
 * 
 * auctionEngine 함수의 동작을 제어하는 옵션.
 * 
 * 옵션 설명:
 * - difficulty: 난이도 레벨 (향후 확장용, 현재는 사용되지 않음)
 * - devMode: 개발자 모드 활성화 시 핵심 계산 단계 로그 출력
 * - logPrefix: 로그 접두사 (기본값: "🧠 [ENGINE]")
 * 
 * 사용 예시:
 * - 개발자 모드: { devMode: true, logPrefix: "🏗️ [BidMaster]" }
 * - 프로덕션: options를 생략하거나 { devMode: false }
 */
export interface EngineOptions {
  difficulty?: Difficulty;
  devMode?: boolean;
  logPrefix?: string; // 로그 접두사
}

/**
 * 엔진 입력 데이터
 * 
 * auctionEngine 함수의 입력. 모든 레이어 계산에 필요한 데이터를 포함.
 * 
 * 필수 필드:
 * - snapshot: 매물 스냅샷 (PropertySnapshot)
 * - userBidPrice: 사용자 입력 입찰가
 * 
 * 선택 필드:
 * - exitPriceHint: 보수적 처분가 힌트 (없으면 FMV 사용)
 * - valuationInput: 평가 입력 데이터 (marketSignals, overrides 등)
 * - options: 엔진 실행 옵션
 * 
 * 데이터 흐름:
 * 1. snapshot → Valuation 레이어 (FMV, 감정가, 최저가 계산)
 * 2. snapshot → Rights 레이어 (권리 인수/소멸 판단)
 * 3. userBidPrice + rights.assumedRightsAmount → Costs 레이어 (총인수금액 계산)
 * 4. valuation.fmv + costs.totalAcquisition → Profit 레이어 (안전마진 계산)
 * 5. 모든 레이어 결과 → EngineOutput
 */
export interface EngineInput {
  snapshot: PropertySnapshot;      // 매물 스냅샷
  userBidPrice: number;            // 사용자 입력 입찰가
  exitPriceHint?: number;          // 보수적 처분가 힌트
  valuationInput?: ValuationInput; // 평가 입력 데이터 (marketSignals, overrides 등)
  options?: EngineOptions;         // 엔진 실행 옵션
}

/**
 * 엔진 출력 결과
 * 
 * auctionEngine 함수의 출력. 모든 레이어의 계산 결과와 통합 안전마진 정보.
 * 
 * 레이어별 결과:
 * - valuation: Valuation 레이어 결과 (FMV, 감정가, 최저가)
 * - rights: Rights 레이어 결과 (권리 분석, 인수 권리 총액)
 * - costs: Costs 레이어 결과 (세금, 명도비, 총인수금액)
 * - profit: Profit 레이어 결과 (FMV/Exit 기준 마진, 손익분기점)
 * 
 * 통합 안전마진 (safety):
 * - fmv: FMV 기준 안전마진 (FMV - 총인수금액)
 * - exit: Exit 기준 안전마진 (Exit - 총인수금액)
 * - userBid: 사용자 입찰가 기준 마진 (FMV - 입찰가)
 * - overFMV: 입찰가가 FMV를 초과하는지 여부
 * 
 * 위험 배지 (riskFlags, v0.2 추가):
 * - Rights 레이어에서 수집된 위험 배지 배열
 * - 소유권분쟁, 상가임차, 유치권, 법정지상권, 분묘, 배당불명확, 임차다수 등
 * 
 * 메타 정보 (meta, v0.2 추가):
 * - engineVersion: 엔진 버전 (예: "v0.2")
 * - generatedAt: 생성 시각 (ISO 8601 형식)
 * 
 * 사용 목적:
 * - 단일 진입점으로 모든 계산 결과 제공
 * - 기존 컴포넌트와의 연동을 위해 브리지 함수로 변환 필요 (Phase 3)
 * - UI에 직접 사용 가능 (SafetyMarginCard, 리포트 등)
 * - 위험 배지를 리포트에 표시하여 사용자에게 리스크 정보 제공
 */
export interface EngineOutput {
  valuation: ValuationResult;      // Valuation 레이어 결과
  rights: RightAnalysisResult;     // Rights 레이어 결과
  costs: CostBreakdown;            // Costs 레이어 결과
  profit: ProfitResult;            // Profit 레이어 결과
  safety: {
    fmv: { amount: number; rate: number };      // FMV 기준 안전마진
    exit: { amount: number; rate: number };      // Exit 기준 안전마진
    userBid: { amount: number; rate: number };   // 사용자 입찰가 기준 마진 (FMV - bid)
    overFMV: boolean;                            // 입찰가가 FMV 초과 여부
  };
  riskFlags: RiskFlagKey[];        // 위험 배지 배열 (v0.2 추가)
  meta?: {                         // 메타 정보 (v0.2 추가)
    engineVersion: string;          // 엔진 버전 (예: "v0.2")
    generatedAt: string;           // 생성 시각 (ISO 8601)
  };
}

// ============================================
// 타입 간 관계 및 사용 흐름
// ============================================
//
// 데이터 흐름:
// 1. PropertySnapshot (입력) → EngineInput.snapshot
//    - SimulationScenario에서 변환 (mapSimulationToSnapshot)
//    - RegisteredRight[], Tenant[] 포함
//
// 2. ValuationInput (선택) → ValuationResult
//    - PropertySnapshot의 appraisal, minBid, fmvHint 사용
//    - FMV 계산 결과는 이후 레이어의 기준값으로 사용
//
// 3. PropertySnapshot → RightAnalysisResult
//    - RegisteredRight[] → 권리 인수/소멸 판단
//    - Tenant[] → 임차인 대항력 분석
//    - assumedRightsAmount는 Costs 레이어 입력으로 사용
//
// 4. CostInput → CostBreakdown
//    - userBidPrice + assumedRightsAmount → 총인수금액 계산
//    - totalAcquisition은 Profit 레이어 입력으로 사용
//
// 5. ProfitInput → ProfitResult
//    - ValuationResult.fmv + CostBreakdown.totalAcquisition → 안전마진 계산
//
// 6. EngineOutput (최종 출력)
//    - 모든 레이어 결과 통합
//    - safety 객체에 FMV/Exit/UserBid 기준 마진 포함
//
// 타입 의존성 그래프:
// - Difficulty, RightType (기본 타입, 독립적)
// - RegisteredRight → RightType 사용
// - Tenant (독립적)
// - PropertySnapshot → RegisteredRight[], Tenant[] 사용
// - ValuationInput, ValuationResult (독립적)
// - RightAnalysisResult → RegisteredRight 사용
// - CostInput, CostBreakdown (독립적)
// - ProfitInput, ProfitResult (독립적)
// - EngineInput → PropertySnapshot, ValuationInput, EngineOptions 사용
// - EngineOutput → ValuationResult, RightAnalysisResult, CostBreakdown, ProfitResult 사용
//
// 예제 사용법:
// ```typescript
// import { auctionEngine } from "@/lib/auction-engine";
// import { mapSimulationToSnapshot } from "@/lib/auction/mappers";
// import type { EngineInput, EngineOutput } from "@/types/auction";
//
// // 1. SimulationScenario를 PropertySnapshot으로 변환
// const snapshot = mapSimulationToSnapshot(simulation);
//
// // 2. EngineInput 구성
// const input: EngineInput = {
//   snapshot,
//   userBidPrice: 500_000_000,
//   exitPriceHint: 550_000_000,
//   valuationInput: {
//     marketSignals: { kbIndex: 0.98, tradeSpeed: 0.97 }
//   },
//   options: {
//     devMode: true,
//     logPrefix: "🧠 [ENGINE]"
//   }
// };
//
// // 3. 엔진 실행
// const output: EngineOutput = auctionEngine(input);
//
// // 4. 결과 사용
// console.log(`FMV: ${output.valuation.fmv.toLocaleString()}원`);
// console.log(`총인수금액: ${output.costs.totalAcquisition.toLocaleString()}원`);
// console.log(`안전마진: ${output.safety.fmv.amount.toLocaleString()}원 (${(output.safety.fmv.rate * 100).toFixed(1)}%)`);
// ```

// ============================================
// 타입 export 목록 (총 15개)
// ============================================
//
// 기본 타입 (2개):
// - Difficulty, RightType
//
// 데이터 스냅샷 (3개):
// - Tenant, RegisteredRight, PropertySnapshot
//
// Valuation 레이어 (2개):
// - ValuationInput, ValuationResult
//
// Rights 레이어 (1개):
// - RightAnalysisResult
//
// Costs 레이어 (2개):
// - CostInput, CostBreakdown
//
// Profit 레이어 (2개):
// - ProfitInput, ProfitResult
//
// 엔진 입력/출력 (3개):
// - EngineOptions, EngineInput, EngineOutput
//
// 모든 타입은 독립적으로 export되어 있으며, 외부 타입 파일 import 없음.
// 타입 간 의존성은 같은 파일 내에서 해결됨 (순환 참조 없음).

