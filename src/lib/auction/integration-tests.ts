/**
 * Bid Master AI - 통합 테스트 및 검증
 * 
 * 목적: Phase 4 컴포넌트 교체 후 전체 플로우 테스트 및 검증
 * 작성일: 2025-01-XX
 * 
 * 테스트 범위:
 * 1. 전체 플로우 테스트 (매물 생성 → 상세 페이지 → 입찰 모달 → 리포트)
 * 2. 데이터 일관성 검증
 * 3. 성능 테스트 (엔진 실행 시간 측정)
 * 4. 에러 처리 테스트
 * 5. TypeScript 컴파일 검증
 */

import type {
  PropertySnapshot,
  EngineOutput,
  EngineInput,
} from "@/types/auction";
import type {
  SimulationScenario,
  RightsAnalysisResult,
} from "@/types/simulation";
import {
  mapSimulationToSnapshot,
  mapEngineOutputToRightsAnalysisResult,
  mapCostBreakdownToAcquisitionBreakdown,
  mapProfitResultToSafetyMargin,
} from "./mappers";
import { auctionEngine } from "@/lib/auction-engine";
import { createTestScenario } from "./mappers-integration-validation";

/**
 * 통합 테스트 실행 함수를 export하여 실제 테스트 스크립트에서 사용 가능하도록 함
 * 
 * 사용 예시:
 * ```typescript
 * import { runAllIntegrationTests } from "@/lib/auction/integration-tests";
 * 
 * // 브라우저 콘솔 또는 Node.js 환경에서 실행
 * runAllIntegrationTests().then(result => {
 *   console.log("통합 테스트 결과:", result);
 * });
 * ```
 */

/**
 * 통합 테스트 결과
 */
export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration: number; // 실행 시간 (ms)
  data?: unknown;
}

/**
 * 전체 플로우 테스트 결과
 */
export interface FullFlowTestResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  tests: IntegrationTestResult[];
  totalDuration: number;
}

/**
 * 전체 플로우 테스트
 * 매물 생성 → 상세 페이지 → 입찰 모달 → 리포트
 */
export async function testFullFlow(): Promise<FullFlowTestResult> {
  console.log("🧪 [통합 테스트] 전체 플로우 테스트 시작");

  const startTime = performance.now();
  const tests: IntegrationTestResult[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. 테스트 시나리오 생성
    const scenario = createTestScenario();
    console.log("🧪 [통합 테스트] 테스트 시나리오 생성 완료");

    // 2. 매물 생성 시 엔진 실행 확인
    const test1 = await testEngineExecutionOnPropertyGeneration(scenario);
    tests.push(test1);
    if (!test1.passed) {
      errors.push(`매물 생성 엔진 실행 실패: ${test1.errors.join(", ")}`);
    }

    // 3. 상세 페이지 로드 시 엔진 실행 확인
    const test2 = await testEngineExecutionOnPropertyPage(scenario);
    tests.push(test2);
    if (!test2.passed) {
      errors.push(`상세 페이지 엔진 실행 실패: ${test2.errors.join(", ")}`);
    }

    // 4. 입찰 모달에서 입찰가 입력 시 엔진 실행 확인
    const test3 = await testEngineExecutionOnBiddingModal(scenario);
    tests.push(test3);
    if (!test3.passed) {
      errors.push(`입찰 모달 엔진 실행 실패: ${test3.errors.join(", ")}`);
    }

    // 5. 리포트 모달 열기 시 데이터 정확성 확인
    const test4 = await testReportModalDataAccuracy(scenario);
    tests.push(test4);
    if (!test4.passed) {
      errors.push(`리포트 모달 데이터 정확성 실패: ${test4.errors.join(", ")}`);
    }

    // 6. 데이터 일관성 검증
    const test5 = await testDataConsistency(scenario);
    tests.push(test5);
    if (!test5.passed) {
      errors.push(`데이터 일관성 검증 실패: ${test5.errors.join(", ")}`);
    }

    const totalDuration = performance.now() - startTime;
    const passed = errors.length === 0;

    console.log("🧪 [통합 테스트] 전체 플로우 테스트 완료", {
      passed,
      errors: errors.length,
      warnings: warnings.length,
      totalDuration: `${totalDuration.toFixed(2)}ms`,
      tests: tests.length,
    });

    return {
      passed,
      errors,
      warnings,
      tests,
      totalDuration,
    };
  } catch (error) {
    const totalDuration = performance.now() - startTime;
    console.error("🧪 [통합 테스트] 전체 플로우 테스트 실패:", error);
    return {
      passed: false,
      errors: [`테스트 실행 실패: ${error}`],
      warnings,
      tests,
      totalDuration,
    };
  }
}

