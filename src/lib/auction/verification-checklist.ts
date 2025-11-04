/**
 * Bid Master AI - 검증 체크리스트
 * 
 * 목적: todo.md의 검증 체크리스트 항목들을 체계적으로 검증
 * 작성일: 2025-01-XX
 * 
 * 검증 범위:
 * 1. 단위 레벨 검증 (각 레이어 함수별)
 * 2. 통합 레벨 검증 (auctionEngine 전체 플로우)
 * 3. 회귀 테스트 (문서 기준 시나리오)
 */

import { estimateValuation } from "@/lib/valuation";
import { analyzeRights } from "@/lib/rights/rights-engine";
import { calcCosts } from "@/lib/costs";
import { evaluateProfit } from "@/lib/profit";
import { auctionEngine } from "@/lib/auction-engine";
import type {
  ValuationInput,
  PropertySnapshot,
  CostInput,
  ProfitInput,
  EngineInput,
} from "@/types/auction";

/**
 * 검증 결과
 */
export interface VerificationResult {
  testName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  details?: unknown;
}

/**
 * 전체 검증 결과
 */
export interface VerificationChecklistResult {
  unitTests: {
    valuation: VerificationResult;
    rights: VerificationResult;
    costs: VerificationResult;
    profit: VerificationResult;
  };
  integration: VerificationResult;
  regression: VerificationResult;
  allPassed: boolean;
}

// ===============================
// 단위 레벨 검증
// ===============================

/**
 * estimateValuation() 테스트
 */
export function testEstimateValuation(): VerificationResult {
  console.log("🧪 [단위 검증] estimateValuation() 테스트 시작");
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    // 1. appraisal/minBid/fmvHint 조합별 테스트
    console.log("🧪 [단위 검증] appraisal/minBid/fmvHint 조합별 테스트");
    
    // 케이스 1: appraisal만 있음 → minBid = appraisal * 0.8
    const case1 = estimateValuation({ appraisal: 100_000_000 });
    const expectedMinBid1 = Math.round(100_000_000 * 0.8);
    if (case1.minBid !== expectedMinBid1) {
      errors.push(`케이스 1 실패: minBid 기대값 ${expectedMinBid1}, 실제값 ${case1.minBid}`);
    } else {
      details.case1 = { passed: true, minBid: case1.minBid };
    }

    // 케이스 2: minBid만 있음 → appraisal = minBid / 0.8
    const case2 = estimateValuation({ minBid: 80_000_000 });
    const expectedAppraisal2 = Math.round(80_000_000 / 0.8);
    if (Math.abs(case2.appraisal - expectedAppraisal2) > 1) {
      errors.push(`케이스 2 실패: appraisal 기대값 ${expectedAppraisal2}, 실제값 ${case2.appraisal}`);
    } else {
      details.case2 = { passed: true, appraisal: case2.appraisal };
    }

    // 케이스 3: 둘 다 없고 fmvHint 있음 → 역산
    const case3 = estimateValuation({ fmvHint: 500_000_000 });
    const expectedAppraisal3 = Math.round(500_000_000 / 0.91);
    const expectedMinBid3 = Math.round(expectedAppraisal3 * 0.8);
    if (Math.abs(case3.appraisal - expectedAppraisal3) > 1000) {
      errors.push(`케이스 3 실패: appraisal 기대값 ${expectedAppraisal3}, 실제값 ${case3.appraisal}`);
    } else if (Math.abs(case3.minBid - expectedMinBid3) > 1000) {
      errors.push(`케이스 3 실패: minBid 기대값 ${expectedMinBid3}, 실제값 ${case3.minBid}`);
    } else {
      details.case3 = { passed: true, appraisal: case3.appraisal, minBid: case3.minBid };
    }

    // 케이스 4: 둘 다 없고 fmvHint도 없음 → 기본 FMV 사용
    const case4 = estimateValuation({});
    if (case4.fmv < 400_000_000 || case4.fmv > 600_000_000) {
      warnings.push(`케이스 4: 기본 FMV가 예상 범위를 벗어남: ${case4.fmv}`);
    } else {
      details.case4 = { passed: true, fmv: case4.fmv };
    }

    // 2. marketSignals 보정 테스트
    console.log("🧪 [단위 검증] marketSignals 보정 테스트");
    
    const case5 = estimateValuation({
      appraisal: 100_000_000,
      marketSignals: { signal1: 1.05, signal2: 1.1, signal3: 0.95 }, // 평균 1.033...
    });
    const fmvWithoutSignal = case5.fmv / 1.033; // 역산
    const expectedFmv = Math.round(100_000_000 * 0.91 * 1.033);
    
    // marketSignals가 적용되면 FMV가 보정됨 (10% 캡 내)
    if (case5.fmv < expectedFmv * 0.9 || case5.fmv > expectedFmv * 1.1) {
      warnings.push(`marketSignals 보정이 예상 범위를 벗어남: ${case5.fmv}`);
    } else {
      details.marketSignals = { passed: true, fmv: case5.fmv };
    }

    // 3. marketSignals ±10% 캡 테스트
    const case6 = estimateValuation({
      appraisal: 100_000_000,
      marketSignals: { signal1: 2.0, signal2: 0.5 }, // 평균 1.25이지만 1.1로 캡됨
    });
    const cappedFmv = Math.round(100_000_000 * 0.91 * 1.1);
    if (case6.fmv > cappedFmv * 1.01) {
      errors.push(`marketSignals 캡 실패: FMV가 10% 캡을 초과함`);
    } else {
      details.marketSignalsCap = { passed: true, fmv: case6.fmv, capped: true };
    }

  } catch (error) {
    errors.push(`테스트 실행 중 오류: ${error instanceof Error ? error.message : String(error)}`);
  }

  const passed = errors.length === 0;
  
  console.log("🧪 [단위 검증] estimateValuation() 테스트 완료", {
    passed,
    errors: errors.length,
    warnings: warnings.length,
  });

  return {
    testName: "estimateValuation()",
    passed,
    errors,
    warnings,
    details,
  };
}

