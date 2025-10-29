/**
 * Bid Master AI - 교육용 매물 생성 서버 액션
 */

"use server";

import {
  DifficultyLevel,
  SimulationScenario,
  EducationalContent,
  RightRecord,
  TenantRecord,
} from "@/types/simulation";
import { generateEducationalProperty } from "@/lib/openai-client";
import { analyzeRights, validateScenario } from "@/lib/rights-analysis-engine";
import { generateRegionalAnalysis } from "@/lib/regional-analysis";

/**
 * 현실적인 가격 범위를 생성합니다.
 */
function generateRealisticPriceRanges(propertyType: string, region: string) {
  console.log(`💰 [가격 생성] ${propertyType} - ${region} 현실적 가격 생성`);

  // 매물 유형별 기본 가격 범위 (억 단위)
  const baseRanges = {
    아파트: {
      "서울 강남": { min: 8, max: 25 },
      "서울 비강남": { min: 4, max: 12 },
      "경기 신도시": { min: 3, max: 10 },
      인천: { min: 2, max: 8 },
      부산: { min: 1.5, max: 6 },
      대구: { min: 1.2, max: 5 },
      대전: { min: 1.5, max: 5 },
      광주: { min: 1, max: 4 },
      울산: { min: 1.2, max: 4.5 },
      세종: { min: 2, max: 6 },
      강원: { min: 0.8, max: 3 },
      충청: { min: 1, max: 4 },
      전라: { min: 0.8, max: 3.5 },
      경상: { min: 1, max: 4 },
      제주: { min: 1.5, max: 5 },
      기타: { min: 1, max: 4 },
    },
    주택: {
      "서울 강남": { min: 6, max: 20 },
      "서울 비강남": { min: 3, max: 10 },
      "경기 신도시": { min: 2, max: 8 },
      인천: { min: 1.5, max: 6 },
      부산: { min: 1, max: 5 },
      대구: { min: 0.8, max: 4 },
      대전: { min: 1, max: 4.5 },
      광주: { min: 0.6, max: 3 },
      울산: { min: 0.8, max: 3.5 },
      세종: { min: 1.2, max: 5 },
      강원: { min: 0.5, max: 2.5 },
      충청: { min: 0.6, max: 3 },
      전라: { min: 0.5, max: 2.8 },
      경상: { min: 0.6, max: 3.2 },
      제주: { min: 1, max: 4 },
      기타: { min: 0.6, max: 3 },
    },
    다가구주택: {
      "서울 강남": { min: 4, max: 12 },
      "서울 비강남": { min: 2.5, max: 8 },
      "경기 신도시": { min: 2, max: 6 },
      인천: { min: 1.5, max: 5 },
      부산: { min: 1, max: 4 },
      대구: { min: 0.8, max: 3.5 },
      대전: { min: 1, max: 4 },
      광주: { min: 0.6, max: 2.5 },
      울산: { min: 0.8, max: 3 },
      세종: { min: 1, max: 4 },
      강원: { min: 0.4, max: 2 },
      충청: { min: 0.5, max: 2.5 },
      전라: { min: 0.4, max: 2.2 },
      경상: { min: 0.5, max: 2.8 },
      제주: { min: 0.8, max: 3.5 },
      기타: { min: 0.5, max: 2.5 },
    },
    근린주택: {
      "서울 강남": { min: 5, max: 15 },
      "서울 비강남": { min: 2.5, max: 8 },
      "경기 신도시": { min: 2, max: 6 },
      인천: { min: 1.5, max: 5 },
      부산: { min: 1, max: 4 },
      대구: { min: 0.8, max: 3.5 },
      대전: { min: 1, max: 4 },
      광주: { min: 0.6, max: 2.5 },
      울산: { min: 0.8, max: 3 },
      세종: { min: 1, max: 4 },
      강원: { min: 0.4, max: 2 },
      충청: { min: 0.5, max: 2.5 },
      전라: { min: 0.4, max: 2.2 },
      경상: { min: 0.5, max: 2.8 },
      제주: { min: 0.8, max: 3.5 },
      기타: { min: 0.5, max: 2.5 },
    },
    도시형생활주택: {
      "서울 강남": { min: 3, max: 10 },
      "서울 비강남": { min: 2, max: 6 },
      "경기 신도시": { min: 1.5, max: 5 },
      인천: { min: 1.2, max: 4 },
      부산: { min: 0.8, max: 3 },
      대구: { min: 0.6, max: 2.5 },
      대전: { min: 0.8, max: 3 },
      광주: { min: 0.5, max: 2 },
      울산: { min: 0.6, max: 2.5 },
      세종: { min: 0.8, max: 3 },
      강원: { min: 0.3, max: 1.5 },
      충청: { min: 0.4, max: 2 },
      전라: { min: 0.3, max: 1.8 },
      경상: { min: 0.4, max: 2.2 },
      제주: { min: 0.6, max: 2.5 },
      기타: { min: 0.4, max: 2 },
    },
    오피스텔: {
      "서울 강남": { min: 3, max: 8 },
      "서울 비강남": { min: 2, max: 5 },
      "경기 신도시": { min: 1.5, max: 4 },
      인천: { min: 1.2, max: 3.5 },
      부산: { min: 0.8, max: 2.5 },
      대구: { min: 0.6, max: 2 },
      대전: { min: 0.8, max: 2.5 },
      광주: { min: 0.5, max: 1.8 },
      울산: { min: 0.6, max: 2 },
      세종: { min: 1, max: 3 },
      강원: { min: 0.4, max: 1.5 },
      충청: { min: 0.5, max: 2 },
      전라: { min: 0.4, max: 1.8 },
      경상: { min: 0.5, max: 2 },
      제주: { min: 0.8, max: 2.5 },
      기타: { min: 0.5, max: 2 },
    },
    상가: {
      "서울 강남": { min: 5, max: 15 },
      "서울 비강남": { min: 2, max: 8 },
      "경기 신도시": { min: 1.5, max: 6 },
      인천: { min: 1.2, max: 5 },
      부산: { min: 0.8, max: 4 },
      대구: { min: 0.6, max: 3 },
      대전: { min: 0.8, max: 3.5 },
      광주: { min: 0.5, max: 2.5 },
      울산: { min: 0.6, max: 3 },
      세종: { min: 1, max: 4 },
      강원: { min: 0.4, max: 2 },
      충청: { min: 0.5, max: 2.5 },
      전라: { min: 0.4, max: 2.2 },
      경상: { min: 0.5, max: 2.8 },
      제주: { min: 0.8, max: 3.5 },
      기타: { min: 0.5, max: 2.5 },
    },
    단독주택: {
      "서울 강남": { min: 6, max: 20 },
      "서울 비강남": { min: 3, max: 10 },
      "경기 신도시": { min: 2, max: 8 },
      인천: { min: 1.5, max: 6 },
      부산: { min: 1, max: 5 },
      대구: { min: 0.8, max: 4 },
      대전: { min: 1, max: 4.5 },
      광주: { min: 0.6, max: 3 },
      울산: { min: 0.8, max: 3.5 },
      세종: { min: 1.2, max: 5 },
      강원: { min: 0.5, max: 2.5 },
      충청: { min: 0.6, max: 3 },
      전라: { min: 0.5, max: 2.8 },
      경상: { min: 0.6, max: 3.2 },
      제주: { min: 1, max: 4 },
      기타: { min: 0.6, max: 3 },
    },
    빌라: {
      "서울 강남": { min: 2, max: 6 },
      "서울 비강남": { min: 1.5, max: 4 },
      "경기 신도시": { min: 1, max: 3 },
      인천: { min: 0.8, max: 2.5 },
      부산: { min: 0.5, max: 2 },
      대구: { min: 0.4, max: 1.5 },
      대전: { min: 0.5, max: 2 },
      광주: { min: 0.3, max: 1.2 },
      울산: { min: 0.4, max: 1.5 },
      세종: { min: 0.6, max: 2.2 },
      강원: { min: 0.2, max: 1 },
      충청: { min: 0.3, max: 1.2 },
      전라: { min: 0.2, max: 1.1 },
      경상: { min: 0.3, max: 1.3 },
      제주: { min: 0.5, max: 2 },
      기타: { min: 0.3, max: 1.2 },
    },
    원룸: {
      "서울 강남": { min: 1, max: 3 },
      "서울 비강남": { min: 0.8, max: 2.5 },
      "경기 신도시": { min: 0.5, max: 1.8 },
      인천: { min: 0.4, max: 1.5 },
      부산: { min: 0.3, max: 1.2 },
      대구: { min: 0.25, max: 1 },
      대전: { min: 0.3, max: 1.2 },
      광주: { min: 0.2, max: 0.8 },
      울산: { min: 0.25, max: 1 },
      세종: { min: 0.4, max: 1.3 },
      강원: { min: 0.15, max: 0.6 },
      충청: { min: 0.2, max: 0.8 },
      전라: { min: 0.15, max: 0.7 },
      경상: { min: 0.2, max: 0.8 },
      제주: { min: 0.3, max: 1.2 },
      기타: { min: 0.2, max: 0.8 },
    },
  };

  // 지역 분류
  const getRegionCategory = (region: string) => {
    if (
      region.includes("강남") ||
      region.includes("서초") ||
      region.includes("송파")
    )
      return "서울 강남";
    if (region.includes("서울")) return "서울 비강남";
    if (
      region.includes("경기") ||
      region.includes("분당") ||
      region.includes("성남")
    )
      return "경기 신도시";
    if (region.includes("인천")) return "인천";
    if (region.includes("부산")) return "부산";
    if (region.includes("대구")) return "대구";
    if (region.includes("대전")) return "대전";
    if (region.includes("광주")) return "광주";
    if (region.includes("울산")) return "울산";
    if (region.includes("세종")) return "세종";
    if (region.includes("강원")) return "강원";
    if (region.includes("충청")) return "충청";
    if (region.includes("전라")) return "전라";
    if (region.includes("경상")) return "경상";
    if (region.includes("제주")) return "제주";
    return "기타";
  };

  const regionCategory = getRegionCategory(region);
  const priceRange = baseRanges[propertyType]?.[regionCategory] ||
    baseRanges[propertyType]?.["기타"] || { min: 1, max: 5 };

  // 매물 유형별 시장 변동성 설정
  const getMarketVolatility = (propertyType: string) => {
    switch (propertyType) {
      case "아파트":
        return 0.2; // ±10% (안정적)
      case "오피스텔":
        return 0.3; // ±15% (중간)
      case "상가":
        return 0.4; // ±20% (변동성 높음)
      case "단독주택":
        return 0.25; // ±12.5% (중간)
      case "빌라":
        return 0.35; // ±17.5% (중간-높음)
      case "원룸":
        return 0.3; // ±15% (중간)
      case "주택":
        return 0.25; // ±12.5% (중간)
      case "다가구주택":
        return 0.3; // ±15% (중간)
      case "근린주택":
        return 0.28; // ±14% (중간)
      case "도시형생활주택":
        return 0.32; // ±16% (중간-높음)
      default:
        return 0.25; // ±12.5% (기본값)
    }
  };

  // 5개의 다양한 가격 생성
  const priceRanges = [];
  for (let i = 0; i < 5; i++) {
    // 매물 유형별 시장 변동성 적용
    const volatilityRange = getMarketVolatility(propertyType);
    const marketVolatility = (Math.random() - 0.5) * volatilityRange;
    const basePrice =
      priceRange.min + (priceRange.max - priceRange.min) * Math.random();
    const adjustedPrice = basePrice * (1 + marketVolatility);

    // 현실적인 가격으로 조정 (백원단위까지 반영)
    const marketValueRaw = adjustedPrice * 100000000; // 억 단위를 원 단위로 변환
    const marketValue = Math.round(marketValueRaw / 100) * 100; // 백원단위로 반올림

    // 감정가는 시장가의 75-90% (백원단위)
    const appraisalRatio = 0.75 + Math.random() * 0.15;
    const appraisalValueRaw = marketValue * appraisalRatio;
    const appraisalValue = Math.round(appraisalValueRaw / 100) * 100;

    // 청구금액은 감정가의 40-70% (백원단위)
    const claimRatio = 0.4 + Math.random() * 0.3;
    const claimAmountRaw = appraisalValue * claimRatio;
    const claimAmount = Math.round(claimAmountRaw / 100) * 100;

    console.log(
      `💰 [가격 생성] ${
        i + 1
      }번째 가격 (${propertyType}) - 시장가: ${marketValue.toLocaleString()}원, 감정가: ${appraisalValue.toLocaleString()}원, 청구금액: ${claimAmount.toLocaleString()}원 (변동성: ${(
        volatilityRange * 100
      ).toFixed(1)}%)`
    );

    priceRanges.push({
      marketValue,
      appraisalValue,
      claimAmount,
    });
  }

  console.log(`💰 [가격 생성] 생성된 가격 범위: ${priceRanges.length}개`);
  return priceRanges;
}

