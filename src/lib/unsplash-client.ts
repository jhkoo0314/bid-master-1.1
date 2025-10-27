/**
 * Unsplash 이미지 검색 클라이언트
 * 한국 부동산 매물에 특화된 이미지 검색 기능
 * 매물 유형별 고유 이미지 보장
 */

// 매물 유형별 이미지 캐시 (중복 방지)
const propertyImageCache = new Map<string, Set<string>>();

/**
 * 매물 유형별 이미지 캐시를 초기화합니다.
 * 테스트나 디버깅 시 사용
 */
export function clearPropertyImageCache(propertyType?: string) {
  if (propertyType) {
    propertyImageCache.delete(propertyType);
    console.log(`🗑️ [캐시 초기화] ${propertyType} 유형 캐시 삭제됨`);
  } else {
    propertyImageCache.clear();
    console.log(`🗑️ [캐시 초기화] 모든 매물 유형 캐시 삭제됨`);
  }
}

/**
 * 상가 매물 유형의 이미지 캐시를 강제로 초기화합니다.
 * 새로운 상가 이미지 검색어 적용을 위해 사용
 */
export function clearCommercialPropertyCache() {
  propertyImageCache.delete("상가");
  console.log(
    `🏢 [캐시 초기화] 상가 매물 유형 캐시 강제 삭제됨 - 새로운 이미지 검색어 적용`
  );
}

/**
 * 단독주택 매물 유형의 이미지 캐시를 강제로 초기화합니다.
 * 새로운 모던한 단독주택 이미지 검색어 적용을 위해 사용
 */
export function clearSingleHouseCache() {
  propertyImageCache.delete("단독주택");
  console.log(
    `🏠 [캐시 초기화] 단독주택 매물 유형 캐시 강제 삭제됨 - 새로운 모던한 이미지 검색어 적용`
  );
}

/**
 * 현재 캐시 상태를 확인합니다.
 */
export function getCacheStatus() {
  const status: Record<string, number> = {};
  for (const [propertyType, usedImages] of propertyImageCache.entries()) {
    status[propertyType] = usedImages.size;
  }
  console.log(`📊 [캐시 상태] 현재 사용된 이미지 수:`, status);
  return status;
}

/**
 * 매물 유형에 따른 한국어 검색어 매핑
 */
const getPropertySearchTerms = (propertyType: string): string[] => {
  const baseTerms: Record<string, string[]> = {
    아파트: [
      "korean apartment interior",
      "korean apartment living room",
      "korean apartment kitchen",
      "korean apartment bedroom",
      "modern korean apartment",
      "korean apartment building exterior",
      "korean apartment complex",
      "korean apartment hallway",
      "korean apartment bathroom",
      "korean apartment balcony",
    ],
    오피스텔: [
      "modern city skyline glass skyscrapers",
      "contemporary urban skyline buildings",
      "modern glass skyscrapers cityscape",
      "urban skyline modern buildings",
      "city skyline glass towers",
      "modern urban architecture skyline",
      "contemporary city skyline",
      "glass skyscrapers urban landscape",
      "modern cityscape buildings",
      "urban skyline contemporary buildings",
    ],
    상가: [
      "korean commercial building exterior",
      "korean shopping street exterior",
      "korean retail building facade",
      "korean commercial district street view",
      "korean shopping center exterior",
      "korean commercial plaza building",
      "korean retail complex exterior",
      "korean commercial street building",
      "korean shopping mall exterior",
      "korean commercial building front",
    ],
    단독주택: [
      "modern contemporary house exterior",
      "modern house architecture",
      "contemporary house design",
      "modern house balcony",
      "modern house front",
      "modern house facade",
      "contemporary house exterior",
      "modern house structure",
      "modern house design",
      "contemporary house architecture",
    ],
    빌라: [
      "korean villa exterior",
      "korean villa building",
      "korean villa interior",
      "korean villa living room",
      "korean villa kitchen",
      "korean villa bedroom",
      "korean villa bathroom",
      "korean villa hallway",
      "korean villa entrance",
      "korean villa complex",
    ],
    원룸: [
      "korean studio apartment",
      "korean one room interior",
      "korean studio living space",
      "korean one room kitchen",
      "korean studio bedroom",
      "korean one room bathroom",
      "korean studio apartment building",
      "korean one room exterior",
      "korean studio apartment hallway",
      "korean one room entrance",
    ],
  };

  return (
    baseTerms[propertyType] || [
      "korean property",
      "korean real estate",
      "korean building",
      "korean house",
      "korean apartment",
    ]
  );
};

