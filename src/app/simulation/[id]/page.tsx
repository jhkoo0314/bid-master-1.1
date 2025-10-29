import React from "react";
import { SimulationScenario } from "@/types/simulation";

interface PageProps { 
  params: Promise<{ id: string }> 
}

export default async function SimulationPage({ params }: PageProps) {
  const { id } = await params;
  
  console.log(`🚀 [시뮬레이션] 페이지 조회: ${id}`);

  // TODO: 실제 시뮬레이션 데이터를 가져오는 로직 구현
  // 현재는 임시 데이터로 표시
  const mockScenario: SimulationScenario = {
    id,
    type: "simulation",
    basicInfo: {
      caseNumber: `2024타경${id}`,
      location: "서울특별시 강남구 역삼동 123-45",
      appraisedValue: 1500000000,
      minimumBid: 1200000000,
      court: "서울중앙지방법원",
      judge: "김판사"
    },
    propertyDetails: {
      propertyType: "아파트",
      landArea: 99.2,
      buildingArea: 84.5,
      floor: 15,
      totalFloors: 20,
      direction: "남향",
      structure: "철근콘크리트",
      completionDate: "2015-03-15"
    },
    schedule: {
      nextAuctionDate: "2024-03-15",
      auctionTime: "14:00",
      registrationDeadline: "2024-03-10",
      depositDeadline: "2024-03-12"
    },
    biddingHistory: [],
    rights: [],
    tenants: [],
    similarSales: [],
    regionalAnalysis: {
      region: "강남구",
      averagePrice: 12000000,
      priceTrend: "상승",
      facilities: ["지하철", "학교", "병원"],
      links: []
    },
    createdAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#0B1220]">
            시뮬레이션: {mockScenario.basicInfo.caseNumber}
          </h1>
          <p className="mt-2 text-[#5B6475]">
            {mockScenario.basicInfo.location} {mockScenario.propertyDetails.propertyType}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
              <h2 className="text-lg font-semibold text-[#0B1220] mb-4">기본 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-[#5B6475]">감정가</div>
                  <div className="text-lg font-semibold">{mockScenario.basicInfo.appraisedValue.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-sm text-[#5B6475]">최저가</div>
                  <div className="text-lg font-semibold">{mockScenario.basicInfo.minimumBid.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-sm text-[#5B6475]">할인율</div>
                  <div className="text-lg font-semibold text-red-600">
                    {Math.round((1 - mockScenario.basicInfo.minimumBid / mockScenario.basicInfo.appraisedValue) * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#5B6475]">입찰보증금</div>
                  <div className="text-lg font-semibold">{Math.round(mockScenario.basicInfo.minimumBid * 0.1).toLocaleString()}원</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
              <h2 className="text-lg font-semibold text-[#0B1220] mb-4">매물 상세</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-[#5B6475]">유형</div>
                  <div className="font-semibold">{mockScenario.propertyDetails.propertyType}</div>
                </div>
                <div>
                  <div className="text-sm text-[#5B6475]">면적</div>
                  <div className="font-semibold">{mockScenario.propertyDetails.landArea}㎡</div>
                </div>
                <div>
                  <div className="text-sm text-[#5B6475]">층수</div>
                  <div className="font-semibold">{mockScenario.propertyDetails.floor}층</div>
                </div>
                <div>
                  <div className="text-sm text-[#5B6475]">구조</div>
                  <div className="font-semibold">{mockScenario.propertyDetails.structure}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
              <h2 className="text-lg font-semibold text-[#0B1220] mb-4">입찰 일정</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#5B6475]">다음 입찰일</span>
                  <span className="font-semibold">{mockScenario.schedule.nextAuctionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6475]">입찰 시간</span>
                  <span className="font-semibold">{mockScenario.schedule.auctionTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6475]">등기 마감</span>
                  <span className="font-semibold">{mockScenario.schedule.registrationDeadline}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
              <h2 className="text-lg font-semibold text-[#0B1220] mb-4">시뮬레이션 시작</h2>
              <p className="text-sm text-[#5B6475] mb-4">
                이 매물로 실전 경매 시뮬레이션을 시작하세요.
              </p>
              <button className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 hover:bg-blue-700 transition">
                시뮬레이션 시작
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
              <h2 className="text-lg font-semibold text-[#0B1220] mb-4">지역 정보</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#5B6475]">지역</span>
                  <span className="text-sm font-semibold">{mockScenario.regionalAnalysis.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#5B6475]">평균가</span>
                  <span className="text-sm font-semibold">{mockScenario.regionalAnalysis.averagePrice.toLocaleString()}원/㎡</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#5B6475]">가격 추세</span>
                  <span className="text-sm font-semibold text-green-600">{mockScenario.regionalAnalysis.priceTrend}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
