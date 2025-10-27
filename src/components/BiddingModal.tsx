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

interface BiddingFormData {
  courtName: string;
  biddingDate: string;
  caseNumber: string;
  propertyNumber: string;
  bidderName: string;
  bidderId: string;
  bidderAddress: string;
  bidderPhone: string;
  bidPrice: number;
  depositAmount: number;
  depositMethod: "cash" | "check";
}

interface BiddingResult {
  userBidPrice: number;
  isSuccess: boolean;
  competitionRate: string;
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
  const [formData, setFormData] = useState<BiddingFormData>({
    courtName: property.regionalAnalysis.court.name,
    biddingDate: property.schedule.currentAuctionDate,
    caseNumber: property.basicInfo.caseNumber,
    propertyNumber: "1", // 기본값으로 1 설정
    bidderName: "",
    bidderId: "",
    bidderAddress: "",
    bidderPhone: "",
    bidPrice: property.basicInfo.minimumBidPrice,
    depositAmount: Math.round(property.basicInfo.minimumBidPrice * 0.1),
    depositMethod: "cash",
  });
  const [bidPriceDisplay, setBidPriceDisplay] = useState<string>(
    property.basicInfo.minimumBidPrice.toLocaleString("ko-KR")
  );
  const [depositAmountDisplay, setDepositAmountDisplay] = useState<string>(
    Math.round(property.basicInfo.minimumBidPrice * 0.1).toLocaleString("ko-KR")
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

  // 폼 데이터 변경 핸들러
  const handleFormDataChange = (
    field: keyof BiddingFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    console.log(`입찰표 필드 변경: ${field} = ${value}`);
  };

  // 입찰가 입력 핸들러
  const handleBidPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseFormattedNumber(e.target.value);
    const depositAmount = Math.round(numericValue * 0.1);

    setFormData((prev) => ({
      ...prev,
      bidPrice: numericValue,
      depositAmount: depositAmount,
    }));
    setBidPriceDisplay(formatNumber(numericValue));
    setDepositAmountDisplay(formatNumber(depositAmount));
    console.log("입찰가 입력:", numericValue, "보증금:", depositAmount);
  };