/**
 * 지역에 따른 추가 검색어 생성
 */
const getRegionalSearchTerms = (location: string): string[] => {
  const regionalTerms: Record<string, string[]> = {
    서울: ["seoul", "korean capital", "seoul city"],
    강남: ["gangnam", "seoul gangnam", "korean business district"],
    서초: ["seocho", "seoul seocho"],
    송파: ["songpa", "seoul songpa"],
    마포: ["mapo", "seoul mapo"],
    영등포: ["yeongdeungpo", "seoul yeongdeungpo"],
    용산: ["yongsan", "seoul yongsan"],
    종로: ["jongno", "seoul jongno"],
    중구: ["jung", "seoul jung"],
    경기: ["gyeonggi", "korean province"],
    성남: ["seongnam", "gyeonggi seongnam"],
    분당: ["bundang", "seongnam bundang"],
    수원: ["suwon", "gyeonggi suwon"],
    고양: ["goyang", "gyeonggi goyang"],
    부천: ["bucheon", "gyeonggi bucheon"],
    안양: ["anyang", "gyeonggi anyang"],
    안산: ["ansan", "gyeonggi ansan"],
    인천: ["incheon", "korean port city"],
    부산: ["busan", "korean port city"],
    대구: ["daegu", "korean city"],
    대전: ["daejeon", "korean city"],
    광주: ["gwangju", "korean city"],
    울산: ["ulsan", "korean industrial city"],
    세종: ["sejong", "korean administrative city"],
    강원: ["gangwon", "korean province"],
    춘천: ["chuncheon", "gangwon chuncheon"],
    원주: ["wonju", "gangwon wonju"],
    강릉: ["gangneung", "gangwon gangneung"],
    속초: ["sokcho", "gangwon sokcho"],
    충청: ["chungcheong", "korean province"],
    청주: ["cheongju", "chungcheong cheongju"],
    충주: ["chungju", "chungcheong chungju"],
    제천: ["jecheon", "chungcheong jecheon"],
    천안: ["cheonan", "chungcheong cheonan"],
    공주: ["gongju", "chungcheong gongju"],
    아산: ["asan", "chungcheong asan"],
    전라: ["jeolla", "korean province"],
    전주: ["jeonju", "jeolla jeonju"],
    군산: ["gunsan", "jeolla gunsan"],
    익산: ["iksan", "jeolla iksan"],
    목포: ["mokpo", "jeolla mokpo"],
    여수: ["yeosu", "jeolla yeosu"],
    순천: ["suncheon", "jeolla suncheon"],
    경상: ["gyeongsang", "korean province"],
    포항: ["pohang", "gyeongsang pohang"],
    경주: ["gyeongju", "gyeongsang gyeongju"],
    구미: ["gumi", "gyeongsang gumi"],
    창원: ["changwon", "gyeongsang changwon"],
    진주: ["jinju", "gyeongsang jinju"],
    김해: ["gimhae", "gyeongsang gimhae"],
    제주: ["jeju", "korean island"],
    서귀포: ["seogwipo", "jeju seogwipo"],
  };

  // 지역명에서 키워드 추출
  for (const [key, terms] of Object.entries(regionalTerms)) {
    if (location.includes(key)) {
      return terms;
    }
  }

  return ["korean", "korea"];
};

/**
 * 가격대에 따른 검색어 조정
 */
