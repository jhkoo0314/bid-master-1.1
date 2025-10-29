/**
 * Bid Master AI - 권리분석 엔진
 * 순수 함수로 구성된 법률 로직 처리
 *
 * 핵심 로그: 말소기준권리 판단, 대항력 계산 결과 등 중요 로직에 로그 추가
 */

import {
  RightRecord,
  TenantRecord,
  SimulationScenario,
  RightsAnalysisResult,
  CaseBasicInfo,
} from "@/types/simulation";

// ============================================
// 1. 권리 우선순위 및 특성 정의
// ============================================

/**
 * 권리유형별 우선순위와 특성을 정의합니다.
 */
function getRightPriority(rightType: string): {
  basePriority: number;
  isSecured: boolean; // 담보권 여부
  canBeAssumed: boolean; // 인수 가능 여부
  description: string;
  riskLevel: 'high' | 'medium' | 'low'; // 리스크 레벨
  claimRatio: number; // 감정가 대비 청구금액 비율
} {
  const priorityMap: Record<string, { basePriority: number; isSecured: boolean; canBeAssumed: boolean; description: string; riskLevel: 'high' | 'medium' | 'low'; claimRatio: number }> = {
    // 1. 채권담보권 (최고 우선순위)
    "근저당권": { basePriority: 1, isSecured: true, canBeAssumed: true, description: "은행 등 금융기관의 담보권", riskLevel: 'high', claimRatio: 0.7 },
    "저당권": { basePriority: 2, isSecured: true, canBeAssumed: true, description: "개인 또는 법인의 담보권", riskLevel: 'high', claimRatio: 0.6 },

    // 2. 강제집행권 (압류계)
    "압류": { basePriority: 3, isSecured: false, canBeAssumed: true, description: "법원의 강제집행권", riskLevel: 'high', claimRatio: 0.5 },
    "가압류": { basePriority: 4, isSecured: false, canBeAssumed: true, description: "미리 압류하는 권리", riskLevel: 'medium', claimRatio: 0.3 },

    // 3. 등기권
    "담보가등기": { basePriority: 5, isSecured: true, canBeAssumed: true, description: "담보를 위한 가등기", riskLevel: 'medium', claimRatio: 0.4 },
    "소유권이전청구권가등기": { basePriority: 6, isSecured: false, canBeAssumed: true, description: "소유권 이전 청구권 가등기", riskLevel: 'high', claimRatio: 0.6 },
    "가등기": { basePriority: 7, isSecured: false, canBeAssumed: false, description: "일반 가등기", riskLevel: 'low', claimRatio: 0.1 },
    "예고등기": { basePriority: 8, isSecured: false, canBeAssumed: false, description: "소유권 보전을 위한 등기", riskLevel: 'low', claimRatio: 0.05 },

    // 4. 임차권
    "전세권": { basePriority: 9, isSecured: false, canBeAssumed: true, description: "전세권자 보호권", riskLevel: 'medium', claimRatio: 0.15 },
    "주택임차권": { basePriority: 10, isSecured: false, canBeAssumed: true, description: "주택 임차권", riskLevel: 'medium', claimRatio: 0.1 },
    "상가임차권": { basePriority: 11, isSecured: false, canBeAssumed: true, description: "상가 임차권", riskLevel: 'medium', claimRatio: 0.1 },

    // 5. 기타 권리
    "가처분": { basePriority: 12, isSecured: false, canBeAssumed: true, description: "임시 처분권", riskLevel: 'medium', claimRatio: 0.2 },
    "유치권": { basePriority: 13, isSecured: false, canBeAssumed: true, description: "점유자의 유치권", riskLevel: 'low', claimRatio: 0.1 },
    "법정지상권": { basePriority: 14, isSecured: false, canBeAssumed: true, description: "법적으로 인정되는 지상권", riskLevel: 'low', claimRatio: 0.1 },
    "분묘기지권": { basePriority: 15, isSecured: false, canBeAssumed: true, description: "분묘 보호권", riskLevel: 'low', claimRatio: 0.05 },
  };

  return priorityMap[rightType] || { basePriority: 99, isSecured: false, canBeAssumed: false, description: "알 수 없는 권리", riskLevel: 'low', claimRatio: 0.1 };
}

