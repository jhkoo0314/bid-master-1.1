/**
 * Bid Master AI - 시뮬레이션용 매물 생성 서버 액션
 */

"use server";

import { SimulationScenario } from "@/types/simulation";
import { generateSimulationProperty } from "@/lib/openai-client";
import { analyzeRights, validateScenario } from "@/lib/rights-analysis-engine";
import { generateRegionalAnalysis } from "@/lib/regional-analysis";

/**
 * 시뮬레이션용 매물을 생성합니다.
 *
 * @returns 권리분석이 완료된 시뮬레이션 시나리오
 */
export async function generateSimulation(): Promise<SimulationScenario> {
  console.log("🚀 [서버 액션] 시뮬레이션용 매물 생성 요청");

  try {
    // 1. OpenAI로 매물 생성
    let scenario = await generateSimulationProperty();

    // 2. 권리분석 엔진으로 검증
    const validation = validateScenario(scenario);
    if (!validation.isValid) {
      console.warn("⚠️ [서버 액션] 시나리오 검증 실패, 재생성 시도");
      console.warn("  검증 오류:", validation.errors);

      // 재생성 시도 (최대 1회)
      scenario = await generateSimulationProperty();
    }

    // 3. 권리분석 실행
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
    console.log("🗺️ [서버 액션] 지역분석 생성");
    scenario.regionalAnalysis = generateRegionalAnalysis(
      scenario.basicInfo.location
    );

    console.log("✅ [서버 액션] 시뮬레이션용 매물 생성 완료");
    console.log(`  - 사건번호: ${scenario.basicInfo.caseNumber}`);
    console.log(`  - 권리 개수: ${scenario.rights.length}`);
    console.log(`  - 임차인 개수: ${scenario.tenants.length}`);

    return scenario;
  } catch (error) {
    console.error("❌ [서버 액션] 시뮬레이션용 매물 생성 실패:", error);
    throw new Error(
      "시뮬레이션 생성에 실패했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}