/**
 * 매물 유형별 맞춤형 교육 콘텐츠를 생성합니다.
 */
function generateEducationalContent(
  difficulty: DifficultyLevel,
  propertyType: string,
  location: string,
  appraisalValue: number
): EducationalContent {
  console.log(
    `📚 [교육 콘텐츠 생성] ${propertyType} - ${location} - ${appraisalValue.toLocaleString()}원`
  );

  // 매물 유형별 기본 정보
  const propertyInfo = getPropertyTypeInfo(
    propertyType,
    location,
    appraisalValue
  );

  // 난이도별 복잡도 조정
  const complexity = getComplexityByDifficulty(difficulty);

  // 매물별 맞춤형 분석 생성
  const coreAnalysis = generatePropertySpecificAnalysis(
    propertyType,
    location,
    appraisalValue,
    complexity
  );

  // 단계별 가이드 생성
  const stepByStepGuide = generateStepByStepGuide(propertyType, complexity);

  // 실전 팁 생성
  const proTips = generateProTips(propertyType, location, complexity);

  // 법률 용어 설명 생성
  const legalTerms = generateLegalTerms(propertyType, complexity);

  return {
    difficulty,
    oneLiner: `${propertyInfo.typeDescription} - ${complexity.description}`,
    coreAnalysis,
    stepByStepGuide,
    proTips,
    legalTerms,
  };
}

/**
 * 매물 유형별 기본 정보를 반환합니다.
 */
function getPropertyTypeInfo(
  propertyType: string,
  location: string,
  appraisalValue: number
) {
  const priceCategory =
    appraisalValue >= 1500000000
      ? "고가"
      : appraisalValue >= 1000000000
      ? "중가"
      : "저가";

  switch (propertyType) {
    case "아파트":
      return {
        typeDescription: `${location} ${priceCategory} 아파트`,
        characteristics: [
          "공동주택",
          "관리비 부담",
          "입주민 규정",
          "엘리베이터",
          "주차장",
        ],
        marketFactors: [
          "학군",
          "교통편의",
          "상가 밀도",
          "환경",
          "미래 개발계획",
        ],
      };
    case "오피스텔":
      return {
        typeDescription: `${location} ${priceCategory} 오피스텔`,
        characteristics: [
          "상업용 주거",
          "관리비 높음",
          "입주 제한",
          "상업시설",
          "투자용",
        ],
        marketFactors: [
          "상권",
          "교통 접근성",
          "업무지구",
          "상업시설",
          "투자 수익률",
        ],
      };
    case "상가":
      return {
        typeDescription: `${location} ${priceCategory} 상가`,
        characteristics: [
          "상업용 부동산",
          "임대 수익",
          "상권 의존",
          "용도 변경 제한",
          "관리 필요",
        ],
        marketFactors: [
          "상권 활성도",
          "유동인구",
          "경쟁업체",
          "임대료 수준",
          "상권 변화",
        ],
      };
    case "단독주택":
      return {
        typeDescription: `${location} ${priceCategory} 단독주택`,
        characteristics: [
          "독립주택",
          "개인 소유",
          "개별 관리",
          "확장 가능",
          "정원",
        ],
        marketFactors: ["지역 개발", "교통 편의", "환경", "학교", "상업시설"],
      };
    case "빌라":
      return {
        typeDescription: `${location} ${priceCategory} 빌라`,
        characteristics: [
          "소형 공동주택",
          "저렴한 관리비",
          "투자용 부동산",
          "임대 수익",
          "접근성",
        ],
        marketFactors: [
          "대중교통",
          "상업시설",
          "학원가",
          "임대 수요",
          "투자 수익률",
        ],
      };
    case "원룸":
      return {
        typeDescription: `${location} ${priceCategory} 원룸`,
        characteristics: [
          "소형 주거공간",
          "저렴한 가격",
          "1인 가구",
          "투자용 부동산",
          "임대 수익",
        ],
        marketFactors: [
          "대학가",
          "직장인",
          "교통편의",
          "상업시설",
          "임대 수요",
        ],
      };
    case "주택":
      return {
        typeDescription: `${location} ${priceCategory} 주택`,
        characteristics: [
          "일반 주거용 건물",
          "개별 소유",
          "다양한 규모",
          "거주용 부동산",
          "투자 가능",
        ],
        marketFactors: [
          "지역 개발",
          "교통 편의",
          "환경",
          "학교",
          "상업시설",
        ],
      };
    case "다가구주택":
      return {
        typeDescription: `${location} ${priceCategory} 다가구주택`,
        characteristics: [
          "여러 가구 거주",
          "투자용 부동산",
          "임대 수익",
          "관리 필요",
          "다양한 임차인",
        ],
        marketFactors: [
          "임대 수요",
          "교통편의",
          "상업시설",
          "학원가",
          "투자 수익률",
        ],
      };
    case "근린주택":
      return {
        typeDescription: `${location} ${priceCategory} 근린주택`,
        characteristics: [
          "근린생활시설 포함",
          "상업+주거 복합",
          "투자용 부동산",
          "임대 수익",
          "상권 의존",
        ],
        marketFactors: [
          "상권 활성도",
          "유동인구",
          "교통편의",
          "임대 수요",
          "투자 수익률",
        ],
      };
    case "도시형생활주택":
      return {
        typeDescription: `${location} ${priceCategory} 도시형생활주택`,
        characteristics: [
          "도시형 주거시설",
          "소형 주거공간",
          "1-2인 가구",
          "투자용 부동산",
          "임대 수익",
        ],
        marketFactors: [
          "대학가",
          "직장인",
          "교통편의",
          "상업시설",
          "임대 수요",
        ],
      };
    default:
      return {
        typeDescription: `${location} ${priceCategory} 부동산`,
        characteristics: ["일반 부동산"],
        marketFactors: ["지역 특성"],
      };
  }
}

/**
 * 난이도별 복잡도를 반환합니다.
 */
function getComplexityByDifficulty(difficulty: DifficultyLevel) {
  switch (difficulty) {
    case "초급":
      return {
        description: "기본 권리 구조",
        rightsCount: "1-2개",
        tenantsCount: "1명",
        complexity: "단순",
      };
    case "중급":
      return {
        description: "다중 권리 구조",
        rightsCount: "2-3개",
        tenantsCount: "2명",
        complexity: "중간",
      };
    case "고급":
      return {
        description: "복잡한 권리 구조",
        rightsCount: "3-4개",
        tenantsCount: "3명",
        complexity: "복잡",
      };
  }
}

/**
 * 매물별 맞춤형 핵심 분석을 생성합니다.
 */
