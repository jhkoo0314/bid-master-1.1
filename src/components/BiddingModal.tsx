/**
 * Bid Master AI - 경매 입찰 팝업 컴포넌트
 */

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { SimulationScenario } from "@/types/simulation";
import { WaitlistModal } from "./WaitlistModal";
import { CircularProgressChart } from "./CircularProgressChart";
import { AuctionAnalysisModal } from "./AuctionAnalysisModal";
import { calculatePoints, calculateAccuracy } from "@/lib/point-calculator";
import { analyzeRights } from "@/lib/rights-analysis-engine";
import { useSimulationStore } from "@/store/simulation-store";

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
      optimal: number;
    };
  };
  auctionAnalysis: {
    averageBidPrice: number;
    highestBidPrice: number;
    lowestBidPrice: number;
    bidPriceRange: number;
    marketTrend: 'hot' | 'normal' | 'cold';
    competitionLevel: 'high' | 'medium' | 'low';
    successProbability: number;
    // 수익모델 분석 데이터 (권리유형 13가지 반영)
    profitAnalysis: {
      totalInvestment: number; // 총 투자금액 (낙찰가 + 인수권리금 + 임차보증금)
      netProfit: number; // 순수익 (감정가 - 총투자금액)
      roi: number; // ROI (%)
      breakEvenPrice: number; // 손익분기점 가격
      profitMargin: number; // 수익률 (%)
      riskLevel: 'high' | 'medium' | 'low';
      riskFactors: string[];
      investmentRecommendation: 'strong_buy' | 'buy' | 'hold' | 'avoid';
    };
  };
}