/**
 * 권리유형별 청구금액을 동적으로 계산합니다.
 * 매물 유형과 권리 특성에 따라 변동됩니다.
 */
function calculateRightClaimAmount(right: RightRecord, propertyValue: number, propertyType?: string): number {
  const { rightType, claimAmount } = right;

  // 이미 청구금액이 설정되어 있는 경우 그대로 사용
  if (claimAmount > 0) {
    console.log(`💰 [권리분석] ${rightType} 고정 청구금액: ${claimAmount.toLocaleString()}원`);
    return claimAmount;
  }

  // 권리 특성 정보 가져오기
  const rightInfo = getRightPriority(rightType);
  let baseRatio = rightInfo.claimRatio;

  // 매물 유형별 가중치 적용
  const propertyMultipliers: Record<string, number> = {
    '아파트': 1.0,      // 표준
    '오피스텔': 0.9,    // 상대적으로 낮음
    '상가': 1.2,        // 상대적으로 높음
    '단독주택': 0.8,    // 상대적으로 낮음
    '빌라': 0.9,        // 상대적으로 낮음
    '토지': 1.1,        // 상대적으로 높음
  };

  const multiplier = propertyMultipliers[propertyType || '아파트'] || 1.0;
  const adjustedRatio = baseRatio * multiplier;

  // 권리 유형별 추가 조정
  let finalRatio = adjustedRatio;
  
  if (rightType === '근저당권' || rightType === '저당권') {
    // 담보권은 감정가의 60-80% 범위에서 변동
    finalRatio = Math.min(Math.max(adjustedRatio, 0.6), 0.8);
  } else if (rightType === '압류' || rightType === '가압류') {
    // 압류권은 감정가의 30-60% 범위에서 변동
    finalRatio = Math.min(Math.max(adjustedRatio, 0.3), 0.6);
  } else if (rightType.includes('임차권') || rightType === '전세권') {
    // 임차권은 감정가의 5-20% 범위에서 변동
    finalRatio = Math.min(Math.max(adjustedRatio, 0.05), 0.2);
  }

  const calculatedAmount = Math.floor(propertyValue * finalRatio);
  
  console.log(`💰 [권리분석] ${rightType} 동적 계산: ${calculatedAmount.toLocaleString()}원 (비율: ${(finalRatio * 100).toFixed(1)}%, 매물: ${propertyType || '아파트'})`);
  
  return calculatedAmount;
}

// ============================================
// 2. 말소기준권리 판단
// ============================================

/**
 * 말소기준권리를 판단합니다.
 * 배당요구종기일 이전에 설정된 최선순위 권리가 말소기준권리가 됩니다.
 *
 * @param rights 등기부 권리 목록
 * @param dividendDeadline 배당요구종기일 (YYYY-MM-DD)
 * @returns 말소기준권리 또는 null
 */
export function determineMalsoBaseRight(
  rights: RightRecord[],
  dividendDeadline: string
): RightRecord | null {
  console.log("🔍 [권리분석 엔진] 말소기준권리 판단 시작");
  console.log(`  - 배당요구종기일: ${dividendDeadline}`);
  console.log(`  - 전체 권리 개수: ${rights.length}`);

  if (rights.length === 0) {
    console.log("  ⚠️ 권리가 없습니다.");
    return null;
  }

  // 배당요구종기일 이전에 설정된 권리만 필터링
  const eligibleRights = rights.filter((right) => {
    const isEligible = right.registrationDate <= dividendDeadline;
    const priorityInfo = getRightPriority(right.rightType);
    console.log(
      `  - ${right.rightType} (${right.registrationDate}, 우선순위: ${priorityInfo.basePriority}): ${
        isEligible ? "적격" : "부적격"
      }`
    );
    return isEligible;
  });

  if (eligibleRights.length === 0) {
    console.log("  ⚠️ 배당요구종기일 이전 권리가 없습니다.");
    return null;
  }

  // 우선순위 기반 정렬 (우선순위 숫자가 낮을수록 높음)
  const sortedRights = [...eligibleRights].sort((a, b) => {
    const priorityA = getRightPriority(a.rightType);
    const priorityB = getRightPriority(b.rightType);

    // 우선순위 비교 (낮은 숫자가 높은 우선순위)
    if (priorityA.basePriority !== priorityB.basePriority) {
      return priorityA.basePriority - priorityB.basePriority;
    }

    // 우선순위가 같으면 등기일 기준
    if (a.registrationDate !== b.registrationDate) {
      return a.registrationDate.localeCompare(b.registrationDate);
    }

    // 등기일도 같으면 기존 priority 필드 사용
    return (a.priority || 0) - (b.priority || 0);
  });

  const malsoBaseRight = sortedRights[0];
  const priorityInfo = getRightPriority(malsoBaseRight.rightType);

  console.log(
    `  ✅ 말소기준권리 결정: ${malsoBaseRight.rightType} (${malsoBaseRight.registrationDate})`
  );
  console.log(
    `     권리자: ${malsoBaseRight.rightHolder}, 청구금액: ${malsoBaseRight.claimAmount.toLocaleString()}원`
  );
  console.log(`     우선순위: ${priorityInfo.basePriority}, 설명: ${priorityInfo.description}`);

  return malsoBaseRight;
}