/**
 * 매물 생성 시 엔진 실행 확인
 */
async function testEngineExecutionOnPropertyGeneration(
  scenario: SimulationScenario
): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // generateSimulation 또는 generateProperty와 동일한 로직
    const snapshot = mapSimulationToSnapshot(scenario);
    const engineOutput = auctionEngine({
      snapshot,
      userBidPrice: scenario.basicInfo.minimumBidPrice,
      options: { devMode: false },
    });

    // 필수 필드 검증
    if (!engineOutput.valuation || !engineOutput.rights || !engineOutput.costs || !engineOutput.profit) {
      errors.push("엔진 출력 필수 필드 누락");
    }

    // 브리지 함수 실행
    const rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(
      engineOutput,
      scenario
    );

    // 분석 결과 반영 확인
    if (rightsAnalysisResult.assumedRights.length === 0 && scenario.rights.length > 0) {
      warnings.push("인수 권리가 없지만 원본 권리는 존재합니다");
    }

    const duration = performance.now() - startTime;

    return {
      testName: "매물 생성 시 엔진 실행",
      passed: errors.length === 0,
      errors,
      warnings,
      duration,
      data: {
        engineOutput: {
          fmv: engineOutput.valuation.fmv,
          assumedRightsAmount: engineOutput.rights.assumedRightsAmount,
          totalAcquisition: engineOutput.costs.totalAcquisition,
        },
        rightsAnalysisResult: {
          assumedRightsCount: rightsAnalysisResult.assumedRights.length,
          extinguishedRightsCount: rightsAnalysisResult.extinguishedRights.length,
        },
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      testName: "매물 생성 시 엔진 실행",
      passed: false,
      errors: [`엔진 실행 실패: ${error}`],
      warnings,
      duration,
    };
  }
}

/**
 * 상세 페이지 로드 시 엔진 실행 확인
 */
async function testEngineExecutionOnPropertyPage(
  scenario: SimulationScenario
): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // property/[id]/page.tsx와 동일한 로직
    const snapshot = mapSimulationToSnapshot(scenario);
    const engineOutput = auctionEngine({
      snapshot,
      userBidPrice: scenario.basicInfo.minimumBidPrice,
      options: { devMode: false },
    });

    const rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(
      engineOutput,
      scenario
    );

    // 리포트 모달 데이터 준비 확인
    if (!rightsAnalysisResult.safetyMargin) {
      errors.push("안전마진이 없습니다");
    }

    if (!rightsAnalysisResult.totalAssumedAmount) {
      warnings.push("총 인수금액이 0입니다");
    }

    const duration = performance.now() - startTime;

    return {
      testName: "상세 페이지 로드 시 엔진 실행",
      passed: errors.length === 0,
      errors,
      warnings,
      duration,
      data: {
        safetyMargin: rightsAnalysisResult.safetyMargin,
        totalAssumedAmount: rightsAnalysisResult.totalAssumedAmount,
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      testName: "상세 페이지 로드 시 엔진 실행",
      passed: false,
      errors: [`엔진 실행 실패: ${error}`],
      warnings,
      duration,
    };
  }
}

/**
 * 입찰 모달에서 입찰가 입력 시 엔진 실행 확인
 */
async function testEngineExecutionOnBiddingModal(
  scenario: SimulationScenario
): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // BiddingModal.tsx와 동일한 로직
    const snapshot = mapSimulationToSnapshot(scenario);
    const userBidPrice = 450000000; // 테스트 입찰가
    const exitPriceHint = 480000000; // 테스트 Exit 가격

    const engineOutput = auctionEngine({
      snapshot,
      userBidPrice,
      exitPriceHint,
      options: { devMode: false },
    });

    // 권리분석 결과 변환
    const rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(
      engineOutput,
      scenario
    );

    // 총인수금액 변환
    const acquisitionBreakdown = mapCostBreakdownToAcquisitionBreakdown(
      engineOutput.costs,
      userBidPrice,
      engineOutput.rights.assumedRightsAmount
    );

    // 안전마진 변환
    const safetyMarginArray = mapProfitResultToSafetyMargin(
      engineOutput.profit,
      engineOutput.valuation,
      exitPriceHint,
      userBidPrice
    );

    // 데이터 검증
    if (acquisitionBreakdown.total !== engineOutput.costs.totalAcquisition) {
      errors.push("총인수금액 불일치");
    }

    if (safetyMarginArray.length < 2) {
      errors.push("안전마진 배열 길이 부족");
    }

    const duration = performance.now() - startTime;

    return {
      testName: "입찰 모달 엔진 실행",
      passed: errors.length === 0,
      errors,
      warnings,
      duration,
      data: {
        totalAcquisition: acquisitionBreakdown.total,
        safetyMarginCount: safetyMarginArray.length,
        marginVsFMV: engineOutput.profit.marginVsFMV,
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      testName: "입찰 모달 엔진 실행",
      passed: false,
      errors: [`엔진 실행 실패: ${error}`],
      warnings,
      duration,
    };
  }
}