/**
 * analyzeRights() 테스트
 */
export function testAnalyzeRights(): VerificationResult {
  console.log("🧪 [단위 검증] analyzeRights() 테스트 시작");
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    // 1. 말소기준권리 판단 테스트
    console.log("🧪 [단위 검증] 말소기준권리 판단 테스트");
    
    const snapshot1: PropertySnapshot = {
      caseId: "TEST-001",
      propertyType: "apartment",
      rights: [
        {
          id: "R1",
          type: "mortgage",
          amount: 100_000_000,
          rankOrder: 1,
          establishedAt: "2024-01-01",
        },
        {
          id: "R2",
          type: "pledge",
          amount: 50_000_000,
          rankOrder: 2,
          establishedAt: "2024-02-01",
        },
      ],
      tenants: [],
      dividendDeadline: "2024-12-31",
    };

    const result1 = analyzeRights(snapshot1);
    
    // 말소기준권리는 rankOrder 1인 mortgage여야 함
    if (result1.malsoBase?.id !== "R1") {
      errors.push(`말소기준권리 판단 실패: 기대값 R1, 실제값 ${result1.malsoBase?.id || "null"}`);
    } else {
      details.malsoBaseRight = { passed: true, rightId: result1.malsoBase.id };
    }

    // 2. 임차인 대항력 판단 테스트
    console.log("🧪 [단위 검증] 임차인 대항력 판단 테스트");
    
    const snapshot2: PropertySnapshot = {
      caseId: "TEST-002",
      propertyType: "apartment",
      rights: [],
      tenants: [
        {
          id: "T1",
          deposit: 50_000_000,
          hasOpposability: true, // strong 대항력
        },
        {
          id: "T2",
          deposit: 30_000_000,
          moveInDate: "2024-01-01", // weak 대항력
        },
        {
          id: "T3",
          deposit: 20_000_000,
          // none 대항력
        },
      ],
    };

    const result2 = analyzeRights(snapshot2);
    
    // strong 대항력 임차인은 인수되어야 함
    const strongTenant = result2.tenantFindings.find(f => f.tenantId === "T1");
    if (!strongTenant || !strongTenant.assumed) {
      errors.push(`임차인 대항력 판단 실패: strong 대항력 임차인이 인수되지 않음`);
    } else {
      details.tenantOpposability = { passed: true, strongTenantAssumed: true };
    }

    // weak 대항력 임차인은 보수적으로 인수될 수 있음
    const weakTenant = result2.tenantFindings.find(f => f.tenantId === "T2");
    if (weakTenant && weakTenant.assumed && details.tenantOpposability) {
      (details.tenantOpposability as Record<string, unknown>).weakTenantAssumed = true;
    }

    // 3. 인수 권리 금액 계산 테스트
    console.log("🧪 [단위 검증] 인수 권리 금액 계산 테스트");
    
    const snapshot3: PropertySnapshot = {
      caseId: "TEST-003",
      propertyType: "apartment",
      rights: [
        {
          id: "R1",
          type: "mortgage",
          amount: 100_000_000,
          rankOrder: 1,
          establishedAt: "2024-01-01",
        },
        {
          id: "R2",
          type: "pledge",
          amount: 50_000_000,
          rankOrder: 2,
          establishedAt: "2024-02-01",
        },
      ],
      tenants: [],
      dividendDeadline: "2024-12-31",
    };

    const result3 = analyzeRights(snapshot3);
    
    // 말소기준권리보다 선순위 권리는 인수되어야 함
    // 이 경우 rankOrder 1이 말소기준이므로 모든 권리가 인수되어야 함
    const assumedRights = result3.rightFindings.filter(f => f.assumed);
    const totalAssumed = assumedRights.reduce((sum, f) => sum + (f.amount || 0), 0);
    
    if (totalAssumed !== result3.assumedRightsAmount) {
      warnings.push(`인수 권리 금액 불일치: 계산값 ${totalAssumed}, 엔진값 ${result3.assumedRightsAmount}`);
    } else {
      details.assumedRightsAmount = { passed: true, amount: result3.assumedRightsAmount };
    }

  } catch (error) {
    errors.push(`테스트 실행 중 오류: ${error instanceof Error ? error.message : String(error)}`);
  }

  const passed = errors.length === 0;
  
  console.log("🧪 [단위 검증] analyzeRights() 테스트 완료", {
    passed,
    errors: errors.length,
    warnings: warnings.length,
  });

  return {
    testName: "analyzeRights()",
    passed,
    errors,
    warnings,
    details,
  };
}

