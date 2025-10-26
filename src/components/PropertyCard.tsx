/**
 * Bid Master AI - 교육용 매물 카드 컴포넌트
 */

"use client";

import { useState, useEffect } from "react";
import { SimulationScenario } from "@/types/simulation";
import Link from "next/link";
import { BiddingModal } from "./BiddingModal";
import {
  searchUniquePropertyImage,
  clearCommercialPropertyCache,
} from "@/lib/unsplash-client";

// 용어 설명 함수 - 핵심분석에 나오는 용어들만 설명
function getTermExplanation(term: string, keyPoints: string[] = []): string {
  // 핵심분석 포인트들에서 해당 용어가 포함된 경우만 설명 제공
  const isTermInKeyPoints = keyPoints.some(
    (point) => point.includes(term) || term.includes(point.split(" ")[0])
  );

  if (!isTermInKeyPoints) {
    return term; // 핵심분석에 없는 용어는 설명 없이 그대로 반환
  }
  const explanations: { [key: string]: string } = {
    시장가: "부동산의 실제 거래가격. 감정가와 다를 수 있습니다.",
    감정가: "부동산의 시장가치를 전문가가 평가한 금액. 경매의 기준이 됩니다.",
    입찰시작가: "경매에서 입찰을 시작하는 최초 가격",
    최저가:
      "경매에서 매각할 수 있는 최소 금액. 보통 감정가의 70-80% 수준입니다.",
    입찰: "경매에서 매물을 구매하기 위해 가격을 제시하는 행위",
    경매: "채무를 변제하기 위해 부동산을 공개적으로 매각하는 절차.",
    부동산임의경매:
      "채무자가 자발적으로 부동산을 경매에 부치는 절차. 강제경매와 구분됩니다.",
    강제경매: "채권자가 법원에 신청하여 부동산을 경매에 부치는 절차.",
    "다중 근저당권":
      "한 부동산에 여러 개의 근저당권이 설정된 상태. 우선순위에 따라 배당받는 순서가 결정됩니다.",
    "임차인 대항력":
      "임차인이 경매에서 자신의 권리를 주장할 수 있는 법적 지위. 전입일과 확정일자 요건을 충족해야 합니다.",
    소액임차인:
      "보증금이 일정 금액 이하인 임차인. 경매에서 우선변제를 받을 수 있는 특별한 보호를 받습니다.",
    말소기준권리:
      "경매에서 가장 우선순위가 높은 권리. 이 권리보다 나중에 설정된 권리들은 말소됩니다.",
    가압류:
      "채권자가 채무자의 재산을 미리 압류해 두는 법적 조치. 경매에서 배당받을 권리가 있습니다.",
    전세권:
      "임대차와 유사하지만 더 강한 권리. 경매에서도 인정받을 수 있습니다.",
    우선변제: "일반 채권자보다 먼저 변제받을 수 있는 특별한 권리입니다.",
    배당요구종기:
      "경매에서 권리를 주장하려면 이 날짜까지 신청해야 하는 마감일입니다.",
    근저당권:
      "채권 담보를 위해 부동산에 설정하는 권리. 경매에서 가장 우선적으로 배당받습니다.",
    지상권:
      "타인의 토지 위에 건물을 짓고 사용할 수 있는 권리. 경매에서도 인정받을 수 있습니다.",
    유찰: "경매에서 입찰자가 없거나 최저가에 도달하지 못해 매각되지 않는 것.",
    입찰보증금:
      "경매에 참여하기 위해 미리 납부하는 보증금. 낙찰 시 계약금으로 전환됩니다.",
    확정일자:
      "임차인이 전입신고를 하고 받는 증명서. 대항력 인정의 중요한 요건입니다.",
    전입신고:
      "새로운 주소로 이사했을 때 관할 동사무소에 신고하는 것. 임차인 대항력의 첫 번째 요건입니다.",
    인수: "경매 낙찰자가 기존 권리나 임차인을 그대로 인정하고 인수하는 것.",
    배당: "경매 매각대금을 각 권리자들에게 우선순위에 따라 나누어 주는 것.",
    낙찰: "경매에서 최고가로 입찰한 사람이 매물을 구매하는 것.",
    대항력: "임차인의 권리 보호 수준 - 경매에서 임차인 권리가 보호되는 정도",
  };

  return explanations[term] || term;
}

