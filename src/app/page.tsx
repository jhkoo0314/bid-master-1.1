/**
 * Bid Master AI - 메인 페이지
 */

"use client";

import { useEffect, useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { DevModeToggle } from "@/components/DevModeToggle";
import {
  PropertyFilter,
  PropertyFilterOptions,
} from "@/components/PropertyFilter";
import { WaitlistModal } from "@/components/WaitlistModal";
import { useSimulationStore } from "@/store/simulation-store";
import { generateMultipleProperties } from "@/app/actions/generate-property";
import { SimulationScenario, DifficultyLevel } from "@/types/simulation";
import Link from "next/link";

export default function HomePage() {
  const {
    educationalProperties,
    setEducationalProperties,
    devMode,
    incrementRefreshCount,
  } = useSimulationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<PropertyFilterOptions>({
    propertyTypes: [],
    regions: [],
    priceRange: { min: 0, max: 5000000000 },
    difficultyLevels: [],
    rightTypes: [],
  });

  // 페이지 로드 시 초기 매물 생성
  useEffect(() => {
    if (educationalProperties.length === 0) {
      loadInitialProperties();
    }
  }, []);

  const loadInitialProperties = async (filters?: PropertyFilterOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "🏠 [메인페이지] 매물 생성 시작",
        filters ? "필터 적용" : "기본 생성"
      );

      // 초급 1개 + 중급 3개 + 고급 2개 = 총 6개
      const difficulties: DifficultyLevel[] = [
        "초급",
        "중급",
        "중급",
        "중급",
        "고급",
        "고급",
      ];

      const properties = await generateMultipleProperties(
        difficulties,
        filters
      );
      setEducationalProperties(properties);

      console.log(`✅ [메인페이지] 매물 생성 완료 (${properties.length}개)`);
    } catch (err) {
      console.error("❌ [메인페이지] 매물 생성 실패:", err);
      setError("매물을 불러오는데 실패했습니다. 새로고침을 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    // 일반 모드에서 10회 제한 체크
    if (!devMode.isDevMode && devMode.refreshCount >= 10) {
      alert(
        "오늘의 무료 매물 생성을 모두 사용했습니다. 더 많은 매물을 보려면 사전 알림을 신청해주세요!"
      );
      return;
    }

    incrementRefreshCount();
    await loadInitialProperties(currentFilters);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (filters: PropertyFilterOptions) => {
    setCurrentFilters(filters);
    console.log("🔍 [메인페이지] 필터 변경:", filters);
  };

  // 필터 적용 핸들러
  const handleApplyFilter = async () => {
    console.log("🔍 [메인페이지] 필터 적용 요청:", currentFilters);

    // 필터 적용 통계 로그
    const filterStats = {
      매물유형:
        currentFilters.propertyTypes.length > 0
          ? currentFilters.propertyTypes.join(", ")
          : "전체",
      지역:
        currentFilters.regions.length > 0
          ? currentFilters.regions.join(", ")
          : "전체",
      가격범위: `${currentFilters.priceRange.min.toLocaleString()}원 ~ ${currentFilters.priceRange.max.toLocaleString()}원`,
      난이도:
        currentFilters.difficultyLevels.length > 0
          ? currentFilters.difficultyLevels.join(", ")
          : "전체",
      권리유형:
        currentFilters.rightTypes.length > 0
          ? currentFilters.rightTypes.join(", ")
          : "전체",
    };

    console.log("📊 [메인페이지] 필터 적용 통계:", filterStats);

    await loadInitialProperties(currentFilters);
  };

  const remainingRefreshes = devMode.isDevMode
    ? "무제한"
    : `${Math.max(0, 10 - devMode.refreshCount)}/10회 남음`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 개발자 모드 토글 */}
      <DevModeToggle />

      {/* Hero 섹션 */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI로 무한 생성되는 실전 경매 훈련장
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            로그인 없이 즉시 시작하는 경매 시뮬레이션
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="#properties"
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors"
            >
              매물 보러가기
            </a>
            <Link
              href="/calculator"
              className="px-8 py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors border-2 border-white"
            >
              수익 계산하기
            </Link>
            <button
              onClick={() => {
                console.log("🔔 [사전 알림] 모달 열기 요청");
                setIsWaitlistModalOpen(true);
              }}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors border-2 border-white"
            >
              🔔 사전 알림 신청
            </button>
          </div>
        </div>
      </section>

      {/* 경매 입찰 섹션 */}
      <section id="properties" className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                AI 생성 경매 매물
              </h2>
              <p className="text-gray-600">
                단계별 난이도로 경매의 핵심을 학습하세요
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {remainingRefreshes}
              </span>
              <button
                onClick={handleRefresh}
                disabled={
                  isLoading ||
                  (!devMode.isDevMode && devMode.refreshCount >= 10)
                }
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>🔄</span>
                <span>새로고침</span>
              </button>
            </div>
          </div>

          {/* 필터 컴포넌트 */}
          <PropertyFilter
            onFilterChange={handleFilterChange}
            onApplyFilter={handleApplyFilter}
            isLoading={isLoading}
          />

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 매물 그리드 */}
          {!isLoading && educationalProperties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationalProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {/* 빈 상태 */}
          {!isLoading && educationalProperties.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 mb-4">아직 생성된 매물이 없습니다.</p>
              <button
                onClick={loadInitialProperties}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                매물 생성하기
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Bid Master AI. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            본 서비스는 교육 목적으로 제공되며, 실제 법원 경매와 다를 수
            있습니다.
          </p>
        </div>
      </footer>

      {/* 사전 알림 신청 모달 */}
      <WaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => {
          console.log("🔔 [사전 알림] 모달 닫기");
          setIsWaitlistModalOpen(false);
        }}
      />
    </div>
  );
}