/**
 * calcCosts() 테스트
 */
export function testCalcCosts(): VerificationResult {
  console.log("🧪 [단위 검증] calcCosts() 테스트 시작");
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    // 1. 세금 계산 정확성
    console.log("🧪 [단위 검증] 세금 계산 정확성");
    
    const input1: CostInput = {
      bidPrice: 100_000_000,
      assumedRightsAmount: 50_000_000,
      propertyType: "apartment",
    };

    const result1 = calcCosts(input1);
    
    // 주거용 기본 세율: 취득세 1.1%, 교육세 0.1%, 농특세 0.2%
    const expectedAcquisitionTax = Math.round(100_000_000 * 0.011);
    const expectedEducationTax = Math.round(100_000_000 * 0.001);
    const expectedSpecialTax = Math.round(100_000_000 * 0.002);
    const expectedTotalTax = expectedAcquisitionTax + expectedEducationTax + expectedSpecialTax;

    if (result1.taxes.acquisitionTax !== expectedAcquisitionTax) {
      errors.push(`취득세 계산 실패: 기대값 ${expectedAcquisitionTax}, 실제값 ${result1.taxes.acquisitionTax}`);
    }

    if (result1.taxes.educationTax !== expectedEducationTax) {
      errors.push(`교육세 계산 실패: 기대값 ${expectedEducationTax}, 실제값 ${result1.taxes.educationTax}`);
    }

    if (result1.taxes.specialTax !== expectedSpecialTax) {
      errors.push(`농특세 계산 실패: 기대값 ${expectedSpecialTax}, 실제값 ${result1.taxes.specialTax}`);
    }

    if (result1.taxes.totalTax !== expectedTotalTax) {
      errors.push(`총 세금 계산 실패: 기대값 ${expectedTotalTax}, 실제값 ${result1.taxes.totalTax}`);
    }

    if (errors.length === 0) {
      details.taxCalculation = {
        passed: true,
        acquisitionTax: result1.taxes.acquisitionTax,
        educationTax: result1.taxes.educationTax,
        specialTax: result1.taxes.specialTax,
        totalTax: result1.taxes.totalTax,
      };
    }

    // 2. 총인수금액 계산 정확성
    console.log("🧪 [단위 검증] 총인수금액 계산 정확성");
    
    const expectedTotalAcquisition =
      input1.bidPrice +
      input1.assumedRightsAmount +
      expectedTotalTax +
      3_000_000 + // 명도비 기본값
      1_000_000; // 기타비용 기본값

    if (Math.abs(result1.totalAcquisition - expectedTotalAcquisition) > 1) {
      errors.push(
        `총인수금액 계산 실패: 기대값 ${expectedTotalAcquisition}, 실제값 ${result1.totalAcquisition}`
      );
    } else {
      details.totalAcquisition = {
        passed: true,
        totalAcquisition: result1.totalAcquisition,
      };
    }

    // 3. overrides 적용 테스트
    const input2: CostInput = {
      bidPrice: 100_000_000,
      assumedRightsAmount: 50_000_000,
      propertyType: "apartment",
      overrides: {
        acquisitionTaxRate: 0.02, // 2%
        evictionCost: 5_000_000,
        miscCost: 2_000_000,
      },
    };

    const result2 = calcCosts(input2);
    const expectedAcquisitionTax2 = Math.round(100_000_000 * 0.02);

    if (result2.taxes.acquisitionTax !== expectedAcquisitionTax2) {
      errors.push(`overrides 적용 실패: 취득세 기대값 ${expectedAcquisitionTax2}, 실제값 ${result2.taxes.acquisitionTax}`);
    }

    if (result2.evictionCost !== 5_000_000) {
      errors.push(`overrides 적용 실패: 명도비 기대값 5,000,000, 실제값 ${result2.evictionCost}`);
    }

    if (result2.miscCost !== 2_000_000) {
      errors.push(`overrides 적용 실패: 기타비용 기대값 2,000,000, 실제값 ${result2.miscCost}`);
    }

    if (errors.length === 0) {
      details.overrides = { passed: true };
    }

  } catch (error) {
    errors.push(`테스트 실행 중 오류: ${error instanceof Error ? error.message : String(error)}`);
  }

  const passed = errors.length === 0;
  
  console.log("🧪 [단위 검증] calcCosts() 테스트 완료", {
    passed,
    errors: errors.length,
    warnings: warnings.length,
  });

  return {
    testName: "calcCosts()",
    passed,
    errors,
    warnings,
    details,
  };
}