  // 보증금 입력 핸들러
  const handleDepositAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const numericValue = parseFormattedNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      depositAmount: numericValue,
    }));
    setDepositAmountDisplay(formatNumber(numericValue));
    console.log("보증금 입력:", numericValue);
  };

  // 가상 경쟁자 생성 함수
  const generateVirtualBidders = (
    userBid: number,
    minBid: number,
    appraisalValue: number
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

    const totalBidders = Math.floor(Math.random() * 6) + 4; // 4-9명
    const bidders = [];

    // 사용자 입찰가를 기준으로 경쟁자들 생성
    for (let i = 0; i < totalBidders; i++) {
      const randomName = names[Math.floor(Math.random() * names.length)];

      // 더 현실적인 입찰가 분포 생성
      let randomBid;
      const userBidRatio = userBid / appraisalValue;

      if (userBidRatio < 0.7) {
        // 사용자 입찰가가 낮으면 경쟁자들도 낮은 가격대
        randomBid =
          minBid + Math.floor(Math.random() * (userBid * 1.1 - minBid));
      } else if (userBidRatio < 0.9) {
        // 중간 가격대
        randomBid = userBid * 0.8 + Math.floor(Math.random() * (userBid * 0.4));
      } else {
        // 높은 가격대
        randomBid = userBid * 0.9 + Math.floor(Math.random() * (userBid * 0.2));
      }

      // 최저가보다는 높게 설정
      randomBid = Math.max(
        randomBid,
        minBid + Math.floor(Math.random() * 1000000)
      );

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

    // 낙찰 성공률 조정 (사용자가 낙찰할 확률을 높임)
    const userRank = bidders.findIndex((bidder) => bidder.name === "나");
    const isUserWinner = Math.random() < (userRank <= 2 ? 0.7 : 0.3); // 상위권이면 70%, 아니면 30%

    if (isUserWinner) {
      // 사용자가 낙찰
      bidders[userRank].isWinner = true;
    } else {
      // 다른 경쟁자가 낙찰
      bidders[0].isWinner = true;
    }

    console.log("경쟁자 생성 완료:", {
      총참여자: bidders.length,
      사용자순위: userRank + 1,
      사용자낙찰: isUserWinner,
      최고가: bidders[0].bidPrice,
    });

    return bidders;
  };

  // 입찰 제출 핸들러
  const handleSubmitBid = async () => {
    // 최저 입찰가 검증만 수행 (AI가 자동 설정한 항목들은 검증 불필요)
    if (formData.bidPrice < property.basicInfo.minimumBidPrice) {
      alert(
        `최저 입찰가는 ${formatNumber(
          property.basicInfo.minimumBidPrice
        )}원입니다.`
      );
      return;
    }

    setIsSubmitting(true);
    console.log("입찰표 제출 시작:", formData);

    // 2초 대기 (로딩 효과)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 가상 경쟁자 생성
    const virtualBidders = generateVirtualBidders(
      formData.bidPrice,
      property.basicInfo.minimumBidPrice,
      property.basicInfo.appraisalValue
    );

    // 낙찰자 찾기
    const winner = virtualBidders.find((bidder) => bidder.isWinner);
    const winningBid = winner ? winner.bidPrice : virtualBidders[0].bidPrice;
    const isUserWinner = winner ? winner.name === "나" : false;
    const totalBidders = virtualBidders.length;

    // 경쟁률 계산 (참여자 수 대비 비율, 예: 6:1)
    const competitionRate = `${totalBidders}:1`;
    console.log("경쟁률 계산:", { totalBidders, competitionRate });

    // 낙찰가율 계산 (낙찰가 대비 감정가 비율 %)
    const bidPriceRatio = Math.round(
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
      userBidPrice: formData.bidPrice,
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

    console.log("입찰 결과 상세:", {
      경쟁률: competitionRate,
      낙찰가율: `${bidPriceRatio}%`,
      낙찰가: formatNumber(winningBid),
      감정가: formatNumber(property.basicInfo.appraisalValue),
      사용자낙찰: isUserWinner,
      입찰보증금: formatNumber(formData.depositAmount),
      남은잔금: isUserWinner
        ? formatNumber(winningBid - formData.depositAmount)
        : "낙찰실패",
    });

    console.log("결과 객체 경쟁률:", competitionRate);

    setBiddingResult(result);
    setIsSubmitting(false);
    console.log("입찰 결과:", result);
  };

  // 모달 닫기
  const handleClose = () => {
    setBiddingResult(null);
    setFormData({
      courtName: property.regionalAnalysis.court.name,
      biddingDate: property.schedule.currentAuctionDate,
      caseNumber: property.basicInfo.caseNumber,
      propertyNumber: "1",
      bidderName: "",
      bidderId: "",
      bidderAddress: "",
      bidderPhone: "",
      bidPrice: property.basicInfo.minimumBidPrice,
      depositAmount: Math.round(property.basicInfo.minimumBidPrice * 0.1),
      depositMethod: "cash",
    });
    setBidPriceDisplay(
      property.basicInfo.minimumBidPrice.toLocaleString("ko-KR")
    );
    setDepositAmountDisplay(
      Math.round(property.basicInfo.minimumBidPrice * 0.1).toLocaleString(
        "ko-KR"
      )
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
            // 입찰표 폼
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

              {/* 입찰표 양식 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">
                  경매입찰표
                </h4>

                {/* 1. 법원명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. 법원명 *
                  </label>
                  <input
                    type="text"
                    value={formData.courtName}
                    onChange={(e) =>
                      handleFormDataChange("courtName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="법원명을 입력하세요"
                  />
                </div>

                {/* 2. 입찰기일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2. 입찰기일
                  </label>
                  <input
                    type="date"
                    value={formData.biddingDate}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* 3. 사건번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    3. 사건번호
                  </label>
                  <input
                    type="text"
                    value={formData.caseNumber}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* 4. 물건번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    4. 물건번호
                  </label>
                  <input
                    type="text"
                    value={formData.propertyNumber}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* 5. 본인 정보 (시뮬레이션용 - 양식만 표시) */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h5 className="font-semibold text-gray-900 mb-3">
                    5. 본인 정보 (시뮬레이션용)
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">성명:</span>
                      <span className="ml-2 text-gray-500">[시뮬레이션용]</span>
                    </div>
                    <div>
                      <span className="text-gray-600">주민등록번호:</span>
                      <span className="ml-2 text-gray-500">[시뮬레이션용]</span>
                    </div>
                    <div>
                      <span className="text-gray-600">주소:</span>
                      <span className="ml-2 text-gray-500">[시뮬레이션용]</span>
                    </div>
                    <div>
                      <span className="text-gray-600">전화번호:</span>
                      <span className="ml-2 text-gray-500">[시뮬레이션용]</span>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    * 실제 경매에서는 본인 정보를 정확히 기재해야 합니다.
                  </p>
                </div>

                {/* 6. 입찰가격 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    6. 입찰가격 (원) *
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

                {/* 7. 입찰보증금액 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    7. 입찰보증금액 (원) *
                  </label>
                  <input
                    type="text"
                    value={depositAmountDisplay}
                    onChange={handleDepositAmountChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="보증금을 입력하세요"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    일반적으로 입찰가의 10% (자동 계산됨)
                  </p>
                </div>

                {/* 8. 입찰보증금 제공 방법 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    8. 입찰보증금 제공 방법 *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="depositMethod"
                        value="cash"
                        checked={formData.depositMethod === "cash"}
                        onChange={(e) =>
                          handleFormDataChange("depositMethod", e.target.value)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">현금</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="depositMethod"
                        value="check"
                        checked={formData.depositMethod === "check"}
                        onChange={(e) =>
                          handleFormDataChange("depositMethod", e.target.value)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">자기앞수표</span>
                    </label>
                  </div>
                </div>
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
                    formData.bidPrice < property.basicInfo.minimumBidPrice
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      입찰 중...
                    </>
                  ) : (
                    "입찰표 제출"
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
                    <span className="text-gray-600">내 입찰가:</span>
                    <span className="ml-2 font-semibold">
                      {formatNumber(biddingResult.userBidPrice)}원
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">참여자 수:</span>
                    <span className="ml-2 font-semibold">
                      {biddingResult.totalBidders}명
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">낙찰가율:</span>
                    <span className="ml-2 font-semibold">
                      {Math.round(
                        (biddingResult.winningBidPrice /
                          property.basicInfo.appraisalValue) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  {biddingResult.isSuccess && (
                    <div>
                      <span className="text-gray-600">남은 잔금:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {formatNumber(
                          biddingResult.winningBidPrice - formData.depositAmount
                        )}
                        원
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">경쟁률:</span>
                    <span className="ml-2 font-semibold">
                      {biddingResult.competitionRate}
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
                      서비스 준비중 입니다.
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
                      서비스 준비중 입니다.
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