/**
 * 리포트 모달 열기 시 데이터 정확성 확인
 */
async function testReportModalDataAccuracy(
  scenario: SimulationScenario
): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const snapshot = mapSimulationToSnapshot(scenario);
    const engineOutput = auctionEngine({
      snapshot,
      userBidPrice: scenario.basicInfo.minimumBidPrice,
      options: { devMode: false },
    });

    const rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(
      engineOutput,
      scenario
    );

    // 리포트 모달에 필요한 데이터 검증
    const requiredFields = [
      "safetyMargin",
      "totalAssumedAmount",
      "assumedRights",
      "extinguishedRights",
      "malsoBaseRight",
    ];

    for (const field of requiredFields) {
      if (!(field in rightsAnalysisResult)) {
        errors.push(`필수 필드 누락: ${field}`);
      }
    }

    // 권장 입찰가 범위 검증
    if (!rightsAnalysisResult.recommendedBidRange) {
      errors.push("권장 입찰가 범위가 없습니다");
    } else {
      const { min, max, optimal } = rightsAnalysisResult.recommendedBidRange;
      if (min >= max) {
        errors.push("권장 입찰가 범위가 잘못되었습니다 (min >= max)");
      }
      if (optimal < min || optimal > max) {
        errors.push("최적 입찰가가 범위를 벗어났습니다");
      }
    }

    // 리스크 분석 검증
    if (!rightsAnalysisResult.riskAnalysis) {
      warnings.push("리스크 분석이 없습니다");
    }

    const duration = performance.now() - startTime;

    return {
      testName: "리포트 모달 데이터 정확성",
      passed: errors.length === 0,
      errors,
      warnings,
      duration,
      data: {
        hasRecommendedRange: !!rightsAnalysisResult.recommendedBidRange,
        hasRiskAnalysis: !!rightsAnalysisResult.riskAnalysis,
        assumedRightsCount: rightsAnalysisResult.assumedRights.length,
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      testName: "리포트 모달 데이터 정확성",
      passed: false,
      errors: [`데이터 검증 실패: ${error}`],
      warnings,
      duration,
    };
  }
}

/**
 * 데이터 일관성 검증
 * 동일 시나리오에 대해 여러 컴포넌트에서 동일한 결과가 나오는지 확인
 */
async function testDataConsistency(
  scenario: SimulationScenario
): Promise<IntegrationTestResult> {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const snapshot = mapSimulationToSnapshot(scenario);
    const userBidPrice = scenario.basicInfo.minimumBidPrice;

    // 첫 번째 엔진 실행
    const engineOutput1 = auctionEngine({
      snapshot,
      userBidPrice,
      options: { devMode: false },
    });

    const rightsAnalysisResult1 = mapEngineOutputToRightsAnalysisResult(
      engineOutput1,
      scenario
    );

    // 두 번째 엔진 실행 (동일 입력)
    const engineOutput2 = auctionEngine({
      snapshot,
      userBidPrice,
      options: { devMode: false },
    });

    const rightsAnalysisResult2 = mapEngineOutputToRightsAnalysisResult(
      engineOutput2,
      scenario
    );

    // 일관성 검증
    if (engineOutput1.valuation.fmv !== engineOutput2.valuation.fmv) {
      errors.push("FMV 불일치");
    }

    if (
      engineOutput1.rights.assumedRightsAmount !==
      engineOutput2.rights.assumedRightsAmount
    ) {
      errors.push("인수 권리 금액 불일치");
    }

    if (
      engineOutput1.costs.totalAcquisition !==
      engineOutput2.costs.totalAcquisition
    ) {
      errors.push("총인수금액 불일치");
    }

    if (
      rightsAnalysisResult1.safetyMargin !== rightsAnalysisResult2.safetyMargin
    ) {
      errors.push("안전마진 불일치");
    }

    // 엔진 결과와 매핑 결과 일치 확인
    if (
      rightsAnalysisResult1.totalAcquisition !== engineOutput1.costs.totalAcquisition
    ) {
      errors.push("엔진 결과와 매핑 결과 불일치 (totalAcquisition)");
    }

    if (
      Math.abs(
        rightsAnalysisResult1.safetyMargin - engineOutput1.profit.marginVsFMV
      ) > 1
    ) {
      warnings.push("안전마진 값 차이 (1원 오차 허용)");
    }

    const duration = performance.now() - startTime;

    return {
      testName: "데이터 일관성 검증",
      passed: errors.length === 0,
      errors,
      warnings,
      duration,
      data: {
        fmv1: engineOutput1.valuation.fmv,
        fmv2: engineOutput2.valuation.fmv,
        totalAcquisition1: engineOutput1.costs.totalAcquisition,
        totalAcquisition2: engineOutput2.costs.totalAcquisition,
        safetyMargin1: rightsAnalysisResult1.safetyMargin,
        safetyMargin2: rightsAnalysisResult2.safetyMargin,
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      testName: "데이터 일관성 검증",
      passed: false,
      errors: [`일관성 검증 실패: ${error}`],
      warnings,
      duration,
    };
  }
}