/**
 * evaluateProfit() 테스트
 */
export function testEvaluateProfit(): VerificationResult {
  console.log("🧪 [단위 검증] evaluateProfit() 테스트 시작");
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    // 1. 안전마진 계산 정확성
    console.log("🧪 [단위 검증] 안전마진 계산 정확성");
    
    const input1: ProfitInput = {
      fmv: 500_000_000,
      totalAcquisition: 400_000_000,
      bidPrice: 350_000_000,
    };

    const result1 = evaluateProfit(input1);
    
    // FMV 기준 마진: FMV - 총인수금액
    const expectedMarginVsFMV = 500_000_000 - 400_000_000;
    const expectedMarginRateVsFMV = expectedMarginVsFMV / 500_000_000;

    if (result1.marginVsFMV !== expectedMarginVsFMV) {
      errors.push(
        `FMV 기준 마진 계산 실패: 기대값 ${expectedMarginVsFMV}, 실제값 ${result1.marginVsFMV}`
      );
    }

    if (Math.abs(result1.marginRateVsFMV - expectedMarginRateVsFMV) > 0.0001) {
      errors.push(
        `FMV 기준 마진률 계산 실패: 기대값 ${expectedMarginRateVsFMV}, 실제값 ${result1.marginRateVsFMV}`
      );
    }

    // Exit 기준 마진: Exit 없으면 FMV 사용
    const expectedMarginVsExit = 500_000_000 - 400_000_000;
    const expectedMarginRateVsExit = expectedMarginVsExit / 500_000_000;

    if (result1.marginVsExit !== expectedMarginVsExit) {
      errors.push(
        `Exit 기준 마진 계산 실패: 기대값 ${expectedMarginVsExit}, 실제값 ${result1.marginVsExit}`
      );
    }

    if (Math.abs(result1.marginRateVsExit - expectedMarginRateVsExit) > 0.0001) {
      errors.push(
        `Exit 기준 마진률 계산 실패: 기대값 ${expectedMarginRateVsExit}, 실제값 ${result1.marginRateVsExit}`
      );
    }

    if (errors.length === 0) {
      details.marginCalculation = {
        passed: true,
        marginVsFMV: result1.marginVsFMV,
        marginRateVsFMV: result1.marginRateVsFMV,
        marginVsExit: result1.marginVsExit,
        marginRateVsExit: result1.marginRateVsExit,
      };
    }

    // 2. Exit 가격이 있으면 Exit 기준 마진 계산
    const input2: ProfitInput = {
      fmv: 500_000_000,
      totalAcquisition: 400_000_000,
      bidPrice: 350_000_000,
      exitPrice: 550_000_000,
    };

    const result2 = evaluateProfit(input2);
    const expectedMarginVsExit2 = 550_000_000 - 400_000_000;
    const expectedMarginRateVsExit2 = expectedMarginVsExit2 / 550_000_000;

    if (result2.marginVsExit !== expectedMarginVsExit2) {
      errors.push(
        `Exit 가격 기준 마진 계산 실패: 기대값 ${expectedMarginVsExit2}, 실제값 ${result2.marginVsExit}`
      );
    }

    // 3. 손익분기점 계산 정확성
    console.log("🧪 [단위 검증] 손익분기점 계산 정확성");
    
    if (result1.bePoint !== input1.totalAcquisition) {
      errors.push(
        `손익분기점 계산 실패: 기대값 ${input1.totalAcquisition}, 실제값 ${result1.bePoint}`
      );
    } else {
      details.bePoint = { passed: true, bePoint: result1.bePoint };
    }

  } catch (error) {
    errors.push(`테스트 실행 중 오류: ${error instanceof Error ? error.message : String(error)}`);
  }

  const passed = errors.length === 0;
  
  console.log("🧪 [단위 검증] evaluateProfit() 테스트 완료", {
    passed,
    errors: errors.length,
    warnings: warnings.length,
  });

  return {
    testName: "evaluateProfit()",
    passed,
    errors,
    warnings,
    details,
  };
}

