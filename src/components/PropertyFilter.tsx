/**
 * Bid Master AI - 매물 필터 컴포넌트
 * 사용자가 원하는 조건으로 매물을 필터링할 수 있는 UI
 */

"use client";

import { useState, useEffect, useRef } from "react";

export interface PropertyFilterOptions {
  propertyType: string;
  region: string;
  priceRange: {
    min: number;
    max: number;
  };
  difficultyLevel: string;
  rightTypes: string[];
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
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 필터 상태
  const [filters, setFilters] = useState<PropertyFilterOptions>({
    propertyType: "",
    region: "",
    priceRange: { min: 0, max: 5000000000 },
    difficultyLevel: "",
    rightTypes: [],
  });

  // 필터 옵션들
  const propertyTypeOptions = [
    { value: "아파트", label: "아파트" },
    { value: "오피스텔", label: "오피스텔" },
    { value: "상가", label: "상가" },
    { value: "단독주택", label: "단독주택" },
    { value: "빌라", label: "빌라" },
    { value: "원룸", label: "원룸" },
  ];

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
    key: "propertyType" | "region" | "difficultyLevel",
    value: string
  ) => {
    const currentValue = filters[key] as string;
    const newValue = currentValue === value ? "" : value;
    updateFilter(key, newValue);
    console.log(`🔘 [토글 선택] ${key}: ${newValue || "선택 해제"}`);
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
    const randomPropertyType =
      propertyTypeOptions[
        Math.floor(Math.random() * propertyTypeOptions.length)
      ].value;
    const randomDifficulty =
      difficultyOptions[Math.floor(Math.random() * difficultyOptions.length)]
        .value;

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

  // 필터 요약 텍스트 생성
  const getFilterSummary = () => {
    const parts = [];
    if (filters.propertyType) parts.push(`🏠 ${filters.propertyType}`);
    if (filters.rightTypes.length > 0) parts.push(`⚖️ 권리유형`);
    if (filters.difficultyLevel) parts.push(`📚 ${filters.difficultyLevel}`);

    return parts.length > 0 ? parts.join(", ") : "매물을 선택해 주세요";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-3">
      {/* 한줄 토글 필터 */}
      <div className="relative" ref={filterRef}>
        {/* 토글 버튼 */}
        <button
          onClick={() => {
            console.log("🔍 [필터 토글] 필터 토글 클릭:", !isFilterExpanded);
            setIsFilterExpanded(!isFilterExpanded);
          }}
          className="w-full px-4 py-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-gray-500">{getFilterSummary()}</span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isFilterExpanded ? "rotate-180" : ""
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
          </div>
        </button>

        {/* 드롭다운 필터 옵션 */}
        {isFilterExpanded && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-4">
              {/* 필터 헤더 */}
              <div className="flex justify-end items-center mb-4 gap-2">
                <button
                  onClick={() => {
                    console.log("🔄 [새 매물 불러오기] 새로고침 버튼 클릭");
                    if (onRefresh) {
                      onRefresh();
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors flex items-center gap-1"
                >
                  <span>🔄</span>
                  <span>새 매물 불러오기</span>
                </button>
                <button
                  onClick={() => {
                    console.log("🔄 [필터 초기화] 초기화 버튼 클릭");
                    resetFilters();
                  }}
                  className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  필터 초기화
                </button>
              </div>

              {/* 필터 옵션들 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 매물 유형 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <span>🏠</span>
                    <span>매물유형</span>
                  </h4>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => {
                      console.log("🏠 [매물유형] 선택:", e.target.value);
                      selectFilter("propertyType", e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  >
                    <option value="">매물 유형 선택</option>
                    {propertyTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 권리 유형 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <span>⚖️</span>
                    <span>권리유형</span>
                  </h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    <div className="grid grid-cols-1 gap-1">
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
                                "⚖️ [권리유형] 체크박스 토글:",
                                option.value
                              );
                              toggleRightType(option.value);
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 난이도 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <span>📚</span>
                    <span>난이도 설정하기</span>
                  </h4>
                  <select
                    value={filters.difficultyLevel}
                    onChange={(e) => {
                      console.log("📚 [난이도] 선택:", e.target.value);
                      selectFilter("difficultyLevel", e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm"
                  >
                    <option value="">난이도 선택</option>
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 필터 적용 버튼 */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={() => {
                    console.log("✅ [필터 적용] 필터 적용 버튼 클릭");
                    handleApplyFilter();
                    setIsFilterExpanded(false);
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>필터 적용 중...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>필터 적용하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
