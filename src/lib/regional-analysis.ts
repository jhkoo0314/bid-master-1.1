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
  console.log(`🏛️ [지역분석] 법원 정보 생성: ${location}`);

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

  // 인천 지역
  if (location.includes("인천")) {
    const district = extractDistrict(location);
    return {
      name: `인천지방법원 ${district}지원`,
      code: "032-123-4567",
      address: `인천광역시 ${district} 법원로 303`,
      phone: "032-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: `${district}구`,
    };
  }

  // 광주 지역
  if (location.includes("광주")) {
    const district = extractDistrict(location);
    return {
      name: `광주지방법원 ${district}지원`,
      code: "062-123-4567",
      address: `광주광역시 ${district} 법원로 404`,
      phone: "062-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: `${district}구`,
    };
  }

  // 대전 지역
  if (location.includes("대전")) {
    const district = extractDistrict(location);
    return {
      name: `대전지방법원 ${district}지원`,
      code: "042-123-4567",
      address: `대전광역시 ${district} 법원로 505`,
      phone: "042-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: `${district}구`,
    };
  }

  // 울산 지역
  if (location.includes("울산")) {
    const district = extractDistrict(location);
    return {
      name: `울산지방법원 ${district}지원`,
      code: "052-123-4567",
      address: `울산광역시 ${district} 법원로 606`,
      phone: "052-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: `${district}구`,
    };
  }

  // 경상북도 지역
  if (location.includes("경북") || location.includes("대구")) {
    const city = extractCity(location);
    return {
      name: `대구지방법원 ${city}지원`,
      code: "053-123-4567",
      address: `경상북도 ${city} 법원로 707`,
      phone: "053-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: city,
    };
  }

  // 전라남도 지역
  if (location.includes("전남") || location.includes("광주")) {
    const city = extractCity(location);
    return {
      name: `광주지방법원 ${city}지원`,
      code: "062-123-4567",
      address: `전라남도 ${city} 법원로 808`,
      phone: "062-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: city,
    };
  }

  // 전라북도 지역
  if (location.includes("전북") || location.includes("전주")) {
    const city = extractCity(location);
    return {
      name: `전주지방법원 ${city}지원`,
      code: "063-123-4567",
      address: `전라북도 ${city} 법원로 909`,
      phone: "063-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: city,
    };
  }

  // 충청남도 지역
  if (
    location.includes("충남") ||
    location.includes("천안") ||
    location.includes("아산")
  ) {
    const city = extractCity(location);
    return {
      name: `대전지방법원 ${city}지원`,
      code: "041-123-4567",
      address: `충청남도 ${city} 법원로 1010`,
      phone: "041-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: city,
    };
  }

  // 충청북도 지역
  if (location.includes("충북") || location.includes("청주")) {
    const city = extractCity(location);
    return {
      name: `청주지방법원 ${city}지원`,
      code: "043-123-4567",
      address: `충청북도 ${city} 법원로 1111`,
      phone: "043-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: city,
    };
  }

  // 강원도 지역
  if (
    location.includes("강원") ||
    location.includes("춘천") ||
    location.includes("원주")
  ) {
    const city = extractCity(location);
    return {
      name: `춘천지방법원 ${city}지원`,
      code: "033-123-4567",
      address: `강원도 ${city} 법원로 1212`,
      phone: "033-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: city,
    };
  }

  // 제주도 지역
  if (location.includes("제주")) {
    return {
      name: "제주지방법원",
      code: "064-123-4567",
      address: "제주특별자치도 제주시 법원로 1313",
      phone: "064-123-4567",
      biddingStartTime: "10:00",
      biddingEndTime: "11:20",
      openingTime: "11:20",
      jurisdiction: "제주특별자치도",
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
  console.log(`📋 [지역분석] 등기소 정보 생성: ${location}`);

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

  // 부산 지역
  if (location.includes("부산")) {
    const district = extractDistrict(location);
    return {
      name: `부산지방법원 ${district}등기소`,
      phone: "1544-0773",
      fax: "(051)123-2000",
      address: `부산광역시 ${district} 등기소로 101`,
    };
  }

  // 대구 지역
  if (location.includes("대구")) {
    const district = extractDistrict(location);
    return {
      name: `대구지방법원 ${district}등기소`,
      phone: "1544-0773",
      fax: "(053)123-2000",
      address: `대구광역시 ${district} 등기소로 202`,
    };
  }

  // 인천 지역
  if (location.includes("인천")) {
    const district = extractDistrict(location);
    return {
      name: `인천지방법원 ${district}등기소`,
      phone: "1544-0773",
      fax: "(032)123-2000",
      address: `인천광역시 ${district} 등기소로 303`,
    };
  }

  // 광주 지역
  if (location.includes("광주")) {
    const district = extractDistrict(location);
    return {
      name: `광주지방법원 ${district}등기소`,
      phone: "1544-0773",
      fax: "(062)123-2000",
      address: `광주광역시 ${district} 등기소로 404`,
    };
  }

  // 대전 지역
  if (location.includes("대전")) {
    const district = extractDistrict(location);
    return {
      name: `대전지방법원 ${district}등기소`,
      phone: "1544-0773",
      fax: "(042)123-2000",
      address: `대전광역시 ${district} 등기소로 505`,
    };
  }

  // 울산 지역
  if (location.includes("울산")) {
    const district = extractDistrict(location);
    return {
      name: `울산지방법원 ${district}등기소`,
      phone: "1544-0773",
      fax: "(052)123-2000",
      address: `울산광역시 ${district} 등기소로 606`,
    };
  }

  // 경상북도 지역
  if (location.includes("경북")) {
    const city = extractCity(location);
    return {
      name: `대구지방법원 ${city}등기소`,
      phone: "1544-0773",
      fax: "(053)123-2000",
      address: `경상북도 ${city} 등기소로 707`,
    };
  }

  // 전라남도 지역
  if (location.includes("전남")) {
    const city = extractCity(location);
    return {
      name: `광주지방법원 ${city}등기소`,
      phone: "1544-0773",
      fax: "(062)123-2000",
      address: `전라남도 ${city} 등기소로 808`,
    };
  }

  // 전라북도 지역
  if (location.includes("전북") || location.includes("전주")) {
    const city = extractCity(location);
    return {
      name: `전주지방법원 ${city}등기소`,
      phone: "1544-0773",
      fax: "(063)123-2000",
      address: `전라북도 ${city} 등기소로 909`,
    };
  }

  // 충청남도 지역
  if (
    location.includes("충남") ||
    location.includes("천안") ||
    location.includes("아산")
  ) {
    const city = extractCity(location);
    return {
      name: `대전지방법원 ${city}등기소`,
      phone: "1544-0773",
      fax: "(041)123-2000",
      address: `충청남도 ${city} 등기소로 1010`,
    };
  }

  // 충청북도 지역
  if (location.includes("충북") || location.includes("청주")) {
    const city = extractCity(location);
    return {
      name: `청주지방법원 ${city}등기소`,
      phone: "1544-0773",
      fax: "(043)123-2000",
      address: `충청북도 ${city} 등기소로 1111`,
    };
  }

  // 강원도 지역
  if (
    location.includes("강원") ||
    location.includes("춘천") ||
    location.includes("원주")
  ) {
    const city = extractCity(location);
    return {
      name: `춘천지방법원 ${city}등기소`,
      phone: "1544-0773",
      fax: "(033)123-2000",
      address: `강원도 ${city} 등기소로 1212`,
    };
  }

  // 제주도 지역
  if (location.includes("제주")) {
    return {
      name: "제주지방법원 등기소",
      phone: "1544-0773",
      fax: "(064)123-2000",
      address: "제주특별자치도 제주시 등기소로 1313",
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
  console.log(`🏢 [지역분석] 세무서 정보 생성: ${location}`);

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

  // 대구 지역
  if (location.includes("대구")) {
    const district = extractDistrict(location);
    return {
      name: `대구${district}세무서`,
      phone: "053-123-4567",
      fax: "053-123-4568",
      address: `대구광역시 ${district} 세무서로 202`,
    };
  }

  // 인천 지역
  if (location.includes("인천")) {
    const district = extractDistrict(location);
    return {
      name: `인천${district}세무서`,
      phone: "032-123-4567",
      fax: "032-123-4568",
      address: `인천광역시 ${district} 세무서로 303`,
    };
  }

  // 광주 지역
  if (location.includes("광주")) {
    const district = extractDistrict(location);
    return {
      name: `광주${district}세무서`,
      phone: "062-123-4567",
      fax: "062-123-4568",
      address: `광주광역시 ${district} 세무서로 404`,
    };
  }

  // 대전 지역
  if (location.includes("대전")) {
    const district = extractDistrict(location);
    return {
      name: `대전${district}세무서`,
      phone: "042-123-4567",
      fax: "042-123-4568",
      address: `대전광역시 ${district} 세무서로 505`,
    };
  }

  // 울산 지역
  if (location.includes("울산")) {
    const district = extractDistrict(location);
    return {
      name: `울산${district}세무서`,
      phone: "052-123-4567",
      fax: "052-123-4568",
      address: `울산광역시 ${district} 세무서로 606`,
    };
  }

  // 경상북도 지역
  if (location.includes("경북")) {
    const city = extractCity(location);
    return {
      name: `${city}세무서`,
      phone: "053-123-4567",
      fax: "053-123-4568",
      address: `경상북도 ${city} 세무서로 707`,
    };
  }

  // 전라남도 지역
  if (location.includes("전남")) {
    const city = extractCity(location);
    return {
      name: `${city}세무서`,
      phone: "062-123-4567",
      fax: "062-123-4568",
      address: `전라남도 ${city} 세무서로 808`,
    };
  }

  // 전라북도 지역
  if (location.includes("전북") || location.includes("전주")) {
    const city = extractCity(location);
    return {
      name: `${city}세무서`,
      phone: "063-123-4567",
      fax: "063-123-4568",
      address: `전라북도 ${city} 세무서로 909`,
    };
  }

  // 충청남도 지역
  if (
    location.includes("충남") ||
    location.includes("천안") ||
    location.includes("아산")
  ) {
    const city = extractCity(location);
    return {
      name: `${city}세무서`,
      phone: "041-123-4567",
      fax: "041-123-4568",
      address: `충청남도 ${city} 세무서로 1010`,
    };
  }

  // 충청북도 지역
  if (location.includes("충북") || location.includes("청주")) {
    const city = extractCity(location);
    return {
      name: `${city}세무서`,
      phone: "043-123-4567",
      fax: "043-123-4568",
      address: `충청북도 ${city} 세무서로 1111`,
    };
  }

  // 강원도 지역
  if (
    location.includes("강원") ||
    location.includes("춘천") ||
    location.includes("원주")
  ) {
    const city = extractCity(location);
    return {
      name: `${city}세무서`,
      phone: "033-123-4567",
      fax: "033-123-4568",
      address: `강원도 ${city} 세무서로 1212`,
    };
  }

  // 제주도 지역
  if (location.includes("제주")) {
    return {
      name: "제주세무서",
      phone: "064-123-4567",
      fax: "064-123-4568",
      address: "제주특별자치도 제주시 세무서로 1313",
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
