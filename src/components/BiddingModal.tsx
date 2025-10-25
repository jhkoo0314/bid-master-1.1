/**
 * Bid Master AI - 경매 입찰 팝업 컴포넌트
 */

"use client";

import { useState, useEffect } from "react";
import { SimulationScenario } from "@/types/simulation";
import { WaitlistModal } from "./WaitlistModal";

interface BiddingModalProps {
  property: SimulationScenario;
  isOpen: boolean;
  onClose: () => void;
}

interface BiddingResult {
  userBidPrice: number;
  isSuccess: boolean;
  competitionRate: number;
  totalBidders: number;
  winningBidPrice: number;
  virtualBidders: Array<{
    name: string;
    bidPrice: number;
    isWinner: boolean;
  }>;
  rightsAnalysis: {
    totalAssumedAmount: number;
    safetyMargin: number;
    recommendedRange: {
      min: number;
      max: number;
    };
  };
  profitAnalysis: {
    expectedProfit: number;
    roi: number;
    totalInvestment: number;
  };
}

export function BiddingModal({ property, isOpen, onClose }: BiddingModalProps) {
  const [bidPrice, setBidPrice] = useState<number>(
    property.basicInfo.minimumBidPrice
  );
  const [bidPriceDisplay, setBidPriceDisplay] = useState<string>(
    property.basicInfo.minimumBidPrice.toLocaleString("ko-KR")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biddingResult, setBiddingResult] = useState<BiddingResult | null>(
    null
  );
  const [showRightsAnalysis, setShowRightsAnalysis] = useState(false);
  const [showProfitAnalysis, setShowProfitAnalysis] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  // 숫자 포맷팅 함수
  const formatNumber = (value: number): string => {
    return value.toLocaleString("ko-KR");
  };

  // 문자열을 숫자로 파싱하는 함수
  const parseFormattedNumber = (value: string): number => {
    return parseInt(value.replace(/,/g, "")) || 0;
  };

  // 입찰가 입력 핸들러
  const handleBidPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseFormattedNumber(e.target.value);
    setBidPrice(numericValue);
    setBidPriceDisplay(formatNumber(numericValue));
    console.log(
      "입찰가 입력:",
      numericValue,
      "포맷된 값:",
      formatNumber(numericValue)
    );
  };

  // 가상 경쟁자 생성 함수
  const generateVirtualBidders = (
    userBid: number,
    minBid: number
  ): Array<{
    name: string;
    bidPrice: number;
    isWinner: boolean;
  }> => {
    const names = [
      "김부동산",
      "이투자",
      "박경매",
      "최개발",
      "정수익",
      "강매물",
      "윤투자",
      "임개발",
      "한부동산",
      "조경매",
    ];

    const totalBidders = Math.floor(Math.random() * 8) + 3; // 3-10명
    const bidders = [];

    for (let i = 0; i < totalBidders; i++) {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomBid =
        minBid + Math.floor(Math.random() * (userBid * 1.2 - minBid));

      bidders.push({
        name: randomName,
        bidPrice: randomBid,
        isWinner: false,
      });
    }

    // 사용자 입찰가 추가
    bidders.push({
      name: "나",
      bidPrice: userBid,
      isWinner: false,
    });

    // 입찰가 순으로 정렬
    bidders.sort((a, b) => b.bidPrice - a.bidPrice);

    // 최고가를 낙찰자로 설정
    bidders[0].isWinner = true;

    return bidders;
  };

  // 입찰 제출 핸들러
  const handleSubmitBid = async () => {
    if (bidPrice < property.basicInfo.minimumBidPrice) {
      alert(
        `최저 입찰가는 ${formatNumber(
          property.basicInfo.minimumBidPrice
        )}원입니다.`
      );
      return;
    }

    setIsSubmitting(true);
    console.log("입찰 제출 시작:", bidPrice);

    // 2초 대기 (로딩 효과)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 가상 경쟁자 생성
    const virtualBidders = generateVirtualBidders(
      bidPrice,
      property.basicInfo.minimumBidPrice
    );
    const winningBid = virtualBidders[0].bidPrice;
    const isUserWinner = virtualBidders[0].name === "나";
    const totalBidders = virtualBidders.length;
    const competitionRate = Math.round(
      (winningBid / property.basicInfo.appraisalValue) * 100
    );

    // 권리분석 결과 (간단한 계산)
    const totalAssumedAmount = property.rights
      .filter((right) => right.willBeAssumed)
      .reduce((sum, right) => sum + right.claimAmount, 0);

    const totalTenantDeposit = property.tenants
      .filter((tenant) => tenant.willBeAssumed)
      .reduce((sum, tenant) => sum + tenant.deposit, 0);

    const safetyMargin = totalAssumedAmount + totalTenantDeposit;

    // 수익 분석
    const totalInvestment = winningBid + safetyMargin + 5000000; // 명도비용 500만원 추가
    const expectedProfit = property.basicInfo.marketValue - totalInvestment;
    const roi = (expectedProfit / totalInvestment) * 100;

    const result: BiddingResult = {
      userBidPrice: bidPrice,
      isSuccess: isUserWinner,
      competitionRate,
      totalBidders,
      winningBidPrice: winningBid,
      virtualBidders,
      rightsAnalysis: {
        totalAssumedAmount,
        safetyMargin,
        recommendedRange: {
          min: property.basicInfo.minimumBidPrice,
          max: Math.round(property.basicInfo.appraisalValue * 0.9),
        },
      },
      profitAnalysis: {
        expectedProfit,
        roi,
        totalInvestment,
      },
    };

    setBiddingResult(result);
    setIsSubmitting(false);
    console.log("입찰 결과:", result);
  };

  // 모달 닫기
  const handleClose = () => {
    setBiddingResult(null);
    setBidPrice(property.basicInfo.minimumBidPrice);
    setBidPriceDisplay(
      property.basicInfo.minimumBidPrice.toLocaleString("ko-KR")
    );
    setShowRightsAnalysis(false);
    setShowProfitAnalysis(false);
    setShowWaitlistModal(false);
    onClose();
  };

  // 권리 분석 리포트 클릭 핸들러
  const handleRightsAnalysisClick = () => {
    setShowRightsAnalysis(true);
    console.log("권리 분석 리포트 클릭됨");
  };

  // 수익 분석 클릭 핸들러
  const handleProfitAnalysisClick = () => {
    setShowProfitAnalysis(true);
    console.log("수익 분석 클릭됨");
  };

  // 사전 알림 신청 핸들러
  const handleWaitlistSignup = () => {
    console.log("사전 알림 신청 모달 열기");
    setShowWaitlistModal(true);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">경매 입찰</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {!biddingResult ? (
            // 입찰 폼
            <div className="space-y-6">
              {/* 매물 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {property.basicInfo.locationShort}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">감정가:</span>
                    <span className="ml-2 font-semibold">
                      {formatNumber(property.basicInfo.appraisalValue)}원
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">최저가:</span>
                    <span className="ml-2 font-semibold text-blue-600">
                      {formatNumber(property.basicInfo.minimumBidPrice)}원
                    </span>
                  </div>
                </div>
              </div>

              {/* 입찰가 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  입찰가 (원)
                </label>
                <input
                  type="text"
                  value={bidPriceDisplay}
                  onChange={handleBidPriceChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="입찰가를 입력하세요 (예: 1,000,000)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  최저 입찰가:{" "}
                  {formatNumber(property.basicInfo.minimumBidPrice)}원
                </p>
              </div>

              {/* 입찰 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitBid}
                  disabled={
                    isSubmitting ||
                    bidPrice < property.basicInfo.minimumBidPrice
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      입찰 중...
                    </>
                  ) : (
                    "입찰하기"
                  )}
                </button>
              </div>
            </div>
          ) : (
            // 입찰 결과
            <div className="space-y-6">
              {/* 입찰 결과 요약 */}
              <div
                className={`p-4 rounded-lg ${
                  biddingResult.isSuccess
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {biddingResult.isSuccess ? "🎉" : "😔"}
                  </span>
                  <h3
                    className={`font-bold ${
                      biddingResult.isSuccess
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {biddingResult.isSuccess ? "낙찰 성공!" : "낙찰 실패"}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">낙찰가:</span>
                    <span className="ml-2 font-semibold">
                      {formatNumber(biddingResult.winningBidPrice)}원
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">경쟁률:</span>
                    <span className="ml-2 font-semibold">
                      {biddingResult.competitionRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">참여자 수:</span>
                    <span className="ml-2 font-semibold">
                      {biddingResult.totalBidders}명
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">내 입찰가:</span>
                    <span className="ml-2 font-semibold">
                      {formatNumber(biddingResult.userBidPrice)}원
                    </span>
                  </div>
                </div>
              </div>

              {/* 경쟁자 현황 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  경쟁자 현황
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {biddingResult.virtualBidders.map((bidder, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${
                        bidder.isWinner
                          ? "bg-yellow-100 border border-yellow-300"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {bidder.name}
                        </span>
                        {bidder.isWinner && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                            낙찰
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold">
                        {formatNumber(bidder.bidPrice)}원
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 권리분석 리포트 */}
              <div>
                <button
                  onClick={handleRightsAnalysisClick}
                  className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      권리분석 리포트
                    </h4>
                    <span className="text-blue-600 text-sm">클릭하여 보기</span>
                  </div>
                </button>

                {showRightsAnalysis && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-center text-gray-600">
                      정식 출시가 되면 알려드리겠습니다
                    </p>
                  </div>
                )}
              </div>

              {/* 수익 분석 */}
              <div>
                <button
                  onClick={handleProfitAnalysisClick}
                  className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">수익 분석</h4>
                    <span className="text-green-600 text-sm">
                      클릭하여 보기
                    </span>
                  </div>
                </button>

                {showProfitAnalysis && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-center text-gray-600">
                      정식 출시가 되면 알려드리겠습니다
                    </p>
                  </div>
                )}
              </div>

              {/* 버튼들 */}
              <div className="flex justify-between">
                <button
                  onClick={handleWaitlistSignup}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  사전 알림 신청
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 사전 알림 신청 모달 */}
      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
      />
    </div>
  );
}
