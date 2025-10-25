/**
 * Bid Master AI - 매물 필터 컴포넌트
 * 사용자가 원하는 조건으로 매물을 필터링할 수 있는 UI
 */

"use client";

import { useState } from "react";

export interface PropertyFilterOptions {
  propertyTypes: string[];
  regions: string[];
  priceRange: {
    min: number;
    max: number;
  };
  difficultyLevels: string[];
  rightTypes: string[];
}

interface PropertyFilterProps {
  onFilterChange: (filters: PropertyFilterOptions) => void;
  onApplyFilter: () => void;
  isLoading?: boolean;
}

export function PropertyFilter({
  onFilterChange,
  onApplyFilter,
  isLoading = false,
}: PropertyFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 필터 상태
  const [filters, setFilters] = useState<PropertyFilterOptions>({
    propertyTypes: [],
    regions: [],
    priceRange: { min: 0, max: 5000000000 },
    difficultyLevels: [],
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
    { value: "전세권", label: "전세권" },
    { value: "가압류", label: "가압류" },
    { value: "지상권", label: "지상권" },
    { value: "임차권", label: "임차권" },
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

  // 체크박스 토글 함수
  const toggleArrayFilter = (
    key: "propertyTypes" | "regions" | "difficultyLevels" | "rightTypes",
    value: string
  ) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  // 가격 범위 업데이트
  const updatePriceRange = (range: { min: number; max: number }) => {
    updateFilter("priceRange", range);
  };

  // 필터 초기화
  const resetFilters = () => {
    const defaultFilters: PropertyFilterOptions = {
      propertyTypes: [],
      regions: [],
      priceRange: { min: 0, max: 5000000000 },
      difficultyLevels: [],
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* 필터 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🔍 매물 필터</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? "접기" : "펼치기"}
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 필터 내용 */}
      {isExpanded && (
        <div className="space-y-6">
          {/* 매물 유형 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              🏠 매물 유형
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {propertyTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={filters.propertyTypes.includes(option.value)}
                    onChange={() =>
                      toggleArrayFilter("propertyTypes", option.value)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 지역 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">📍 지역</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {regionOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={filters.regions.includes(option.value)}
                    onChange={() => toggleArrayFilter("regions", option.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 가격 범위 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              💰 가격 범위
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {priceRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() =>
                    updatePriceRange({ min: range.min, max: range.max })
                  }
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    filters.priceRange.min === range.min &&
                    filters.priceRange.max === range.max
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              선택된 범위: {filters.priceRange.min.toLocaleString()}원 ~{" "}
              {filters.priceRange.max.toLocaleString()}원
            </div>
          </div>

          {/* 난이도 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              📚 난이도
            </h4>
            <div className="flex gap-4">
              {difficultyOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={filters.difficultyLevels.includes(option.value)}
                    onChange={() =>
                      toggleArrayFilter("difficultyLevels", option.value)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 권리 유형 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              ⚖️ 권리 유형
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {rightTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={filters.rightTypes.includes(option.value)}
                    onChange={() =>
                      toggleArrayFilter("rightTypes", option.value)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 필터 적용 버튼 */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleApplyFilter}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      )}

      {/* 선택된 필터 요약 */}
      {!isExpanded && (
        <div className="text-sm text-gray-600">
          {filters.propertyTypes.length > 0 && (
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
              매물: {filters.propertyTypes.join(", ")}
            </span>
          )}
          {filters.regions.length > 0 && (
            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
              지역: {filters.regions.join(", ")}
            </span>
          )}
          {filters.difficultyLevels.length > 0 && (
            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
              난이도: {filters.difficultyLevels.join(", ")}
            </span>
          )}
          {filters.rightTypes.length > 0 && (
            <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
              권리: {filters.rightTypes.join(", ")}
            </span>
          )}
          {filters.propertyTypes.length === 0 &&
            filters.regions.length === 0 &&
            filters.difficultyLevels.length === 0 &&
            filters.rightTypes.length === 0 && (
              <span className="text-gray-400">필터를 선택해주세요</span>
            )}
        </div>
      )}
    </div>
  );
}
