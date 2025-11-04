/**
 * Bid Master AI - 통합 플로우 검증 유틸리티
 * 
 * 목적: 전체 매핑 플로우와 엔진 브리지 함수 검증
 * 작성일: 2025-01-XX
 */

import type {
  PropertySnapshot,
  EngineOutput,
} from "@/types/auction";
import type {
  SimulationScenario,
  RightsAnalysisResult,
} from "@/types/simulation";
import {
  mapSimulationToSnapshot,
  mapEngineOutputToRightsAnalysisResult,
} from "./mappers";
import { auctionEngine } from "@/lib/auction-engine";

/**
 * 통합 플로우 검증 결과
 */
export interface IntegrationValidationResult {
  flowName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  stepResults: {
    step: string;
    passed: boolean;
    errors: string[];
  }[];
}

/**
 * 전체 매핑 플로우 검증
 * SimulationScenario → PropertySnapshot → EngineOutput → RightsAnalysisResult
 */
export async function validateIntegrationFlow(): Promise<IntegrationValidationResult> {
  console.log("🧪 [통합 검증] 전체 매핑 플로우 검증 시작");

  const result: IntegrationValidationResult = {
    flowName: "SimulationScenario → PropertySnapshot → EngineOutput → RightsAnalysisResult",
    passed: true,
    errors: [],
    warnings: [],
    stepResults: [],
  };

  try {
    // 1단계: SimulationScenario 생성
    const scenario: SimulationScenario = createTestScenario();
    result.stepResults.push({
      step: "1. SimulationScenario 생성",
      passed: true,
      errors: [],
    });

    // 2단계: PropertySnapshot 변환
    let snapshot: PropertySnapshot;
    try {
      snapshot = mapSimulationToSnapshot(scenario);
      result.stepResults.push({
        step: "2. SimulationScenario → PropertySnapshot",
        passed: true,
        errors: [],
      });

      // 필수 필드 검증
      if (!snapshot.caseId || !snapshot.propertyType || !snapshot.rights || !snapshot.tenants) {
        result.stepResults[result.stepResults.length - 1].passed = false;
        result.stepResults[result.stepResults.length - 1].errors.push("필수 필드 누락");
        result.passed = false;
      }
    } catch (error) {
      result.stepResults.push({
        step: "2. SimulationScenario → PropertySnapshot",
        passed: false,
        errors: [`변환 실패: ${error}`],
      });
      result.errors.push(`2단계 실패: ${error}`);
      result.passed = false;
      return result;
    }

    // 3단계: EngineOutput 생성 (auctionEngine 실행)
    let engineOutput: EngineOutput;
    try {
      const engineInput = {
        snapshot,
        userBidPrice: 400000000,
        exitPriceHint: 450000000,
        options: {
          devMode: false, // 검증 중에는 로그 최소화
        },
      };

      engineOutput = auctionEngine(engineInput);
      result.stepResults.push({
        step: "3. PropertySnapshot → EngineOutput (auctionEngine)",
        passed: true,
        errors: [],
      });

      // 필수 필드 검증
      if (
        !engineOutput.valuation ||
        !engineOutput.rights ||
        !engineOutput.costs ||
        !engineOutput.profit ||
        !engineOutput.safety
      ) {
        result.stepResults[result.stepResults.length - 1].passed = false;
        result.stepResults[result.stepResults.length - 1].errors.push("필수 필드 누락");
        result.passed = false;
      }

      // 데이터 일관성 검증
      if (engineOutput.costs.totalAcquisition <= 0) {
        result.warnings.push("총인수금액이 0 이하입니다");
      }

      if (engineOutput.valuation.fmv <= 0) {
        result.errors.push("FMV가 0 이하입니다");
        result.passed = false;
      }
    } catch (error) {
      result.stepResults.push({
        step: "3. PropertySnapshot → EngineOutput (auctionEngine)",
        passed: false,
        errors: [`엔진 실행 실패: ${error}`],
      });
      result.errors.push(`3단계 실패: ${error}`);
      result.passed = false;
      return result;
    }

    // 4단계: RightsAnalysisResult 변환
    let rightsAnalysisResult: RightsAnalysisResult;
    try {
      rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(engineOutput, scenario);
      result.stepResults.push({
        step: "4. EngineOutput → RightsAnalysisResult",
        passed: true,
        errors: [],
      });

      // 필수 필드 검증
      const requiredFields = [
        "malsoBaseRight",
        "extinguishedRights",
        "assumedRights",
        "totalAssumedAmount",
        "assumedTenants",
        "totalTenantDeposit",
        "totalAcquisition",
        "safetyMargin",
        "recommendedBidRange",
        "riskAnalysis",
      ];

      const missingFields = requiredFields.filter(
        (field) => (rightsAnalysisResult as any)[field] === undefined
      );

      if (missingFields.length > 0) {
        result.stepResults[result.stepResults.length - 1].passed = false;
        result.stepResults[result.stepResults.length - 1].errors.push(
          `필수 필드 누락: ${missingFields.join(", ")}`
        );
        result.passed = false;
      }

      // 데이터 일관성 검증
      if (rightsAnalysisResult.totalAcquisition !== engineOutput.costs.totalAcquisition) {
        result.errors.push(
          `총인수금액 불일치: RightsAnalysisResult=${rightsAnalysisResult.totalAcquisition}, EngineOutput=${engineOutput.costs.totalAcquisition}`
        );
        result.passed = false;
      }

      if (rightsAnalysisResult.safetyMargin !== engineOutput.profit.marginVsFMV) {
        result.errors.push(
          `안전마진 불일치: RightsAnalysisResult=${rightsAnalysisResult.safetyMargin}, EngineOutput=${engineOutput.profit.marginVsFMV}`
        );
        result.passed = false;
      }

      // 권리 배열 검증
      const assumedRightsCount = rightsAnalysisResult.assumedRights.length;
      const engineAssumedCount = engineOutput.rights.rightFindings.filter((f) => f.assumed).length;
      if (assumedRightsCount !== engineAssumedCount) {
        result.warnings.push(
          `인수 권리 수 불일치: RightsAnalysisResult=${assumedRightsCount}, EngineOutput=${engineAssumedCount}`
        );
      }

      // 임차인 배열 검증
      const assumedTenantsCount = rightsAnalysisResult.assumedTenants.length;
      const engineAssumedTenantsCount = engineOutput.rights.tenantFindings.filter(
        (f) => f.assumed
      ).length;
      if (assumedTenantsCount !== engineAssumedTenantsCount) {
        result.warnings.push(
          `인수 임차인 수 불일치: RightsAnalysisResult=${assumedTenantsCount}, EngineOutput=${engineAssumedTenantsCount}`
        );
      }
    } catch (error) {
      result.stepResults.push({
        step: "4. EngineOutput → RightsAnalysisResult",
        passed: false,
        errors: [`변환 실패: ${error}`],
      });
      result.errors.push(`4단계 실패: ${error}`);
      result.passed = false;
    }
  } catch (error) {
    result.errors.push(`통합 검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  console.log("🧪 [통합 검증] 전체 매핑 플로우 검증 완료", {
    flowName: result.flowName,
    passed: result.passed,
    stepCount: result.stepResults.length,
    passedSteps: result.stepResults.filter((s) => s.passed).length,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    stepResults: result.stepResults.map((s) => ({
      step: s.step,
      passed: s.passed,
      errorCount: s.errors.length,
    })),
  });

  return result;
}

/**
 * 엔진 실행 후 브리지 함수 검증
 * auctionEngine() 실행 → mapEngineOutputToRightsAnalysisResult() 실행
 */
export async function validateEngineBridgeFlow(): Promise<IntegrationValidationResult> {
  console.log("🧪 [통합 검증] 엔진 실행 후 브리지 함수 검증 시작");

  const result: IntegrationValidationResult = {
    flowName: "auctionEngine() → mapEngineOutputToRightsAnalysisResult()",
    passed: true,
    errors: [],
    warnings: [],
    stepResults: [],
  };

  try {
    // 1단계: 테스트 시나리오 생성
    const scenario = createTestScenario();
    const snapshot = mapSimulationToSnapshot(scenario);

    result.stepResults.push({
      step: "1. 테스트 시나리오 및 스냅샷 생성",
      passed: true,
      errors: [],
    });

    // 2단계: auctionEngine 실행
    let engineOutput: EngineOutput;
    try {
      const engineInput = {
        snapshot,
        userBidPrice: 400000000,
        exitPriceHint: 450000000,
        options: {
          devMode: false,
        },
      };

      engineOutput = auctionEngine(engineInput);

      result.stepResults.push({
        step: "2. auctionEngine() 실행",
        passed: true,
        errors: [],
      });

      // 엔진 출력 검증
      if (!engineOutput.valuation || !engineOutput.rights || !engineOutput.costs || !engineOutput.profit) {
        result.stepResults[result.stepResults.length - 1].passed = false;
        result.stepResults[result.stepResults.length - 1].errors.push("엔진 출력 필수 필드 누락");
        result.passed = false;
      }
    } catch (error) {
      result.stepResults.push({
        step: "2. auctionEngine() 실행",
        passed: false,
        errors: [`엔진 실행 실패: ${error}`],
      });
      result.errors.push(`엔진 실행 실패: ${error}`);
      result.passed = false;
      return result;
    }

    // 3단계: 브리지 함수 실행
    let rightsAnalysisResult: RightsAnalysisResult;
    try {
      rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(engineOutput, scenario);

      result.stepResults.push({
        step: "3. mapEngineOutputToRightsAnalysisResult() 실행",
        passed: true,
        errors: [],
      });

      // 기존 컴포넌트가 기대하는 형식 검증
      const requiredFields = [
        "malsoBaseRight",
        "extinguishedRights",
        "assumedRights",
        "totalAssumedAmount",
        "assumedTenants",
        "totalTenantDeposit",
        "totalAcquisition",
        "safetyMargin",
        "recommendedBidRange",
        "riskAnalysis",
      ];

      const missingFields = requiredFields.filter(
        (field) => (rightsAnalysisResult as any)[field] === undefined
      );

      if (missingFields.length > 0) {
        result.stepResults[result.stepResults.length - 1].passed = false;
        result.stepResults[result.stepResults.length - 1].errors.push(
          `필수 필드 누락: ${missingFields.join(", ")}`
        );
        result.passed = false;
      }

      // 데이터 타입 검증
      if (!Array.isArray(rightsAnalysisResult.extinguishedRights)) {
        result.errors.push("extinguishedRights가 배열이 아닙니다");
        result.passed = false;
      }

      if (!Array.isArray(rightsAnalysisResult.assumedRights)) {
        result.errors.push("assumedRights가 배열이 아닙니다");
        result.passed = false;
      }

      if (!Array.isArray(rightsAnalysisResult.assumedTenants)) {
        result.errors.push("assumedTenants가 배열이 아닙니다");
        result.passed = false;
      }

      if (typeof rightsAnalysisResult.totalAcquisition !== "number") {
        result.errors.push("totalAcquisition이 숫자가 아닙니다");
        result.passed = false;
      }

      if (typeof rightsAnalysisResult.safetyMargin !== "number") {
        result.errors.push("safetyMargin이 숫자가 아닙니다");
        result.passed = false;
      }

      if (!rightsAnalysisResult.recommendedBidRange || typeof rightsAnalysisResult.recommendedBidRange !== "object") {
        result.errors.push("recommendedBidRange가 객체가 아닙니다");
        result.passed = false;
      }

      if (!rightsAnalysisResult.riskAnalysis || typeof rightsAnalysisResult.riskAnalysis !== "object") {
        result.errors.push("riskAnalysis가 객체가 아닙니다");
        result.passed = false;
      }

      // 권장 입찰가 범위 검증
      const { recommendedBidRange } = rightsAnalysisResult;
      if (
        typeof recommendedBidRange.min !== "number" ||
        typeof recommendedBidRange.max !== "number" ||
        typeof recommendedBidRange.optimal !== "number"
      ) {
        result.errors.push("recommendedBidRange 필드가 올바르지 않습니다");
        result.passed = false;
      }

      if (recommendedBidRange.min > recommendedBidRange.max) {
        result.errors.push("recommendedBidRange.min이 max보다 큽니다");
        result.passed = false;
      }

      // 리스크 분석 검증
      const { riskAnalysis } = rightsAnalysisResult;
      if (
        !["low", "medium", "high"].includes(riskAnalysis.overallRiskLevel) ||
        typeof riskAnalysis.riskScore !== "number" ||
        !Array.isArray(riskAnalysis.riskFactors) ||
        !Array.isArray(riskAnalysis.recommendations)
      ) {
        result.errors.push("riskAnalysis 구조가 올바르지 않습니다");
        result.passed = false;
      }

      // 데이터 일관성 검증
      if (rightsAnalysisResult.totalAcquisition !== engineOutput.costs.totalAcquisition) {
        result.errors.push(
          `총인수금액 불일치: ${rightsAnalysisResult.totalAcquisition} !== ${engineOutput.costs.totalAcquisition}`
        );
        result.passed = false;
      }

      if (Math.abs(rightsAnalysisResult.safetyMargin - engineOutput.profit.marginVsFMV) > 1) {
        result.warnings.push(
          `안전마진 미세 차이: ${rightsAnalysisResult.safetyMargin} vs ${engineOutput.profit.marginVsFMV}`
        );
      }
    } catch (error) {
      result.stepResults.push({
        step: "3. mapEngineOutputToRightsAnalysisResult() 실행",
        passed: false,
        errors: [`브리지 함수 실행 실패: ${error}`],
      });
      result.errors.push(`브리지 함수 실행 실패: ${error}`);
      result.passed = false;
    }
  } catch (error) {
    result.errors.push(`통합 검증 중 오류 발생: ${error}`);
    result.passed = false;
  }

  console.log("🧪 [통합 검증] 엔진 실행 후 브리지 함수 검증 완료", {
    flowName: result.flowName,
    passed: result.passed,
    stepCount: result.stepResults.length,
    passedSteps: result.stepResults.filter((s) => s.passed).length,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    stepResults: result.stepResults.map((s) => ({
      step: s.step,
      passed: s.passed,
      errorCount: s.errors.length,
    })),
  });

  return result;
}

/**
 * 모든 통합 검증 실행
 */
export async function validateAllIntegrationFlows(): Promise<{
  integrationFlow: IntegrationValidationResult;
  engineBridgeFlow: IntegrationValidationResult;
}> {
  console.log("🧪 [통합 검증] 모든 통합 검증 시작");

  const integrationFlow = await validateIntegrationFlow();
  const engineBridgeFlow = await validateEngineBridgeFlow();

  const allPassed = integrationFlow.passed && engineBridgeFlow.passed;

  console.log("🧪 [통합 검증] 모든 통합 검증 완료", {
    allPassed,
    integrationFlow: {
      passed: integrationFlow.passed,
      errors: integrationFlow.errors.length,
      warnings: integrationFlow.warnings.length,
    },
    engineBridgeFlow: {
      passed: engineBridgeFlow.passed,
      errors: engineBridgeFlow.errors.length,
      warnings: engineBridgeFlow.warnings.length,
    },
  });

  return {
    integrationFlow,
    engineBridgeFlow,
  };
}

/**
 * 테스트용 SimulationScenario 생성
 * 
 * @returns 테스트용 시뮬레이션 시나리오
 */
export function createTestScenario(): SimulationScenario {
  return {
    id: "test-integration-1",
    type: "simulation",
    basicInfo: {
      caseNumber: "2025타경52051",
      court: "수원지방법원",
      propertyType: "아파트",
      location: "경기도 성남시 분당구 정자동",
      locationShort: "성남시 분당구",
      marketValue: 500000000,
      appraisalValue: 450000000,
      minimumBidPrice: 360000000,
      startingBidPrice: 360000000,
      bidDeposit: 36000000,
      claimAmount: 300000000,
      debtor: "홍길동",
      owner: "홍길동",
      creditor: "주식회사 OO은행",
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
        rightHolder: "주식회사 OO은행",
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: true,
      },
      {
        id: "right-2",
        rightType: "압류",
        claimAmount: 50000000,
        priority: 2,
        registrationDate: "2024-02-01",
        rightHolder: "OO신용정보",
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: true,
      },
    ],
    tenants: [
      {
        id: "tenant-1",
        tenantName: "김철수",
        deposit: 50000000,
        moveInDate: "2023-01-01",
        confirmationDate: "2023-01-15",
        hasDaehangryeok: true,
        isSmallTenant: false,
        priorityPaymentAmount: 0,
        willBeAssumed: true,
        monthlyRent: 500000,
      },
      {
        id: "tenant-2",
        tenantName: "이영희",
        deposit: 30000000,
        moveInDate: "2023-06-01",
        confirmationDate: null,
        hasDaehangryeok: false,
        isSmallTenant: false,
        priorityPaymentAmount: 0,
        willBeAssumed: false,
        monthlyRent: 300000,
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
}

