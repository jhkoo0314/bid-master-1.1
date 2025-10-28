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
import HeroBelow from "@/components/HeroBelow";
import Footer from "@/components/Footer";
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
  const [isExpertColumnPreparing, setIsExpertColumnPreparing] = useState(false);

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

  // 필터 적용 핸들러 (내부용)
  const handleApplyFilterWithFilters = async (
    filters: PropertyFilterOptions
  ) => {
    console.log("🔍 [메인페이지] 필터 적용 요청:", filters);

    // 지역과 가격범위는 항상 랜덤으로 생성되도록 필터 수정
    const modifiedFilters = {
      ...filters,
      region: "", // 지역은 항상 빈 값으로 설정 (랜덤 생성)
      priceRange: { min: 0, max: 5000000000 }, // 가격범위는 항상 전체로 설정 (랜덤 생성)
    };

    // 필터 적용 통계 로그
    const filterStats = {
      매물유형: filters.propertyType || "전체",
      지역: "랜덤 생성",
      가격범위: "랜덤 생성",
      난이도: filters.difficultyLevel || "전체",
      권리유형:
        filters.rightTypes.length > 0 ? filters.rightTypes.join(", ") : "전체",
    };

    console.log("📊 [메인페이지] 필터 적용 통계:", filterStats);

    await loadInitialProperties(modifiedFilters);
  };

  // 필터 적용 핸들러 (외부용)
  const handleApplyFilter = async () => {
    await handleApplyFilterWithFilters(currentFilters);
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
    <div className="min-h-screen bg-white">
      {/* 개발자 모드 토글 - 프로덕션에서는 숨김 */}
      {process.env.NODE_ENV !== "production" && <DevModeToggle />}

      {/* 헤더 - 좌측 로고와 가운데 메뉴 버튼들 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between py-4">
            {/* 로고 - 좌측 정렬 */}
            <div className="flex items-center gap-3">
              <img
                src="/bmlogo.png"
                alt="Bid Master Logo"
                className="h-8 w-8 object-contain"
              />
              <div className="flex flex-col items-start">
                <h1 className="text-2xl font-bold text-gray-900">Bid master</h1>
                <p className="text-xs font-medium tracking-wide text-gray-500">
                  Fail, Fast, learn faster
                </p>
              </div>
            </div>
            {/* 메뉴 버튼들 - 정확한 가운데 정렬 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={() => {
                  console.log("📚 [주요경매용어] 모달 열기 요청");
                  setIsAuctionTermsModalOpen(true);
                }}
                className="inline-flex items-center justify-center px-3 py-1.5 font-medium text-xs transition-all duration-200 hover:bg-gray-100 rounded-md text-gray-900 hover:-translate-y-1 hover:shadow-md"
              >
                경매용어
              </button>
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center px-3 py-1.5 font-medium text-xs transition-all duration-200 hover:bg-gray-100 rounded-md text-gray-900 hover:-translate-y-1 hover:shadow-md"
              >
                수익 계산기
              </Link>
              <button
                onClick={() => {
                  console.log("📰 [전문가 칼럼] 서비스 준비중 모달 열기 요청");
                  setIsExpertColumnPreparing(true);
                }}
                className="inline-flex items-center justify-center px-3 py-1.5 font-medium text-xs transition-all duration-200 hover:bg-gray-100 rounded-md text-gray-900 hover:-translate-y-1 hover:shadow-md"
              >
                전문가 칼럼
              </button>
              <button
                onClick={() => {
                  console.log("🔔 [사전 알림] 모달 열기 요청");
                  setIsWaitlistModalOpen(true);
                }}
                className="inline-flex items-center justify-center px-3 py-1.5 font-medium text-xs transition-all duration-200 bg-secondary text-white rounded-md hover:bg-blue-600 hover:-translate-y-1 hover:shadow-md"
              >
                사전 알림 신청
              </button>
            </div>
            {/* 로그인 탭 - 우측 상단 (현재 미지원) */}
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 font-medium text-xs sm:text-sm bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed opacity-60 hover:bg-gray-400 hover:opacity-80 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">로그인</span>
                <span className="sm:hidden">로그인</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 - 제목과 설명만 */}
      <section className="py-16 flex items-center justify-center bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight text-gray-900">
              부동산 경매, 아직도 비싼 돈 주고 배우세요?
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-4 font-normal leading-relaxed max-w-3xl mx-auto text-gray-600">
              로그인 없이 시작하는 경매 학습 시뮬레이션
            </p>
            <p className="text-base sm:text-lg mb-8 font-normal leading-relaxed max-w-2xl mx-auto text-gray-500">
              최대한 많이 실패하고, 더 많이 배울 수 있습니다.
            </p>
            <div className="flex justify-center items-center">
              <button
                onClick={() => {
                  console.log(
                    "🏠 [실전경매훈련] 버튼 클릭 - 매물 섹션으로 스크롤"
                  );
                  document.getElementById("properties")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <span>실전 경매 훈련</span>
                <svg
                  className="ml-2 w-4 h-4 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HeroBelow 컴포넌트 - 실패 보관소, 감각 테스트, 실시간 현황 */}
      <HeroBelow />

      {/* 경매 입찰 섹션 - 컴팩트 Vercel 스타일 */}
      <section id="properties" className="py-12 relative bg-white">
        {/* 상단 구분선 */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 tracking-tight text-gray-900"></h2>
            </div>
          </div>

          {/* 필터 컴포넌트 */}
          <PropertyFilter
            onFilterChange={handleFilterChange}
            onApplyFilter={handleApplyFilter}
            onRefresh={handleRefresh}
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

      {/* Footer - 새로운 푸터 컴포넌트 */}
      <Footer />

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

      {/* 전문가 칼럼 서비스 준비중 모달 */}
      {isExpertColumnPreparing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-6">📰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                전문가 칼럼 준비중입니다
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                경매 전문가들의 실전 노하우를 곧 만나보실 수 있습니다
              </p>
              <button
                onClick={() => {
                  console.log("📰 [전문가 칼럼] 모달 닫기");
                  setIsExpertColumnPreparing(false);
                }}
                className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm w-full"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