// ============================================
// 2. 권리의 인수/소멸 여부 판단
// ============================================

/**
 * 각 권리의 인수/소멸 여부를 판단합니다.
 * 말소기준권리보다 선순위 권리는 인수, 후순위 권리는 소멸됩니다.
 *
 * @param rights 등기부 권리 목록
 * @param malsoBaseRight 말소기준권리
 * @returns 인수/소멸 여부가 표시된 권리 목록
 */
export function determineRightStatus(
  rights: RightRecord[],
  malsoBaseRight: RightRecord | null
): RightRecord[] {
  console.log("🔍 [권리분석 엔진] 권리 인수/소멸 판단 시작");

  if (!malsoBaseRight) {
    console.log("  ⚠️ 말소기준권리가 없어 모든 권리를 소멸 처리합니다.");
    return rights.map((right) => ({
      ...right,
      isMalsoBaseRight: false,
      willBeExtinguished: true,
      willBeAssumed: false,
    }));
  }

  return rights.map((right) => {
    const isMalsoBase = right.id === malsoBaseRight.id;
    const rightPriority = getRightPriority(right.rightType);
    const malsoPriority = getRightPriority(malsoBaseRight.rightType);

    // 말소기준권리보다 선순위인지 판단 (우선순위 숫자가 낮을수록 높음)
    const isPriorToMalsoBase =
      rightPriority.basePriority < malsoPriority.basePriority ||
      (rightPriority.basePriority === malsoPriority.basePriority &&
        (right.registrationDate < malsoBaseRight.registrationDate ||
         (right.registrationDate === malsoBaseRight.registrationDate &&
          (right.priority || 0) < (malsoBaseRight.priority || 0))));

    // 권리유형별 인수 가능 여부와 말소기준권리 여부를 고려
    const willBeAssumed = isPriorToMalsoBase && rightPriority.canBeAssumed;
    const willBeExtinguished = !isPriorToMalsoBase && !isMalsoBase && rightPriority.canBeAssumed;

    console.log(
      `  - ${right.rightType} (우선순위: ${rightPriority.basePriority}, ${right.registrationDate}): ${
        isMalsoBase ? "말소기준권리" : willBeAssumed ? "인수" : willBeExtinguished ? "소멸" : "유지"
      }`
    );

    return {
      ...right,
      isMalsoBaseRight: isMalsoBase,
      willBeExtinguished,
      willBeAssumed,
    };
  });
}

// ============================================
// 3. 임차인 대항력 판단
// ============================================

/**
 * 임차인의 대항력 성립 여부를 판단합니다.
 * 대항력 성립 요건:
 * 1. 전입일이 말소기준권리 설정일보다 빠를 것
 * 2. 확정일자가 배당요구종기일보다 빠를 것
 *
 * @param tenants 임차인 목록
 * @param malsoBaseRight 말소기준권리
 * @param dividendDeadline 배당요구종기일
 * @returns 대항력 여부가 표시된 임차인 목록
 */