function generatePropertySpecificAnalysis(
  propertyType: string,
  location: string,
  appraisalValue: number,
  complexity: any
) {
  const baseAnalysis = {
    learningGoal: "",
    keyPoints: [] as string[],
    risks: [] as string[],
    strategy: "",
  };

  switch (propertyType) {
    case "아파트":
      baseAnalysis.learningGoal = "아파트 경매의 특수성과 공동주택 관리 이해";
      baseAnalysis.keyPoints = [
        "관리비 부담 계산",
        "입주민 규정 확인",
        "주차장 사용권",
        "공용시설 이용권",
        "관리사무소 운영비",
      ];
      baseAnalysis.risks = [
        "관리비 미납 부담",
        "입주민 갈등",
        "시설 노후화",
        "주차장 부족",
        "관리비 인상",
      ];
      baseAnalysis.strategy = "관리비와 시설 상태를 고려한 현실적 입찰가 산정";
      break;

    case "오피스텔":
      baseAnalysis.learningGoal = "오피스텔의 상업용 특성과 투자 수익률 분석";
      baseAnalysis.keyPoints = [
        "상업용 관리비",
        "임대 수익률",
        "상권 변화",
        "용도 변경 제한",
        "투자 회수 기간",
      ];
      baseAnalysis.risks = [
        "상권 쇠퇴",
        "임대료 하락",
        "공실 위험",
        "관리비 부담",
        "투자 실패",
      ];
      baseAnalysis.strategy =
        "임대 수익률과 상권 전망을 고려한 투자적 관점 입찰";
      break;

    case "상가":
      baseAnalysis.learningGoal = "상가의 상권 의존성과 임대 수익 분석";
      baseAnalysis.keyPoints = [
        "상권 활성도",
        "임대료 수준",
        "유동인구",
        "경쟁업체",
        "상권 변화 전망",
      ];
      baseAnalysis.risks = [
        "상권 쇠퇴",
        "임대료 하락",
        "공실 증가",
        "경쟁 심화",
        "상권 이전",
      ];
      baseAnalysis.strategy =
        "상권 분석과 임대 수익을 기반으로 한 상업적 가치 평가";
      break;

    case "단독주택":
      baseAnalysis.learningGoal = "단독주택의 개별성과 지역 개발 전망 분석";
      baseAnalysis.keyPoints = [
        "개별 관리",
        "확장 가능성",
        "지역 개발",
        "교통 편의",
        "환경 변화",
      ];
      baseAnalysis.risks = [
        "개별 관리 부담",
        "지역 쇠퇴",
        "교통 불편",
        "환경 악화",
        "개발 지연",
      ];
      baseAnalysis.strategy =
        "지역 개발 전망과 개별 특성을 고려한 장기적 관점 입찰";
      break;

    case "주택":
      baseAnalysis.learningGoal = "일반 주택의 거주용 특성과 투자 가치 분석";
      baseAnalysis.keyPoints = [
        "거주용 특성",
        "투자 가능성",
        "지역 개발",
        "교통 편의",
        "환경 변화",
      ];
      baseAnalysis.risks = [
        "거주용 한계",
        "지역 쇠퇴",
        "교통 불편",
        "환경 악화",
        "투자 실패",
      ];
      baseAnalysis.strategy =
        "거주용과 투자용 가치를 모두 고려한 균형적 입찰";
      break;

    case "다가구주택":
      baseAnalysis.learningGoal = "다가구주택의 임대 수익과 관리 복잡성 분석";
      baseAnalysis.keyPoints = [
        "임대 수익률",
        "다양한 임차인",
        "관리 복잡성",
        "교통편의",
        "상업시설",
      ];
      baseAnalysis.risks = [
        "임차인 관리",
        "공실 위험",
        "관리비 부담",
        "임대료 하락",
        "투자 실패",
      ];
      baseAnalysis.strategy =
        "임대 수익률과 관리 부담을 고려한 현실적 입찰";
      break;

    case "근린주택":
      baseAnalysis.learningGoal = "근린주택의 상업+주거 복합 특성과 상권 의존성 분석";
      baseAnalysis.keyPoints = [
        "상업+주거 복합",
        "상권 의존성",
        "임대 수익",
        "유동인구",
        "상권 변화",
      ];
      baseAnalysis.risks = [
        "상권 쇠퇴",
        "임대료 하락",
        "공실 증가",
        "상권 이전",
        "투자 실패",
      ];
      baseAnalysis.strategy =
        "상권 분석과 복합 용도 특성을 고려한 상업적 가치 평가";
      break;

    case "도시형생활주택":
      baseAnalysis.learningGoal = "도시형생활주택의 소형 주거 특성과 임대 수익 분석";
      baseAnalysis.keyPoints = [
        "소형 주거공간",
        "1-2인 가구",
        "임대 수익",
        "교통편의",
        "상업시설",
      ];
      baseAnalysis.risks = [
        "소형 공간 한계",
        "임대 수요 변화",
        "공실 위험",
        "관리비 부담",
        "투자 실패",
      ];
      baseAnalysis.strategy =
        "소형 주거 특성과 임대 수익을 고려한 투자적 관점 입찰";
      break;
  }

  // 난이도별 복잡도 추가
  if (complexity.complexity === "중간") {
    baseAnalysis.keyPoints.push("다중 권리 분석", "임차인 대항력");
    baseAnalysis.risks.push("권리 우선순위 오류", "대항력 판단 실수");
  } else if (complexity.complexity === "복잡") {
    baseAnalysis.keyPoints.push(
      "복잡한 권리 구조",
      "전세권 처리",
      "다중 임차인"
    );
    baseAnalysis.risks.push(
      "복잡한 권리 분석",
      "전세권 처리 오류",
      "고위험 입찰"
    );
  }

  return baseAnalysis;
}

/**
 * 단계별 가이드를 생성합니다.
 */
function generateStepByStepGuide(propertyType: string, complexity: any) {
  const baseSteps = {
    step1: "",
    step2: "",
    step3: "",
    step4: "",
  };

  switch (propertyType) {
    case "아파트":
      baseSteps.step1 = "아파트 관리 현황과 시설 상태 파악하기";
      baseSteps.step2 = "관리비와 입주민 규정 확인하기";
      baseSteps.step3 = "주차장과 공용시설 이용권 검토하기";
      baseSteps.step4 = "관리비 부담과 시설 노후화 리스크 점검하기";
      break;
    case "오피스텔":
      baseSteps.step1 = "상권 현황과 임대 수익률 분석하기";
      baseSteps.step2 = "상업용 관리비와 용도 변경 제한 확인하기";
      baseSteps.step3 = "투자 회수 기간과 수익률 계산하기";
      baseSteps.step4 = "상권 변화와 공실 위험 평가하기";
      break;
    case "상가":
      baseSteps.step1 = "상권 활성도와 유동인구 분석하기";
      baseSteps.step2 = "임대료 수준과 경쟁업체 현황 파악하기";
      baseSteps.step3 = "상권 변화 전망과 임대 수익 계산하기";
      baseSteps.step4 = "상권 쇠퇴와 공실 증가 리스크 점검하기";
      break;
    case "단독주택":
      baseSteps.step1 = "지역 개발 계획과 교통 편의성 확인하기";
      baseSteps.step2 = "개별 관리 부담과 확장 가능성 검토하기";
      baseSteps.step3 = "환경 변화와 장기적 가치 평가하기";
      baseSteps.step4 = "지역 쇠퇴와 개발 지연 리스크 점검하기";
      break;
    case "주택":
      baseSteps.step1 = "거주용 특성과 투자 가능성 분석하기";
      baseSteps.step2 = "지역 개발과 교통 편의성 확인하기";
      baseSteps.step3 = "환경 변화와 장기적 가치 평가하기";
      baseSteps.step4 = "거주용 한계와 투자 실패 리스크 점검하기";
      break;
    case "다가구주택":
      baseSteps.step1 = "임대 수익률과 임차인 현황 분석하기";
      baseSteps.step2 = "관리 복잡성과 교통편의성 확인하기";
      baseSteps.step3 = "상업시설과 임대 수요 평가하기";
      baseSteps.step4 = "임차인 관리와 공실 위험 점검하기";
      break;
    case "근린주택":
      baseSteps.step1 = "상권 활성도와 유동인구 분석하기";
      baseSteps.step2 = "상업+주거 복합 특성 확인하기";
      baseSteps.step3 = "임대 수익과 상권 변화 전망 평가하기";
      baseSteps.step4 = "상권 쇠퇴와 공실 증가 리스크 점검하기";
      break;
    case "도시형생활주택":
      baseSteps.step1 = "소형 주거공간과 1-2인 가구 특성 분석하기";
      baseSteps.step2 = "교통편의성과 상업시설 확인하기";
      baseSteps.step3 = "임대 수익과 임대 수요 평가하기";
      baseSteps.step4 = "소형 공간 한계와 공실 위험 점검하기";
      break;
  }

  return baseSteps;
}

/**
 * 실전 팁을 생성합니다.
 */
function generateProTips(
  propertyType: string,
  location: string,
  complexity: any
) {
  const baseTips: string[] = [];

  switch (propertyType) {
    case "아파트":
      baseTips.push(
        "관리비 현황을 꼼꼼히 확인하세요",
        "입주민 규정과 주차장 사용권을 확인하세요",
        "시설 노후화 정도를 정확히 파악하세요"
      );
      break;
    case "오피스텔":
      baseTips.push(
        "상권 변화 전망을 신중히 분석하세요",
        "임대 수익률을 현실적으로 계산하세요",
        "상업용 관리비 부담을 고려하세요"
      );
      break;
    case "상가":
      baseTips.push(
        "상권 활성도를 정확히 파악하세요",
        "유동인구와 경쟁업체를 분석하세요",
        "임대료 수준을 시장가와 비교하세요"
      );
      break;
    case "단독주택":
      baseTips.push(
        "지역 개발 계획을 확인하세요",
        "교통 편의성을 정확히 파악하세요",
        "개별 관리 부담을 고려하세요"
      );
      break;
    case "주택":
      baseTips.push(
        "거주용과 투자용 가치를 모두 고려하세요",
        "지역 개발 전망을 확인하세요",
        "교통 편의성을 정확히 파악하세요"
      );
      break;
    case "다가구주택":
      baseTips.push(
        "임대 수익률을 현실적으로 계산하세요",
        "임차인 관리 부담을 고려하세요",
        "공실 위험을 정확히 평가하세요"
      );
      break;
    case "근린주택":
      baseTips.push(
        "상권 활성도를 정확히 파악하세요",
        "유동인구와 상권 변화를 분석하세요",
        "상업+주거 복합 특성을 고려하세요"
      );
      break;
    case "도시형생활주택":
      baseTips.push(
        "소형 주거공간의 한계를 고려하세요",
        "1-2인 가구 수요를 분석하세요",
        "임대 수익과 공실 위험을 평가하세요"
      );
      break;
  }

  // 난이도별 팁 추가
  if (complexity.complexity === "중간") {
    baseTips.push(
      "말소기준권리를 정확히 파악하세요",
      "임차인의 대항력을 정확히 판단하세요"
    );
  } else if (complexity.complexity === "복잡") {
    baseTips.push(
      "복잡한 권리 구조를 단계별로 분석하세요",
      "전세권과 근저당권의 우선순위를 정확히 파악하세요"
    );
  }

  return baseTips;
}