export function BiddingModal({ property, isOpen, onClose }: BiddingModalProps) {
  const { dashboardStats, updateDashboardStats, devMode } = useSimulationStore();

  // 초기값을 빈 객체로 설정하고 useEffect에서 초기화
  const [formData, setFormData] = useState<BiddingFormData>({
    courtName: "",
    biddingDate: "",
    caseNumber: "",
    propertyNumber: "1",
    bidderName: "",
    bidderId: "",
    bidderAddress: "",
    bidderPhone: "",
    bidPrice: 0,
    depositAmount: 0,
    depositMethod: "cash",
  });
  const [bidPriceDisplay, setBidPriceDisplay] = useState<string>("0");
  const [depositAmountDisplay, setDepositAmountDisplay] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biddingResult, setBiddingResult] = useState<BiddingResult | null>(
    null
  );
  const [showRightsAnalysis, setShowRightsAnalysis] = useState(false);
  const [showAuctionAnalysis, setShowAuctionAnalysis] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  
  // 이전 isOpen 값 추적 (무한 루프 방지)
  const prevIsOpenRef = useRef(false);
  const prevPropertyIdRef = useRef<string | undefined>(undefined);

  // useMemo 제거 - useEffect에서만 초기화

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
    console.log("🚀 [입찰버튼] 입찰 제출 버튼 클릭됨!");
    try {
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

    // 권리분석 결과 (더 정확한 분석 사용)
    const rightsAnalysisResult = analyzeRights(property);
    const recommendedRange = rightsAnalysisResult.recommendedBidRange;
    const totalAssumedAmount = rightsAnalysisResult.totalAssumedAmount;
    const safetyMargin = rightsAnalysisResult.safetyMargin;
    
    // recommendedRange가 undefined인 경우 기본값 제공
    if (!recommendedRange) {
      console.log("⚠️ [입찰결과] 권장 범위가 없어 기본값 사용");
    }

    // ROI 계산 (간단한 버전) - 임시 변수로 계산
    const tempTotalInvestment = winningBid + safetyMargin + 5000000; // 명도비용 500만원 추가
    const expectedProfit = property.basicInfo.marketValue - tempTotalInvestment;
    const tempRoi = (expectedProfit / tempTotalInvestment) * 100;

    // 포인트 계산
    console.log("⭐ [입찰결과] 포인트 계산 시작");
    const pointResult = calculatePoints({
      scenario: property,
      userBidPrice: formData.bidPrice,
      winningBidPrice: winningBid,
      isSuccess: isUserWinner,
      roi: tempRoi,
      rightsAnalysisResult: {
        totalAssumedAmount: rightsAnalysisResult.totalAssumedAmount,
        safetyMargin: rightsAnalysisResult.safetyMargin,
        recommendedRange: recommendedRange || {
          min: property.basicInfo.minimumBidPrice,
          max: property.basicInfo.appraisalValue * 0.8,
          optimal: Math.round((property.basicInfo.minimumBidPrice + property.basicInfo.appraisalValue * 0.8) / 2)
        },
      },
    });

    // 정확도 계산
    const accuracy = calculateAccuracy(formData.bidPrice, recommendedRange);

    // 대시보드 통계 업데이트
    const currentPoints = dashboardStats.points + pointResult.totalPoints;
    const currentXp = dashboardStats.xp + pointResult.xp;
    
    // 평균 정확도 및 ROI 계산 (이전 정확도와 ROI를 배열로 저장해야 하지만, 
    // 여기서는 간단히 이동 평균으로 계산)
    const newAccuracy = dashboardStats.accuracy === 0 
      ? accuracy 
      : (dashboardStats.accuracy * 0.7 + accuracy * 0.3); // 가중 평균
    const newRoi = dashboardStats.roi === 0 
      ? tempRoi / 100 
      : (dashboardStats.roi * 0.7 + (tempRoi / 100) * 0.3); // 가중 평균 (ROI는 %를 소수로 변환)

    updateDashboardStats({
      points: currentPoints,
      xp: currentXp,
      accuracy: newAccuracy,
      roi: newRoi,
    });

    console.log("📊 [입찰결과] 대시보드 통계 업데이트 완료:", {
      포인트: pointResult.totalPoints,
      XP: pointResult.xp,
      누적포인트: currentPoints,
      누적XP: currentXp,
      정확도: `${(accuracy * 100).toFixed(1)}%`,
      ROI: `${tempRoi.toFixed(2)}%`,
    });

    // 경매분석 데이터 계산
    const allBidPrices = virtualBidders.map(bidder => bidder.bidPrice);
    const averageBidPrice = Math.round(allBidPrices.reduce((sum, price) => sum + price, 0) / allBidPrices.length);
    const highestBidPrice = Math.max(...allBidPrices);
    const lowestBidPrice = Math.min(...allBidPrices);
    const bidPriceRange = highestBidPrice - lowestBidPrice;
    
    // 시장 트렌드 분석
    const marketTrend = bidPriceRatio > 80 ? 'hot' : bidPriceRatio > 60 ? 'normal' : 'cold';
    
    // 경쟁 수준 분석
    const competitionLevel = totalBidders > 8 ? 'high' : totalBidders > 4 ? 'medium' : 'low';
    
    // 성공 확률 계산 (사용자 입찰가가 평균보다 높으면 성공 확률 높음)
    const successProbability = Math.min(95, Math.max(5, 
      ((formData.bidPrice - averageBidPrice) / averageBidPrice * 50) + 50
    ));

    // 수익모델 분석 (권리유형 13가지 반영)
    const totalInvestment = winningBid + rightsAnalysisResult.totalAssumedAmount + rightsAnalysisResult.totalTenantDeposit;
    const netProfit = property.basicInfo.appraisalValue - totalInvestment;
    const roi = (netProfit / totalInvestment) * 100;
    const breakEvenPrice = totalInvestment;
    const profitMargin = (netProfit / property.basicInfo.appraisalValue) * 100;
    
    // 리스크 분석 (권리 분석 결과 반영)
    const riskLevel = rightsAnalysisResult.riskAnalysis.overallRiskLevel;
    const riskFactors = rightsAnalysisResult.riskAnalysis.riskFactors;
    
    // 투자 권장도 계산 (수익성 + 리스크 종합)
    let investmentRecommendation: 'strong_buy' | 'buy' | 'hold' | 'avoid';
    if (roi > 20 && riskLevel === 'low') {
      investmentRecommendation = 'strong_buy';
    } else if (roi > 10 && riskLevel !== 'high') {
      investmentRecommendation = 'buy';
    } else if (roi > 0) {
      investmentRecommendation = 'hold';
    } else {
      investmentRecommendation = 'avoid';
    }

    console.log("📊 [경매분석] 수익모델 분석 완료:", {
      총투자금액: formatNumber(totalInvestment),
      순수익: formatNumber(netProfit),
      ROI: `${roi.toFixed(2)}%`,
      수익률: `${profitMargin.toFixed(2)}%`,
      손익분기점: formatNumber(breakEvenPrice),
      리스크레벨: riskLevel,
      투자권장도: investmentRecommendation
    });

    console.log("📊 [경매분석] 경매분석 데이터 계산 완료:", {
      평균입찰가: formatNumber(averageBidPrice),
      최고입찰가: formatNumber(highestBidPrice),
      최저입찰가: formatNumber(lowestBidPrice),
      입찰가범위: formatNumber(bidPriceRange),
      시장트렌드: marketTrend,
      경쟁수준: competitionLevel,
      성공확률: `${successProbability.toFixed(1)}%`
    });

    const result: BiddingResult = {
      userBidPrice: formData.bidPrice,
      isSuccess: isUserWinner,
      competitionRate,
      totalBidders,
      winningBidPrice: winningBid,
      virtualBidders,
      rightsAnalysis: {
        totalAssumedAmount: rightsAnalysisResult.totalAssumedAmount,
        safetyMargin: rightsAnalysisResult.safetyMargin,
        recommendedRange: recommendedRange || {
          min: property.basicInfo.minimumBidPrice,
          max: property.basicInfo.appraisalValue * 0.8,
          optimal: Math.round((property.basicInfo.minimumBidPrice + property.basicInfo.appraisalValue * 0.8) / 2)
        },
      },
      auctionAnalysis: {
        averageBidPrice,
        highestBidPrice,
        lowestBidPrice,
        bidPriceRange,
        marketTrend,
        competitionLevel,
        successProbability,
        profitAnalysis: {
          totalInvestment,
          netProfit,
          roi,
          breakEvenPrice,
          profitMargin,
          riskLevel,
          riskFactors,
          investmentRecommendation,
        },
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
    console.log(
      "💰 [입찰결과] 감정가 표시:",
      formatNumber(property.basicInfo.appraisalValue) + "원"
    );
    } catch (error) {
      console.error("❌ [입찰 에러] 입찰 처리 중 오류 발생:", error);
      setIsSubmitting(false);
      alert("입찰 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 모달 닫기
  const handleClose = () => {
    console.log("🔒 [입찰모달] handleClose 호출됨");
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
    setShowWaitlistModal(false);
    console.log("🔒 [입찰모달] onClose 호출 전");
    onClose();
    console.log("🔒 [입찰모달] onClose 호출 후");
  };

  // 권리 분석 리포트 클릭 핸들러
  const handleRightsAnalysisClick = () => {
    setShowRightsAnalysis(!showRightsAnalysis);
    console.log("📊 [권리분석] 권리분석리포트 요약 클릭됨:", !showRightsAnalysis);
  };

  // 경매 분석 리포트 클릭 핸들러
  const handleAuctionAnalysisClick = () => {
    setShowAuctionAnalysis(!showAuctionAnalysis);
    console.log("📊 [경매분석] 경매분석리포트 요약 클릭됨:", !showAuctionAnalysis);
  };

  // 사전 알림 신청 핸들러
  const handleWaitlistSignup = () => {
    console.log("사전 알림 신청 모달 열기");
    setShowWaitlistModal(true);
  };

  // 권리분석 요약 생성 함수
  const generateRightsAnalysisSummary = (property: SimulationScenario, rightsAnalysis: any) => {
    console.log("📊 [권리분석] 요약 생성 시작");
    
    const { totalAssumedAmount, safetyMargin, recommendedRange } = rightsAnalysis;
    const { minimumBidPrice, appraisalValue } = property.basicInfo;
    
    // 실제 권리분석 엔진을 사용하여 정확한 결과 계산
    const actualRightsAnalysis = analyzeRights(property);
    const actualSafetyMargin = actualRightsAnalysis.safetyMargin;
    const actualTotalAssumedAmount = actualRightsAnalysis.totalAssumedAmount;
    const actualAssumedRights = actualRightsAnalysis.assumedRights.length;
    const actualAssumedTenants = actualRightsAnalysis.assumedTenants.length;
    
    console.log("📊 [권리분석] 실제 분석 결과:", {
      안전마진: actualSafetyMargin,
      인수권리총액: actualTotalAssumedAmount,
      인수권리개수: actualAssumedRights,
      인수임차인수: actualAssumedTenants,
      감정가: appraisalValue,
      안전마진비율: `${((actualSafetyMargin / appraisalValue) * 100).toFixed(1)}%`
    });
    
    // 안전 마진 비율 계산 (실제 값 사용)
    const marginRatio = (actualSafetyMargin / appraisalValue) * 100;
    
    let title = "";
    let content = "";
    let details = "";
    
    if (marginRatio > 30) {
      title = "고위험 매물";
      content = `안전마진이 ${marginRatio.toFixed(1)}%로 매우 높아 주의가 필요합니다.`;
      details = `인수권리 ${actualAssumedRights}개, 임차인 ${actualAssumedTenants}명으로 총 ${actualSafetyMargin.toLocaleString()}원 추가 부담 예상`;
    } else if (marginRatio > 15) {
      title = "중위험 매물";
      content = `안전마진이 ${marginRatio.toFixed(1)}%로 적당한 수준입니다.`;
      details = `인수권리 ${actualAssumedRights}개, 임차인 ${actualAssumedTenants}명으로 총 ${actualSafetyMargin.toLocaleString()}원 추가 부담 예상`;
    } else {
      title = "안전한 매물";
      content = `안전마진이 ${marginRatio.toFixed(1)}%로 낮아 상대적으로 안전합니다.`;
      details = `인수권리 ${actualAssumedRights}개, 임차인 ${actualAssumedTenants}명으로 총 ${actualSafetyMargin.toLocaleString()}원 추가 부담 예상`;
    }
    
    console.log("📊 [권리분석] 요약 생성 완료:", { title, content, details });
    
    return { title, content, details };
  };

  // 모달이 열릴 때 또는 매물이 변경될 때 formData 초기화 (단일 useEffect로 통합)
  useEffect(() => {
    // 모달이 닫혀있으면 아무것도 하지 않음
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }

    // 모달이 방금 열린 경우 또는 매물이 변경된 경우에만 초기화
    const isOpening = !prevIsOpenRef.current;
    const propertyChanged = property.id !== prevPropertyIdRef.current;


    if (isOpening || propertyChanged) {
      console.log("🔓 [입찰모달] 모달 초기화", { isOpening, propertyChanged, propertyId: property.id });

      // property 객체의 현재 값들을 로컬 변수에 저장하여 무한 루프 방지
      // regionalAnalysis가 없는 경우를 대비한 안전성 검사
      const courtName = property.regionalAnalysis?.court?.name || "법원 정보 없음";
      const biddingDate = property.schedule.currentAuctionDate;
      const caseNumber = property.basicInfo.caseNumber;
      const minimumBidPrice = property.basicInfo.minimumBidPrice;

      setFormData({
        courtName,
        biddingDate,
        caseNumber,
        propertyNumber: "1",
        bidderName: "",
        bidderId: "",
        bidderAddress: "",
        bidderPhone: "",
        bidPrice: minimumBidPrice,
        depositAmount: Math.round(minimumBidPrice * 0.1),
        depositMethod: "cash",
      });
      setBidPriceDisplay(minimumBidPrice.toLocaleString("ko-KR"));
      setDepositAmountDisplay(
        Math.round(minimumBidPrice * 0.1).toLocaleString("ko-KR")
      );
      setBiddingResult(null);
      setShowRightsAnalysis(false);
      setShowWaitlistModal(false);
    }

    // 이전 값들 업데이트
    prevIsOpenRef.current = isOpen;
    prevPropertyIdRef.current = property.id;
  }, [isOpen, property.id]); // property.id만 의존성으로 사용하여 무한 루프 방지

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [isOpen]); // onClose는 effect 안에서 최신 값을 참조하므로 dependency에서 제외

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
                    {biddingResult.isSuccess ? "성공" : "실패"}
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
                    <span className="text-gray-600">감정가:</span>
                    <span className="ml-2 font-semibold text-blue-600">
                      {formatNumber(property.basicInfo.appraisalValue)}원
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">참여자 수:</span>
                    <span className="ml-2 font-semibold">
                      {biddingResult.totalBidders}명
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
                </div>

                {/* 원형 차트로 주요 지표 표시 */}
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    입찰 결과 분석
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CircularProgressChart
                      label="낙찰가율"
                      value={Math.round(
                        (biddingResult.winningBidPrice /
                          property.basicInfo.appraisalValue) *
                          100
                      )}
                      maxValue={100}
                      unit="%"
                      color="#3B82F6"
                    />
                    <CircularProgressChart
                      label="경쟁률"
                      value={parseInt(
                        biddingResult.competitionRate.split(":")[0]
                      )}
                      maxValue={10}
                      unit=":1"
                      color="#10B981"
                    />
                    <CircularProgressChart
                      label="감정가율"
                      value={Math.round(
                        (property.basicInfo.minimumBidPrice /
                          property.basicInfo.appraisalValue) *
                          100
                      )}
                      maxValue={100}
                      unit="%"
                      color="#F59E0B"
                    />
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

              {/* 권리분석리포트 요약 */}
              <div>
                <button
                  onClick={handleRightsAnalysisClick}
                  className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      권리분석리포트 요약
                    </h4>
                    <span className="text-blue-600 text-sm">
                      {showRightsAnalysis ? "접기" : "클릭하여 보기"}
                    </span>
                  </div>
                </button>

                {showRightsAnalysis && biddingResult && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                    <div className="space-y-4">
                      <h5 className="font-semibold text-gray-900 mb-3">권리분석 결과</h5>
                      
                      {/* 기본 분석 정보 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">총 인수 권리금:</span>
                          <span className="ml-2 font-semibold text-blue-600">
                            {formatNumber(biddingResult.rightsAnalysis.totalAssumedAmount)}원
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">안전 마진:</span>
                          <span className="ml-2 font-semibold text-green-600">
                            {formatNumber(biddingResult.rightsAnalysis.safetyMargin)}원
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">권장 입찰 범위:</span>
                          <span className="ml-2 font-semibold">
                            {formatNumber(biddingResult.rightsAnalysis.recommendedRange.min)}원 ~ {formatNumber(biddingResult.rightsAnalysis.recommendedRange.max)}원
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">최적 입찰가:</span>
                          <span className="ml-2 font-semibold text-purple-600">
                            {formatNumber(biddingResult.rightsAnalysis.recommendedRange.optimal)}원
                          </span>
                        </div>
                      </div>

                      {/* 리스크 분석 */}
                      {biddingResult.rightsAnalysis.riskAnalysis && (
                        <div className="mt-4 p-3 rounded border">
                          <div className={`p-3 rounded ${
                            biddingResult.rightsAnalysis.riskAnalysis.overallRiskLevel === 'high' 
                              ? 'bg-red-50 border-red-200' 
                              : biddingResult.rightsAnalysis.riskAnalysis.overallRiskLevel === 'medium'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-green-50 border-green-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <h6 className="font-semibold text-gray-900">
                                리스크 분석 ({biddingResult.rightsAnalysis.riskAnalysis.riskScore}/100점)
                              </h6>
                            </div>
                            
                            {biddingResult.rightsAnalysis.riskAnalysis.riskFactors.length > 0 && (
                              <div className="mb-2">
                                <p className="text-sm text-gray-700 mb-1">
                                  <strong>리스크 요인:</strong>
                                </p>
                                <ul className="text-xs text-gray-600 list-disc list-inside">
                                  {biddingResult.rightsAnalysis.riskAnalysis.riskFactors.map((factor, index) => (
                                    <li key={index}>{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {biddingResult.rightsAnalysis.riskAnalysis.recommendations.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-700 mb-1">
                                  <strong>권장사항:</strong>
                                </p>
                                <ul className="text-xs text-gray-600 list-disc list-inside">
                                  {biddingResult.rightsAnalysis.riskAnalysis.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-800 mb-3">
                          <strong>분석 요약:</strong> 13가지 권리유형을 종합 분석하여 안전한 입찰 범위를 제시합니다. 
                          리스크 레벨과 권리금을 고려한 최적 입찰가를 참고하세요.
                        </p>
                        <button
                          onClick={() => {
                            if (devMode.isDevMode) {
                              setShowAnalysisModal(true);
                              console.log("📊 [권리분석] 자세히보기 버튼 클릭 - 개발자 모드");
                            } else {
                              setShowWaitlistModal(true);
                              console.log("📊 [권리분석] 자세히보기 버튼 클릭 - 일반 모드 (사전알림 신청)");
                            }
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          자세히보기
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 경매분석리포트 요약 */}
              <div>
                <button
                  onClick={handleAuctionAnalysisClick}
                  className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      경매분석리포트 요약
                    </h4>
                    <span className="text-green-600 text-sm">
                      {showAuctionAnalysis ? "접기" : "클릭하여 보기"}
                    </span>
                  </div>
                </button>

                {showAuctionAnalysis && biddingResult && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                    {console.log("📊 [경매분석] 경매분석리포트 섹션 표시됨:", {
                      경쟁률: biddingResult.competitionRate,
                      총입찰자수: biddingResult.totalBidders,
                      낙찰가: formatNumber(biddingResult.winningBidPrice),
                      시장트렌드: biddingResult.auctionAnalysis.marketTrend,
                      경쟁수준: biddingResult.auctionAnalysis.competitionLevel,
                      성공확률: `${biddingResult.auctionAnalysis.successProbability.toFixed(1)}%`
                    })}
                    <div className="space-y-4">
                      <h5 className="font-semibold text-gray-900 mb-3">경매분석 결과</h5>
                      
                      {/* 경매 기본 정보 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">경쟁률:</span>
                          <span className="ml-2 font-semibold text-orange-600">
                            {biddingResult.competitionRate}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">총 입찰자 수:</span>
                          <span className="ml-2 font-semibold text-blue-600">
                            {biddingResult.totalBidders}명
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">낙찰가:</span>
                          <span className="ml-2 font-semibold text-red-600">
                            {formatNumber(biddingResult.winningBidPrice)}원
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">사용자 입찰가:</span>
                          <span className={`ml-2 font-semibold ${
                            biddingResult.isSuccess ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {formatNumber(biddingResult.userBidPrice)}원
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">평균 입찰가:</span>
                          <span className="ml-2 font-semibold text-purple-600">
                            {formatNumber(biddingResult.auctionAnalysis.averageBidPrice)}원
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">입찰가 범위:</span>
                          <span className="ml-2 font-semibold text-indigo-600">
                            {formatNumber(biddingResult.auctionAnalysis.bidPriceRange)}원
                          </span>
                        </div>
                      </div>

                      {/* 시장 분석 */}
                      <div className="mt-4 p-3 rounded border">
                        <h6 className="font-semibold text-gray-900 mb-3">시장 분석</h6>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center p-3 rounded border">
                            <div className="font-semibold text-gray-700">시장 트렌드</div>
                            <div className={`text-xs ${
                              biddingResult.auctionAnalysis.marketTrend === 'hot' ? 'text-red-600' :
                              biddingResult.auctionAnalysis.marketTrend === 'normal' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              {biddingResult.auctionAnalysis.marketTrend === 'hot' ? '매우 뜨거움' :
                               biddingResult.auctionAnalysis.marketTrend === 'normal' ? '보통' : '차가움'}
                            </div>
                          </div>
                          <div className="text-center p-3 rounded border">
                            <div className="font-semibold text-gray-700">경쟁 수준</div>
                            <div className={`text-xs ${
                              biddingResult.auctionAnalysis.competitionLevel === 'high' ? 'text-red-600' :
                              biddingResult.auctionAnalysis.competitionLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {biddingResult.auctionAnalysis.competitionLevel === 'high' ? '높음' :
                               biddingResult.auctionAnalysis.competitionLevel === 'medium' ? '보통' : '낮음'}
                            </div>
                          </div>
                          <div className="text-center p-3 rounded border">
                            <div className="font-semibold text-gray-700">성공 확률</div>
                            <div className={`text-xs ${
                              biddingResult.auctionAnalysis.successProbability > 70 ? 'text-green-600' :
                              biddingResult.auctionAnalysis.successProbability > 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {biddingResult.auctionAnalysis.successProbability.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 입찰 결과 분석 */}
                      <div className="mt-4 p-3 rounded border">
                        <div className={`p-3 rounded ${
                          biddingResult.isSuccess 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <h6 className="font-semibold text-gray-900">
                              입찰 결과: {biddingResult.isSuccess ? '성공' : '실패'}
                            </h6>
                          </div>
                          
                          <div className="text-sm text-gray-700">
                            <p className="mb-2">
                              <strong>분석:</strong> {biddingResult.isSuccess 
                                ? '경쟁을 뚫고 낙찰에 성공했습니다.' 
                                : '낙찰에 실패했습니다. 다음 기회를 노려보세요.'}
                            </p>
                            <p>
                              <strong>경쟁 상황:</strong> 총 {biddingResult.totalBidders}명의 입찰자 중에서 
                              {biddingResult.competitionRate}의 경쟁률을 기록했습니다.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 수익 분석 (권리유형 13가지 반영) */}
                      <div className="mt-4 p-3 rounded border">
                        <h6 className="font-semibold text-gray-900 mb-3">수익 분석 (권리유형 종합)</h6>
                        
                        {devMode.isDevMode ? (
                          <>
                            {console.log("💰 [수익분석] 개발자 모드 - 수익분석 상세 정보 표시")}
                            {/* 투자 금액 분석 */}
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-600">총 투자금액:</span>
                                <span className="ml-2 font-semibold text-red-600">
                                  {formatNumber(biddingResult.auctionAnalysis.profitAnalysis.totalInvestment)}원
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">순수익:</span>
                                <span className={`ml-2 font-semibold ${
                                  biddingResult.auctionAnalysis.profitAnalysis.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatNumber(biddingResult.auctionAnalysis.profitAnalysis.netProfit)}원
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">ROI:</span>
                                <span className={`ml-2 font-semibold ${
                                  biddingResult.auctionAnalysis.profitAnalysis.roi > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {biddingResult.auctionAnalysis.profitAnalysis.roi.toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">수익률:</span>
                                <span className={`ml-2 font-semibold ${
                                  biddingResult.auctionAnalysis.profitAnalysis.profitMargin > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {biddingResult.auctionAnalysis.profitAnalysis.profitMargin.toFixed(2)}%
                                </span>
                              </div>
                            </div>

                            {/* 투자 권장도 */}
                            <div className="mt-4 p-3 rounded border">
                              <div className={`p-3 rounded ${
                                biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'strong_buy' ? 'bg-green-50 border-green-200' :
                                biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'buy' ? 'bg-blue-50 border-blue-200' :
                                biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'hold' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">
                                    {biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'strong_buy' ? '🚀' :
                                     biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'buy' ? '📈' :
                                     biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'hold' ? '⏸️' : '⚠️'}
                                  </span>
                                  <h6 className="font-semibold text-gray-900">
                                    투자 권장도: {
                                      biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'strong_buy' ? '강력 매수' :
                                      biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'buy' ? '매수' :
                                      biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'hold' ? '보유' : '회피'
                                    }
                                  </h6>
                                </div>
                                
                                <div className="text-sm text-gray-700">
                                  <p className="mb-2">
                                    <strong>분석:</strong> 권리유형 13가지를 종합 분석한 결과, 
                                    {biddingResult.auctionAnalysis.profitAnalysis.roi > 0 ? 
                                      ` 예상 수익률 ${biddingResult.auctionAnalysis.profitAnalysis.roi.toFixed(2)}%로 ` :
                                      ` 예상 손실률 ${Math.abs(biddingResult.auctionAnalysis.profitAnalysis.roi).toFixed(2)}%로 `
                                    }
                                    {biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'strong_buy' ? '매우 유망한 투자 기회입니다.' :
                                     biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'buy' ? '적당한 투자 기회입니다.' :
                                     biddingResult.auctionAnalysis.profitAnalysis.investmentRecommendation === 'hold' ? '신중한 검토가 필요합니다.' : '투자를 권장하지 않습니다.'}
                                  </p>
                                  <p>
                                    <strong>손익분기점:</strong> {formatNumber(biddingResult.auctionAnalysis.profitAnalysis.breakEvenPrice)}원
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* 리스크 요인 (권리유형 기반) */}
                            {biddingResult.auctionAnalysis.profitAnalysis.riskFactors.length > 0 && (
                              <div className="mt-3 p-3 rounded border">
                                <h6 className="font-semibold text-gray-900 mb-2">주요 리스크 요인</h6>
                                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                  {biddingResult.auctionAnalysis.profitAnalysis.riskFactors.slice(0, 5).map((factor, index) => (
                                    <li key={index}>{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            {console.log("🚧 [수익분석] 일반모드 - 서비스 준비중 메시지 표시")}
                            <div className="text-gray-500 text-lg mb-2">🚧</div>
                            <p className="text-gray-600 font-medium">서비스 준비중입니다</p>
                            <p className="text-sm text-gray-500 mt-1">곧 더 나은 서비스로 찾아뵙겠습니다</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-sm text-green-800 mb-3">
                          <strong>분석 요약:</strong> AI가 생성한 가상 입찰자들과의 경쟁을 통해 
                          실제 경매 상황을 시뮬레이션합니다. 경쟁률과 입찰 패턴을 분석하여 
                          실전 경매에서의 전략을 학습할 수 있습니다.
                        </p>
                        <button
                          onClick={() => {
                            console.log("📊 [경매분석] 자세히보기 버튼 클릭됨");
                            if (devMode.isDevMode) {
                              setShowAnalysisModal(true);
                              console.log("📊 [경매분석] 자세히보기 버튼 클릭 - 개발자 모드 (상세 리포트 모달 열기)");
                            } else {
                              setShowWaitlistModal(true);
                              console.log("📊 [경매분석] 자세히보기 버튼 클릭 - 일반 모드 (사전알림 신청 모달 열기)");
                            }
                          }}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          자세히보기
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 버튼들 */}
              <div className="flex justify-end">
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

      {/* 권리분석 상세 리포트 모달 */}
      <AuctionAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => {
          setShowAnalysisModal(false);
          console.log("📊 [권리분석] 상세 리포트 모달 닫기");
        }}
        property={property}
      />
    </div>
  );
}