export function determineTenantDaehangryeok(
  tenants: TenantRecord[],
  malsoBaseRight: RightRecord | null,
  dividendDeadline: string
): TenantRecord[] {
  console.log("🔍 [권리분석 엔진] 임차인 대항력 판단 시작");
  console.log(`  - 배당요구종기일: ${dividendDeadline}`);
  console.log(
    `  - 말소기준권리 설정일: ${malsoBaseRight?.registrationDate || "없음"}`
  );

  if (!malsoBaseRight) {
    console.log(
      "  ⚠️ 말소기준권리가 없어 모든 임차인의 대항력을 인정하지 않습니다."
    );
    return tenants.map((tenant) => ({
      ...tenant,
      hasDaehangryeok: false,
      willBeAssumed: false,
      isSmallTenant: false,
      priorityPaymentAmount: 0,
    }));
  }

  return tenants.map((tenant) => {
    // 대항력 요건 1: 전입일이 말소기준권리 설정일보다 빠를 것
    const moveInBeforeMalso =
      tenant.moveInDate < malsoBaseRight.registrationDate;

    // 대항력 요건 2: 확정일자가 배당요구종기일보다 빠를 것
    const confirmationBeforeDeadline =
      tenant.confirmationDate !== null &&
      tenant.confirmationDate <= dividendDeadline;

    const hasDaehangryeok = moveInBeforeMalso && confirmationBeforeDeadline;

    // 소액임차인 판단 (보증금 기준 - 지역별로 다르지만 여기서는 간단히 처리)
    // 서울: 1억 7천만원 이하, 수도권: 1억 3천만원 이하, 기타: 8천만원 이하
    const isSmallTenant = tenant.deposit <= 170000000; // 간단히 서울 기준 적용

    // 소액임차인 우선변제금액 계산 (보증금의 1/2, 최대 5천만원)
    const priorityPaymentAmount = isSmallTenant
      ? Math.min(tenant.deposit / 2, 50000000)
      : 0;

    // 대항력이 있거나 소액임차인이면 인수 대상
    const willBeAssumed = hasDaehangryeok || isSmallTenant;

    console.log(
      `  - ${tenant.tenantName} (전입: ${tenant.moveInDate}, 확정: ${
        tenant.confirmationDate || "없음"}, 보증금: ${tenant.deposit.toLocaleString()}원)`
    );
    console.log(
      `    대항력: ${hasDaehangryeok ? "있음" : "없음"}, 소액임차인: ${
        isSmallTenant ? "예" : "아니오"
      }, 인수: ${willBeAssumed ? "예" : "아니오"}, 우선변제금액: ${priorityPaymentAmount.toLocaleString()}원`
    );

    return {
      ...tenant,
      hasDaehangryeok,
      isSmallTenant,
      priorityPaymentAmount,
      willBeAssumed,
    };
  });
}

// ============================================
// 4. 인수해야 할 권리 총액 계산
// ============================================

/**
 * 인수해야 할 권리와 임차보증금의 총액을 계산합니다.
 *
 * @param rights 권리 목록
 * @param tenants 임차인 목록
 * @returns 안전 마진 (인수 권리 총액 + 임차보증금 총액)
 */
export function calculateSafetyMargin(
  rights: RightRecord[],
  tenants: TenantRecord[],
  propertyValue: number = 0,
  propertyType?: string
): number {
  console.log("🔍 [권리분석 엔진] 안전 마진 계산 시작");
  console.log(`  - 매물 유형: ${propertyType || '아파트'}`);
  console.log(`  - 감정가: ${propertyValue.toLocaleString()}원`);

  // 인수해야 할 권리 총액 (청구금액이 없는 경우 자동 계산)
  const assumedRights = rights.filter((right) => right.willBeAssumed);
  const totalAssumedRights = assumedRights.reduce((sum, right) => {
    const claimAmount = right.claimAmount > 0 ? right.claimAmount : calculateRightClaimAmount(right, propertyValue, propertyType);
    const rightInfo = getRightPriority(right.rightType);
    console.log(`    - ${right.rightType} (${rightInfo.riskLevel}): ${claimAmount.toLocaleString()}원`);
    return sum + claimAmount;
  }, 0);

  console.log(`  - 인수 권리 총액: ${totalAssumedRights.toLocaleString()}원 (${assumedRights.length}개 권리)`);

  // 인수해야 할 임차보증금 총액
  const assumedTenants = tenants.filter((tenant) => tenant.willBeAssumed);
  const totalTenantDeposit = assumedTenants.reduce((sum, tenant) => {
    // 소액임차인은 우선변제금액만 계산
    const tenantAmount = tenant.isSmallTenant ? tenant.priorityPaymentAmount : tenant.deposit;
    console.log(`    - ${tenant.tenantName}: ${tenantAmount.toLocaleString()}원 (${tenant.isSmallTenant ? '우선변제' : '전액'})`);
    return sum + tenantAmount;
  }, 0);

  console.log(
    `  - 인수 임차보증금 총액: ${totalTenantDeposit.toLocaleString()}원 (${assumedTenants.length}명 임차인)`
  );

  const safetyMargin = totalAssumedRights + totalTenantDeposit;
  console.log(`  ✅ 총 안전 마진: ${safetyMargin.toLocaleString()}원`);

  return safetyMargin;
}

