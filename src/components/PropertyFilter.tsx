/**
 * Bid Master AI - 매물 필터 컴포넌트
 * 사용자가 원하는 조건으로 매물을 필터링할 수 있는 UI
 */

"use client";

import { useState } from "react";

export interface PropertyFilterOptions {
  propertyType: string;
  region: string;
  priceRange: {
    min: number;
    max: number;
  };
  difficultyLevel: string;
  rightTypes: string[];
  propertyCategory: string; // 새로운 매물유형 필터
}

interface PropertyFilterProps {
  onFilterChange: (filters: PropertyFilterOptions) => void;
  onApplyFilter: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function PropertyFilter({
  onFilterChange,
  onApplyFilter,
  onRefresh,
  isLoading = false,
}: PropertyFilterProps) {
  const [isRightTypesExpanded, setIsRightTypesExpanded] = useState(false);
  const [isPropertyTypeExpanded, setIsPropertyTypeExpanded] = useState(false);
  const [isDifficultyExpanded, setIsDifficultyExpanded] = useState(false);
  const [isPropertyCategoryExpanded, setIsPropertyCategoryExpanded] =
    useState(false);

  // 필터 상태
  const [filters, setFilters] = useState<PropertyFilterOptions>({
    propertyType: "",
    region: "",
    priceRange: { min: 0, max: 5000000000 },
    difficultyLevel: "",
    rightTypes: [],
    propertyCategory: "",
  });

  // 필터 옵션들 (사용하지 않음, propertyCategory에 따라 동적으로 표시)
  const propertyTypeOptions: never[] = [];

  const regionOptions = [
    { value: "서울", label: "서울특별시" },
    { value: "경기", label: "경기도" },
    { value: "인천", label: "인천광역시" },
    { value: "부산", label: "부산광역시" },
    { value: "대구", label: "대구광역시" },
    { value: "광주", label: "광주광역시" },
    { value: "대전", label: "대전광역시" },
    { value: "울산", label: "울산광역시" },
    { value: "세종", label: "세종특별자치시" },
  ];

  const difficultyOptions = [
    { value: "초급", label: "초급" },
    { value: "중급", label: "중급" },
    { value: "고급", label: "고급" },
  ];

  const rightTypeOptions = [
    { value: "근저당권", label: "근저당권" },
    { value: "저당권", label: "저당권" },
    { value: "압류", label: "압류" },
    { value: "가압류", label: "가압류" },
    { value: "담보가등기", label: "담보가등기" },
    { value: "전세권", label: "전세권" },
    { value: "소유권이전청구권가등기", label: "소유권이전 청구권 가등기" },
    { value: "가처분", label: "가처분" },
    { value: "주택임차권", label: "주택임차권" },
    { value: "상가임차권", label: "상가임차권" },
    { value: "유치권", label: "유치권" },
    { value: "법정지상권", label: "법정지상권" },
    { value: "분묘기지권", label: "분묘기지권" },
  ];

  // 매물유형 카테고리 옵션들 (주거용/상업용)
  const propertyCategoryOptions = [
    { value: "주거용", label: "주거용" },
    { value: "상업용", label: "상업용 (준비중)" },
  ];

  // 주거용 매물 유형들
  const residentialPropertyOptions = [
    { value: "아파트", label: "아파트" },
    { value: "오피스텔", label: "오피스텔" },
    { value: "단독주택", label: "단독주택" },
    { value: "다가구주택", label: "다가구주택" },
    { value: "근린주택", label: "근린주택" },
    { value: "주택", label: "주택" },
    { value: "원룸", label: "원룸" },
    { value: "빌라", label: "빌라" },
    { value: "도시형생활주택", label: "도시형생활주택" },
  ];

  // 상업용 매물 유형들 (현재 준비중)
  const commercialPropertyOptions: never[] = [];

  // 가격 범위 옵션
  const priceRanges = [
    { label: "1억 이하", min: 0, max: 100000000 },
    { label: "1억~3억", min: 100000000, max: 300000000 },
    { label: "3억~5억", min: 300000000, max: 500000000 },
    { label: "5억~10억", min: 500000000, max: 1000000000 },
    { label: "10억~20억", min: 1000000000, max: 2000000000 },
    { label: "20억 이상", min: 2000000000, max: 5000000000 },
  ];

  // 필터 업데이트 함수
  const updateFilter = (key: keyof PropertyFilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
    console.log(`🔍 [필터 업데이트] ${key}:`, value);
  };

  // 토글 버튼 선택 함수
  const selectFilter = (
    key: "propertyType" | "region" | "difficultyLevel" | "propertyCategory",
    value: string
  ) => {
    const currentValue = filters[key] as string;
    const newValue = currentValue === value ? "" : value;
    updateFilter(key, newValue);
    console.log(`🔘 [토글 선택] ${key}: ${newValue || "선택 해제"}`);

    // 매물유형 카테고리를 선택했을 때, 기존에 선택된 매물 유형이 해당 카테고리에 없는 경우 초기화
    if (key === "propertyCategory" && filters.propertyType) {
      const availableOptions =
        value === "주거용"
          ? residentialPropertyOptions
          : value === "상업용"
          ? commercialPropertyOptions
          : [...residentialPropertyOptions, ...commercialPropertyOptions];

      const isAvailable = availableOptions.some(
        (option) => option.value === filters.propertyType
      );

      if (!isAvailable) {
        updateFilter("propertyType", "");
        console.log("🔄 [매물유형 초기화] 선택된 카테고리에 맞지 않아 초기화");
      }
    }
  };

  // 권리유형 체크박스 토글 함수
  const toggleRightType = (value: string) => {
    const currentArray = filters.rightTypes;
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFilter("rightTypes", newArray);
    console.log(
      `☑️ [권리유형 체크] ${value}: ${
        newArray.includes(value) ? "선택" : "해제"
      }`
    );
  };

  // 가격 범위 업데이트
  const updatePriceRange = (range: { min: number; max: number }) => {
    updateFilter("priceRange", range);
  };

  // 랜덤 필터 선택
  const randomizeFilters = () => {
    // 매물유형 카테고리 랜덤 선택: 상업용은 제외 (준비중)
    const enabledCategories = propertyCategoryOptions.filter(
      (option) => option.value === "주거용"
    );
    const randomCategory =
      enabledCategories[
        Math.floor(Math.random() * enabledCategories.length)
      ].value;

    // 선택된 카테고리에 따라 매물 유형 선택
    const availableOptions =
      randomCategory === "주거용"
        ? residentialPropertyOptions
        : commercialPropertyOptions;

    // 주거용 아닌 경우(빈 옵션): 에러 로그 후 디폴트 값 할당
    if (!availableOptions.length) {
      console.error(
        "❌ [랜덤 필터] 해당 카테고리에는 매물 유형 옵션이 없습니다:",
        randomCategory
      );
      return;
    }
    const randomPropertyType =
      availableOptions[Math.floor(Math.random() * availableOptions.length)].value;

    const randomDifficulty =
      difficultyOptions[Math.floor(Math.random() * difficultyOptions.length)].value;

    // 권리유형은 1-3개 랜덤 선택
    const shuffledRightTypes = [...rightTypeOptions].sort(
      () => 0.5 - Math.random()
    );
    const randomRightTypesCount = Math.floor(Math.random() * 3) + 1; // 1-3개
    const randomRightTypes = shuffledRightTypes
      .slice(0, randomRightTypesCount)
      .map((option) => option.value);

    const randomFilters: PropertyFilterOptions = {
      propertyType: randomPropertyType,
      region: "", // 지역은 항상 빈 값으로 설정 (랜덤 생성)
      priceRange: { min: 0, max: 5000000000 }, // 가격범위는 항상 전체로 설정 (랜덤 생성)
      difficultyLevel: randomDifficulty,
      rightTypes: randomRightTypes,
      propertyCategory: randomCategory,
    };

    setFilters(randomFilters);
    onFilterChange(randomFilters);
    console.log("🎲 [랜덤 필터] 랜덤 필터가 적용되었습니다:", randomFilters);
  };

  // 필터 초기화
  const resetFilters = () => {
    const defaultFilters: PropertyFilterOptions = {
      propertyType: "",
      region: "",
      priceRange: { min: 0, max: 5000000000 },
      difficultyLevel: "",
      rightTypes: [],
      propertyCategory: "",
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
    console.log("🔄 [필터 초기화] 모든 필터가 초기화되었습니다");
  };

  // 필터 적용
  const handleApplyFilter = () => {
    console.log("✅ [필터 적용] 선택된 필터:", filters);
    onApplyFilter();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-3">
      {/* 한 줄 필터 레이아웃 */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 md:justify-between">
        {/* 좌측: 필터 옵션들 */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-1 min-w-0 basis-full md:basis-auto order-1 md:order-none">
          {/* 새로운 매물유형 토글 필터 */}
          <div className="relative">
            <button
              onClick={() => {
                console.log(
                  "🏢 [매물유형 토글] 토글 클릭:",
                  !isPropertyCategoryExpanded
                );
                setIsPropertyCategoryExpanded(!isPropertyCategoryExpanded);
              }}
              className="px-2 py-1.5 text-left bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-between min-w-[120px]"
            >
              <div className="flex items-center gap-1 text-xs text-gray-700">
                <span>{filters.propertyCategory || "매물유형"}</span>
              </div>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                  isPropertyCategoryExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isPropertyCategoryExpanded && (
              <div className="absolute z-10 mt-1 w-full border border-gray-300 rounded-md bg-white shadow-lg">
                <div className="p-2">
                  {propertyCategoryOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="radio"
                        name="propertyCategory"
                        value={option.value}
                        checked={filters.propertyCategory === option.value}
                        onChange={() => {
                          console.log("🏢 [매물유형] 선택:", option.value);
                          selectFilter("propertyCategory", option.value);
                          setIsPropertyCategoryExpanded(false);
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 기존 매물 유형 */}
          <div className="relative">
            <button
              onClick={() => {
                console.log(
                  "🏠 [매물유형 토글] 토글 클릭:",
                  !isPropertyTypeExpanded
                );
                setIsPropertyTypeExpanded(!isPropertyTypeExpanded);
              }}
              className="px-2 py-1.5 text-left bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-between min-w-[120px]"
            >
              <div className="flex items-center gap-1 text-xs text-gray-700">
                {filters.propertyType && <span>{filters.propertyType}</span>}
              </div>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                  isPropertyTypeExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isPropertyTypeExpanded && (
              <div className="absolute z-10 mt-1 w-full border border-gray-300 rounded-md bg-white shadow-lg">
                <div className="p-2">
                  {/* 선택된 카테고리에 따라 다른 옵션 표시 */}
                  {(filters.propertyCategory === "주거용"
                    ? residentialPropertyOptions
                    : filters.propertyCategory === "상업용"
                    ? commercialPropertyOptions
                    : [
                        ...residentialPropertyOptions,
                        ...commercialPropertyOptions,
                      ]
                  ).map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="radio"
                        name="propertyType"
                        value={option.value}
                        checked={filters.propertyType === option.value}
                        onChange={() => {
                          console.log("🏠 [매물유형] 선택:", option.value);
                          selectFilter("propertyType", option.value);
                          setIsPropertyTypeExpanded(false);
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 권리 유형 */}
          <div className="relative">
            <button
              onClick={() => {
                console.log(
                  "⚖️ [권리유형 토글] 토글 클릭:",
                  !isRightTypesExpanded
                );
                setIsRightTypesExpanded(!isRightTypesExpanded);
              }}
              className="px-2 py-1.5 text-left bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-between min-w-[120px]"
            >
              <div className="flex items-center gap-1 text-xs text-gray-700">
                <span>권리유형</span>
                {filters.rightTypes.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded-full">
                    {filters.rightTypes.length}
                  </span>
                )}
              </div>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                  isRightTypesExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isRightTypesExpanded && (
              <div className="absolute z-10 mt-1 w-64 max-h-32 overflow-y-auto border border-gray-300 rounded-md bg-white shadow-lg">
                <div className="p-2">
                  {rightTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.rightTypes.includes(option.value)}
                        onChange={() => {
                          console.log(
                            "☑️ [권리유형] 체크박스 토글:",
                            option.value
                          );
                          toggleRightType(option.value);
                        }}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-xs text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 난이도 */}
          <div className="relative">
            <button
              onClick={() => {
                console.log(
                  "📚 [난이도 토글] 토글 클릭:",
                  !isDifficultyExpanded
                );
                setIsDifficultyExpanded(!isDifficultyExpanded);
              }}
              className="px-2 py-1.5 text-left bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-between min-w-[120px]"
            >
              <div className="flex items-center gap-1 text-xs text-gray-700">
                <span>{filters.difficultyLevel || "난이도"}</span>
              </div>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                  isDifficultyExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDifficultyExpanded && (
              <div className="absolute z-10 mt-1 w-full border border-gray-300 rounded-md bg-white shadow-lg">
                <div className="p-2">
                  {difficultyOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="radio"
                        name="difficultyLevel"
                        value={option.value}
                        checked={filters.difficultyLevel === option.value}
                        onChange={() => {
                          console.log("📚 [난이도] 선택:", option.value);
                          selectFilter("difficultyLevel", option.value);
                          setIsDifficultyExpanded(false);
                        }}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 액션 버튼들 */}
        <div className="flex items-center gap-2 basis-full md:basis-auto justify-start md:justify-end order-2 md:order-none">
          <button
            onClick={() => {
              console.log("🔄 [새 매물 불러오기] 새로고침 버튼 클릭");
              if (onRefresh) {
                onRefresh();
              }
            }}
            className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            <span>매물 생성</span>
          </button>
          <button
            onClick={() => {
              console.log("🎲 [랜덤 필터] 랜덤 탭 버튼 클릭");
              randomizeFilters();
            }}
            className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            <span>랜덤</span>
          </button>
          <button
            onClick={() => {
              console.log("🔄 [필터 초기화] 초기화 버튼 클릭");
              resetFilters();
            }}
            className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            초기화
          </button>
          <button
            onClick={() => {
              console.log("✅ [필터 적용] 필터 적용 버튼 클릭");
              handleApplyFilter();
            }}
            disabled={isLoading}
            className="px-4 py-1.5 text-xs bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>적용 중...</span>
              </>
            ) : (
              <>
                <span>필터 적용</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