/**
 * 법률 용어 설명을 생성합니다.
 */
function generateLegalTerms(propertyType: string, complexity: any) {
  const baseTerms: Record<string, string> = {
    말소기준권리:
      "경매로 인해 소멸되는 권리 - 배당요구종기일 이전에 설정된 최선순위 권리",
    대항력: "임차인의 권리 보호 수준 - 경매에서 임차인 권리가 보호되는 정도",
    소액임차인:
      "보증금이 일정 금액 이하인 임차인 - 우선변제금액을 받을 수 있는 특별한 보호",
    전세권:
      "전세금을 지급하고 부동산을 사용할 수 있는 권리 - 근저당권보다 우선순위가 높음",
  };

  // 매물 유형별 특수 용어 추가
  switch (propertyType) {
    case "아파트":
      baseTerms["관리비"] = "공동주택의 공용시설 관리와 운영에 필요한 비용";
      baseTerms["입주민규정"] = "아파트 입주민들이 지켜야 하는 공동생활 규칙";
      baseTerms["주차장사용권"] = "아파트 주차장을 사용할 수 있는 권리";
      break;
    case "오피스텔":
      baseTerms["상업용관리비"] = "오피스텔의 상업시설 관리에 필요한 비용";
      baseTerms["용도변경제한"] =
        "상업용 부동산의 용도를 변경할 수 있는 제한사항";
      baseTerms["임대수익률"] = "임대료 수익을 투자금액으로 나눈 비율";
      break;
    case "상가":
      baseTerms["상권"] = "상업 활동이 활발한 지역의 범위";
      baseTerms["유동인구"] = "상가 주변을 지나다니는 사람들의 수";
      baseTerms["임대료수준"] = "해당 지역 상가의 평균 임대료";
      break;
    case "단독주택":
      baseTerms["개별관리"] = "단독주택의 개별적인 관리와 유지보수";
      baseTerms["확장가능성"] = "단독주택을 확장하거나 개조할 수 있는 가능성";
      baseTerms["지역개발"] = "해당 지역의 개발 계획과 전망";
      break;
    case "주택":
      baseTerms["거주용특성"] = "일반 주택의 거주용 부동산 특성";
      baseTerms["투자가능성"] = "주택의 투자용 부동산으로 활용 가능한 정도";
      baseTerms["지역개발"] = "해당 지역의 개발 계획과 전망";
      break;
    case "다가구주택":
      baseTerms["임대수익률"] = "다가구주택의 임대료 수익을 투자금액으로 나눈 비율";
      baseTerms["임차인관리"] = "여러 가구의 임차인들을 관리하는 복잡성";
      baseTerms["공실위험"] = "임차인이 없어서 발생하는 수익 손실 위험";
      break;
    case "근린주택":
      baseTerms["상권의존성"] = "근린주택이 상권 활성도에 의존하는 정도";
      baseTerms["복합용도"] = "상업과 주거가 복합된 부동산 용도";
      baseTerms["유동인구"] = "근린주택 주변을 지나다니는 사람들의 수";
      break;
    case "도시형생활주택":
      baseTerms["소형주거공간"] = "도시형생활주택의 작은 주거 공간 특성";
      baseTerms["1-2인이구"] = "도시형생활주택의 주요 거주 대상 가구";
      baseTerms["임대수요"] = "도시형생활주택에 대한 임대 수요의 정도";
      break;
  }

  // 난이도별 용어 추가
  if (complexity.complexity === "중간") {
    baseTerms["다중권리"] = "여러 개의 권리가 설정된 복잡한 권리 구조";
    baseTerms["권리우선순위"] = "여러 권리 중 우선순위가 높은 권리";
  } else if (complexity.complexity === "복잡") {
    baseTerms["복잡한권리구조"] = "여러 종류의 권리가 복잡하게 얽힌 구조";
    baseTerms["전세권처리"] = "전세권이 있는 경우의 특별한 처리 방법";
  }

  return baseTerms;
}

/**
 * 교육용 매물의 권리를 생성합니다.
 */
function generateEducationalRights(
  difficulty: DifficultyLevel,
  propertyType: string,
  claimAmount: number
): RightRecord[] {
  console.log(
    `🔍 [교육용 권리 생성] ${difficulty} - ${propertyType} - 청구금액: ${claimAmount.toLocaleString()}원`
  );

  const rights: RightRecord[] = [];
  const baseClaimAmount = Math.floor(claimAmount * 0.7);
  const secondaryClaimAmount = Math.floor(claimAmount * 0.3);

  // 기본 근저당권 (1순위)
  rights.push({
    id: "right-1",
    registrationDate: "2016-11-22",
    rightType: "근저당권",
    rightHolder: "국민은행",
    claimAmount: baseClaimAmount,
    priority: 1,
    isMalsoBaseRight: false,
    willBeExtinguished: false,
    willBeAssumed: false,
  });

  // 난이도별 권리 추가
  if (difficulty === "중급" || difficulty === "고급") {
    // 다양한 권리 유형 중에서 랜덤 선택
    const additionalRightTypes = [
      "압류",
      "가압류",
      "담보가등기",
      "소유권이전청구권가등기",
      "가처분",
      "유치권",
      "법정지상권",
      "분묘기지권",
    ];
    const selectedRightType =
      additionalRightTypes[
        Math.floor(Math.random() * additionalRightTypes.length)
      ];

    rights.push({
      id: "right-2",
      registrationDate: "2018-03-15",
      rightType: selectedRightType,
      rightHolder:
        selectedRightType === "압류" || selectedRightType === "가압류"
          ? "서울중앙지방법원"
          : selectedRightType === "담보가등기"
          ? "신한은행"
          : selectedRightType === "소유권이전청구권가등기"
          ? "김영수"
          : selectedRightType === "가처분"
          ? "서울중앙지방법원"
          : selectedRightType === "유치권"
          ? "이영희"
          : selectedRightType === "법정지상권"
          ? "박민수"
          : selectedRightType === "분묘기지권"
          ? "최수진"
          : "권리자",
      claimAmount: secondaryClaimAmount,
      priority: 2,
      isMalsoBaseRight: false,
      willBeExtinguished: false,
      willBeAssumed: false,
    });
  }

  if (difficulty === "고급") {
    // 고급에서는 더 복잡한 권리 구조
    const complexRightTypes = [
      "전세권",
      "주택상가임차권",
      "압류",
      "가압류",
      "담보가등기",
    ];
    const selectedComplexRightType =
      complexRightTypes[Math.floor(Math.random() * complexRightTypes.length)];

    rights.push({
      id: "right-3",
      registrationDate: "2020-07-10",
      rightType: selectedComplexRightType,
      rightHolder:
        selectedComplexRightType === "전세권"
          ? "김영수"
          : selectedComplexRightType === "주택상가임차권"
          ? "이영희"
          : selectedComplexRightType === "압류" ||
            selectedComplexRightType === "가압류"
          ? "서울중앙지방법원"
          : selectedComplexRightType === "담보가등기"
          ? "하나은행"
          : "권리자",
      claimAmount: Math.floor(claimAmount * 0.2),
      priority: 3,
      isMalsoBaseRight: false,
      willBeExtinguished: false,
      willBeAssumed: false,
    });

    // 매물 유형별 특수 권리 추가
    if (propertyType === "상가") {
      rights.push({
        id: "right-4",
        registrationDate: "2022-01-20",
        rightType: "전세권",
        rightHolder: "김영수",
        claimAmount: Math.floor(claimAmount * 0.15),
        priority: 4,
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: false,
      });
    } else if (propertyType === "아파트") {
      rights.push({
        id: "right-4",
        registrationDate: "2022-01-20",
        rightType: "주택상가임차권",
        rightHolder: "이영희",
        claimAmount: Math.floor(claimAmount * 0.15),
        priority: 4,
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: false,
      });
    } else if (propertyType === "단독주택") {
      rights.push({
        id: "right-4",
        registrationDate: "2022-01-20",
        rightType: "법정지상권",
        rightHolder: "박민수",
        claimAmount: Math.floor(claimAmount * 0.15),
        priority: 4,
        isMalsoBaseRight: false,
        willBeExtinguished: false,
        willBeAssumed: false,
      });
    }
  }

  console.log(`✅ [교육용 권리 생성] 생성된 권리 개수: ${rights.length}`);
  console.log(
    `🔍 [교육용 권리 생성] 생성된 권리 유형: ${rights
      .map((r) => r.rightType)
      .join(", ")}`
  );
  return rights;
}

/**
 * 교육용 매물의 임차인을 생성합니다.
 */
function generateEducationalTenants(
  difficulty: DifficultyLevel,
  propertyType: string,
  location: string
): TenantRecord[] {
  console.log(
    `🔍 [교육용 임차인 생성] ${difficulty} - ${propertyType} - ${location}`
  );

  const tenants: TenantRecord[] = [];

  // 기본 임차인 (모든 난이도)
  tenants.push({
    id: "tenant-1",
    tenantName: "이영희",
    deposit: 50000000,
    monthlyRent: 0,
    moveInDate: "2020-03-15",
    confirmationDate: "2020-03-15",
    hasDaehangryeok: false,
    isSmallTenant: false,
    priorityPaymentAmount: 0,
    willBeAssumed: false,
  });

  // 중급 이상에서 추가 임차인
  if (difficulty === "중급" || difficulty === "고급") {
    tenants.push({
      id: "tenant-2",
      tenantName: "박민수",
      deposit: 30000000,
      monthlyRent: 0,
      moveInDate: "2021-08-20",
      confirmationDate: "2021-08-20",
      hasDaehangryeok: false,
      isSmallTenant: true,
      priorityPaymentAmount: 30000000,
      willBeAssumed: false,
    });
  }

  // 고급에서 추가 임차인
  if (difficulty === "고급") {
    tenants.push({
      id: "tenant-3",
      tenantName: "최수진",
      deposit: 80000000,
      monthlyRent: 0,
      moveInDate: "2019-12-01",
      confirmationDate: "2019-12-01",
      hasDaehangryeok: false,
      isSmallTenant: false,
      priorityPaymentAmount: 0,
      willBeAssumed: false,
    });
  }

  console.log(`✅ [교육용 임차인 생성] 생성된 임차인 개수: ${tenants.length}`);
  return tenants;
}