// ============================================
// 5. 권리분석 전체 실행
// ============================================

/**
 * 시뮬레이션 시나리오에 대한 전체 권리분석을 실행합니다.
 *
 * @param scenario 시뮬레이션 시나리오
 * @returns 권리분석 결과
 */
export function analyzeRights(
  scenario: SimulationScenario
): RightsAnalysisResult {
  console.log("🚀 [권리분석 엔진] 전체 권리분석 시작");
  console.log(`  - 시나리오 ID: ${scenario.id}`);
  console.log(`  - 사건번호: ${scenario.basicInfo.caseNumber}`);
  console.log(`  - 권리 개수: ${scenario.rights.length}`);
  console.log(`  - 임차인 개수: ${scenario.tenants.length}`);
  console.log(`  - 감정가: ${scenario.basicInfo.appraisalValue.toLocaleString()}원`);

  const { schedule, rights, tenants, basicInfo, propertyDetails } = scenario;

  // 1. 말소기준권리 판단
  console.log("🔍 [권리분석 엔진] 1단계: 말소기준권리 판단 시작");
  const malsoBaseRight = determineMalsoBaseRight(
    rights,
    schedule.dividendDeadline
  );
  console.log(`✅ [권리분석 엔진] 말소기준권리: ${malsoBaseRight?.rightType || "없음"}`);

  // 2. 권리 인수/소멸 판단
  console.log("🔍 [권리분석 엔진] 2단계: 권리 인수/소멸 판단 시작");
  const analyzedRights = determineRightStatus(rights, malsoBaseRight);
  console.log(`✅ [권리분석 엔진] 권리 분석 완료: ${analyzedRights.length}개`);

  // 3. 임차인 대항력 판단
  console.log("🔍 [권리분석 엔진] 3단계: 임차인 대항력 판단 시작");
  const analyzedTenants = determineTenantDaehangryeok(
    tenants,
    malsoBaseRight,
    schedule.dividendDeadline
  );
  console.log(`✅ [권리분석 엔진] 임차인 분석 완료: ${analyzedTenants.length}명`);

  // 4. 인수 권리 및 임차인 필터링
  const assumedRights = analyzedRights.filter((r) => r.willBeAssumed);
  const extinguishedRights = analyzedRights.filter((r) => r.willBeExtinguished);
  const assumedTenants = analyzedTenants.filter((t) => t.willBeAssumed);
  
  console.log("🔍 [권리분석 엔진] 필터링 결과:");
  console.log(`  - 분석된 권리: ${analyzedRights.length}개`);
  console.log(`  - 인수 권리: ${assumedRights.length}개`);
  console.log(`  - 소멸 권리: ${extinguishedRights.length}개`);
  console.log(`  - 분석된 임차인: ${analyzedTenants.length}명`);
  console.log(`  - 인수 임차인: ${assumedTenants.length}명`);

  // 5. 총액 계산
  const propertyType = propertyDetails?.usage || '아파트';
  const totalAssumedAmount = assumedRights.reduce(
    (sum, r) => sum + (r.claimAmount > 0 ? r.claimAmount : calculateRightClaimAmount(r, basicInfo.appraisalValue, propertyType)),
    0
  );
  const totalTenantDeposit = assumedTenants.reduce(
    (sum, t) => sum + (t.isSmallTenant ? t.priorityPaymentAmount : t.deposit),
    0
  );
  const safetyMargin = calculateSafetyMargin(analyzedRights, analyzedTenants, basicInfo.appraisalValue, propertyType);

  // 6. 권장 입찰가 범위 계산
  const recommendedBidRange = calculateRecommendedBidRange(
    basicInfo,
    safetyMargin
  );

  // 7. 리스크 분석
  const riskAnalysis = analyzeRightsRisk(analyzedRights, propertyType);

  console.log("✅ [권리분석 엔진] 전체 권리분석 완료");
  console.log(`  - 말소기준권리: ${malsoBaseRight?.rightType || "없음"}`);
  console.log(`  - 인수권리 개수: ${assumedRights.length}개`);
  console.log(`  - 소멸권리 개수: ${extinguishedRights.length}개`);
  console.log(`  - 인수임차인 개수: ${assumedTenants.length}명`);
  console.log(`  - 인수권리 총액: ${totalAssumedAmount.toLocaleString()}원`);
  console.log(`  - 인수임차보증금 총액: ${totalTenantDeposit.toLocaleString()}원`);
  console.log(`  - 최종 안전마진: ${safetyMargin.toLocaleString()}원`);
  console.log(`  - 안전마진 비율: ${((safetyMargin / basicInfo.appraisalValue) * 100).toFixed(1)}%`);
  console.log(`  - 리스크 레벨: ${riskAnalysis.overallRiskLevel} (${riskAnalysis.riskScore}/100)`);

  return {
    malsoBaseRight,
    extinguishedRights,
    assumedRights,
    totalAssumedAmount,
    assumedTenants,
    totalTenantDeposit,
    safetyMargin,
    recommendedBidRange,
    riskAnalysis,
  };
}