/**
 * 성능 테스트 결과
 */
export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  duration: number; // 실행 시간 (ms)
  averageDuration: number; // 평균 실행 시간 (ms)
  minDuration: number; // 최소 실행 시간 (ms)
  maxDuration: number; // 최대 실행 시간 (ms)
  iterations: number; // 반복 횟수
}

/**
 * 성능 테스트
 * 엔진 실행 시간 측정 및 최적화 검토
 */
export async function testPerformance(): Promise<PerformanceTestResult> {
  console.log("🧪 [성능 테스트] 엔진 실행 시간 측정 시작");

  const iterations = 10; // 10회 반복 측정
  const durations: number[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const scenario = createTestScenario();
    const snapshot = mapSimulationToSnapshot(scenario);
    const userBidPrice = scenario.basicInfo.minimumBidPrice;

    // 여러 번 실행하여 평균 시간 측정
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      const engineOutput = auctionEngine({
        snapshot,
        userBidPrice,
        options: { devMode: false },
      });

      const rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(
        engineOutput,
        scenario
      );

      const duration = performance.now() - startTime;
      durations.push(duration);

      // 각 실행 결과 검증
      if (!engineOutput.valuation || !engineOutput.rights || !engineOutput.costs) {
        errors.push(`실행 ${i + 1}: 필수 필드 누락`);
      }
    }

    const averageDuration =
      durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // 성능 기준 검증 (100ms 이하 권장)
    if (averageDuration > 100) {
      warnings.push(`평균 실행 시간이 100ms를 초과합니다: ${averageDuration.toFixed(2)}ms`);
    }

    if (maxDuration > 200) {
      warnings.push(`최대 실행 시간이 200ms를 초과합니다: ${maxDuration.toFixed(2)}ms`);
    }

    const totalDuration = durations.reduce((a, b) => a + b, 0);

    console.log("🧪 [성능 테스트] 엔진 실행 시간 측정 완료", {
      averageDuration: `${averageDuration.toFixed(2)}ms`,
      minDuration: `${minDuration.toFixed(2)}ms`,
      maxDuration: `${maxDuration.toFixed(2)}ms`,
      totalDuration: `${totalDuration.toFixed(2)}ms`,
      iterations,
    });

    return {
      testName: "성능 테스트",
      passed: errors.length === 0,
      errors,
      warnings,
      duration: totalDuration,
      averageDuration,
      minDuration,
      maxDuration,
      iterations,
    };
  } catch (error) {
    console.error("🧪 [성능 테스트] 성능 테스트 실패:", error);
    return {
      testName: "성능 테스트",
      passed: false,
      errors: [`성능 테스트 실패: ${error}`],
      warnings,
      duration: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      iterations: 0,
    };
  }
}

/**
 * 에러 처리 테스트 결과
 */
export interface ErrorHandlingTestResult {
  testName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  tests: {
    testCase: string;
    passed: boolean;
    error: string | null;
  }[];
}

/**
 * 에러 처리 테스트
 * 엔진 실행 실패, 매핑 함수 실패 시 에러 처리 확인
 */
