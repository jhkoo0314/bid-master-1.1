/**
 * Bid Master AI - 교육용 매물 카드 컴포넌트
 */

"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { SimulationScenario } from "@/types/simulation";
import Link from "next/link";
import { BiddingModal } from "./BiddingModal";

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
  propertyImage?: string;
}

export function PropertyCard({
  property,
  propertyImage: initialPropertyImage,
}: PropertyCardProps) {
  const { basicInfo, educationalContent } = property;
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  // props로 받은 이미지를 사용하거나 기본 이미지 사용
  const displayImage = initialPropertyImage || "/placeholder.png";

  // 모달 닫기 핸들러 - useCallback으로 메모이제이션하여 불필요한 리렌더링 방지
  const handleCloseModal = useCallback(() => {
    console.log("🔒 [매물카드] 입찰 모달 닫기");
    setIsBiddingModalOpen(false);
  }, []);

  // 모달 열기 핸들러 - useCallback으로 메모이제이션
  const handleOpenModal = useCallback(() => {
    console.log("🔓 [매물카드] 입찰 모달 열기");
    setIsBiddingModalOpen(true);
  }, []);

  // 호버 애니메이션 핸들러 제거 - CSS 호버 효과만 사용

  // 난이도별 색상 - Bid Master 커스텀 컬러 사용 (1단계 줄임)
  const difficultyColors = {
    초급: "bg-green-50 text-green-700 border-green-200",
    중급: "bg-yellow-50 text-yellow-700 border-yellow-200",
    고급: "bg-red-50 text-red-700 border-red-200",
  };

  // 난이도 결정 로직 - educationalContent가 없으면 랜덤하게 결정
  const getDifficulty = () => {
    if (educationalContent?.difficulty) {
      return educationalContent.difficulty;
    }
    // educationalContent가 없으면 매물 유형과 가격에 따라 난이도 결정
    const difficulties = ["초급", "중급", "고급"];
    const randomIndex = Math.floor(Math.random() * difficulties.length);
    return difficulties[randomIndex];
  };

  const difficulty = getDifficulty();
  const difficultyColor =
    difficultyColors[difficulty] || "bg-gray-100 text-gray-800 border-gray-300";

  // ESC 키로 이미지 뷰어 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isImageViewerOpen) {
        console.log("🖼️ [매물카드] ESC 키로 풀스크린 뷰어 닫기");
        setIsImageViewerOpen(false);
      }
    };

    if (isImageViewerOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageViewerOpen]);

  // 이미지 로딩 상태를 즉시 완료로 설정 (이미지가 props로 제공됨)
  useEffect(() => {
    setImageLoading(false);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full min-h-[280px]">
      {/* 매물 이미지 */}
      <div className="aspect-[3/1] md:aspect-[4/2] lg:aspect-[5/3] relative overflow-hidden">
        {imageLoading ? (
          // 로딩 상태
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-1"></div>
              <div className="text-xs text-gray-600 font-medium">
                이미지 로딩중...
              </div>
            </div>
          </div>
        ) : displayImage ? (
          // 실제 이미지
          <img
            src={displayImage}
            alt={`${basicInfo.propertyType} - ${basicInfo.locationShort}`}
            className="w-full h-full object-cover transition-transform duration-300 cursor-pointer hover:scale-105"
            onClick={() => {
              console.log("🖼️ [매물카드] 이미지 클릭 - 풀스크린 뷰어 열기");
              setIsImageViewerOpen(true);
            }}
            onError={(e) => {
              console.log(`❌ [매물카드] 이미지 로드 실패: ${displayImage}`);
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}

        {/* 이미지 로드 실패 시 기본 표시 */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${
            displayImage ? "hidden" : ""
          }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">🏢</div>
            <div className="text-sm text-gray-600 font-medium">
              {basicInfo.propertyType}
            </div>
          </div>
        </div>

        {/* 매물 유형 오버레이 - 단독주택 가독성 개선 */}
        <div
          className="absolute top-3 left-3 text-black px-1.5 py-0.5 rounded-full text-xs font-normal shadow-lg border border-gray-300"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }}
        >
          {basicInfo.propertyType}
        </div>
      </div>

      {/* 매물 정보 - 컴팩트 Vercel 스타일 */}
      <div className="p-3 flex flex-col flex-grow transition-all duration-300">
        {/* 사건번호와 난이도 */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-gray-500 font-medium">
            {basicInfo.caseNumber}
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-xs font-normal border whitespace-nowrap ${difficultyColor}`}
          >
            {difficulty}
          </span>
        </div>

        {/* 교육 콘텐츠 한줄 요약 */}
        {educationalContent && (
          <div className="mb-2">
            <span className="text-xs text-gray-500 line-clamp-1 font-medium">
              {educationalContent.oneLiner}
            </span>
          </div>
        )}

        {/* 소재지 */}
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm leading-tight">
          {basicInfo.locationShort}
        </h3>

        {/* 가격 정보 - 컴팩트 Vercel 스타일 */}
        <div className="space-y-1.5 mb-3 transition-all duration-300">
          <div className="flex justify-between items-center group">
            <span
              className="text-gray-600 transition-colors cursor-help font-medium text-sm"
              title={getTermExplanation("감정가")}
            >
              감정가
            </span>
            <span className="text-black text-sm font-semibold transition-colors duration-300">
              {basicInfo.appraisalValue.toLocaleString("ko-KR")}원
            </span>
          </div>
          <div className="flex justify-between items-center group">
            <span
              className="text-gray-600 transition-colors cursor-help font-medium text-sm"
              title={getTermExplanation("최저가")}
            >
              최저가
            </span>
            <span className="text-black text-sm font-semibold transition-colors duration-300">
              {basicInfo.minimumBidPrice.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>

        {/* 권리 유형 표시 - 컴팩트 Vercel 스타일 */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5 min-h-[24px] items-center">
            {property.rights && property.rights.length > 0 ? (
              <>
                {property.rights.slice(0, 2).map((right, index) => (
                  <span
                    key={right.id}
                    className="px-1.5 py-0.5 bg-danger/10 text-danger text-xs rounded-full font-normal border border-danger/30"
                    title={`${right.rightType} - ${
                      right.rightHolder
                    } (${right.claimAmount.toLocaleString()}원)`}
                  >
                    {right.rightType}
                  </span>
                ))}
                {property.rights.length > 2 && (
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-normal">
                    +{property.rights.length - 2}개
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400 text-xs">권리 정보 없음</span>
            )}
          </div>
        </div>

        {/* 버튼 - 컴팩트 Vercel 스타일 */}
        <div className="flex gap-2 mt-auto transition-transform duration-300">
          <Link
            href={`/property/${property.basicInfo.caseNumber}`}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-center text-xs font-semibold rounded-full hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-200 flex items-center justify-center"
          >
            상세보기
          </Link>
          <button
            onClick={() => {
              console.log(
                "🎯 [UI 변경] 경매입찰 버튼을 상세보기와 동일한 스타일로 변경"
              );
              handleOpenModal();
            }}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-center text-xs font-semibold rounded-full hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-200 flex items-center justify-center"
          >
            경매입찰
          </button>
        </div>
      </div>

      {/* 입찰 팝업 */}
      <BiddingModal
        property={property}
        isOpen={isBiddingModalOpen}
        onClose={handleCloseModal}
      />

      {/* 풀스크린 이미지 뷰어 */}
      {isImageViewerOpen && displayImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={(e) => {
            // 배경 클릭 시 모달 닫기
            if (e.target === e.currentTarget) {
              console.log("🖼️ [매물카드] 배경 클릭으로 풀스크린 뷰어 닫기");
              setIsImageViewerOpen(false);
            }
          }}
        >
          <div className="relative max-w-full max-h-full p-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🖼️ [매물카드] X 버튼 클릭으로 풀스크린 뷰어 닫기");
                setIsImageViewerOpen(false);
              }}
              className="absolute top-2 right-2 text-white text-2xl hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="이미지 뷰어 닫기"
            >
              ✕
            </button>
            <img
              src={displayImage}
              alt={`${basicInfo.propertyType} - ${basicInfo.locationShort}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PropertyCard);