// ============================================
// 6. 리스크 분석
// ============================================

/**
 * 권리들의 리스크를 분석합니다.
 */
function analyzeRightsRisk(rights: RightRecord[], propertyType: string): {
  overallRiskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
  riskFactors: string[];
  recommendations: string[];
} {
  console.log("🔍 [권리분석 엔진] 리스크 분석 시작");
  console.log(`  - 매물 유형: ${propertyType}`);

  let riskScore = 0;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // 권리 개수에 따른 기본 리스크
  const rightCount = rights.length;
  if (rightCount === 0) {
    riskScore += 10; // 권리가 없으면 낮은 리스크
    riskFactors.push("권리가 없어 안전함");
  } else if (rightCount >= 5) {
    riskScore += 30; // 권리가 많으면 높은 리스크
    riskFactors.push("권리가 많아 복잡함");
    recommendations.push("권리 관계를 면밀히 검토하세요");
  }

  // 고위험 권리 분석
  const highRiskRights = rights.filter(r => {
    const info = getRightPriority(r.rightType);
    return info.riskLevel === 'high';
  });

  if (highRiskRights.length > 0) {
    riskScore += highRiskRights.length * 20;
    riskFactors.push(`고위험 권리 ${highRiskRights.length}개 존재`);
    recommendations.push("고위험 권리의 청구금액을 정확히 파악하세요");
  }

  // 담보권 분석
  const securedRights = rights.filter(r => {
    const info = getRightPriority(r.rightType);
    return info.isSecured;
  });

  if (securedRights.length > 1) {
    riskScore += 25;
    riskFactors.push("여러 담보권이 존재함");
    recommendations.push("담보권 간의 우선순위를 확인하세요");
  }

  // 매물 유형별 리스크 조정
  const propertyRiskMultipliers: Record<string, number> = {
    '아파트': 1.0,
    '오피스텔': 1.2,
    '상가': 1.5,
    '단독주택': 0.8,
    '빌라': 1.1,
    '토지': 1.3,
  };

  const multiplier = propertyRiskMultipliers[propertyType] || 1.0;
  riskScore = Math.round(riskScore * multiplier);

  // 리스크 레벨 결정
  let overallRiskLevel: 'high' | 'medium' | 'low';
  if (riskScore >= 70) {
    overallRiskLevel = 'high';
    recommendations.push("매우 신중한 검토가 필요합니다");
  } else if (riskScore >= 40) {
    overallRiskLevel = 'medium';
    recommendations.push("주의 깊은 검토가 필요합니다");
  } else {
    overallRiskLevel = 'low';
    recommendations.push("상대적으로 안전한 매물입니다");
  }

  console.log(`  - 리스크 점수: ${riskScore}/100`);
  console.log(`  - 리스크 레벨: ${overallRiskLevel}`);
  console.log(`  - 리스크 요인: ${riskFactors.length}개`);

  return {
    overallRiskLevel,
    riskScore,
    riskFactors,
    recommendations,
  };
}

