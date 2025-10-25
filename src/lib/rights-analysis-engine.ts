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
// 1. 말소기준권리 판단
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
    console.log(
      `  - ${right.rightType} (${right.registrationDate}): ${
        isEligible ? "적격" : "부적격"
      }`
    );
    return isEligible;
  });

  if (eligibleRights.length === 0) {
    console.log("  ⚠️ 배당요구종기일 이전 권리가 없습니다.");
    return null;
  }

  // 등기일 기준으로 정렬하여 최선순위 권리 찾기
  const sortedRights = [...eligibleRights].sort((a, b) => {
    if (a.registrationDate !== b.registrationDate) {
      return a.registrationDate.localeCompare(b.registrationDate);
    }
    return a.priority - b.priority;
  });

  const malsoBaseRight = sortedRights[0];
  console.log(
    `  ✅ 말소기준권리 결정: ${malsoBaseRight.rightType} (${malsoBaseRight.registrationDate})`
  );
  console.log(
    `     권리자: ${
      malsoBaseRight.rightHolder
    }, 청구금액: ${malsoBaseRight.claimAmount.toLocaleString()}원`
  );

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

    // 말소기준권리보다 선순위인지 판단
    const isPriorToMalsoBase =
      right.registrationDate < malsoBaseRight.registrationDate ||
      (right.registrationDate === malsoBaseRight.registrationDate &&
        right.priority < malsoBaseRight.priority);

    const willBeAssumed = isPriorToMalsoBase;
    const willBeExtinguished = !isPriorToMalsoBase && !isMalsoBase;

    console.log(
      `  - ${right.rightType} (${right.registrationDate}): ${
        isMalsoBase ? "말소기준권리" : willBeAssumed ? "인수" : "소멸"
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
        tenant.confirmationDate || "없음"
      })`
    );
    console.log(
      `    대항력: ${hasDaehangryeok ? "있음" : "없음"}, 소액임차인: ${
        isSmallTenant ? "예" : "아니오"
      }, 인수: ${willBeAssumed ? "예" : "아니오"}`
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
  tenants: TenantRecord[]
): number {
  console.log("🔍 [권리분석 엔진] 안전 마진 계산 시작");

  // 인수해야 할 권리 총액
  const totalAssumedRights = rights
    .filter((right) => right.willBeAssumed)
    .reduce((sum, right) => sum + right.claimAmount, 0);

  console.log(`  - 인수 권리 총액: ${totalAssumedRights.toLocaleString()}원`);

  // 인수해야 할 임차보증금 총액
  const totalTenantDeposit = tenants
    .filter((tenant) => tenant.willBeAssumed)
    .reduce((sum, tenant) => {
      // 소액임차인은 우선변제금액만 계산
      return (
        sum +
        (tenant.isSmallTenant ? tenant.priorityPaymentAmount : tenant.deposit)
      );
    }, 0);

  console.log(
    `  - 인수 임차보증금 총액: ${totalTenantDeposit.toLocaleString()}원`
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

  const { schedule, rights, tenants, basicInfo } = scenario;

  // 1. 말소기준권리 판단
  const malsoBaseRight = determineMalsoBaseRight(
    rights,
    schedule.dividendDeadline
  );

  // 2. 권리 인수/소멸 판단
  const analyzedRights = determineRightStatus(rights, malsoBaseRight);

  // 3. 임차인 대항력 판단
  const analyzedTenants = determineTenantDaehangryeok(
    tenants,
    malsoBaseRight,
    schedule.dividendDeadline
  );

  // 4. 인수 권리 및 임차인 필터링
  const assumedRights = analyzedRights.filter((r) => r.willBeAssumed);
  const extinguishedRights = analyzedRights.filter((r) => r.willBeExtinguished);
  const assumedTenants = analyzedTenants.filter((t) => t.willBeAssumed);

  // 5. 총액 계산
  const totalAssumedAmount = assumedRights.reduce(
    (sum, r) => sum + r.claimAmount,
    0
  );
  const totalTenantDeposit = assumedTenants.reduce(
    (sum, t) => sum + (t.isSmallTenant ? t.priorityPaymentAmount : t.deposit),
    0
  );
  const safetyMargin = calculateSafetyMargin(analyzedRights, analyzedTenants);

  // 6. 권장 입찰가 범위 계산
  const recommendedBidRange = calculateRecommendedBidRange(
    basicInfo,
    safetyMargin
  );

  console.log("✅ [권리분석 엔진] 전체 권리분석 완료");

  return {
    malsoBaseRight,
    extinguishedRights,
    assumedRights,
    totalAssumedAmount,
    assumedTenants,
    totalTenantDeposit,
    safetyMargin,
    recommendedBidRange,
  };
}

// ============================================
// 6. 권장 입찰가 범위 계산
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

  // 최소 입찰가: 최저가 + 안전 마진
  const min = minimumBidPrice + safetyMargin;

  // 최대 입찰가: 감정가의 80% (일반적인 시세)
  const max = appraisalValue * 0.8;

  // 최적 입찰가: 최소와 최대의 중간값
  const optimal = Math.round((min + max) / 2);

  console.log(`  - 최소 입찰가: ${min.toLocaleString()}원`);
  console.log(`  - 최대 입찰가: ${max.toLocaleString()}원`);
  console.log(`  - 최적 입찰가: ${optimal.toLocaleString()}원`);

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
