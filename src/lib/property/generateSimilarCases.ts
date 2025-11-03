/**
 * Bid Master AI - 유사 낙찰 사례 생성
 * 매물 정보를 기반으로 유사한 낙찰 사례를 동적으로 생성합니다.
 */

import type { PropertyDetail, SimilarCase } from "@/types/property";
import type { SimulationScenario } from "@/types/simulation";

interface GenerateSimilarCasesInput {
  property?: PropertyDetail;
  scenario?: SimulationScenario;
  bidRange: {
    min: number;
    max: number;
    optimal?: number;
  };
}

/**
 * 지역명에서 구/시 단위 추출 (예: "서울시 송파구" -> "송파구")
 */
function extractDistrict(address: string): string {
  const parts = address.split(" ");
  for (const part of parts) {
    if (part.endsWith("구") || part.endsWith("시") || part.endsWith("군")) {
      return part;
    }
  }
  return parts[parts.length - 1] || "지역";
}

/**
 * 매물 유형 약칭 변환 (예: "오피스텔" -> "오피스텔", "아파트" -> "아파트")
 */
function getPropertyTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    아파트: "아파트",
    오피스텔: "오피스텔",
    단독주택: "주택",
    빌라: "빌라",
    원룸: "원룸",
    주택: "주택",
    다가구주택: "다가구",
    근린주택: "주택",
    도시형생활주택: "주택",
  };
  return typeMap[type] || "부동산";
}

/**
 * 유사 낙찰 사례를 생성합니다.
 *
 * @param input 매물 정보 및 권장 입찰가 범위
 * @returns 유사 사례 배열 (최소 2개)
 */
export function generateSimilarCases(
  input: GenerateSimilarCasesInput
): SimilarCase[] {
  console.log("🔍 [유사 사례 생성] 시작");

  const { property, scenario, bidRange } = input;

  // 기본 정보 추출
  let address = "";
  let propertyType = "";
  let minimumBidPrice = bidRange.min;
  let appraisalValue = 0;

  if (property) {
    address = property.meta?.address || "";
    propertyType = property.meta?.type || "기타";
    minimumBidPrice = property.price?.lowest || bidRange.min;
    appraisalValue = property.price?.appraised || 0;
  } else if (scenario) {
    address = scenario.basicInfo.location || "";
    propertyType = scenario.basicInfo.propertyType || "기타";
    minimumBidPrice = scenario.basicInfo.minimumBidPrice || bidRange.min;
    appraisalValue = scenario.basicInfo.appraisalValue || 0;
  }

  const district = extractDistrict(address);
  const propertyLabel = getPropertyTypeLabel(propertyType);

  console.log(`  - 지역: ${district}`);
  console.log(`  - 매물 유형: ${propertyLabel}`);
  console.log(`  - 권장 범위: ${bidRange.min.toLocaleString()} ~ ${bidRange.max.toLocaleString()}원`);

  // 유사 사례 2-3개 생성
  const cases: SimilarCase[] = [];
  const count = Math.max(2, Math.floor(Math.random() * 2) + 2); // 2-3개

  // 시간 태그 옵션
  const timeTags = [
    "최근 1개월 낙찰",
    "2개월 전 낙찰",
    "3개월 전 낙찰",
    "최근 2주 낙찰",
  ];

  for (let i = 0; i < count; i++) {
    // 낙찰가: 권장 범위 내에서 랜덤하게 생성 (약간의 변동 포함)
    const rangeRatio = bidRange.max / bidRange.min;
    const variance = 0.85 + Math.random() * 0.3; // 85% ~ 115% 범위
    const basePrice = bidRange.optimal || bidRange.min + (bidRange.max - bidRange.min) * 0.5;
    const won = Math.round(basePrice * variance);

    // 경쟁률: 3:1 ~ 6:1 사이에서 생성
    const competitionRate = Math.floor(Math.random() * 4) + 3; // 3-6
    const rate = `${competitionRate}:1`;

    // ROI: 5% ~ 15% 사이에서 생성 (약간의 변동)
    const baseRoi = 8 + (won / bidRange.max) * 5; // 가격이 높을수록 ROI 약간 상승
    const roiVariation = -2 + Math.random() * 4; // ±2% 변동
    const roi = Math.max(5, Math.min(15, Math.round((baseRoi + roiVariation) * 10) / 10));

    // 제목: 지역 + 매물 유형
    const title = `${district} ○○ ${propertyLabel}`;

    // 시간 태그: 순서대로 배분
    const tag = timeTags[i % timeTags.length] || "최근 낙찰";

    const similarCase: SimilarCase = {
      id: `sim${i + 1}`,
      title,
      won,
      rate,
      roi,
      tag,
    };

    cases.push(similarCase);
    console.log(`  - 사례 ${i + 1}: ${title}, ${won.toLocaleString()}원, 경쟁률 ${rate}, ROI ${roi}%`);
  }

  console.log(`✅ [유사 사례 생성] 완료: ${cases.length}개 생성`);
  return cases;
}