// ============================================
// 7. 권장 입찰가 범위 계산
// ============================================

/**
 * 권장 입찰가 범위를 계산합니다.
 *
 * @param basicInfo 기본 정보
 * @param safetyMargin 안전 마진
 * @returns 권장 입찰가 범위
 */
function calculateRecommendedBidRange(
  basicInfo: CaseBasicInfo,
  safetyMargin: number
): { min: number; max: number; optimal: number } {
  console.log("🔍 [권리분석 엔진] 권장 입찰가 범위 계산");

  const { minimumBidPrice, appraisalValue } = basicInfo;

  // 최소 입찰가: 최저가 (안전 마진은 별도로 고려)
  const min = minimumBidPrice;

  // 최대 입찰가: 감정가의 80% (일반적인 시세)
  const max = Math.round(appraisalValue * 0.8);

  // 최적 입찰가: 안전 마진을 고려하여 계산
  // 안전 마진이 크면 최저가에 가까운 값, 작으면 중간 값
  const marginRatio = safetyMargin / appraisalValue;
  let optimal: number;

  if (marginRatio > 0.3) {
    // 안전 마진이 크면 최저가에 가까운 값
    optimal = Math.round(min + (max - min) * 0.2);
  } else if (marginRatio > 0.1) {
    // 중간 수준이면 중간 값
    optimal = Math.round((min + max) / 2);
  } else {
    // 안전 마진이 작으면 감정가에 가까운 값
    optimal = Math.round(min + (max - min) * 0.8);
  }

  console.log(`  - 최소 입찰가: ${min.toLocaleString()}원`);
  console.log(`  - 최대 입찰가: ${max.toLocaleString()}원`);
  console.log(`  - 최적 입찰가: ${optimal.toLocaleString()}원`);
  console.log(`  - 안전 마진 비율: ${(marginRatio * 100).toFixed(1)}%`);

  return { min, max, optimal };
}

// ============================================
// 7. 시나리오 검증
// ============================================

/**
 * AI가 생성한 시나리오의 법률적 정합성을 검증합니다.
 *
 * @param scenario 시뮬레이션 시나리오
 * @returns 검증 결과 { isValid: boolean, errors: string[] }
 */
export function validateScenario(scenario: SimulationScenario): {
  isValid: boolean;
  errors: string[];
} {
  console.log("🔍 [권리분석 엔진] 시나리오 검증 시작");

  const errors: string[] = [];

  // 1. 기본 정보 검증
  if (scenario.basicInfo.minimumBidPrice > scenario.basicInfo.appraisalValue) {
    errors.push("최저가가 감정가보다 높습니다.");
  }

  if (
    scenario.basicInfo.bidDeposit !==
    scenario.basicInfo.minimumBidPrice * 0.1
  ) {
    errors.push("입찰보증금이 최저가의 10%가 아닙니다.");
  }

  // 2. 일정 검증
  const { schedule } = scenario;
  if (schedule.caseFiledDate > schedule.decisionDate) {
    errors.push("경매사건접수일이 개시결정일보다 늦습니다.");
  }

  if (schedule.decisionDate > schedule.dividendDeadline) {
    errors.push("개시결정일이 배당요구종기일보다 늦습니다.");
  }

  // 3. 권리 검증
  if (scenario.rights.length === 0) {
    errors.push("권리가 하나도 없습니다.");
  }

  // 4. 매각 일정 검증
  if (scenario.biddingHistory.length === 0) {
    errors.push("매각 일정이 없습니다.");
  }

  const isValid = errors.length === 0;

  if (isValid) {
    console.log("  ✅ 시나리오 검증 통과");
  } else {
    console.log("  ⚠️ 시나리오 검증 실패:");
    errors.forEach((error) => console.log(`    - ${error}`));
  }

  return { isValid, errors };
}
