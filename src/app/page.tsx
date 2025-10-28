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
  const [activeTab, setActiveTab] = useState<"basic" | "practice" | "advanced">(
    "basic"
  );
  const [isServicePreparing, setIsServicePreparing] = useState(false);
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

  // 탭 변경 핸들러
  const handleTabChange = (tab: "basic" | "practice" | "advanced") => {
    console.log(`📚 [학습탭] 탭 변경: ${tab} - 서비스 준비중으로 전환`);
    setActiveTab(tab);
    setIsServicePreparing(true);
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
                className="inline-flex items-center justify-center px-3 py-1.5 font-medium text-xs transition-all duration-200 hover:bg-gray-100 rounded-md text-gray-900 hover:-translate-y-1 hover:shadow-md"
              >
                사전 알림 신청
              </button>
            </div>
            {/* 빈 공간 - 우측 균형을 위해 */}
            <div className="flex flex-col items-end">
              <h1 className="text-2xl font-bold opacity-0 text-gray-900">
                Bid master
              </h1>
              <p className="text-xs font-medium tracking-wide opacity-0 text-gray-500">
                Fail, Fast, learn faster
              </p>
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
                    "🏠 [매물보러가기] 버튼 클릭 - 매물 섹션으로 스크롤"
                  );
                  document.getElementById("properties")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className="inline-flex items-center justify-center px-8 py-4 bg-secondary text-white font-semibold rounded-full hover:bg-secondary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
              >
                <span>매물 보러가기</span>
              </button>
            </div>
          </div>
        </div>
        {/* 구분선 */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </section>

      {/* 경매 입찰 섹션 - 컴팩트 Vercel 스타일 */}
      <section id="properties" className="py-12 relative bg-white">
        {/* 상단 구분선 */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 tracking-tight text-gray-900">
                실전 경매 훈련장
              </h2>
              <p className="text-base sm:text-lg font-normal leading-relaxed max-w-xl text-gray-600">
                {activeTab === "basic" &&
                  "기초부터 차근차근 경매의 핵심을 익혀보세요"}
                {activeTab === "practice" &&
                  "실제 상황을 바탕으로 경매 기술을 연습하세요"}
                {activeTab === "advanced" &&
                  "고급 전략으로 경매의 달인이 되어보세요"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">
                {remainingRefreshes}
              </span>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-5 py-2.5 text-gray-700 font-semibold rounded-full hover:bg-gray-100 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm border border-gray-300"
              >
                <span className="mr-2">🔄</span>
                <span>매물 새로고침</span>
              </button>
            </div>
          </div>

          {/* 학습 단계별 카드 탭들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 기본개념익히기 카드 */}
            <div
              onClick={() => handleTabChange("basic")}
              className={`relative cursor-pointer rounded-xl p-4 transition-all duration-300 transform hover:scale-105 ${
                activeTab === "basic"
                  ? "bg-white text-black shadow-xl border-2 border-gray-300"
                  : "bg-white text-black shadow-md hover:shadow-lg border-2 border-gray-200"
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <span className="text-xl mr-2">1️⃣</span>
                  <h3 className="text-lg font-bold text-black">
                    기본 개념 익히기
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  경매의 기본 개념부터 차근차근 학습하세요.
                </p>
                <div className="flex items-center justify-center space-x-1 text-xs">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    초급
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    기초
                  </span>
                </div>
              </div>
              {activeTab === "basic" && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
              )}
            </div>

            {/* 실전적용하기 카드 */}
            <div
              onClick={() => handleTabChange("practice")}
              className={`relative cursor-pointer rounded-xl p-4 transition-all duration-300 transform hover:scale-105 ${
                activeTab === "practice"
                  ? "bg-white text-black shadow-xl border-2 border-gray-300"
                  : "bg-white text-black shadow-md hover:shadow-lg border-2 border-gray-200"
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <span className="text-xl mr-2">2️⃣</span>
                  <h3 className="text-lg font-bold text-black">
                    실전 적용 하기
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  실제 상황을 바탕으로 경매 기술을 연습하세요.
                </p>
                <div className="flex items-center justify-center space-x-1 text-xs">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    중급
                  </span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                    실전
                  </span>
                </div>
              </div>
              {activeTab === "practice" && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
              )}
            </div>

            {/* 고급전략세우기 카드 */}
            <div
              onClick={() => handleTabChange("advanced")}
              className={`relative cursor-pointer rounded-xl p-4 transition-all duration-300 transform hover:scale-105 ${
                activeTab === "advanced"
                  ? "bg-white text-black shadow-xl border-2 border-gray-300"
                  : "bg-white text-black shadow-md hover:shadow-lg border-2 border-gray-200"
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <span className="text-xl mr-2">3️⃣</span>
                  <h3 className="text-lg font-bold text-black">
                    고급 전략 세우기
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  고급 전략으로 경매의 달인이 되어보세요.
                </p>
                <div className="flex items-center justify-center space-x-1 text-xs">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    고급
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                    전략
                  </span>
                </div>
              </div>
              {activeTab === "advanced" && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
              )}
            </div>
          </div>

          {/* 서비스 준비중 메시지 - 카드 탭 또는 전문가 칼럼 클릭 시 표시 */}
          {isServicePreparing && (
            <div className="text-center py-12 mb-8">
              <div className="text-6xl mb-6">🚧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                서비스 준비중입니다
              </h3>
              <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
                더 나은 서비스로 곧 찾아뵙겠습니다
              </p>
              <button
                onClick={() => {
                  console.log("🔄 [서비스준비중] 돌아가기 버튼 클릭");
                  setIsServicePreparing(false);
                }}
                className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
              >
                돌아가기
              </button>
            </div>
          )}

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
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <p className="text-gray-600 text-base font-medium mb-3">
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
