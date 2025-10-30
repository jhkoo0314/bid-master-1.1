"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DevModeToggle } from "@/components/DevModeToggle";
import PropertyCard from "@/components/PropertyCard";
import {
  PropertyFilter,
  PropertyFilterOptions,
} from "@/components/PropertyFilter";
import { WaitlistModal } from "@/components/WaitlistModal";
import { AuctionTermsModal } from "@/components/AuctionTermsModal";
import HeroBelow from "@/components/HeroBelow";
import Footer from "@/components/Footer";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useSimulationStore } from "@/store/simulation-store";
import { generateMultipleProperties } from "@/app/actions/generate-simulation";
import { SimulationScenario, DifficultyLevel } from "@/types/simulation";
import Link from "next/link";

export default function HomePage() {
  const {
    educationalProperties,
    setEducationalProperties,
    setPropertyCache,
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
  const [activeUsers, setActiveUsers] = useState(37);

  const memoizedProperties = useMemo(() => {
    const propertyImageMap: Record<string, string> = {
      아파트: "/apartment.jpg",
      오피스텔: "/officetel.png",
      단독주택: "/dandok.jpg",
      빌라: "/villa.jpg",
      원룸: "/oneroom.jpg",
      주택: "/dandok.jpg",
      다가구주택: "/manyapart.png",
      근린주택: "/greenapart.jpg",
      도시형생활주택: "/cityapart.png",
    };

    return educationalProperties
      .filter((property) => property && property.basicInfo)
      .map((property) => ({
        ...property,
        propertyImage:
          propertyImageMap[property.basicInfo.propertyType] || "/placeholder.png",
      }));
  }, [educationalProperties]);

  useEffect(() => {
    if (educationalProperties.length === 0) {
      loadInitialProperties();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(10, prev + change);
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const loadInitialProperties = async (filters?: PropertyFilterOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "🏠 [메인페이지] 매물 생성 시작",
        filters ? "필터 적용" : "기본 생성"
      );

      const difficulties: DifficultyLevel[] = [
        "초급",
        "초급",
        "중급",
        "중급",
        "중급",
        "고급",
        "고급",
        "고급",
      ];

      const convertedFilters = filters
        ? {
            propertyTypes: filters.propertyType ? [filters.propertyType] : undefined,
            regions: filters.region ? [filters.region] : undefined,
            priceRange: filters.priceRange,
            difficultyLevels: filters.difficultyLevel ? [filters.difficultyLevel] : undefined,
            rightTypes: filters.rightTypes.length > 0 ? filters.rightTypes : undefined,
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

      // 매물 데이터를 스토어에 저장
      properties.forEach((property) => {
        setPropertyCache(property.basicInfo.caseNumber, property);
      });

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

  const handleFilterChange = (filters: PropertyFilterOptions) => {
    setCurrentFilters(filters);
    console.log("🔍 [메인페이지] 필터 변경:", filters);
  };

  const handleApplyFilterWithFilters = async (filters: PropertyFilterOptions) => {
    console.log("🔍 [메인페이지] 필터 적용 요청:", filters);

    const modifiedFilters = {
      ...filters,
      region: "",
      priceRange: { min: 0, max: 5000000000 },
    };

    const filterStats = {
      매물유형: filters.propertyType || "전체",
      지역: "랜덤 생성",
      가격범위: "랜덤 생성",
      난이도: filters.difficultyLevel || "전체",
      권리유형: filters.rightTypes.length > 0 ? filters.rightTypes.join(", ") : "전체",
    };

    console.log("📊 [메인페이지] 필터 적용 통계:", filterStats);

    await loadInitialProperties(modifiedFilters);
  };

  const handleApplyFilter = async () => {
    await handleApplyFilterWithFilters(currentFilters);
  };

  const remainingRefreshes = "";

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

    if (isLeftSwipe && currentCardIndex < memoizedProperties.length - 1) {
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
      {process.env.NODE_ENV !== "production" && <DevModeToggle />}

      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between py-3 sm:py-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/bmlogo.png" alt="Bid Master Logo" className="h-6 w-6 sm:h-8 sm:w-8 object-contain" />
              <div className="flex flex-col items-start">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Bid master</h1>
                <p className="text-xs font-medium tracking-wide text-gray-500 hidden sm:block">Fail, Fast, learn faster</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2 sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">
              <button onClick={() => { console.log("📚 [주요경매용어] 모달 열기 요청"); setIsAuctionTermsModalOpen(true); }} className="inline-flex items-center justify-center px-3 py-2 font-medium text-xs transition-all duration-200 hover:bg-gray-100 rounded-md text-gray-900 hover:-translate-y-1 hover:shadow-md">경매용어</button>
              <Link href="/calculator" className="inline-flex items-center justify-center px-3 py-2 font-medium text-xs transition-all duration-200 hover:bg-gray-100 rounded-md text-gray-900 hover:-translate-y-1 hover:shadow-md">수익 계산기</Link>
              <Link href="/guide" onClick={() => { console.log("📖 [실전 가이드] 페이지 이동"); }} className="inline-flex items-center justify-center px-3 py-2 font-medium text-xs transition-all duration-200 hover:bg-gray-100 rounded-md text-gray-900 hover:-translate-y-1 hover:shadow-md">실전 가이드</Link>
              <button onClick={() => { console.log("💬 [피드백] 피드백 모달 열기 요청"); setIsExpertColumnPreparing(true); }} className="inline-flex items-center justify-center px-3 py-2 font-medium text-xs transition-all duration-200 hover:bg-gray-100 rounded-md text-gray-900 hover:-translate-y-1 hover:shadow-md">피드백</button>
              <button onClick={() => { console.log("🔔 [사전 알림] 모달 열기 요청"); setIsWaitlistModalOpen(true); }} className="inline-flex items-center justify-center px-3 py-2 font-medium text-xs transition-all duration-200 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:-translate-y-1 hover:shadow-md">사전 알림 신청</button>
            </div>
            <div className="hidden sm:flex items-center">
              <div className="inline-flex items-center justify-center px-3 py-1.5 font-medium text-xs bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed opacity-60 hover:bg-gray-400 hover:opacity-80 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>로그인</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 flex items-center justify-center bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight text-gray-900">부동산 경매, 아직도 비싼 돈 주고 배우세요?</h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-4 font-normal leading-relaxed max-w-3xl mx-auto text-gray-600">로그인 없이 시작하는 경매 학습 시뮬레이션</p>
            <p className="text-base sm:text-lg mb-8 font-normal leading-relaxed max-w-2xl mx-auto text-gray-500">최대한 많이 실패하고, 더 많이 배울 수 있습니다.</p>
            <div className="flex justify-center items-center">
              <button onClick={() => { console.log("🏠 [실전경매훈련] 버튼 클릭 - 매물 섹션으로 스크롤"); document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" }); }} className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm" style={{ backgroundColor: "#F3F4F6" }}>
                <span>실전 경매 훈련</span>
                <svg className="ml-2 w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <HeroBelow activeUsers={activeUsers} />

      <section id="properties" className="py-12 relative bg-white">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="container mx-auto px-4 max-w-6xl">
          <DashboardHeader />
          <PropertyFilter onFilterChange={setCurrentFilters} onApplyFilter={handleApplyFilter} onRefresh={handleRefresh} isLoading={isLoading} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 font-medium text-sm">{error}</div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
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

          {!isLoading && memoizedProperties.length > 0 && (
            <>
              <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
                {memoizedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} propertyImage={property.propertyImage} />
                ))}
              </div>
              <div className="md:hidden">
                <div className="swipeable overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                  <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentCardIndex * 100}%)` }}>
                    {memoizedProperties.map((property) => (
                      <div key={property.id} className="w-full flex-shrink-0 px-2">
                        <PropertyCard property={property} propertyImage={property.propertyImage} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center mt-4 space-x-2">
                  {memoizedProperties.map((_, index) => (
                    <button key={index} onClick={() => { console.log(`📱 [스와이프] 인디케이터 클릭 - 카드 ${index + 1}`); setCurrentCardIndex(index); }} className={`w-2 h-2 rounded-full transition-colors ${index === currentCardIndex ? "bg-slate-900" : "bg-gray-300"}`} />
                  ))}
                </div>
              </div>
            </>
          )}

          {!isLoading && memoizedProperties.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">아직 생성된 매물이 없습니다</h3>
              <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">새로운 매물을 생성하여 경매 시뮬레이션을 시작해보세요</p>
              <button onClick={() => loadInitialProperties()} className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm">매물 생성하기</button>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <WaitlistModal isOpen={isWaitlistModalOpen} onClose={() => { console.log("🔔 [사전 알림] 모달 닫기"); setIsWaitlistModalOpen(false); }} />
      <AuctionTermsModal isOpen={isAuctionTermsModalOpen} onClose={() => { console.log("📚 [주요경매용어] 모달 닫기"); setIsAuctionTermsModalOpen(false); }} />

      {isExpertColumnPreparing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-6">💬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">피드백을 남겨주세요</h2>
              <p className="text-lg text-gray-600 mb-8">서비스 개선을 위해 여러분의 소중한 의견을 들려주세요</p>
              <div className="space-y-4">
                <textarea 
                  placeholder="서비스에 대한 의견이나 개선사항을 자유롭게 작성해주세요..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => { console.log("💬 [피드백] 피드백 제출"); setIsExpertColumnPreparing(false); }} className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm w-full">피드백 제출</button>
                <button onClick={() => { console.log("💬 [피드백] 모달 닫기"); setIsExpertColumnPreparing(false); }} className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-all duration-200 text-sm w-full">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
