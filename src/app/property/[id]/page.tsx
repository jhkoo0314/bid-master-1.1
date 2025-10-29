"use client";

import React, { useState, useEffect } from "react";
import SummaryHeader from "@/components/property/SummaryHeader";
import StickyBar from "@/components/property/StickyBar";
import SectionCard from "@/components/property/SectionCard";
import DecisionPanel from "@/components/property/DecisionPanel";
import ScheduleTable from "@/components/property/ScheduleTable";
import RightsTable from "@/components/property/RightsTable";
import PayoutTable from "@/components/property/PayoutTable";
import RegionPanel from "@/components/property/RegionPanel";
import { PropertyDetail } from "@/types/property";
import { SimulationScenario } from "@/types/simulation";
import { useSimulationStore } from "@/store/simulation-store";
import { mapSimulationToPropertyDetail } from "@/lib/property/formatters";

interface PageProps { 
  params: Promise<{ id: string }> 
}

export default function PropertyPage({ params }: PageProps) {
  const [caseId, setCaseId] = useState<string>("");
  const [data, setData] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getPropertyFromCache, educationalProperties } = useSimulationStore();

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      // URL 디코딩 처리
      const decodedCaseId = decodeURIComponent(resolvedParams.id);
      setCaseId(decodedCaseId);
      console.log(`🏠 [매물 상세] 페이지 조회: ${decodedCaseId}`);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!caseId) return;

    const loadPropertyDetail = async () => {
      try {
        setIsLoading(true);
        console.log(`🗂️ [데이터] PropertyDetail 조회 시작: caseId=${caseId}`);
        
        // 1. 스토어에서 매물 데이터 조회 시도
        const cachedScenario = getPropertyFromCache(caseId);
        if (cachedScenario) {
          console.log(`💾 [캐시] 매물 데이터 조회 성공: ${caseId}`);
          const mapped = mapSimulationToPropertyDetail(cachedScenario);
          setData(mapped);
          setIsLoading(false);
          return;
        }

        // 2. 교육용 매물 목록에서 조회 시도
        const foundScenario = educationalProperties.find(
          (prop) => prop.basicInfo.caseNumber === caseId
        );
        if (foundScenario) {
          console.log(`📚 [교육용] 매물 데이터 조회 성공: ${caseId}`);
          const mapped = mapSimulationToPropertyDetail(foundScenario);
          setData(mapped);
          setIsLoading(false);
          return;
        }

        // 3. 찾지 못한 경우 에러
        console.log(`❌ [에러] 매물 데이터를 찾을 수 없음: ${caseId}`);
        setError("매물 정보를 찾을 수 없습니다.");
      } catch (err) {
        console.error("❌ [에러] 매물 상세 정보 로드 실패", err);
        setError("매물 정보를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPropertyDetail();
  }, [caseId, getPropertyFromCache, educationalProperties]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="lg:col-span-4 space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">매물을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">{error || "요청하신 매물 정보가 존재하지 않습니다."}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* 뒤로가기 버튼 */}
      <div className="mb-4">
        <button
          onClick={() => {
            console.log("🔙 [뒤로가기] 사용자가 뒤로가기 버튼 클릭");
            window.history.back();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
          뒤로가기
        </button>
      </div>
      
      <SummaryHeader caseId={data.caseId} meta={data.meta} price={data.price} nextAuction={data.nextAuction} />
      <div className="h-3" />
      <StickyBar lowestPrice={data.price.lowest} nextAuctionDate={data.nextAuction.date} court={data.nextAuction.court} topRisk={data.risks[0]?.title} />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <DecisionPanel
            recommendedRange={{ min: Math.round(data.price.lowest * 0.95), max: Math.round(data.price.lowest * 1.05) }}
            risks={data.risks}
          />

          <SectionCard title="진행/매각 일정" description="진행 상태를 시간 순으로 확인합니다." source="법원 공고" updatedAt={data.snapshotAt}>
            <ScheduleTable data={data.schedules} />
          </SectionCard>

          <SectionCard title="권리관계" description="권리의 순위와 말소/인수 여부를 확인합니다." source="등기부등본" updatedAt={data.snapshotAt}>
            <RightsTable data={data.rights} />
          </SectionCard>

          <SectionCard title="예상 배당" description="최저가 기준 예상 배당 금액입니다." source="배당표 추정" updatedAt={data.snapshotAt}>
            <PayoutTable data={data.payout.rows} />
          </SectionCard>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <RegionPanel region={data.region} />
        </div>
      </div>
    </div>
  );
}
