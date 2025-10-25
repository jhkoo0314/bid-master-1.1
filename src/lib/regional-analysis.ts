/**
 * Bid Master AI - 지역분석 생성 유틸리티
 * 매물 위치에 따른 관할 법원, 등기소, 세무서 정보를 동적으로 생성
 */

import { RegionalAnalysis } from "@/types/simulation";

/**
 * 매물 위치에 따른 지역분석 정보를 생성합니다.
 */
export function generateRegionalAnalysis(location: string): RegionalAnalysis {
  console.log(`🗺️ [지역분석] 위치 기반 분석 생성: ${location}`);

  // 위치별 관할 법원 매핑
  const courtMapping = getCourtByLocation(location);
  const registryMapping = getRegistryByLocation(location);
  const taxOfficeMapping = getTaxOfficeByLocation(location);

  return {
    court: courtMapping,
    registry: registryMapping,
    taxOffice: taxOfficeMapping,
    externalLinks: getExternalLinks(location),
  };
}

/**
 * 위치에 따른 관할 법원 정보를 반환합니다.
 */
function getCourtByLocation(location: string) {
  // 서울 지역
  if (location.includes("서울")) {
    const district = extractDistrict(location);
    return {
      name: `서울지방법원 ${district}지원`,
      code: getCourtCode(district),
      address: `서울특별시 ${district}구 법원로 123`,
      phone: "02-3480-1000",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: `${district}구`,
    };
  }

  // 경기도 지역
  if (location.includes("경기")) {
    const city = extractCity(location);
    return {
      name: `수원지방법원 ${city}지원`,
      code: "031-123-4567",
      address: `경기도 ${city} 법원로 456`,
      phone: "031-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: city,
    };
  }

  // 경상남도 지역
  if (
    location.includes("경남") ||
    location.includes("창원") ||
    location.includes("밀양") ||
    location.includes("창녕")
  ) {
    const city = extractCity(location);
    return {
      name: `창원지방법원 ${city}지원`,
      code: "504-24",
      address: `경상남도 ${city} 법원로 789`,
      phone: "055-350-2500",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: city,
    };
  }

  // 부산 지역
  if (location.includes("부산")) {
    const district = extractDistrict(location);
    return {
      name: `부산지방법원 ${district}지원`,
      code: "051-123-4567",
      address: `부산광역시 ${district} 법원로 101`,
      phone: "051-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: `${district}구`,
    };
  }

  // 대구 지역
  if (location.includes("대구")) {
    const district = extractDistrict(location);
    return {
      name: `대구지방법원 ${district}지원`,
      code: "053-123-4567",
      address: `대구광역시 ${district} 법원로 202`,
      phone: "053-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: `${district}구`,
    };
  }

  // 기본값 (서울)
  return {
    name: "서울지방법원",
    code: "02-123-4567",
    address: "서울특별시 중구 세종대로 187",
    phone: "02-3480-1000",
    biddingStartTime: "10:00",
    biddingEndTime: "11:20",
    openingTime: "11:20",
    jurisdiction: "서울특별시",
  };
}

/**
 * 위치에 따른 등기소 정보를 반환합니다.
 */
function getRegistryByLocation(location: string) {
  // 서울 지역
  if (location.includes("서울")) {
    const district = extractDistrict(location);
    return {
      name: `서울지방법원 ${district}등기소`,
      phone: "1544-0773",
      fax: "(02)3480-2000",
      address: `서울특별시 ${district}구 등기소로 123`,
    };
  }

  // 경기도 지역
  if (location.includes("경기")) {
    const city = extractCity(location);
    return {
      name: `수원지방법원 ${city}등기소`,
      phone: "1544-0773",
      fax: "(031)123-2000",
      address: `경기도 ${city} 등기소로 456`,
    };
  }

  // 경상남도 지역
  if (
    location.includes("경남") ||
    location.includes("창원") ||
    location.includes("밀양") ||
    location.includes("창녕")
  ) {
    return {
      name: "창원지방법원 본원 창녕등기소",
      phone: "1544-0773",
      fax: "(055)533-0511",
      address: "경남 창녕군 창녕읍 남창녕로 26 (말흘리 318-1)",
    };
  }

  // 기본값
  return {
    name: "서울지방법원 등기소",
    phone: "1544-0773",
    fax: "(02)3480-2000",
    address: "서울특별시 중구 등기소로 123",
  };
}

