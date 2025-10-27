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

      {/* 헤더 - 좌측 상단 로고 */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Bid master</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero 섹션 - 컴팩트 Vercel 스타일 */}
      <section className="bg-white py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 leading-tight tracking-tight">
              AI로 무한 생성되는
              <br />
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                실전 경매 훈련장
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 font-normal leading-relaxed max-w-2xl mx-auto">
              로그인 없이 즉시 시작하는 경매 시뮬레이션
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 flex-wrap">
              <a
                href="#properties"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🏠 매물 보러가기
              </a>
              <button
                onClick={() => {
                  console.log("📚 [주요경매용어] 모달 열기 요청");
                  setIsAuctionTermsModalOpen(true);
                }}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                📚 주요 경매용어
              </button>
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                💰 수익 계산하기
              </Link>
              <button
                onClick={() => {
                  console.log("🔔 [사전 알림] 모달 열기 요청");
                  setIsWaitlistModalOpen(true);
                }}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🔔 사전 알림 신청
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 경매 입찰 섹션 - 컴팩트 Vercel 스타일 */}
      <section id="properties" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                AI 생성 경매 매물
              </h2>
              <p className="text-base sm:text-lg text-gray-600 font-normal leading-relaxed max-w-xl">
                단계별 난이도로 경매의 핵심을 학습하세요
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 font-medium">
                {remainingRefreshes}
              </span>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-50 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm border border-gray-200"
              >
                <span className="mr-2">🔄</span>
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

          {/* 에러 메시지 - 컴팩트 Vercel 스타일 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 font-medium text-sm">
              {error}
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
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
                          ? "bg-slate-900"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 빈 상태 - 컴팩트 Vercel 스타일 */}
          {!isLoading && educationalProperties.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                아직 생성된 매물이 없습니다
              </h3>
              <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
                새로운 매물을 생성하여 경매 시뮬레이션을 시작해보세요
              </p>
              <button
                onClick={() => loadInitialProperties()}
                className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
              >
                매물 생성하기
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer - 컴팩트 Vercel 스타일 */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <p className="text-gray-400 text-base font-medium mb-3">
            © 2025 Bid Master AI. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
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