interface PropertyCardProps {
  property: SimulationScenario;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { basicInfo, educationalContent } = property;
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [propertyImage, setPropertyImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // 난이도별 색상
  const difficultyColors = {
    초급: "bg-green-100 text-green-800 border-green-300",
    중급: "bg-yellow-100 text-yellow-800 border-yellow-300",
    고급: "bg-red-100 text-red-800 border-red-300",
  };

  const difficultyColor = educationalContent
    ? difficultyColors[educationalContent.difficulty]
    : "bg-gray-100 text-gray-800 border-gray-300";

  // 매물 이미지 로드
  useEffect(() => {
    const loadPropertyImage = async () => {
      try {
        console.log(
          `🖼️ [매물카드] 이미지 로드 시작 - ${basicInfo.propertyType}`
        );
        setImageLoading(true);

        // 상가 매물 유형인 경우 고정 이미지 사용
        if (basicInfo.propertyType === "상가") {
          const commercialImageUrl =
            "https://images.unsplash.com/photo-1677933416890-14c28bc64052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080";
          setPropertyImage(commercialImageUrl);
          console.log(
            `🏪 [매물카드] 상가 매물 유형 - 고정 이미지 사용: ${commercialImageUrl}`
          );
          setImageLoading(false);
          return;
        }

        // 빌라 매물 유형인 경우 고정 이미지 사용
        if (basicInfo.propertyType === "빌라") {
          const villaImageUrl =
            "https://images.unsplash.com/photo-1760129745103-91c4022ed5fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080";
          setPropertyImage(villaImageUrl);
          console.log(
            `🏠 [매물카드] 빌라 매물 유형 - 고정 이미지 사용: ${villaImageUrl}`
          );
          setImageLoading(false);
          return;
        }

        const imageUrl = await searchUniquePropertyImage(
          basicInfo.propertyType,
          basicInfo.locationShort,
          basicInfo.marketValue
        );

        if (imageUrl) {
          setPropertyImage(imageUrl);
          console.log(`✅ [매물카드] 이미지 로드 성공: ${imageUrl}`);
        } else {
          console.log(`⚠️ [매물카드] 이미지 로드 실패 - 기본 이미지 사용`);
        }
      } catch (error) {
        console.error(`❌ [매물카드] 이미지 로드 오류:`, error);
      } finally {
        setImageLoading(false);
      }
    };

    loadPropertyImage();
  }, [basicInfo.propertyType, basicInfo.locationShort, basicInfo.marketValue]);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200">
      {/* 매물 이미지 */}
      <div className="h-48 relative overflow-hidden">
        {imageLoading ? (
          // 로딩 상태
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">이미지 로딩중...</div>
            </div>
          </div>
        ) : propertyImage ? (
          // 실제 이미지
          <img
            src={propertyImage}
            alt={`${basicInfo.propertyType} - ${basicInfo.locationShort}`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              console.log(`❌ [매물카드] 이미지 로드 실패: ${propertyImage}`);
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}

        {/* 이미지 로드 실패 시 기본 표시 */}
        <div
          className={`w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ${
            propertyImage ? "hidden" : ""
          }`}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🏢</div>
            <div className="text-sm text-gray-600">
              {basicInfo.propertyType}
            </div>
          </div>
        </div>

        {/* 매물 유형 오버레이 */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
          {basicInfo.propertyType}
        </div>
      </div>

      {/* 매물 정보 */}
      <div className="p-4">
        {/* 난이도 뱃지 */}
        {educationalContent && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${difficultyColor}`}
            >
              {educationalContent.difficulty}
            </span>
            <span className="text-xs text-gray-500">
              {educationalContent.oneLiner}
            </span>
          </div>
        )}

        {/* 사건번호 */}
        <div className="text-sm text-gray-500 mb-1">{basicInfo.caseNumber}</div>

        {/* 소재지 */}
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
          {basicInfo.locationShort}
        </h3>

        {/* 물건종별 */}
        <div className="text-sm text-gray-600 mb-3">
          {basicInfo.propertyType}
        </div>

        {/* 가격 정보 */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm group">
            <span
              className="text-gray-600 group-hover:text-blue-600 transition-colors cursor-help"
              title={getTermExplanation("시장가")}
            >
              시장가
            </span>
            <span className="font-semibold text-green-600">
              {basicInfo.marketValue.toLocaleString("ko-KR")}원
            </span>
          </div>
          <div className="flex justify-between text-sm group">
            <span
              className="text-gray-600 group-hover:text-blue-600 transition-colors cursor-help"
              title={getTermExplanation("감정가")}
            >
              감정가
            </span>
            <span className="font-semibold text-gray-900">
              {basicInfo.appraisalValue.toLocaleString("ko-KR")}원
            </span>
          </div>
          <div className="flex justify-between text-sm group">
            <span
              className="text-gray-600 group-hover:text-blue-600 transition-colors cursor-help"
              title={getTermExplanation("입찰시작가")}
            >
              입찰시작가
            </span>
            <span className="font-semibold text-orange-600">
              {basicInfo.startingBidPrice.toLocaleString("ko-KR")}원
            </span>
          </div>
          <div className="flex justify-between text-sm group">
            <span
              className="text-gray-600 group-hover:text-blue-600 transition-colors cursor-help"
              title={getTermExplanation("최저가")}
            >
              최저가
            </span>
            <span className="font-bold text-blue-600">
              {basicInfo.minimumBidPrice.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>

        {/* 입찰 상태 */}
        <div className="text-xs text-gray-500 mb-4">
          입찰 {basicInfo.daysUntilBid}일 전
        </div>

        {/* 교육 포인트 태그 */}
        {educationalContent && (
          <div className="flex flex-wrap gap-1 mb-4">
            {educationalContent.coreAnalysis.keyPoints
              .slice(0, 2)
              .map((point, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded cursor-help group"
                  title={getTermExplanation(
                    point,
                    educationalContent.coreAnalysis.keyPoints
                  )}
                >
                  {point.substring(0, 15)}...
                </span>
              ))}
          </div>
        )}

        {/* 권리 유형 표시 */}
        {property.rights && property.rights.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {property.rights.slice(0, 3).map((right, index) => (
              <span
                key={right.id}
                className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded"
                title={`${right.rightType} - ${
                  right.rightHolder
                } (${right.claimAmount.toLocaleString()}원)`}
              >
                {right.rightType}
              </span>
            ))}
            {property.rights.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs">
                +{property.rights.length - 3}개
              </span>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2">
          <Link
            href={`/property/${property.id}`}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-center text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            상세보기
          </Link>
          <button
            onClick={() => setIsBiddingModalOpen(true)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-center text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            경매입찰
          </button>
        </div>
      </div>

      {/* 입찰 팝업 */}
      <BiddingModal
        property={property}
        isOpen={isBiddingModalOpen}
        onClose={() => setIsBiddingModalOpen(false)}
      />
    </div>
  );
}
