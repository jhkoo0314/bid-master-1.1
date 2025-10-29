import { cache } from "react";
import type { PropertyDetail } from "@/types/property";
import type { SimulationScenario } from "@/types/simulation";
import { mapSimulationToPropertyDetail } from "./formatters";

export const getPropertyDetail = cache(async function getPropertyDetail(caseId: string): Promise<PropertyDetail> {
  console.log(`🗂️ [데이터] PropertyDetail 조회 시작: caseId=${caseId}`);
  
  // 우선 목데이터에서 조회 시도
  const mockNames = ["property-normal.json", "property-pending.json", "property-insufficient.json", "property-case004.json"];
  for (const name of mockNames) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/mock/${name}`, { cache: "no-store" });
      if (!res.ok) {
        console.log(`🗂️ [데이터] 목데이터 로드 실패: ${name} (${res.status})`);
        continue;
      }
      const json = (await res.json()) as PropertyDetail;
      if (json.caseId === caseId) {
        console.log(`🗂️ [데이터] 목데이터 매치: ${name}`);
        return json;
      }
    } catch (error) {
      console.log(`🗂️ [데이터] 목데이터 로드 에러: ${name}`, error);
    }
  }

  // 목데이터에서 찾지 못한 경우, 새로 생성된 매물 데이터를 시뮬레이션으로 변환
  try {
    console.log("🔄 [데이터] 새로 생성된 매물 데이터로 시뮬레이션 생성 시도");
    const simRes = await fetch(`/api/test-read`);
    if (simRes.ok) {
      const sim = (await simRes.json()) as SimulationScenario;
      // caseId를 시뮬레이션의 caseNumber로 설정
      sim.basicInfo.caseNumber = caseId;
      const mapped = mapSimulationToPropertyDetail(sim);
      console.log("🗂️ [데이터] 시뮬레이션 매핑 사용");
      return mapped;
    }
  } catch (error) {
    console.log("🗂️ [데이터] 시뮬레이션 매핑 실패:", error);
  }

  console.log("❌ [에러] PropertyDetail 조회 실패: fallback 사용");
  throw new Error("PropertyDetail not found");
});