/**
 * 교육용 매물을 생성합니다.
 *
 * @param difficulty 난이도 (초급, 중급, 고급)
 * @param filters 필터 옵션 (선택사항)
 * @returns 권리분석이 완료된 시뮬레이션 시나리오
 */
export async function generateProperty(
  difficulty: DifficultyLevel,
  filters?: {
    propertyTypes?: string[];
    regions?: string[];
    priceRange?: { min: number; max: number };
    difficultyLevels?: string[];
    rightTypes?: string[];
  }
): Promise<SimulationScenario> {
  console.log(`🚀 [서버 액션] 교육용 매물 생성 요청 (난이도: ${difficulty})`);
  if (filters) {
    console.log(`🔍 [서버 액션] 필터 적용:`, filters);
  }

  try {
    // 매물 유형별 데이터 템플릿
    const propertyTemplates = [
      {
        propertyType: "아파트",
        locations: [
          // 서울
          { full: "서울특별시 강남구 테헤란로 123", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초대로 456", short: "서울 서초구" },
          { full: "서울특별시 송파구 올림픽로 789", short: "서울 송파구" },
          { full: "서울특별시 마포구 홍대입구역 101", short: "서울 마포구" },
          { full: "서울특별시 영등포구 여의도동 202", short: "서울 영등포구" },
          { full: "서울특별시 용산구 이태원동 303", short: "서울 용산구" },
          { full: "서울특별시 종로구 인사동 404", short: "서울 종로구" },
          { full: "서울특별시 중구 명동 505", short: "서울 중구" },
          // 경기도
          { full: "경기도 성남시 분당구 판교역로 202", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 303", short: "경기 수원시" },
          { full: "경기도 고양시 일산동구 정발산로 404", short: "경기 고양시" },
          { full: "경기도 부천시 원미구 상동 505", short: "경기 부천시" },
          { full: "경기도 안양시 동안구 시민대로 606", short: "경기 안양시" },
          { full: "경기도 안산시 단원구 광덕로 707", short: "경기 안산시" },
          // 인천
          { full: "인천광역시 연수구 송도국제대로 808", short: "인천 연수구" },
          { full: "인천광역시 남동구 구월로 909", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 101", short: "인천 서구" },
          // 부산
          {
            full: "부산광역시 해운대구 센텀중앙로 202",
            short: "부산 해운대구",
          },
          { full: "부산광역시 사상구 낙동대로 303", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 404", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 505", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 606", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 707", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 808", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 909", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 101", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 202", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 303", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 404", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 505", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 606", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 707", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 808", short: "세종시" },
          { full: "세종특별자치시 도움3로 909", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 101", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 202", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 303", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 404", short: "강원 속초시" },
          // 충청북도
          { full: "충청북도 청주시 상당구 상당로 505", short: "충북 청주시" },
          { full: "충청북도 충주시 중앙로 606", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 707", short: "충북 제천시" },
          // 충청남도
          { full: "충청남도 천안시 동남구 신부동 808", short: "충남 천안시" },
          { full: "충청남도 공주시 봉황로 909", short: "충남 공주시" },
          { full: "충청남도 아산시 신창면 순천향로 101", short: "충남 아산시" },
          // 전라북도
          { full: "전라북도 전주시 완산구 효자로 202", short: "전북 전주시" },
          { full: "전라북도 군산시 해망로 303", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 404", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 505", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 606", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 707", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 808", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 909", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 101", short: "경북 구미시" },
          // 경상남도
          { full: "경상남도 창원시 의창구 중앙대로 202", short: "경남 창원시" },
          { full: "경상남도 진주시 진주대로 303", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 404", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 505", short: "제주 제주시" },
          {
            full: "제주특별자치도 서귀포시 중앙로 606",
            short: "제주 서귀포시",
          },
        ],
        propertyDetails: [
          {
            landArea: 85.5,
            landAreaPyeong: 25.8,
            buildingArea: 84.2,
            buildingAreaPyeong: 25.5,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "15층",
          },
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "8층",
          },
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "20층",
          },
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 49.6,
            buildingAreaPyeong: 15.0,
            buildingType: "15평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "5층",
          },
          {
            landArea: 115.7,
            landAreaPyeong: 35.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "아파트",
            floor: "25층",
          },
        ],
      },
      {
        propertyType: "오피스텔",
        locations: [
          // 서울
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 용산구 이태원동 789-12", short: "서울 용산구" },
          {
            full: "서울특별시 영등포구 여의도동 101-23",
            short: "서울 영등포구",
          },
          { full: "서울특별시 마포구 홍대입구역 202-34", short: "서울 마포구" },
          { full: "서울특별시 송파구 잠실동 303-45", short: "서울 송파구" },
          // 경기도
          { full: "경기도 수원시 영통구 광교동 202-34", short: "경기 수원시" },
          { full: "경기도 성남시 분당구 정자동 303-45", short: "경기 성남시" },
          {
            full: "경기도 고양시 일산동구 정발산로 404-56",
            short: "경기 고양시",
          },
          { full: "경기도 부천시 원미구 상동 505-67", short: "경기 부천시" },
          {
            full: "경기도 안양시 동안구 시민대로 606-78",
            short: "경기 안양시",
          },
          // 인천
          {
            full: "인천광역시 연수구 송도국제대로 707-89",
            short: "인천 연수구",
          },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          {
            full: "부산광역시 해운대구 센텀중앙로 101-12",
            short: "부산 해운대구",
          },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          {
            full: "충청북도 청주시 상당구 상당로 404-43",
            short: "충북 청주시",
          },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          {
            full: "충청남도 천안시 동남구 신부동 707-76",
            short: "충남 천안시",
          },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          {
            full: "충청남도 아산시 신창면 순천향로 909-98",
            short: "충남 아산시",
          },
          // 전라북도
          {
            full: "전라북도 전주시 완산구 효자로 101-09",
            short: "전북 전주시",
          },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          {
            full: "경상남도 창원시 의창구 중앙대로 101-90",
            short: "경남 창원시",
          },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          {
            full: "제주특별자치도 서귀포시 중앙로 505-26",
            short: "제주 서귀포시",
          },
        ],
        propertyDetails: [
          {
            landArea: 33.1,
            landAreaPyeong: 10.0,
            buildingArea: 33.1,
            buildingAreaPyeong: 10.0,
            buildingType: "10평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "12층",
          },
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 49.6,
            buildingAreaPyeong: 15.0,
            buildingType: "15평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "8층",
          },
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "15층",
          },
          {
            landArea: 24.8,
            landAreaPyeong: 7.5,
            buildingArea: 24.8,
            buildingAreaPyeong: 7.5,
            buildingType: "7.5평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "6층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "오피스텔",
            floor: "18층",
          },
        ],
      },
      {
        propertyType: "상가",
        locations: [
          // 서울
          { full: "서울특별시 강남구 가로수길 123-45", short: "서울 강남구" },
          { full: "서울특별시 마포구 홍대입구역 456-78", short: "서울 마포구" },
          { full: "서울특별시 종로구 인사동 789-12", short: "서울 종로구" },
          { full: "서울특별시 송파구 잠실동 101-23", short: "서울 송파구" },
          {
            full: "서울특별시 영등포구 여의도동 202-34",
            short: "서울 영등포구",
          },
          { full: "서울특별시 용산구 이태원동 303-45", short: "서울 용산구" },
          // 경기도
          { full: "경기도 부천시 원미구 상동 202-34", short: "경기 부천시" },
          { full: "경기도 성남시 분당구 정자동 303-45", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 404-56", short: "경기 수원시" },
          {
            full: "경기도 고양시 일산동구 정발산로 505-67",
            short: "경기 고양시",
          },
          {
            full: "경기도 안양시 동안구 시민대로 606-78",
            short: "경기 안양시",
          },
          // 인천
          {
            full: "인천광역시 연수구 송도국제대로 707-89",
            short: "인천 연수구",
          },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          {
            full: "부산광역시 해운대구 센텀중앙로 101-12",
            short: "부산 해운대구",
          },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          {
            full: "충청북도 청주시 상당구 상당로 404-43",
            short: "충북 청주시",
          },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          {
            full: "충청남도 천안시 동남구 신부동 707-76",
            short: "충남 천안시",
          },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          {
            full: "충청남도 아산시 신창면 순천향로 909-98",
            short: "충남 아산시",
          },
          // 전라북도
          {
            full: "전라북도 전주시 완산구 효자로 101-09",
            short: "전북 전주시",
          },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          {
            full: "경상남도 창원시 의창구 중앙대로 101-90",
            short: "경남 창원시",
          },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          {
            full: "제주특별자치도 서귀포시 중앙로 505-26",
            short: "제주 서귀포시",
          },
        ],
        propertyDetails: [
          {
            landArea: 33.1,
            landAreaPyeong: 10.0,
            buildingArea: 33.1,
            buildingAreaPyeong: 10.0,
            buildingType: "10평형",
            structure: "철근콘크리트조",
            usage: "상가",
            floor: "1층",
          },
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 49.6,
            buildingAreaPyeong: 15.0,
            buildingType: "15평형",
            structure: "철근콘크리트조",
            usage: "상가",
            floor: "1층",
          },
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "상가",
            floor: "1층",
          },
          {
            landArea: 24.8,
            landAreaPyeong: 7.5,
            buildingArea: 24.8,
            buildingAreaPyeong: 7.5,
            buildingType: "7.5평형",
            structure: "철근콘크리트조",
            usage: "상가",
            floor: "1층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "상가",
            floor: "1층",
          },
        ],
      },
      {
        propertyType: "단독주택",
        locations: [
          // 서울
          { full: "서울특별시 강남구 도곡동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 반포동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          {
            full: "서울특별시 영등포구 여의도동 202-34",
            short: "서울 영등포구",
          },
          { full: "서울특별시 용산구 이태원동 303-45", short: "서울 용산구" },
          // 경기도
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 303-45", short: "경기 수원시" },
          {
            full: "경기도 고양시 일산동구 정발산로 404-56",
            short: "경기 고양시",
          },
          { full: "경기도 부천시 원미구 상동 505-67", short: "경기 부천시" },
          {
            full: "경기도 안양시 동안구 시민대로 606-78",
            short: "경기 안양시",
          },
          // 인천
          {
            full: "인천광역시 연수구 송도국제대로 707-89",
            short: "인천 연수구",
          },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          {
            full: "부산광역시 해운대구 센텀중앙로 101-12",
            short: "부산 해운대구",
          },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          {
            full: "충청북도 청주시 상당구 상당로 404-43",
            short: "충북 청주시",
          },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          {
            full: "충청남도 천안시 동남구 신부동 707-76",
            short: "충남 천안시",
          },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          {
            full: "충청남도 아산시 신창면 순천향로 909-98",
            short: "충남 아산시",
          },
          // 전라북도
          {
            full: "전라북도 전주시 완산구 효자로 101-09",
            short: "전북 전주시",
          },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          {
            full: "경상남도 창원시 의창구 중앙대로 101-90",
            short: "경남 창원시",
          },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          {
            full: "제주특별자치도 서귀포시 중앙로 505-26",
            short: "제주 서귀포시",
          },
        ],
        propertyDetails: [
          {
            landArea: 165.3,
            landAreaPyeong: 50.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "2층",
          },
          {
            landArea: 132.2,
            landAreaPyeong: 40.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "2층",
          },
          {
            landArea: 198.3,
            landAreaPyeong: 60.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "3층",
          },
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "2층",
          },
          {
            landArea: 231.4,
            landAreaPyeong: 70.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "단독주택",
            floor: "3층",
          },
        ],
      },
      {
        propertyType: "빌라",
        locations: [
          // 서울
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          {
            full: "서울특별시 영등포구 여의도동 202-34",
            short: "서울 영등포구",
          },
          { full: "서울특별시 용산구 이태원동 303-45", short: "서울 용산구" },
          // 경기도
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 303-45", short: "경기 수원시" },
          {
            full: "경기도 고양시 일산동구 정발산로 404-56",
            short: "경기 고양시",
          },
          { full: "경기도 부천시 원미구 상동 505-67", short: "경기 부천시" },
          {
            full: "경기도 안양시 동안구 시민대로 606-78",
            short: "경기 안양시",
          },
          // 인천
          {
            full: "인천광역시 연수구 송도국제대로 707-89",
            short: "인천 연수구",
          },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          {
            full: "부산광역시 해운대구 센텀중앙로 101-12",
            short: "부산 해운대구",
          },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          {
            full: "충청북도 청주시 상당구 상당로 404-43",
            short: "충북 청주시",
          },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          {
            full: "충청남도 천안시 동남구 신부동 707-76",
            short: "충남 천안시",
          },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          {
            full: "충청남도 아산시 신창면 순천향로 909-98",
            short: "충남 아산시",
          },
          // 전라북도
          {
            full: "전라북도 전주시 완산구 효자로 101-09",
            short: "전북 전주시",
          },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          {
            full: "경상남도 창원시 의창구 중앙대로 101-90",
            short: "경남 창원시",
          },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          {
            full: "제주특별자치도 서귀포시 중앙로 505-26",
            short: "제주 서귀포시",
          },
        ],
        propertyDetails: [
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "3층",
          },
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "2층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "4층",
          },
          {
            landArea: 33.1,
            landAreaPyeong: 10.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "2층",
          },
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "빌라",
            floor: "5층",
          },
        ],
      },
      {
        propertyType: "주택",
        locations: [
          // 서울
          { full: "서울특별시 강남구 도곡동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 반포동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "서울특별시 영등포구 여의도동 202-34", short: "서울 영등포구" },
          { full: "서울특별시 용산구 이태원동 303-45", short: "서울 용산구" },
          // 경기도
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 303-45", short: "경기 수원시" },
          { full: "경기도 고양시 일산동구 정발산로 404-56", short: "경기 고양시" },
          { full: "경기도 부천시 원미구 상동 505-67", short: "경기 부천시" },
          { full: "경기도 안양시 동안구 시민대로 606-78", short: "경기 안양시" },
          // 인천
          { full: "인천광역시 연수구 송도국제대로 707-89", short: "인천 연수구" },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          { full: "부산광역시 해운대구 센텀중앙로 101-12", short: "부산 해운대구" },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          { full: "충청북도 청주시 상당구 상당로 404-43", short: "충북 청주시" },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          { full: "충청남도 천안시 동남구 신부동 707-76", short: "충남 천안시" },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          { full: "충청남도 아산시 신창면 순천향로 909-98", short: "충남 아산시" },
          // 전라북도
          { full: "전라북도 전주시 완산구 효자로 101-09", short: "전북 전주시" },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          { full: "경상남도 창원시 의창구 중앙대로 101-90", short: "경남 창원시" },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          { full: "제주특별자치도 서귀포시 중앙로 505-26", short: "제주 서귀포시" },
        ],
        propertyDetails: [
          {
            landArea: 165.3,
            landAreaPyeong: 50.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "주택",
            floor: "2층",
          },
          {
            landArea: 132.2,
            landAreaPyeong: 40.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "주택",
            floor: "2층",
          },
          {
            landArea: 198.3,
            landAreaPyeong: 60.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "주택",
            floor: "3층",
          },
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "주택",
            floor: "2층",
          },
          {
            landArea: 231.4,
            landAreaPyeong: 70.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "주택",
            floor: "3층",
          },
        ],
      },
      {
        propertyType: "다가구주택",
        locations: [
          // 서울
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "서울특별시 영등포구 여의도동 202-34", short: "서울 영등포구" },
          { full: "서울특별시 용산구 이태원동 303-45", short: "서울 용산구" },
          // 경기도
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 303-45", short: "경기 수원시" },
          { full: "경기도 고양시 일산동구 정발산로 404-56", short: "경기 고양시" },
          { full: "경기도 부천시 원미구 상동 505-67", short: "경기 부천시" },
          { full: "경기도 안양시 동안구 시민대로 606-78", short: "경기 안양시" },
          // 인천
          { full: "인천광역시 연수구 송도국제대로 707-89", short: "인천 연수구" },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          { full: "부산광역시 해운대구 센텀중앙로 101-12", short: "부산 해운대구" },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          { full: "충청북도 청주시 상당구 상당로 404-43", short: "충북 청주시" },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          { full: "충청남도 천안시 동남구 신부동 707-76", short: "충남 천안시" },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          { full: "충청남도 아산시 신창면 순천향로 909-98", short: "충남 아산시" },
          // 전라북도
          { full: "전라북도 전주시 완산구 효자로 101-09", short: "전북 전주시" },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          { full: "경상남도 창원시 의창구 중앙대로 101-90", short: "경남 창원시" },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          { full: "제주특별자치도 서귀포시 중앙로 505-26", short: "제주 서귀포시" },
        ],
        propertyDetails: [
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "다가구주택",
            floor: "3층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "다가구주택",
            floor: "3층",
          },
          {
            landArea: 115.7,
            landAreaPyeong: 35.0,
            buildingArea: 148.8,
            buildingAreaPyeong: 45.0,
            buildingType: "45평형",
            structure: "철근콘크리트조",
            usage: "다가구주택",
            floor: "4층",
          },
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "다가구주택",
            floor: "2층",
          },
          {
            landArea: 132.2,
            landAreaPyeong: 40.0,
            buildingArea: 165.3,
            buildingAreaPyeong: 50.0,
            buildingType: "50평형",
            structure: "철근콘크리트조",
            usage: "다가구주택",
            floor: "4층",
          },
        ],
      },
      {
        propertyType: "근린주택",
        locations: [
          // 서울
          { full: "서울특별시 강남구 가로수길 123-45", short: "서울 강남구" },
          { full: "서울특별시 마포구 홍대입구역 456-78", short: "서울 마포구" },
          { full: "서울특별시 종로구 인사동 789-12", short: "서울 종로구" },
          { full: "서울특별시 송파구 잠실동 101-23", short: "서울 송파구" },
          { full: "서울특별시 영등포구 여의도동 202-34", short: "서울 영등포구" },
          { full: "서울특별시 용산구 이태원동 303-45", short: "서울 용산구" },
          // 경기도
          { full: "경기도 부천시 원미구 상동 202-34", short: "경기 부천시" },
          { full: "경기도 성남시 분당구 정자동 303-45", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 404-56", short: "경기 수원시" },
          { full: "경기도 고양시 일산동구 정발산로 505-67", short: "경기 고양시" },
          { full: "경기도 안양시 동안구 시민대로 606-78", short: "경기 안양시" },
          // 인천
          { full: "인천광역시 연수구 송도국제대로 707-89", short: "인천 연수구" },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          { full: "부산광역시 해운대구 센텀중앙로 101-12", short: "부산 해운대구" },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          { full: "충청북도 청주시 상당구 상당로 404-43", short: "충북 청주시" },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          { full: "충청남도 천안시 동남구 신부동 707-76", short: "충남 천안시" },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          { full: "충청남도 아산시 신창면 순천향로 909-98", short: "충남 아산시" },
          // 전라북도
          { full: "전라북도 전주시 완산구 효자로 101-09", short: "전북 전주시" },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          { full: "경상남도 창원시 의창구 중앙대로 101-90", short: "경남 창원시" },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          { full: "제주특별자치도 서귀포시 중앙로 505-26", short: "제주 서귀포시" },
        ],
        propertyDetails: [
          {
            landArea: 66.1,
            landAreaPyeong: 20.0,
            buildingArea: 99.2,
            buildingAreaPyeong: 30.0,
            buildingType: "30평형",
            structure: "철근콘크리트조",
            usage: "근린주택",
            floor: "2층",
          },
          {
            landArea: 49.6,
            landAreaPyeong: 15.0,
            buildingArea: 82.6,
            buildingAreaPyeong: 25.0,
            buildingType: "25평형",
            structure: "철근콘크리트조",
            usage: "근린주택",
            floor: "2층",
          },
          {
            landArea: 82.6,
            landAreaPyeong: 25.0,
            buildingArea: 115.7,
            buildingAreaPyeong: 35.0,
            buildingType: "35평형",
            structure: "철근콘크리트조",
            usage: "근린주택",
            floor: "3층",
          },
          {
            landArea: 33.1,
            landAreaPyeong: 10.0,
            buildingArea: 66.1,
            buildingAreaPyeong: 20.0,
            buildingType: "20평형",
            structure: "철근콘크리트조",
            usage: "근린주택",
            floor: "2층",
          },
          {
            landArea: 99.2,
            landAreaPyeong: 30.0,
            buildingArea: 132.2,
            buildingAreaPyeong: 40.0,
            buildingType: "40평형",
            structure: "철근콘크리트조",
            usage: "근린주택",
            floor: "3층",
          },
        ],
      },
      {
        propertyType: "도시형생활주택",
        locations: [
          // 서울
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          { full: "서울특별시 영등포구 여의도동 202-34", short: "서울 영등포구" },
          { full: "서울특별시 용산구 이태원동 303-45", short: "서울 용산구" },
          // 경기도
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 303-45", short: "경기 수원시" },
          { full: "경기도 고양시 일산동구 정발산로 404-56", short: "경기 고양시" },
          { full: "경기도 부천시 원미구 상동 505-67", short: "경기 부천시" },
          { full: "경기도 안양시 동안구 시민대로 606-78", short: "경기 안양시" },
          // 인천
          { full: "인천광역시 연수구 송도국제대로 707-89", short: "인천 연수구" },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          { full: "부산광역시 해운대구 센텀중앙로 101-12", short: "부산 해운대구" },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          { full: "충청북도 청주시 상당구 상당로 404-43", short: "충북 청주시" },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          { full: "충청남도 천안시 동남구 신부동 707-76", short: "충남 천안시" },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          { full: "충청남도 아산시 신창면 순천향로 909-98", short: "충남 아산시" },
          // 전라북도
          { full: "전라북도 전주시 완산구 효자로 101-09", short: "전북 전주시" },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          { full: "경상남도 창원시 의창구 중앙대로 101-90", short: "경남 창원시" },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          { full: "제주특별자치도 서귀포시 중앙로 505-26", short: "제주 서귀포시" },
        ],
        propertyDetails: [
          {
            landArea: 19.8,
            landAreaPyeong: 6.0,
            buildingArea: 19.8,
            buildingAreaPyeong: 6.0,
            buildingType: "6평형",
            structure: "철근콘크리트조",
            usage: "도시형생활주택",
            floor: "8층",
          },
          {
            landArea: 16.5,
            landAreaPyeong: 5.0,
            buildingArea: 16.5,
            buildingAreaPyeong: 5.0,
            buildingType: "5평형",
            structure: "철근콘크리트조",
            usage: "도시형생활주택",
            floor: "12층",
          },
          {
            landArea: 23.1,
            landAreaPyeong: 7.0,
            buildingArea: 23.1,
            buildingAreaPyeong: 7.0,
            buildingType: "7평형",
            structure: "철근콘크리트조",
            usage: "도시형생활주택",
            floor: "15층",
          },
          {
            landArea: 13.2,
            landAreaPyeong: 4.0,
            buildingArea: 13.2,
            buildingAreaPyeong: 4.0,
            buildingType: "4평형",
            structure: "철근콘크리트조",
            usage: "도시형생활주택",
            floor: "6층",
          },
          {
            landArea: 26.4,
            landAreaPyeong: 8.0,
            buildingArea: 26.4,
            buildingAreaPyeong: 8.0,
            buildingType: "8평형",
            structure: "철근콘크리트조",
            usage: "도시형생활주택",
            floor: "18층",
          },
        ],
      },
      {
        propertyType: "원룸",
        locations: [
          // 서울
          { full: "서울특별시 강남구 역삼동 123-45", short: "서울 강남구" },
          { full: "서울특별시 서초구 서초동 456-78", short: "서울 서초구" },
          { full: "서울특별시 송파구 잠실동 789-12", short: "서울 송파구" },
          { full: "서울특별시 마포구 상암동 101-23", short: "서울 마포구" },
          {
            full: "서울특별시 영등포구 여의도동 202-34",
            short: "서울 영등포구",
          },
          { full: "서울특별시 용산구 이태원동 303-45", short: "서울 용산구" },
          // 경기도
          { full: "경기도 성남시 분당구 정자동 202-34", short: "경기 성남시" },
          { full: "경기도 수원시 영통구 광교동 303-45", short: "경기 수원시" },
          {
            full: "경기도 고양시 일산동구 정발산로 404-56",
            short: "경기 고양시",
          },
          { full: "경기도 부천시 원미구 상동 505-67", short: "경기 부천시" },
          {
            full: "경기도 안양시 동안구 시민대로 606-78",
            short: "경기 안양시",
          },
          // 인천
          {
            full: "인천광역시 연수구 송도국제대로 707-89",
            short: "인천 연수구",
          },
          { full: "인천광역시 남동구 구월로 808-90", short: "인천 남동구" },
          { full: "인천광역시 서구 청라국제대로 909-01", short: "인천 서구" },
          // 부산
          {
            full: "부산광역시 해운대구 센텀중앙로 101-12",
            short: "부산 해운대구",
          },
          { full: "부산광역시 사상구 낙동대로 202-23", short: "부산 사상구" },
          { full: "부산광역시 금정구 중앙대로 303-34", short: "부산 금정구" },
          // 대구
          { full: "대구광역시 수성구 동대구로 404-45", short: "대구 수성구" },
          { full: "대구광역시 달서구 성서공단로 505-56", short: "대구 달서구" },
          { full: "대구광역시 동구 동부로 606-67", short: "대구 동구" },
          // 대전
          { full: "대전광역시 유성구 대학로 707-78", short: "대전 유성구" },
          { full: "대전광역시 서구 둔산로 808-89", short: "대전 서구" },
          { full: "대전광역시 중구 중앙로 909-90", short: "대전 중구" },
          // 광주
          { full: "광주광역시 서구 상무대로 101-01", short: "광주 서구" },
          { full: "광주광역시 북구 첨단과기로 202-12", short: "광주 북구" },
          { full: "광주광역시 남구 제봉로 303-23", short: "광주 남구" },
          // 울산
          { full: "울산광역시 남구 삼산로 404-34", short: "울산 남구" },
          { full: "울산광역시 동구 방어진순환도로 505-45", short: "울산 동구" },
          { full: "울산광역시 북구 화봉로 606-56", short: "울산 북구" },
          // 세종
          { full: "세종특별자치시 한누리대로 707-67", short: "세종시" },
          { full: "세종특별자치시 도움3로 808-78", short: "세종시" },
          // 강원도
          { full: "강원도 춘천시 중앙로 909-89", short: "강원 춘천시" },
          { full: "강원도 원주시 원일로 101-10", short: "강원 원주시" },
          { full: "강원도 강릉시 중앙로 202-21", short: "강원 강릉시" },
          { full: "강원도 속초시 중앙로 303-32", short: "강원 속초시" },
          // 충청북도
          {
            full: "충청북도 청주시 상당구 상당로 404-43",
            short: "충북 청주시",
          },
          { full: "충청북도 충주시 중앙로 505-54", short: "충북 충주시" },
          { full: "충청북도 제천시 의림대로 606-65", short: "충북 제천시" },
          // 충청남도
          {
            full: "충청남도 천안시 동남구 신부동 707-76",
            short: "충남 천안시",
          },
          { full: "충청남도 공주시 봉황로 808-87", short: "충남 공주시" },
          {
            full: "충청남도 아산시 신창면 순천향로 909-98",
            short: "충남 아산시",
          },
          // 전라북도
          {
            full: "전라북도 전주시 완산구 효자로 101-09",
            short: "전북 전주시",
          },
          { full: "전라북도 군산시 해망로 202-18", short: "전북 군산시" },
          { full: "전라북도 익산시 익산대로 303-27", short: "전북 익산시" },
          // 전라남도
          { full: "전라남도 목포시 해안로 404-36", short: "전남 목포시" },
          { full: "전라남도 여수시 중앙로 505-45", short: "전남 여수시" },
          { full: "전라남도 순천시 중앙로 606-54", short: "전남 순천시" },
          // 경상북도
          { full: "경상북도 포항시 남구 대잠동 707-63", short: "경북 포항시" },
          { full: "경상북도 경주시 원화로 808-72", short: "경북 경주시" },
          { full: "경상북도 구미시 구미대로 909-81", short: "경북 구미시" },
          // 경상남도
          {
            full: "경상남도 창원시 의창구 중앙대로 101-90",
            short: "경남 창원시",
          },
          { full: "경상남도 진주시 진주대로 202-99", short: "경남 진주시" },
          { full: "경상남도 김해시 김해대로 303-08", short: "경남 김해시" },
          // 제주도
          { full: "제주특별자치도 제주시 연동 404-17", short: "제주 제주시" },
          {
            full: "제주특별자치도 서귀포시 중앙로 505-26",
            short: "제주 서귀포시",
          },
        ],
        propertyDetails: [
          {
            landArea: 16.5,
            landAreaPyeong: 5.0,
            buildingArea: 16.5,
            buildingAreaPyeong: 5.0,
            buildingType: "5평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "8층",
          },
          {
            landArea: 19.8,
            landAreaPyeong: 6.0,
            buildingArea: 19.8,
            buildingAreaPyeong: 6.0,
            buildingType: "6평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "12층",
          },
          {
            landArea: 23.1,
            landAreaPyeong: 7.0,
            buildingArea: 23.1,
            buildingAreaPyeong: 7.0,
            buildingType: "7평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "15층",
          },
          {
            landArea: 13.2,
            landAreaPyeong: 4.0,
            buildingArea: 13.2,
            buildingAreaPyeong: 4.0,
            buildingType: "4평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "6층",
          },
          {
            landArea: 26.4,
            landAreaPyeong: 8.0,
            buildingArea: 26.4,
            buildingAreaPyeong: 8.0,
            buildingType: "8평형",
            structure: "철근콘크리트조",
            usage: "원룸",
            floor: "18층",
          },
        ],
      },
    ];

    // 필터링된 템플릿 선택
    const getFilteredTemplates = () => {
      let filteredTemplates = propertyTemplates;

      // 매물 유형 필터링
      if (filters?.propertyTypes && filters.propertyTypes.length > 0) {
        filteredTemplates = filteredTemplates.filter((template) =>
          filters.propertyTypes!.includes(template.propertyType)
        );
        console.log(
          `🏠 [필터링] 매물 유형 필터 적용: ${filters.propertyTypes.join(", ")}`
        );
      }

      return filteredTemplates;
    };

    // 난이도별 복잡한 권리 구조를 가진 더미 데이터 생성
    const generateComplexData = (difficulty: DifficultyLevel) => {
      // 필터링된 템플릿에서 랜덤하게 매물 유형 선택
      const filteredTemplates = getFilteredTemplates();
      if (filteredTemplates.length === 0) {
        console.warn(
          "⚠️ [필터링] 필터 조건에 맞는 매물이 없습니다. 기본 템플릿을 사용합니다."
        );
        const selectedTemplate =
          propertyTemplates[
            Math.floor(Math.random() * propertyTemplates.length)
          ];
      } else {
        const selectedTemplate =
          filteredTemplates[
            Math.floor(Math.random() * filteredTemplates.length)
          ];
      }

      const selectedTemplate =
        filteredTemplates.length > 0
          ? filteredTemplates[
              Math.floor(Math.random() * filteredTemplates.length)
            ]
          : propertyTemplates[
              Math.floor(Math.random() * propertyTemplates.length)
            ];
      // 지역은 항상 랜덤으로 선택 (필터 무시)
      const selectedLocation =
        selectedTemplate.locations[
          Math.floor(Math.random() * selectedTemplate.locations.length)
        ];

      console.log(`📍 [랜덤 지역] 선택된 위치: ${selectedLocation.short}`);

      // 동적으로 가격 생성
      console.log(
        `💰 [가격 생성] ${selectedTemplate.propertyType} - ${selectedLocation.short} 동적 가격 생성 시작`
      );
      const generatedPriceRanges = generateRealisticPriceRanges(
        selectedTemplate.propertyType,
        selectedLocation.short
      );

      // 가격은 항상 랜덤으로 선택 (필터 무시)
      const selectedPriceRange =
        generatedPriceRanges[
          Math.floor(Math.random() * generatedPriceRanges.length)
        ];

      console.log(
        `💰 [랜덤 가격] 선택된 가격: ${selectedPriceRange.appraisalValue.toLocaleString()}원`
      );
      const selectedPropertyDetails =
        selectedTemplate.propertyDetails[
          Math.floor(Math.random() * selectedTemplate.propertyDetails.length)
        ];

      // 가격 계산 (감정가 기준으로 최저가, 입찰시작가 계산 - 백원단위)
      const minimumBidPriceRaw = selectedPriceRange.appraisalValue * 0.8; // 감정가의 80%
      const minimumBidPrice = Math.round(minimumBidPriceRaw / 100) * 100; // 백원단위로 반올림

      const startingBidPriceRaw = selectedPriceRange.appraisalValue * 0.83; // 감정가의 83%
      const startingBidPrice = Math.round(startingBidPriceRaw / 100) * 100; // 백원단위로 반올림

      const bidDepositRaw = minimumBidPrice * 0.1; // 최저가의 10%
      const bidDeposit = Math.round(bidDepositRaw / 100) * 100; // 백원단위로 반올림

      console.log(
        `💰 [매물 가격] 최저가: ${minimumBidPrice.toLocaleString()}원, 입찰시작가: ${startingBidPrice.toLocaleString()}원, 입찰보증금: ${bidDeposit.toLocaleString()}원`
      );

      console.log(
        `🏠 [매물 생성] 선택된 매물 유형: ${selectedTemplate.propertyType}`
      );
      console.log(`📍 [매물 생성] 선택된 위치: ${selectedLocation.short}`);
      console.log(
        `💰 [매물 생성] 시장가: ${selectedPriceRange.marketValue.toLocaleString()}원`
      );
      console.log(
        `💰 [매물 생성] 감정가: ${selectedPriceRange.appraisalValue.toLocaleString()}원`
      );

      const baseData = {
        caseNumber: `2025타경${Math.floor(Math.random() * 90000) + 10000}`,
        court: "서울중앙지방법원 경매1계",
        propertyType: selectedTemplate.propertyType,
        location: selectedLocation.full,
        locationShort: selectedLocation.short,
        marketValue: selectedPriceRange.marketValue,
        appraisalValue: selectedPriceRange.appraisalValue,
        minimumBidPrice: minimumBidPrice,
        startingBidPrice: startingBidPrice,
        bidDeposit: bidDeposit,
        claimAmount: selectedPriceRange.claimAmount,
        debtor: "김철수",
        owner: "김철수",
        creditor: "국민은행",
        auctionType: "부동산임의경매",
        biddingMethod: "기일입찰",
        status: "진행",
        daysUntilBid: 15,
        propertyDetails: selectedPropertyDetails,
        schedule: {
          caseFiledDate: "2025-01-15",
          decisionDate: "2025-01-20",
          dividendDeadline: "2025-04-20",
          firstAuctionDate: "2025-09-15",
          currentAuctionDate: "2025-10-15",
        },
        biddingHistory: [
          {
            round: 1,
            auctionDate: "2025-09-15",
            minimumPrice: 1200000000,
            priceRatio: 100,
            result: "유찰",
          },
        ],
      };

      // 난이도별 권리 구조
      if (difficulty === "초급") {
        return {
          ...baseData,
          rights: generateEducationalRights(
            difficulty,
            selectedTemplate.propertyType,
            selectedPriceRange.claimAmount
          ),
          tenants: generateEducationalTenants(
            difficulty,
            selectedTemplate.propertyType,
            selectedLocation.short
          ),
        };
      } else {
        // 중급과 고급도 동일하게 처리
        return {
          ...baseData,
          rights: generateEducationalRights(
            difficulty,
            selectedTemplate.propertyType,
            selectedPriceRange.claimAmount
          ),
          tenants: generateEducationalTenants(
            difficulty,
            selectedTemplate.propertyType,
            selectedLocation.short
          ),
        };
      }
    };

    const baseData = generateComplexData(difficulty);
    const dummyData = {
      ...baseData,
      similarSales: [
        {
          saleDate: "2025-08-15",
          similarSize: "25평형",
          appraisalValue: 1200000000,
          salePrice: 1150000000,
          salePriceRatio: 95.8,
          location: "서울 강남구 테헤란로 125",
        },
      ],
      educationalContent: generateEducationalContent(
        difficulty,
        baseData.propertyType,
        baseData.locationShort,
        baseData.appraisalValue
      ),
    };

    // 1. 기본 시나리오 생성
    const scenario: SimulationScenario = {
      id: `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "educational",
      basicInfo: {
        caseNumber: dummyData.caseNumber,
        court: dummyData.court,
        propertyType: dummyData.propertyType,
        location: dummyData.location,
        locationShort: dummyData.locationShort,
        marketValue: dummyData.marketValue,
        appraisalValue: dummyData.appraisalValue,
        minimumBidPrice: dummyData.minimumBidPrice,
        startingBidPrice: dummyData.startingBidPrice,
        bidDeposit: dummyData.bidDeposit,
        claimAmount: dummyData.claimAmount,
        debtor: dummyData.debtor,
        owner: dummyData.owner,
        creditor: dummyData.creditor,
        auctionType: dummyData.auctionType,
        biddingMethod: dummyData.biddingMethod,
        status: dummyData.status,
        daysUntilBid: dummyData.daysUntilBid,
      },
      propertyDetails: dummyData.propertyDetails,
      schedule: dummyData.schedule,
      biddingHistory: dummyData.biddingHistory,
      rights: dummyData.rights,
      tenants: dummyData.tenants,
      similarSales: dummyData.similarSales,
      educationalContent: dummyData.educationalContent,
      createdAt: new Date().toISOString(),
    };

    // 2. 권리분석 엔진으로 검증
    console.log("🔍 [서버 액션] 권리분석 엔진으로 시나리오 검증 시작");
    const validation = validateScenario(scenario);
    if (!validation.isValid) {
      console.warn("⚠️ [서버 액션] 시나리오 검증 실패");
      console.warn("  검증 오류:", validation.errors);
    }

    // 3. 권리분석 실행
    console.log("🔍 [서버 액션] 권리분석 엔진 실행 시작");
    const analysisResult = analyzeRights(scenario);

    // 4. 분석 결과를 시나리오에 반영
    console.log("🔍 [서버 액션] 권리분석 결과를 시나리오에 반영");
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

    console.log("✅ [서버 액션] 교육용 매물 생성 완료");
    console.log(`  - 사건번호: ${scenario.basicInfo.caseNumber}`);
    console.log(`  - 권리 개수: ${scenario.rights.length}`);
    console.log(`  - 임차인 개수: ${scenario.tenants.length}`);
    console.log(
      `  - 말소기준권리: ${analysisResult.malsoBaseRight?.rightType || "없음"}`
    );
    console.log(`  - 인수 권리 개수: ${analysisResult.assumedRights.length}`);
    console.log(
      `  - 소멸 권리 개수: ${analysisResult.extinguishedRights.length}`
    );
    console.log(
      `  - 인수 임차인 개수: ${analysisResult.assumedTenants.length}`
    );
    console.log(
      `  - 안전 마진: ${analysisResult.safetyMargin.toLocaleString()}원`
    );

    return scenario;
  } catch (error) {
    console.error("❌ [서버 액션] 교육용 매물 생성 실패:", error);
    throw new Error("매물 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
}

/**
 * 여러 난이도의 교육용 매물을 일괄 생성합니다.
 *
 * @param difficulties 난이도 배열
 * @param filters 필터 옵션 (선택사항)
 * @returns 생성된 시나리오 배열
 */
export async function generateMultipleProperties(
  difficulties: DifficultyLevel[],
  filters?: {
    propertyTypes?: string[];
    regions?: string[];
    priceRange?: { min: number; max: number };
    difficultyLevels?: string[];
    rightTypes?: string[];
  }
): Promise<SimulationScenario[]> {
  console.log(`🚀 [서버 액션] 일괄 매물 생성 요청 (${difficulties.length}개)`);
  if (filters) {
    console.log(`🔍 [서버 액션] 필터 적용:`, filters);
  }

  try {
    const scenarios = await Promise.all(
      difficulties.map((difficulty) => generateProperty(difficulty, filters))
    );

    console.log(`✅ [서버 액션] 일괄 매물 생성 완료 (${scenarios.length}개)`);

    return scenarios;
  } catch (error) {
    console.error("❌ [서버 액션] 일괄 매물 생성 실패:", error);
    throw new Error("매물 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
}
