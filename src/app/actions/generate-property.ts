/**
 * Bid Master AI - 매물 생성 서버 액션
 */

"use server";

import { SimulationScenario, DifficultyLevel } from "@/types/simulation";
import { generateSimulationProperty } from "@/lib/openai-client";
import { analyzeRights, validateScenario } from "@/lib/rights-analysis-engine";
import { generateRegionalAnalysis } from "@/lib/regional-analysis";

/**
 * 매물을 생성합니다.
 *
 * @param difficulty 난이도 (초급, 중급, 고급)
 * @returns 권리분석이 완료된 시뮬레이션 시나리오
 */
export async function generateProperty(
  difficulty: DifficultyLevel = "초급"
): Promise<SimulationScenario> {
  console.log("🏠 [매물 생성] AI 매물 생성 시작:", difficulty);

  try {
    // 1. OpenAI로 매물 생성
    let scenario = await generateSimulationProperty();

    // 2. 권리·임차인·감정가·최저가 자동 보완
    if (!scenario.rights || scenario.rights.length === 0) {
      console.warn("⚠️ [매물 생성] 권리정보 없어서 더미 생성");
      scenario.rights = [
        {
          id: "dummy1",
          rightType: "근저당권",
          rightHolder: "은행",
          claimAmount: 72000000,
          registrationDate: "2022-03-10",
          isMalsoBaseRight: true,
          willBeAssumed: true,
        },
      ];
    }
    if (!scenario.tenants || scenario.tenants.length === 0) {
      console.warn("⚠️ [매물 생성] 임차인정보 없어서 더미 생성");
      scenario.tenants = [
        {
          id: "dummyT1",
          tenantName: "김임차",
          deposit: 32000000,
          willBeAssumed: true,
          isSmallTenant: true,
          priorityPaymentAmount: 8000000,
        },
      ];
    }
    if (
      !scenario.basicInfo.appraisalValue ||
      scenario.basicInfo.appraisalValue === 0
    ) {
      scenario.basicInfo.appraisalValue = 240000000;
    }
    if (
      !scenario.basicInfo.minimumBidPrice ||
      scenario.basicInfo.minimumBidPrice === 0
    ) {
      scenario.basicInfo.minimumBidPrice = 190000000;
    }
    // 3. 권리분석 실행
    console.log("⚖️ [권리분석] 말소기준권리 판단 및 대항력 계산 시작");
    const analysisResult = analyzeRights(scenario);

    // 4. 분석 결과를 시나리오에 반영
    scenario.rights = scenario.rights.map((right) => {
      const analyzed =
        analysisResult.assumedRights.find((r) => r.id === right.id) ||
        analysisResult.extinguishedRights.find((r) => r.id === right.id) ||
        right;
      return analyzed;
    });

    scenario.tenants = scenario.tenants.map((tenant) => {
      const analyzed =
        analysisResult.assumedTenants.find((t) => t.id === tenant.id) || tenant;
      return analyzed;
    });

    // 5. 지역분석 생성
    console.log("🗺️ [지역분석] 지역 정보 생성");
    scenario.regionalAnalysis = generateRegionalAnalysis(
      scenario.basicInfo.location
    );

    console.log("✅ [매물 생성] AI 매물 생성 완료");
    console.log(`  - 사건번호: ${scenario.basicInfo.caseNumber}`);
    console.log(`  - 권리 개수: ${scenario.rights.length}`);
    console.log(`  - 임차인 개수: ${scenario.tenants.length}`);

    return scenario;
  } catch (error) {
    console.error("❌ [매물 생성] AI 매물 생성 실패:", error);
    throw new Error("매물 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
}