/**
 * 위치에 따른 세무서 정보를 반환합니다.
 */
function getTaxOfficeByLocation(location: string) {
  // 서울 지역
  if (location.includes("서울")) {
    const district = extractDistrict(location);
    return {
      name: `${district}세무서`,
      phone: "02-123-4567",
      fax: "02-123-4568",
      address: `서울특별시 ${district}구 세무서로 123`,
    };
  }

  // 경기도 지역
  if (location.includes("경기")) {
    const city = extractCity(location);
    return {
      name: `${city}세무서`,
      phone: "031-123-4567",
      fax: "031-123-4568",
      address: `경기도 ${city} 세무서로 456`,
    };
  }

  // 경상남도 지역
  if (
    location.includes("경남") ||
    location.includes("창원") ||
    location.includes("밀양") ||
    location.includes("창녕")
  ) {
    return {
      name: "마산세무서",
      phone: "055-240-02",
      fax: "055-223-6881",
      address: "경상남도 창원시 마산합포구 해안대로 51 유로스퀘어 3층",
    };
  }

  // 부산 지역
  if (location.includes("부산")) {
    return {
      name: "부산세무서",
      phone: "051-123-4567",
      fax: "051-123-4568",
      address: "부산광역시 중구 세무서로 101",
    };
  }

  // 기본값
  return {
    name: "서울세무서",
    phone: "02-123-4567",
    fax: "02-123-4568",
    address: "서울특별시 중구 세무서로 123",
  };
}

/**
 * 외부 링크 목록을 반환합니다.
 */
function getExternalLinks(location: string) {
  const baseLinks = [
    { name: "네이버부동산", url: "https://land.naver.com" },
    { name: "카카오맵", url: "https://map.kakao.com" },
    { name: "로드뷰", url: "https://map.kakao.com" },
    { name: "위성지도", url: "https://map.naver.com" },
    { name: "지적도", url: "https://map.ngii.go.kr" },
    { name: "네이버지도", url: "https://map.naver.com" },
    { name: "씨:리얼지도", url: "https://map.cjrealty.com" },
    { name: "도시계획지도", url: "https://map.ngii.go.kr" },
  ];

  // 위치별 특화 링크 추가
  if (location.includes("서울")) {
    baseLinks.push(
      { name: "서울시 도시계획", url: "https://urban.seoul.go.kr" },
      { name: "서울시 부동산정보", url: "https://realestate.seoul.go.kr" }
    );
  }

  if (location.includes("경기")) {
    baseLinks.push(
      { name: "경기도 도시계획", url: "https://urban.gg.go.kr" },
      { name: "경기도 부동산정보", url: "https://realestate.gg.go.kr" }
    );
  }

  return baseLinks;
}

/**
 * 주소에서 구/군 정보를 추출합니다.
 */
function extractDistrict(location: string): string {
  const districtMatch = location.match(/(\w+구|\w+군)/);
  return districtMatch ? districtMatch[1] : "중구";
}

/**
 * 주소에서 시/군 정보를 추출합니다.
 */
function extractCity(location: string): string {
  const cityMatch = location.match(/(\w+시|\w+군)/);
  return cityMatch ? cityMatch[1] : "수원시";
}

/**
 * 구/군에 따른 법원 코드를 반환합니다.
 */
function getCourtCode(district: string): string {
  const codeMap: { [key: string]: string } = {
    강남구: "02-123-4567",
    서초구: "02-123-4568",
    송파구: "02-123-4569",
    마포구: "02-123-4570",
    중구: "02-123-4571",
  };
  return codeMap[district] || "02-123-4567";
}