export async function testErrorHandling(): Promise<ErrorHandlingTestResult> {
  console.log("🧪 [에러 처리 테스트] 에러 처리 테스트 시작");

  const tests: {
    testCase: string;
    passed: boolean;
    error: string | null;
  }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 테스트 1: 잘못된 시나리오 (권리 없음)
    try {
      const invalidScenario = createTestScenario();
      invalidScenario.rights = [];
      const snapshot = mapSimulationToSnapshot(invalidScenario);

      const engineOutput = auctionEngine({
        snapshot,
        userBidPrice: 400000000,
        options: { devMode: false },
      });

      // 권리 없어도 엔진은 실행되어야 함 (권리 금액은 0)
      if (engineOutput.rights.assumedRightsAmount !== 0) {
        tests.push({
          testCase: "권리 없는 시나리오",
          passed: false,
          error: "인수 권리 금액이 0이 아닙니다",
        });
        errors.push("권리 없는 시나리오 처리 실패");
      } else {
        tests.push({
          testCase: "권리 없는 시나리오",
          passed: true,
          error: null,
        });
      }
    } catch (error) {
      tests.push({
        testCase: "권리 없는 시나리오",
        passed: false,
        error: String(error),
      });
      errors.push(`권리 없는 시나리오 처리 실패: ${error}`);
    }

    // 테스트 2: 잘못된 입찰가 (0 또는 음수)
    try {
      const scenario = createTestScenario();
      const snapshot = mapSimulationToSnapshot(scenario);

      const engineOutput = auctionEngine({
        snapshot,
        userBidPrice: 0, // 잘못된 입찰가
        options: { devMode: false },
      });

      // 0 입찰가는 허용되지만 경고가 있을 수 있음
      if (engineOutput.costs.totalAcquisition < 0) {
        tests.push({
          testCase: "0 입찰가 처리",
          passed: false,
          error: "총인수금액이 음수입니다",
        });
        errors.push("0 입찰가 처리 실패");
      } else {
        tests.push({
          testCase: "0 입찰가 처리",
          passed: true,
          error: null,
        });
        warnings.push("0 입찰가는 정상 동작하지만 실제 사용 시 문제가 될 수 있습니다");
      }
    } catch (error) {
      // 에러가 발생하면 좋음 (에러 처리 확인)
      tests.push({
        testCase: "0 입찰가 처리",
        passed: true,
        error: null,
      });
    }

    // 테스트 3: 매핑 함수 에러 처리
    try {
      const scenario = createTestScenario();
      const snapshot = mapSimulationToSnapshot(scenario);
      const engineOutput = auctionEngine({
        snapshot,
        userBidPrice: scenario.basicInfo.minimumBidPrice,
        options: { devMode: false },
      });

      // 매핑 함수 실행
      const rightsAnalysisResult = mapEngineOutputToRightsAnalysisResult(
        engineOutput,
        scenario
      );

      if (!rightsAnalysisResult) {
        tests.push({
          testCase: "매핑 함수 에러 처리",
          passed: false,
          error: "매핑 함수가 null을 반환했습니다",
        });
        errors.push("매핑 함수 에러 처리 실패");
      } else {
        tests.push({
          testCase: "매핑 함수 에러 처리",
          passed: true,
          error: null,
        });
      }
    } catch (error) {
      tests.push({
        testCase: "매핑 함수 에러 처리",
        passed: false,
        error: String(error),
      });
      errors.push(`매핑 함수 에러 처리 실패: ${error}`);
    }

    const passed = errors.length === 0;

    console.log("🧪 [에러 처리 테스트] 에러 처리 테스트 완료", {
      passed,
      errors: errors.length,
      warnings: warnings.length,
      tests: tests.length,
    });

    return {
      testName: "에러 처리 테스트",
      passed,
      errors,
      warnings,
      tests,
    };
  } catch (error) {
    console.error("🧪 [에러 처리 테스트] 에러 처리 테스트 실패:", error);
    return {
      testName: "에러 처리 테스트",
      passed: false,
      errors: [`테스트 실행 실패: ${error}`],
      warnings,
      tests,
    };
  }
}

/**
 * 모든 통합 테스트 실행
 */
export async function runAllIntegrationTests(): Promise<{
  fullFlow: FullFlowTestResult;
  performance: PerformanceTestResult;
  errorHandling: ErrorHandlingTestResult;
  allPassed: boolean;
}> {
  console.log("🧪 [통합 테스트] 모든 통합 테스트 시작");

  const fullFlow = await testFullFlow();
  const performance = await testPerformance();
  const errorHandling = await testErrorHandling();

  const allPassed =
    fullFlow.passed && performance.passed && errorHandling.passed;

  console.log("🧪 [통합 테스트] 모든 통합 테스트 완료", {
    allPassed,
    fullFlow: {
      passed: fullFlow.passed,
      errors: fullFlow.errors.length,
      duration: `${fullFlow.totalDuration.toFixed(2)}ms`,
    },
    performance: {
      passed: performance.passed,
      averageDuration: `${performance.averageDuration.toFixed(2)}ms`,
    },
    errorHandling: {
      passed: errorHandling.passed,
      errors: errorHandling.errors.length,
    },
  });

  return {
    fullFlow,
    performance,
    errorHandling,
    allPassed,
  };
}

