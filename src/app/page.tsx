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
import { AuctionTermsModal } from "@/components/AuctionTermsModal";
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
  const [isAuctionTermsModalOpen, setIsAuctionTermsModalOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<PropertyFilterOptions>({
    propertyType: "",
    region: "",
    priceRange: { min: 0, max: 5000000000 },
    difficultyLevel: "",
    rightTypes: [],
  });
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

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

      // PropertyFilterOptions를 generateMultipleProperties가 받는 형태로 변환
      const convertedFilters = filters
        ? {
            propertyTypes: filters.propertyType
              ? [filters.propertyType]
              : undefined,
            regions: filters.region ? [filters.region] : undefined,
            priceRange: filters.priceRange,
            difficultyLevels: filters.difficultyLevel
              ? [filters.difficultyLevel]
              : undefined,
            rightTypes:
              filters.rightTypes.length > 0 ? filters.rightTypes : undefined,
          }
        : undefined;

      console.log("🔄 [메인페이지] 필터 변환:", {
        원본: filters,
        변환: convertedFilters,
      });

      const properties = await generateMultipleProperties(
        difficulties,
        convertedFilters
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
    console.log("🔄 [메인페이지] 새로고침 요청 - 무제한 사용 가능");
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
      매물유형: currentFilters.propertyType || "전체",
      지역: currentFilters.region || "전체",
      가격범위: `${currentFilters.priceRange.min.toLocaleString()}원 ~ ${currentFilters.priceRange.max.toLocaleString()}원`,
      난이도: currentFilters.difficultyLevel || "전체",
      권리유형:
        currentFilters.rightTypes.length > 0
          ? currentFilters.rightTypes.join(", ")
          : "전체",
    };

    console.log("📊 [메인페이지] 필터 적용 통계:", filterStats);

    await loadInitialProperties(currentFilters);
  };

  const remainingRefreshes = "";

  // 스와이프 제스처 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log("📱 [스와이프] 터치 시작");
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentCardIndex < educationalProperties.length - 1) {
      console.log("📱 [스와이프] 왼쪽 스와이프 - 다음 카드");
      setCurrentCardIndex(currentCardIndex + 1);
    }
    if (isRightSwipe && currentCardIndex > 0) {
      console.log("📱 [스와이프] 오른쪽 스와이프 - 이전 카드");
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 개발자 모드 토글 - 프로덕션에서는 숨김 */}
      {process.env.NODE_ENV !== "production" && <DevModeToggle />}

      {/* Hero 섹션 */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
            AI로 무한 생성되는 실전 경매 훈련장
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-4 sm:mb-6">
            로그인 없이 즉시 시작하는 경매 시뮬레이션
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
            <a
              href="#properties"
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 active:scale-95 transition-all text-center text-sm sm:text-base"
            >
              매물 보러가기
            </a>
            <button
              onClick={() => {
                console.log("📚 [주요경매용어] 모달 열기 요청");
                setIsAuctionTermsModalOpen(true);
              }}
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 active:scale-95 transition-all border-2 border-white text-center text-sm sm:text-base"
            >
              📚 주요 경매용어
            </button>
            <Link
              href="/calculator"
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-600 active:scale-95 transition-all border-2 border-white text-center text-sm sm:text-base"
            >
              수익 계산하기
            </Link>
            <button
              onClick={() => {
                console.log("🔔 [사전 알림] 모달 열기 요청");
                setIsWaitlistModalOpen(true);
              }}
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all border-2 border-white text-center text-sm sm:text-base"
            >
              🔔 사전 알림 신청
            </button>
          </div>
        </div>
      </section>

      {/* 경매 입찰 섹션 */}
      <section id="properties" className="py-16">
        <div className="container mx-auto px-4 max-w-7xl">
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
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
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
            <>
              {/* 데스크톱 그리드 */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {educationalProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* 모바일 스와이프 카드 */}
              <div className="md:hidden">
                <div
                  className="swipeable overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{
                      transform: `translateX(-${currentCardIndex * 100}%)`,
                    }}
                  >
                    {educationalProperties.map((property) => (
                      <div
                        key={property.id}
                        className="w-full flex-shrink-0 px-2"
                      >
                        <PropertyCard property={property} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 스와이프 인디케이터 */}
                <div className="flex justify-center mt-4 space-x-2">
                  {educationalProperties.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        console.log(
                          `📱 [스와이프] 인디케이터 클릭 - 카드 ${index + 1}`
                        );
                        setCurrentCardIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentCardIndex
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 빈 상태 */}
          {!isLoading && educationalProperties.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 mb-4">아직 생성된 매물이 없습니다.</p>
              <button
                onClick={() => loadInitialProperties()}
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
        <div className="container mx-auto px-4 max-w-7xl text-center">
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

      {/* 주요 경매용어 모달 */}
      <AuctionTermsModal
        isOpen={isAuctionTermsModalOpen}
        onClose={() => {
          console.log("📚 [주요경매용어] 모달 닫기");
          setIsAuctionTermsModalOpen(false);
        }}
      />
    </div>
  );
}