const getPriceBasedSearchTerms = (marketValue: number): string[] => {
  if (marketValue >= 2000000000) {
    // 20억 이상
    return ["luxury", "premium", "high-end", "expensive"];
  } else if (marketValue >= 1000000000) {
    // 10억 이상
    return ["modern", "contemporary", "upscale", "quality"];
  } else if (marketValue >= 500000000) {
    // 5억 이상
    return ["standard", "middle-class", "comfortable", "decent"];
  } else {
    // 5억 미만
    return ["affordable", "budget", "simple", "basic"];
  }
};

/**
 * 매물 유형별 고유 이미지를 검색합니다.
 * 중복 방지를 위해 캐시를 사용합니다.
 *
 * @param propertyType 매물 유형 (아파트, 오피스텔, 상가, 단독주택, 빌라, 원룸)
 * @param location 지역명
 * @param marketValue 시장가
 * @returns 고유한 이미지 URL 또는 null
 */
export async function searchUniquePropertyImage(
  propertyType: string,
  location: string,
  marketValue: number
): Promise<string | null> {
  console.log(`🖼️ [고유 이미지 검색] 매물 이미지 검색 시작`);
  console.log(`  - 매물 유형: ${propertyType}`);
  console.log(`  - 지역: ${location}`);
  console.log(`  - 시장가: ${marketValue.toLocaleString()}원`);

  try {
    // 매물 유형별 캐시 초기화
    if (!propertyImageCache.has(propertyType)) {
      propertyImageCache.set(propertyType, new Set<string>());
    }

    const usedImages = propertyImageCache.get(propertyType)!;
    console.log(
      `📊 [고유 이미지 검색] 현재 사용된 이미지 수: ${usedImages.size}`
    );

    // 검색어 생성
    const propertyTerms = getPropertySearchTerms(propertyType);
    const regionalTerms = getRegionalSearchTerms(location);
    const priceTerms = getPriceBasedSearchTerms(marketValue);

    // 검색어 조합 (최대 3개까지)
    const searchTerms = [
      ...propertyTerms.slice(0, 2),
      ...regionalTerms.slice(0, 1),
      ...priceTerms.slice(0, 1),
    ].slice(0, 3);

    const searchQuery = searchTerms.join(" ");

    console.log(`🔍 [고유 이미지 검색] 검색어: ${searchQuery}`);

    // Unsplash API 호출 (실제 구현에서는 환경변수에서 API 키를 가져와야 함)
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!unsplashAccessKey) {
      console.warn(
        "⚠️ [고유 이미지 검색] Unsplash API 키가 설정되지 않았습니다."
      );
      return getDefaultPropertyImage(propertyType);
    }

    // 여러 페이지에서 고유한 이미지 검색 (최대 5페이지)
    for (let page = 1; page <= 5; page++) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          searchQuery
        )}&per_page=10&orientation=landscape&page=${page}`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(
          `⚠️ [고유 이미지 검색] Unsplash API 호출 실패: ${response.status}`
        );
        continue;
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // 사용되지 않은 이미지 찾기
        for (const photo of data.results) {
          const imageUrl = photo.urls.regular;
          if (!usedImages.has(imageUrl)) {
            // 새로운 고유 이미지 발견
            usedImages.add(imageUrl);
            console.log(`✅ [고유 이미지 검색] 고유 이미지 발견: ${imageUrl}`);
            console.log(
              `📊 [고유 이미지 검색] ${propertyType} 유형 총 사용 이미지: ${usedImages.size}개`
            );
            return imageUrl;
          }
        }
      }
    }

    // 고유한 이미지를 찾지 못한 경우 기본 이미지 반환
    console.log(
      `⚠️ [고유 이미지 검색] 고유 이미지를 찾지 못했습니다. 기본 이미지 사용`
    );
    return getDefaultPropertyImage(propertyType);
  } catch (error) {
    console.error("❌ [고유 이미지 검색] 이미지 검색 중 오류 발생:", error);
    return getDefaultPropertyImage(propertyType);
  }
}

/**
 * 매물 이미지를 검색합니다. (기존 함수 - 호환성 유지)
 *
 * @param propertyType 매물 유형 (아파트, 오피스텔, 상가, 단독주택, 빌라, 원룸)
 * @param location 지역명
 * @param marketValue 시장가
 * @returns 이미지 URL 또는 null
 */
export async function searchPropertyImage(
  propertyType: string,
  location: string,
  marketValue: number
): Promise<string | null> {
  console.log(`🖼️ [이미지 검색] 매물 이미지 검색 시작`);
  console.log(`  - 매물 유형: ${propertyType}`);
  console.log(`  - 지역: ${location}`);
  console.log(`  - 시장가: ${marketValue.toLocaleString()}원`);

  try {
    // 검색어 생성
    const propertyTerms = getPropertySearchTerms(propertyType);
    const regionalTerms = getRegionalSearchTerms(location);
    const priceTerms = getPriceBasedSearchTerms(marketValue);

    // 검색어 조합 (최대 3개까지)
    const searchTerms = [
      ...propertyTerms.slice(0, 2),
      ...regionalTerms.slice(0, 1),
      ...priceTerms.slice(0, 1),
    ].slice(0, 3);

    const searchQuery = searchTerms.join(" ");

    console.log(`🔍 [이미지 검색] 검색어: ${searchQuery}`);

    // Unsplash API 호출 (실제 구현에서는 환경변수에서 API 키를 가져와야 함)
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!unsplashAccessKey) {
      console.warn("⚠️ [이미지 검색] Unsplash API 키가 설정되지 않았습니다.");
      return null;
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchQuery
      )}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(
        `⚠️ [이미지 검색] Unsplash API 호출 실패: ${response.status}`
      );
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular;
      console.log(`✅ [이미지 검색] 이미지 검색 성공: ${imageUrl}`);
      return imageUrl;
    } else {
      console.log("⚠️ [이미지 검색] 검색 결과가 없습니다.");
      return null;
    }
  } catch (error) {
    console.error("❌ [이미지 검색] 이미지 검색 중 오류 발생:", error);
    return null;
  }
}

/**
 * 매물 유형별 기본 이미지 URL을 반환합니다.
 * Unsplash API가 실패할 경우 사용할 기본 이미지들
 */
export function getDefaultPropertyImage(propertyType: string): string {
  console.log(`🖼️ [기본 이미지] ${propertyType} 유형 기본 이미지 반환`);

  const defaultImages: Record<string, string> = {
    아파트:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    오피스텔:
      "https://images.unsplash.com/photo-1722299547563-03e2d21fe289?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4MTU3OTV8MHwxfHNlYXJjaHw4fHxnbGFzcyUyMHNreXNjcmFwZXIlMjBtb2Rlcm58ZW58MHwwfHx8MTc2MTU3MjkzNXww&ixlib=rb-4.1.0&q=85",
    상가: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    단독주택:
      "https://images.unsplash.com/photo-1686164748506-4311ba437c24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MTU3OTV8MHwxfHNlYXJjaHw3fHxtb2Rlcm4lMjBjb250ZW1wb3JhcnklMjBob3VzZSUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDF8MHx8fDE3NjE1NzMzODl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    빌라: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    원룸: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  };

  const selectedImage = defaultImages[propertyType] || defaultImages.아파트;

  if (propertyType === "오피스텔") {
    console.log(
      `🏢 [오피스텔 이미지] 도시 스카이라인 스타일의 모던한 빌딩 이미지로 교체 완료`
    );
    console.log(`🖼️ [오피스텔 이미지] 새로운 이미지 URL: ${selectedImage}`);
  }

  if (propertyType === "단독주택") {
    console.log(
      `🏠 [단독주택 이미지] 발코니가 있는 2층 모던 주택 이미지로 교체 완료`
    );
    console.log(
      `🖼️ [단독주택 이미지] 새로운 모던한 이미지 URL: ${selectedImage}`
    );
  }

  return selectedImage;
}