// ===============================
// 통합 레벨 검증
// ===============================

/**
 * auctionEngine() 전체 플로우 테스트
 */
export function testAuctionEngine(): VerificationResult {
  console.log("🧪 [통합 검증] auctionEngine() 전체 플로우 테스트 시작");
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const input: EngineInput = {
      snapshot: {
        caseId: "TEST-ENGINE",
        propertyType: "apartment",
        rights: [
          {
            id: "R1",
            type: "mortgage",
            amount: 100_000_000,
            rankOrder: 1,
            establishedAt: "2024-01-01",
          },
        ],
        tenants: [
          {
            id: "T1",
            deposit: 50_000_000,
            hasOpposability: true,
          },
        ],
        appraisal: 500_000_000,
        minBid: 400_000_000,
      },
      userBidPrice: 450_000_000,
      exitPriceHint: 550_000_000,
      options: {
        devMode: true,
        logPrefix: "🧪 [테스트]",
      },
    };

    const output = auctionEngine(input);

    // 1. 입력 → 출력 데이터 정확성
    console.log("🧪 [통합 검증] 입력 → 출력 데이터 정확성 검증");
    
    if (!output.valuation) {
      errors.push("Valuation 결과 누락");
    } else {
      if (output.valuation.fmv <= 0) {
        errors.push(`FMV가 유효하지 않음: ${output.valuation.fmv}`);
      }
      if (output.valuation.appraisal <= 0) {
        errors.push(`감정가가 유효하지 않음: ${output.valuation.appraisal}`);
      }
      if (output.valuation.minBid <= 0) {
        errors.push(`최저가가 유효하지 않음: ${output.valuation.minBid}`);
      }
    }

    if (!output.rights) {
      errors.push("Rights 결과 누락");
    } else {
      if (output.rights.assumedRightsAmount < 0) {
        errors.push(`인수 권리 금액이 음수: ${output.rights.assumedRightsAmount}`);
      }
    }

    if (!output.costs) {
      errors.push("Costs 결과 누락");
    } else {
      if (output.costs.totalAcquisition <= 0) {
        errors.push(`총인수금액이 유효하지 않음: ${output.costs.totalAcquisition}`);
      }
    }

    if (!output.profit) {
      errors.push("Profit 결과 누락");
    } else {
      if (output.profit.bePoint <= 0) {
        errors.push(`손익분기점이 유효하지 않음: ${output.profit.bePoint}`);
      }
    }

    // 2. Safety 객체 계산 정확성
    console.log("🧪 [통합 검증] Safety 객체 계산 정확성");
    
    if (!output.safety) {
      errors.push("Safety 객체 누락");
    } else {
      // FMV 기준 안전마진 검증
      const expectedFmvAmount = output.valuation.fmv - output.costs.totalAcquisition;
      const expectedFmvRate = output.valuation.fmv > 0
        ? expectedFmvAmount / output.valuation.fmv
        : 0;

      if (Math.abs(output.safety.fmv.amount - expectedFmvAmount) > 1) {
        errors.push(
          `Safety FMV amount 불일치: 기대값 ${expectedFmvAmount}, 실제값 ${output.safety.fmv.amount}`
        );
      }

      if (Math.abs(output.safety.fmv.rate - expectedFmvRate) > 0.0001) {
        errors.push(
          `Safety FMV rate 불일치: 기대값 ${expectedFmvRate}, 실제값 ${output.safety.fmv.rate}`
        );
      }

      // Exit 기준 안전마진 검증
      const exitPrice = input.exitPriceHint ?? output.valuation.fmv;
      const expectedExitAmount = exitPrice - output.costs.totalAcquisition;
      const expectedExitRate = exitPrice > 0 ? expectedExitAmount / exitPrice : 0;

      if (Math.abs(output.safety.exit.amount - expectedExitAmount) > 1) {
        errors.push(
          `Safety Exit amount 불일치: 기대값 ${expectedExitAmount}, 실제값 ${output.safety.exit.amount}`
        );
      }

      // overFMV 검증
      const expectedOverFMV = input.userBidPrice > output.valuation.fmv;
      if (output.safety.overFMV !== expectedOverFMV) {
        errors.push(
          `overFMV 불일치: 기대값 ${expectedOverFMV}, 실제값 ${output.safety.overFMV}`
        );
      }

      if (errors.length === 0) {
        details.safety = {
          passed: true,
          fmv: output.safety.fmv,
          exit: output.safety.exit,
          overFMV: output.safety.overFMV,
        };
      }
    }

    // 3. devMode 로그 출력 확인 (수동 확인 필요, 여기서는 경고만)
    console.log("🧪 [통합 검증] devMode 로그 출력 확인 (수동 확인 필요)");
    warnings.push("devMode 로그 출력은 콘솔에서 수동 확인 필요");

    // 4. 데이터 일관성 검증
    // Profit의 marginVsFMV와 Safety의 fmv.amount가 일치해야 함
    if (Math.abs(output.profit.marginVsFMV - output.safety.fmv.amount) > 1) {
      errors.push(
        `데이터 일관성 실패: profit.marginVsFMV(${output.profit.marginVsFMV})와 safety.fmv.amount(${output.safety.fmv.amount}) 불일치`
      );
    }

    if (errors.length === 0) {
      details.dataConsistency = { passed: true };
    }

  } catch (error) {
    errors.push(`테스트 실행 중 오류: ${error instanceof Error ? error.message : String(error)}`);
  }

  const passed = errors.length === 0;
  
  console.log("🧪 [통합 검증] auctionEngine() 전체 플로우 테스트 완료", {
    passed,
    errors: errors.length,
    warnings: warnings.length,
  });

  return {
    testName: "auctionEngine()",
    passed,
    errors,
    warnings,
    details,
  };
}

// ===============================
// 회귀 테스트
// ===============================

/**
 * 회귀 테스트 (문서 부록 C 기준)
 */
export function testRegression(): VerificationResult {
  console.log("🧪 [회귀 테스트] 시작");
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Record<string, unknown> = {};

  try {
    const baseSnapshot: PropertySnapshot = {
      caseId: "REGRESSION-001",
      propertyType: "apartment",
      rights: [
        {
          id: "R1",
          type: "mortgage",
          amount: 100_000_000,
          rankOrder: 1,
          establishedAt: "2024-01-01",
        },
      ],
      tenants: [],
      appraisal: 500_000_000,
      minBid: 400_000_000,
    };

    // 1. FMV/감정가/최저가 역산 일관성
    console.log("🧪 [회귀 테스트] FMV/감정가/최저가 역산 일관성");
    
    const input1: EngineInput = {
      snapshot: baseSnapshot,
      userBidPrice: 450_000_000,
      options: { devMode: false },
    };

    const output1 = auctionEngine(input1);
    
    // FMV = 감정가 * 0.91
    const expectedFmv = Math.round(baseSnapshot.appraisal! * 0.91);
    if (Math.abs(output1.valuation.fmv - expectedFmv) > 1000) {
      errors.push(
        `FMV 역산 일관성 실패: 기대값 ${expectedFmv}, 실제값 ${output1.valuation.fmv}`
      );
    }

    // 최저가 = 감정가 * 0.8
    const expectedMinBid = Math.round(baseSnapshot.appraisal! * 0.8);
    if (Math.abs(output1.valuation.minBid - expectedMinBid) > 1000) {
      errors.push(
        `최저가 역산 일관성 실패: 기대값 ${expectedMinBid}, 실제값 ${output1.valuation.minBid}`
      );
    }

    // 2. 동일 스냅샷에 입찰가 변경 시 총인수금액 단조 변화
    console.log("🧪 [회귀 테스트] 입찰가 변경 시 총인수금액 단조 변화");
    
    const input2a: EngineInput = {
      snapshot: baseSnapshot,
      userBidPrice: 400_000_000,
      options: { devMode: false },
    };
    const output2a = auctionEngine(input2a);

    const input2b: EngineInput = {
      snapshot: baseSnapshot,
      userBidPrice: 500_000_000,
      options: { devMode: false },
    };
    const output2b = auctionEngine(input2b);

    // 입찰가가 증가하면 총인수금액도 증가해야 함 (단조 증가)
    if (output2b.costs.totalAcquisition <= output2a.costs.totalAcquisition) {
      errors.push(
        `총인수금액 단조 변화 실패: 입찰가 증가 시 총인수금액도 증가해야 함`
      );
    }

    // 3. overFMV 경고가 FMV 초과 구간에서만 켜짐
    console.log("🧪 [회귀 테스트] overFMV 경고가 FMV 초과 구간에서만 켜짐");
    
    const input3a: EngineInput = {
      snapshot: baseSnapshot,
      userBidPrice: output1.valuation.fmv - 10_000_000, // FMV 미만
      options: { devMode: false },
    };
    const output3a = auctionEngine(input3a);

    const input3b: EngineInput = {
      snapshot: baseSnapshot,
      userBidPrice: output1.valuation.fmv + 10_000_000, // FMV 초과
      options: { devMode: false },
    };
    const output3b = auctionEngine(input3b);

    if (output3a.safety.overFMV !== false) {
      errors.push(`overFMV 경고 실패: FMV 미만에서도 경고가 켜짐`);
    }

    if (output3b.safety.overFMV !== true) {
      errors.push(`overFMV 경고 실패: FMV 초과에서도 경고가 꺼짐`);
    }

    // 4. weak 임차인 있을 때 명도비 상향 시 총인수금액 증가
    console.log("🧪 [회귀 테스트] weak 임차인 있을 때 명도비 상향 시 총인수금액 증가");
    
    const snapshotWithWeakTenant: PropertySnapshot = {
      ...baseSnapshot,
      tenants: [
        {
          id: "T1",
          deposit: 50_000_000,
          moveInDate: "2024-01-01", // weak 대항력
        },
      ],
    };

    const input4a: EngineInput = {
      snapshot: snapshotWithWeakTenant,
      userBidPrice: 450_000_000,
      valuationInput: {
        evictionCost: 3_000_000,
      },
      options: { devMode: false },
    };
    const output4a = auctionEngine(input4a);

    const input4b: EngineInput = {
      snapshot: snapshotWithWeakTenant,
      userBidPrice: 450_000_000,
      valuationInput: {
        evictionCost: 6_000_000, // 명도비 상향
      },
      options: { devMode: false },
    };
    const output4b = auctionEngine(input4b);

    if (output4b.costs.totalAcquisition <= output4a.costs.totalAcquisition) {
      errors.push(
        `명도비 상향 시 총인수금액 증가 실패: 명도비가 증가했는데 총인수금액이 증가하지 않음`
      );
    }

    // 5. 세율/비용 overrides가 결과에 반영됨
    console.log("🧪 [회귀 테스트] 세율/비용 overrides가 결과에 반영됨");
    
    const input5a: EngineInput = {
      snapshot: baseSnapshot,
      userBidPrice: 450_000_000,
      options: { devMode: false },
    };
    const output5a = auctionEngine(input5a);

    const input5b: EngineInput = {
      snapshot: baseSnapshot,
      userBidPrice: 450_000_000,
      valuationInput: {
        acquisitionTaxRate: 0.02, // 2%로 변경
      },
      options: { devMode: false },
    };
    const output5b = auctionEngine(input5b);

    // 세율이 증가하면 세금도 증가해야 함
    if (output5b.costs.taxes.totalTax <= output5a.costs.taxes.totalTax) {
      errors.push(
        `세율 overrides 반영 실패: 세율이 증가했는데 세금이 증가하지 않음`
      );
    }

    if (errors.length === 0) {
      details.regressionTests = { passed: true };
    }

  } catch (error) {
    errors.push(`테스트 실행 중 오류: ${error instanceof Error ? error.message : String(error)}`);
  }

  const passed = errors.length === 0;
  
  console.log("🧪 [회귀 테스트] 완료", {
    passed,
    errors: errors.length,
    warnings: warnings.length,
  });

  return {
    testName: "회귀 테스트",
    passed,
    errors,
    warnings,
    details,
  };
}

// ===============================
// 전체 검증 실행
// ===============================

/**
 * 전체 검증 체크리스트 실행
 */
export function runVerificationChecklist(): VerificationChecklistResult {
  console.log("🧪 [검증 체크리스트] 전체 검증 시작");

  // 단위 레벨 검증
  const valuation = testEstimateValuation();
  const rights = testAnalyzeRights();
  const costs = testCalcCosts();
  const profit = testEvaluateProfit();

  // 통합 레벨 검증
  const integration = testAuctionEngine();

  // 회귀 테스트
  const regression = testRegression();

  const allPassed =
    valuation.passed &&
    rights.passed &&
    costs.passed &&
    profit.passed &&
    integration.passed &&
    regression.passed;

  console.log("🧪 [검증 체크리스트] 전체 검증 완료", {
    allPassed,
    unitTests: {
      valuation: valuation.passed,
      rights: rights.passed,
      costs: costs.passed,
      profit: profit.passed,
    },
    integration: integration.passed,
    regression: regression.passed,
  });

  return {
    unitTests: {
      valuation,
      rights,
      costs,
      profit,
    },
    integration,
    regression,
    allPassed,
  };
}

