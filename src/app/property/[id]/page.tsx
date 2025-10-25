/**
 * Bid Master AI - 매물 상세보기 페이지
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SimulationScenario } from "@/types/simulation";
import { useSimulationStore } from "@/store/simulation-store";
import { generateProperty } from "@/app/actions/generate-property";
import { analyzeRights } from "@/lib/rights-analysis-engine";
import { AuctionAnalysisModal } from "@/components/AuctionAnalysisModal";
import Link from "next/link";

// 용어 설명 함수
function getTermExplanation(term: string, keyPoints: string[] = []): string {
  // 핵심분석 포인트들에서 해당 용어가 포함된 경우만 설명 제공
  const isTermInKeyPoints = keyPoints.some(
    (point) => point.includes(term) || term.includes(point.split(" ")[0])
  );

  if (!isTermInKeyPoints) {
    return term; // 핵심분석에 없는 용어는 설명 없이 그대로 반환
  }
  const explanations: { [key: string]: string } = {
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
    감정가: "부동산의 시장가치를 전문가가 평가한 금액. 경매의 기준이 됩니다.",
    최저가:
      "경매에서 매각할 수 있는 최소 금액. 보통 감정가의 70-80% 수준입니다.",
    입찰보증금:
      "경매에 참여하기 위해 미리 납부하는 보증금. 낙찰 시 계약금으로 전환됩니다.",
    확정일자:
      "임차인이 전입신고를 하고 받는 증명서. 대항력 인정의 중요한 요건입니다.",
    전입신고:
      "새로운 주소로 이사했을 때 관할 동사무소에 신고하는 것. 임차인 대항력의 첫 번째 요건입니다.",
    인수: "경매 낙찰자가 기존 권리나 임차인을 그대로 인정하고 인수하는 것.",
    배당: "경매 매각대금을 각 권리자들에게 우선순위에 따라 나누어 주는 것.",
    경매: "채무를 변제하기 위해 부동산을 공개적으로 매각하는 절차.",
    부동산임의경매:
      "채무자가 자발적으로 부동산을 경매에 부치는 절차. 강제경매와 구분됩니다.",
    강제경매: "채권자가 법원에 신청하여 부동산을 경매에 부치는 절차.",
    낙찰: "경매에서 최고가로 입찰한 사람이 매물을 구매하는 것.",
    대항력: "임차인의 권리 보호 수준 - 경매에서 임차인 권리가 보호되는 정도",
    관리비: "공동주택의 공용시설 관리와 운영에 필요한 비용",
    입주민규정: "아파트 입주민들이 지켜야 하는 공동생활 규칙",
    주차장사용권: "아파트 주차장을 사용할 수 있는 권리",
    상업용관리비: "오피스텔의 상업시설 관리에 필요한 비용",
    용도변경제한: "상업용 부동산의 용도를 변경할 수 있는 제한사항",
    임대수익률: "임대료 수익을 투자금액으로 나눈 비율",
    상권: "상업 활동이 활발한 지역의 범위",
    유동인구: "상가 주변을 지나다니는 사람들의 수",
    임대료수준: "해당 지역 상가의 평균 임대료",
    시장가: "부동산의 실제 거래가격. 감정가와 다를 수 있습니다.",
    입찰시작가: "경매에서 입찰을 시작하는 최초 가격",
    권리분석: "부동산에 설정된 각종 권리들의 우선순위와 내용을 파악하는 것",
    "임차인 현황": "해당 부동산에 거주하는 임차인들의 보증금, 월세 등 정보",
    "입찰가 산정": "경매에 참여할 적정 입찰가격을 계산하는 것",
    "리스크 체크": "경매 참여 시 발생할 수 있는 위험요소들을 점검하는 것",
    채무자: "경매 대상 부동산의 소유자이자 채무를 진 사람",
    채권자: "채무자에게 돈을 빌려준 사람이나 기관",
    소유자: "부동산의 법적 소유자",
    기일입찰: "정해진 날짜와 시간에 법원에서 진행하는 입찰 방식",
    전자입찰: "인터넷을 통해 진행하는 입찰 방식",
    입찰: "경매에서 매물을 구매하기 위해 가격을 제시하는 행위",
    매각: "경매를 통해 부동산을 판매하는 것",
    매각기일: "경매가 진행되는 날짜",
    매각기일공고: "경매 일정을 공지하는 법원 공고",
    감정평가: "부동산의 시장가치를 전문가가 평가하는 과정",
    감정평가서: "부동산의 시장가치를 평가한 공식 문서",
    토지면적: "부동산의 토지 부분 면적",
    건물면적: "부동산의 건물 부분 면적",
    전용면적: "실제 사용할 수 있는 면적",
    공용면적: "공동으로 사용하는 면적",
    구조: "건물의 건축 구조 방식",
    용도: "부동산의 사용 목적",
    층수: "건물의 총 층수",
    해당층: "경매 대상이 되는 층",
    유찰횟수: "경매에서 유찰된 횟수",
    유찰사유: "경매에서 유찰된 이유",
    낙찰가: "경매에서 최종 낙찰된 가격",
    낙찰자: "경매에서 최종 낙찰받은 사람",
    계약금: "낙찰 후 계약 시 지급하는 금액",
    잔금: "계약금을 제외한 나머지 금액",
    인수기일: "낙찰 후 부동산을 인수하는 날짜",
    인수조건: "부동산 인수 시 적용되는 조건들",
  };

  return explanations[term] || term;
}

// 매물별 동적 단계별 가이드 생성 함수
function generateDynamicStepGuide(property: SimulationScenario): {
  [key: string]: string;
} {
  console.log("🔍 [동적 가이드] 매물별 단계별 가이드 생성:", property.id);

  const { basicInfo, rights, tenants, propertyDetails } = property;
  const hasComplexRights = rights && rights.length > 2;
  const hasTenants = tenants && tenants.length > 0;
  const hasSmallTenants = tenants && tenants.some((t) => t.isSmallTenant);
  const hasMultipleMortgages =
    rights && rights.filter((r) => r.rightType === "근저당권").length > 1;
  const isApartment = propertyDetails?.usage === "아파트";
  const isOffice = propertyDetails?.usage === "오피스텔";
  const isCommercial = propertyDetails?.usage === "상가";

  const guide: { [key: string]: string } = {};

  // 1단계: 권리분석 (매물 특성에 따라 다름)
  if (hasMultipleMortgages) {
    guide.step1 = `다중 근저당권이 설정된 복잡한 권리구조입니다. 
    • 말소기준권리(${
      rights?.find((r) => r.isMalsoBaseRight)?.rightType || "근저당권"
    }) 확인
    • 각 근저당권의 설정일자와 청구금액 비교
    • 배당순위에 따른 권리 소멸/인수 여부 파악
    • 권리분석 전문가 상담 권장`;
  } else if (hasComplexRights) {
    guide.step1 = `다양한 권리가 설정된 매물입니다.
    • 근저당권 외 다른 권리들(${rights
      ?.map((r) => r.rightType)
      .join(", ")}) 확인
    • 각 권리의 인수/소멸 여부 파악
    • 권리자별 청구금액과 배당 가능성 검토`;
  } else {
    guide.step1 = `단순한 권리구조의 매물입니다.
    • 근저당권 1개만 설정된 안전한 구조
    • 권리분석이 상대적으로 간단
    • 입찰 시 권리 인수 부담 최소화`;
  }

  // 2단계: 임차인 현황 (임차인 유무에 따라 다름)
  if (hasTenants) {
    const tenantCount = tenants?.length || 0;
    const smallTenantCount =
      tenants?.filter((t) => t.isSmallTenant).length || 0;
    const daehangryeokCount =
      tenants?.filter((t) => t.hasDaehangryeok).length || 0;

    guide.step2 = `임차인이 ${tenantCount}명 거주 중입니다.
    • 소액임차인 ${smallTenantCount}명 (우선변제 대상)
    • 대항력 보유 임차인 ${daehangryeokCount}명
    • 총 인수비용: ${tenants
      ?.reduce((sum, t) => sum + t.deposit, 0)
      .toLocaleString("ko-KR")}원
    • 임차인 인수 시 추가 비용 고려 필요`;

    if (hasSmallTenants) {
      guide.step2 += `\n    ⚠️ 소액임차인 우선변제로 인한 추가 비용 발생 가능`;
    }
  } else {
    guide.step2 = `임차인이 없는 깨끗한 매물입니다.
    • 인수 시 추가 비용 없음
    • 즉시 입주 또는 재임대 가능
    • 투자 리스크 최소화`;
  }

  // 3단계: 입찰가 산정 (매물 유형에 따라 다름)
  const basePrice = basicInfo.minimumBidPrice || 0;
  const appraisalPrice = basicInfo.appraisalValue || 0;
  const discountRate = Math.round((1 - basePrice / appraisalPrice) * 100);

  if (isApartment) {
    guide.step3 = `아파트 매물의 입찰가 산정입니다.
    • 현재 할인율: ${discountRate}%
    • 권장 입찰가: ${Math.round(basePrice * 1.15).toLocaleString(
      "ko-KR"
    )}원 (최저가 +15%)
    • 아파트 특성상 안정적인 투자 가능
    • 관리비 및 입주민 규정 확인 필요`;
  } else if (isOffice) {
    guide.step3 = `오피스텔 매물의 입찰가 산정입니다.
    • 현재 할인율: ${discountRate}%
    • 권장 입찰가: ${Math.round(basePrice * 1.2).toLocaleString(
      "ko-KR"
    )}원 (최저가 +20%)
    • 상업용 관리비 고려 필요
    • 용도변경 제한사항 확인`;
  } else if (isCommercial) {
    guide.step3 = `상가 매물의 입찰가 산정입니다.
    • 현재 할인율: ${discountRate}%
    • 권장 입찰가: ${Math.round(basePrice * 1.25).toLocaleString(
      "ko-KR"
    )}원 (최저가 +25%)
    • 상권 분석 및 임대수익률 검토 필요
    • 용도변경 가능성 확인`;
  } else {
    guide.step3 = `일반 매물의 입찰가 산정입니다.
    • 현재 할인율: ${discountRate}%
    • 권장 입찰가: ${Math.round(basePrice * 1.1).toLocaleString(
      "ko-KR"
    )}원 (최저가 +10%)
    • 매물 특성에 맞는 활용 방안 검토`;
  }

  // 4단계: 리스크 체크 (매물별 특성에 따라 다름)
  const risks = [];
  if (hasComplexRights) risks.push("복잡한 권리구조");
  if (hasTenants) risks.push("임차인 인수 부담");
  if (hasSmallTenants) risks.push("소액임차인 우선변제");
  if (discountRate < 20) risks.push("낮은 할인율");

  if (risks.length > 0) {
    guide.step4 = `주의해야 할 리스크 요소들:
    • ${risks.join(", ")}
    • 입찰 전 현장 답사 필수
    • 권리분석 전문가 상담 권장
    • 충분한 자금 확보 필요`;
  } else {
    guide.step4 = `상대적으로 안전한 매물입니다.
    • 단순한 권리구조
    • 임차인 부담 없음
    • 적정 할인율
    • 신중한 입찰 전략 수립`;
  }

  console.log("✅ [동적 가이드] 생성 완료:", guide);
  return guide;
}

// 단계별 가이드 제목 함수
function getStepTitle(stepKey: string): string {
  const titles: { [key: string]: string } = {
    step1: "권리분석 시작하기",
    step2: "임차인 현황 파악하기",
    step3: "입찰가 산정하기",
    step4: "리스크 체크",
  };

  return titles[stepKey] || stepKey;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const { educationalProperties, devMode } = useSimulationStore();

  // 토글 상태 관리
  const [showRisks, setShowRisks] = useState(false);
  const [showProTips, setShowProTips] = useState(false);
  const [showLegalTerms, setShowLegalTerms] = useState(false);
  const [showStepGuide, setShowStepGuide] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<"education" | "report">(
    "education"
  );
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showAuctionAnalysisModal, setShowAuctionAnalysisModal] =
    useState(false);
  const [waitlistForm, setWaitlistForm] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [property, setProperty] = useState<SimulationScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rightsAnalysis, setRightsAnalysis] = useState<any>(null);

  // 대기자 명단 제출 함수
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("대기자 명단 제출:", waitlistForm);
      // TODO: 실제 API 호출로 대체
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 시뮬레이션

      alert("서비스가 정식출시되면 알려드리겠습니다. 감사합니다");
      setShowWaitlistModal(false);
      setWaitlistForm({ name: "", email: "" });
    } catch (error) {
      console.error("대기자 명단 제출 실패:", error);
      alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    console.log("매물 상세보기 페이지 로드:", propertyId);

    if (!propertyId) {
      setError("매물 ID가 없습니다.");
      setIsLoading(false);
      return;
    }

    const loadProperty = async () => {
      try {
        // 먼저 스토어에서 매물 찾기
        const foundProperty = educationalProperties.find(
          (p) => p.id === propertyId
        );

        if (foundProperty) {
          console.log("매물 정보 찾음:", foundProperty);
          setProperty(foundProperty);

          // 개발자 모드에서 권리분석 실행
          if (devMode.isDevMode) {
            console.log("🔍 [개발자 모드] 권리분석 실행");
            const analysis = analyzeRights(foundProperty);
            setRightsAnalysis(analysis);
            console.log("권리분석 결과:", analysis);
          }
        } else {
          console.log("매물을 찾을 수 없음, 새로 생성:", propertyId);
          // 매물을 찾을 수 없으면 새로 생성 (초급으로 생성)
          const newProperty = await generateProperty("초급");
          console.log("새로 생성된 매물:", newProperty);
          setProperty(newProperty);

          // 개발자 모드에서 권리분석 실행
          if (devMode.isDevMode) {
            console.log("🔍 [개발자 모드] 권리분석 실행");
            const analysis = analyzeRights(newProperty);
            setRightsAnalysis(analysis);
            console.log("권리분석 결과:", analysis);
          }
        }
      } catch (err) {
        console.error("매물 로드 실패:", err);
        setError("매물 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [propertyId, educationalProperties, devMode.isDevMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-64 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || "매물을 찾을 수 없습니다"}
            </h1>
            <p className="text-gray-600 mb-6">
              요청하신 매물 정보를 불러올 수 없습니다.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { basicInfo, educationalContent } = property;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← 메인으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">매물 상세 정보</h1>
          <p className="text-gray-600 mt-2">
            경매 매물의 상세 정보와 교육 포인트를 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 매물 기본 정보 */}
          <div className="lg:col-span-2">
            {/* 사건 기본정보 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-xl font-bold">사건 기본정보</h2>
                <p className="text-blue-100 text-sm">
                  조회수: 1,026 | 입찰 {basicInfo.daysUntilBid}일 전
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">소재지</span>
                      <span className="font-medium text-right max-w-xs">
                        {basicInfo.location}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">경매종류</span>
                      <span className="font-medium">
                        {basicInfo.auctionType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">물건종류</span>
                      <span className="font-medium">
                        {basicInfo.propertyType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">경매대상</span>
                      <span className="font-medium">토지 및 건물일괄매각</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">입찰방법</span>
                      <span className="font-medium">
                        {basicInfo.biddingMethod}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">토지면적</span>
                      <span className="font-medium">
                        {property.propertyDetails?.landAreaPyeong || 0}평
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">건물면적</span>
                      <span className="font-medium">
                        {property.propertyDetails?.buildingAreaPyeong || 0}평
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">감정가</span>
                      <span className="font-bold text-blue-600">
                        {basicInfo.appraisalValue?.toLocaleString("ko-KR") ||
                          "0"}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">최저가</span>
                      <span className="font-bold text-red-600">
                        ↓{" "}
                        {Math.round(
                          (1 -
                            basicInfo.minimumBidPrice /
                              basicInfo.appraisalValue) *
                            100
                        )}
                        %{" "}
                        {basicInfo.minimumBidPrice?.toLocaleString("ko-KR") ||
                          "0"}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">입찰보증금</span>
                      <span className="font-medium">
                        (10%){" "}
                        {Math.round(
                          (basicInfo.minimumBidPrice || 0) * 0.1
                        ).toLocaleString("ko-KR")}
                        원
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">채무/소유자</span>
                      <span className="font-medium">
                        {basicInfo.debtor} / {basicInfo.owner}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">채권자</span>
                      <span className="font-medium">{basicInfo.creditor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">청구금액</span>
                      <span className="font-medium">
                        {basicInfo.claimAmount?.toLocaleString("ko-KR") || "0"}
                        원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 진행일정 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-bold">진행일정</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">경과</th>
                        <th className="text-left py-2">진행</th>
                        <th className="text-left py-2">날짜</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2">1일</td>
                        <td className="py-2">경매사건접수</td>
                        <td className="py-2">
                          {property.schedule?.caseFiledDate || "정보 없음"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">6일</td>
                        <td className="py-2">개시결정일</td>
                        <td className="py-2">
                          {property.schedule?.decisionDate || "정보 없음"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">97일</td>
                        <td className="py-2">배당요구종기일</td>
                        <td className="py-2">
                          {property.schedule?.dividendDeadline || "정보 없음"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">418일</td>
                        <td className="py-2">최초경매일</td>
                        <td className="py-2">
                          {property.schedule?.firstAuctionDate || "정보 없음"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 매각일정 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-bold">매각일정</h3>
                <p className="text-gray-300 text-sm">
                  입찰 {basicInfo.daysUntilBid}일 전
                </p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">경과</th>
                        <th className="text-left py-2">회차</th>
                        <th className="text-left py-2">매각기일</th>
                        <th className="text-left py-2">최저가</th>
                        <th className="text-left py-2">비율</th>
                        <th className="text-left py-2">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.biddingHistory?.map((bid, index) => (
                        <tr key={index}>
                          <td className="py-2">
                            {bid.round === 1
                              ? "417일"
                              : bid.round === 2
                              ? "501일"
                              : bid.round === 3
                              ? "543일"
                              : bid.round === 4
                              ? "585일"
                              : "627일"}
                          </td>
                          <td className="py-2">{bid.round}</td>
                          <td className="py-2">
                            {new Date(bid.auctionDate).toLocaleDateString(
                              "ko-KR"
                            )}
                          </td>
                          <td className="py-2">
                            {bid.minimumPrice.toLocaleString("ko-KR")}원
                          </td>
                          <td className="py-2">{bid.priceRatio}%</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                bid.result === "진행"
                                  ? "bg-blue-100 text-blue-800"
                                  : bid.result === "유찰"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {bid.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 감정평가현황 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-bold">감정평가현황</h3>
                <p className="text-gray-300 text-sm">
                  [감정원 : 경남감정 / 가격시점 : 2024.02.22]
                </p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">목록</th>
                        <th className="text-left py-2">주소</th>
                        <th className="text-left py-2">구조/용도/대지권</th>
                        <th className="text-left py-2">면적</th>
                        <th className="text-left py-2">감정가</th>
                        <th className="text-left py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2">목록1</td>
                        <td className="py-2">{basicInfo.location}</td>
                        <td className="py-2">
                          {property.propertyDetails?.structure ||
                            "철근콘크리트조"}{" "}
                          / {property.propertyDetails?.usage || "아파트"}
                        </td>
                        <td className="py-2">
                          {property.propertyDetails?.landAreaPyeong || 0}평
                        </td>
                        <td className="py-2 font-bold text-blue-600">
                          {basicInfo.appraisalValue?.toLocaleString("ko-KR") ||
                            "0"}
                          원
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          본건은 아파트로 현황은 거주용임
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 임차인현황 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-bold">임차인현황</h3>
                <p className="text-gray-300 text-sm">
                  [말소기준권리 : 2014. 8. 28.근저당권. 설정, 배당요구종기일 :
                  2024/05/14]
                </p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex gap-4 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                      주택임대차보호법 기준
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                      상가임대차보호법 기준
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">임차인</th>
                        <th className="text-left py-2">용도/점유</th>
                        <th className="text-left py-2">전입일자</th>
                        <th className="text-left py-2">확정일자</th>
                        <th className="text-left py-2">배당요구일</th>
                        <th className="text-left py-2">보증금/월세</th>
                        <th className="text-left py-2">대항력</th>
                        <th className="text-left py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.tenants?.map((tenant, index) => (
                        <tr key={tenant.id}>
                          <td className="py-2">{tenant.tenantName}</td>
                          <td className="py-2">본건전체</td>
                          <td className="py-2">{tenant.moveInDate}</td>
                          <td className="py-2">
                            {tenant.confirmationDate || "미상"}
                          </td>
                          <td className="py-2">X</td>
                          <td className="py-2">
                            {tenant.deposit.toLocaleString("ko-KR")}[월]
                            {tenant.monthlyRent.toLocaleString("ko-KR")}
                          </td>
                          <td className="py-2">
                            {tenant.hasDaehangryeok ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                O
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                X
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-sm text-gray-600">
                            {tenant.isSmallTenant ? "소액임차인 우선변제" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>매각물건명세서비고:</strong> 권리신고 없어
                    임대차관계 불분명
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>현황조사서기타:</strong> 현장에서 직원을 만나
                    서류제출 안내장을 주었으며 차후 서류는 제출한다고 하며 본건
                    임차관계내용은 전입세대열람내역 및 상가건물임대차현황서를
                    바탕으로 작성된 내용임
                  </p>
                </div>
              </div>
            </div>

            {/* 토지등기부 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-bold">토지등기부</h3>
                <p className="text-gray-300 text-sm">등기부상 권리 현황</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">순위</th>
                        <th className="text-left py-2">권리종류</th>
                        <th className="text-left py-2">권리자</th>
                        <th className="text-left py-2">등기일</th>
                        <th className="text-left py-2">청구금액</th>
                        <th className="text-left py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.rights?.map((right, index) => (
                        <tr key={right.id}>
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2">{right.rightType}</td>
                          <td className="py-2">{right.rightHolder}</td>
                          <td className="py-2">{right.registrationDate}</td>
                          <td className="py-2 font-bold text-blue-600">
                            {right.claimAmount.toLocaleString("ko-KR")}원
                          </td>
                          <td className="py-2">
                            {right.isMalsoBaseRight && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                말소기준권리
                              </span>
                            )}
                            {right.willBeAssumed && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                인수
                              </span>
                            )}
                            {right.willBeExtinguished && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                소멸
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 예상배당표 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-bold">예상배당표</h3>
                <p className="text-gray-300 text-sm">
                  경매 매각대금 배당 순서 및 예상 금액
                </p>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>매각대금:</strong>{" "}
                    {basicInfo.minimumBidPrice?.toLocaleString("ko-KR") || "0"}
                    원 (최저가 기준)
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">순위</th>
                        <th className="text-left py-2">권리자</th>
                        <th className="text-left py-2">권리종류</th>
                        <th className="text-left py-2">청구금액</th>
                        <th className="text-left py-2">예상배당</th>
                        <th className="text-left py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.rights?.map((right, index) => (
                        <tr key={right.id}>
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2">{right.rightHolder}</td>
                          <td className="py-2">{right.rightType}</td>
                          <td className="py-2">
                            {right.claimAmount.toLocaleString("ko-KR")}원
                          </td>
                          <td className="py-2 font-bold text-green-600">
                            {right.willBeAssumed
                              ? right.claimAmount.toLocaleString("ko-KR") + "원"
                              : "0원"}
                          </td>
                          <td className="py-2">
                            {right.willBeAssumed ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                배당
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                소멸
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* 임차인 우선변제 */}
                      {property.tenants
                        ?.filter((t) => t.isSmallTenant)
                        .map((tenant, index) => (
                          <tr
                            key={`tenant-${tenant.id}`}
                            className="bg-yellow-50"
                          >
                            <td className="py-2">-</td>
                            <td className="py-2">{tenant.tenantName}</td>
                            <td className="py-2">소액임차인</td>
                            <td className="py-2">
                              {tenant.priorityPaymentAmount.toLocaleString(
                                "ko-KR"
                              )}
                              원
                            </td>
                            <td className="py-2 font-bold text-yellow-600">
                              {tenant.priorityPaymentAmount.toLocaleString(
                                "ko-KR"
                              )}
                              원
                            </td>
                            <td className="py-2">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                우선변제
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>참고:</strong> 실제 배당은 매각대금에 따라 달라질 수
                    있습니다. 소액임차인은 우선변제를 받을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 지역분석 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-gray-800 text-white px-6 py-4">
                <h3 className="text-lg font-bold">지역분석</h3>
                <p className="text-gray-300 text-sm">
                  관할 법원, 등기소, 세무서 정보
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 법원 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      법원
                    </h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {property.regionalAnalysis.court.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ({property.regionalAnalysis.court.code})
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {property.regionalAnalysis.court.address}
                      </p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">입찰시작시간:</span>{" "}
                          {property.regionalAnalysis.court.biddingStartTime}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">입찰마감시간:</span>{" "}
                          {property.regionalAnalysis.court.biddingEndTime}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">개찰시간:</span>{" "}
                          {property.regionalAnalysis.court.openingTime}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">대표:</span>{" "}
                          {property.regionalAnalysis.court.phone}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {property.regionalAnalysis.court.jurisdiction}
                      </p>
                    </div>
                  </div>

                  {/* 등기소 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      등기소
                    </h4>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {property.regionalAnalysis.registry.name}
                      </p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">대표:</span>{" "}
                          {property.regionalAnalysis.registry.phone}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">팩스:</span>{" "}
                          {property.regionalAnalysis.registry.fax}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          {property.regionalAnalysis.registry.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 세무서 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      세무서
                    </h4>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {property.regionalAnalysis.taxOffice.name}
                      </p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">대표:</span>{" "}
                          {property.regionalAnalysis.taxOffice.phone}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">팩스:</span>{" "}
                          {property.regionalAnalysis.taxOffice.fax}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          {property.regionalAnalysis.taxOffice.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 외부 링크 */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    관련 링크
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {property.regionalAnalysis.externalLinks.map(
                      (link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
                        >
                          <div className="text-sm font-medium text-gray-700">
                            {link.name}
                          </div>
                        </a>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="lg:col-span-1">
            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("education")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "education"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  📚 교육 포인트
                </button>
                <button
                  onClick={() => {
                    if (devMode.isDevMode) {
                      setActiveTab("report");
                    } else {
                      setShowWaitlistModal(true);
                    }
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "report" && devMode.isDevMode
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  📊 경매분석 리포트
                </button>
              </div>
            </div>

            {/* 교육 포인트 탭 */}
            {activeTab === "education" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📚 교육 포인트
                </h3>

                {/* 매물별 교육포인트 간략 설명 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="text-blue-600 mr-2">💡</span>이 매물의 핵심
                    학습 포인트
                  </h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    {property && (
                      <>
                        {/* 매물 유형별 핵심 포인트 */}
                        {property.propertyDetails?.usage === "아파트" && (
                          <p>
                            <strong>아파트 경매:</strong> 안정적인 투자 매물로,
                            관리비와 입주민 규정을 꼼꼼히 확인해야 합니다.
                          </p>
                        )}
                        {property.propertyDetails?.usage === "오피스텔" && (
                          <p>
                            <strong>오피스텔 경매:</strong> 상업용 관리비와
                            용도변경 제한사항을 반드시 검토해야 합니다.
                          </p>
                        )}
                        {property.propertyDetails?.usage === "상가" && (
                          <p>
                            <strong>상가 경매:</strong> 상권 분석과 임대수익률을
                            중점적으로 검토해야 합니다.
                          </p>
                        )}

                        {/* 권리 복잡도에 따른 포인트 */}
                        {property.rights && property.rights.length > 2 && (
                          <p>
                            <strong>복잡한 권리구조:</strong> 다중 근저당권이나
                            다양한 권리가 설정되어 있어 신중한 분석이
                            필요합니다.
                          </p>
                        )}

                        {/* 임차인 관련 포인트 */}
                        {property.tenants && property.tenants.length > 0 && (
                          <p>
                            <strong>임차인 인수:</strong>{" "}
                            {property.tenants.length}명의 임차인이 거주 중이어서
                            인수 비용을 고려해야 합니다.
                            {property.tenants.some((t) => t.isSmallTenant) &&
                              " 특히 소액임차인 우선변제로 인한 추가 비용이 발생할 수 있습니다."}
                          </p>
                        )}

                        {/* 할인율에 따른 포인트 */}
                        {(() => {
                          const discountRate = Math.round(
                            (1 -
                              (property.basicInfo.minimumBidPrice || 0) /
                                (property.basicInfo.appraisalValue || 1)) *
                              100
                          );
                          if (discountRate > 30) {
                            return (
                              <p>
                                <strong>높은 할인율:</strong> {discountRate}%의
                                높은 할인율로 투자 기회가 좋지만, 숨겨진
                                리스크가 있을 수 있습니다.
                              </p>
                            );
                          } else if (discountRate < 20) {
                            return (
                              <p>
                                <strong>낮은 할인율:</strong> {discountRate}%의
                                낮은 할인율로 안전하지만 수익성은 제한적일 수
                                있습니다.
                              </p>
                            );
                          } else {
                            return (
                              <p>
                                <strong>적정 할인율:</strong> {discountRate}%의
                                적정 할인율로 균형잡힌 투자 기회입니다.
                              </p>
                            );
                          }
                        })()}
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 매물별 맞춤 가이드 */}
                  <div>
                    <button
                      onClick={() => setShowStepGuide(!showStepGuide)}
                      className="flex items-center justify-between w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-800">
                        📋 매물별 맞춤 가이드
                      </h4>
                      <span className="text-yellow-600">
                        {showStepGuide ? "▲" : "▼"}
                      </span>
                    </button>
                    {showStepGuide && (
                      <div className="mt-3 space-y-2">
                        {Object.entries(
                          educationalContent?.stepByStepGuide ||
                            generateDynamicStepGuide(property)
                        ).map(([key, value], index) => (
                          <div
                            key={key}
                            className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r"
                          >
                            <p className="text-sm text-gray-700 font-medium mb-1">
                              {index + 1}단계: {getStepTitle(key)}
                            </p>
                            <p className="text-xs text-gray-600 whitespace-pre-line">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 핵심 분석 */}
                  {educationalContent?.coreAnalysis?.keyPoints && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">
                        🔍 핵심 분석
                      </h4>
                      <div className="space-y-2">
                        {educationalContent.coreAnalysis.keyPoints.map(
                          (point, index) => (
                            <div
                              key={index}
                              className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r"
                            >
                              <p className="text-sm text-gray-700 font-medium mb-1">
                                {point}
                              </p>
                              <p className="text-xs text-gray-600">
                                {getTermExplanation(
                                  point,
                                  educationalContent.coreAnalysis?.keyPoints ||
                                    []
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* 예상 리스크 */}
                  {educationalContent?.coreAnalysis?.risks &&
                    educationalContent.coreAnalysis.risks.length > 0 && (
                      <div>
                        <button
                          onClick={() => setShowRisks(!showRisks)}
                          className="flex items-center justify-between w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <h4 className="font-medium text-gray-800">
                            ⚠️ 예상 리스크
                          </h4>
                          <span className="text-red-600">
                            {showRisks ? "▲" : "▼"}
                          </span>
                        </button>
                        {showRisks && (
                          <div className="mt-3 space-y-2">
                            {educationalContent.coreAnalysis.risks.map(
                              (risk, index) => (
                                <div
                                  key={index}
                                  className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r"
                                >
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    {risk}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation(
                                      risk,
                                      educationalContent.coreAnalysis
                                        ?.keyPoints || []
                                    )}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {/* 실전 팁 */}
                  {educationalContent?.proTips &&
                    educationalContent.proTips.length > 0 && (
                      <div>
                        <button
                          onClick={() => setShowProTips(!showProTips)}
                          className="flex items-center justify-between w-full p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <h4 className="font-medium text-gray-800">
                            🎯 실전 팁
                          </h4>
                          <span className="text-indigo-600">
                            {showProTips ? "▲" : "▼"}
                          </span>
                        </button>
                        {showProTips && (
                          <div className="mt-3 space-y-2">
                            {educationalContent.proTips.map((tip, index) => (
                              <div
                                key={index}
                                className="p-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-r"
                              >
                                <p className="text-sm text-gray-700 font-medium mb-1">
                                  {tip}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {getTermExplanation(
                                    tip,
                                    educationalContent.coreAnalysis
                                      ?.keyPoints || []
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  {/* 주요 용어 설명 */}
                  <div>
                    <button
                      onClick={() => setShowTerms(!showTerms)}
                      className="flex items-center justify-between w-full p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-800">
                        📖 주요 용어 설명
                      </h4>
                      <span className="text-purple-600">
                        {showTerms ? "▲" : "▼"}
                      </span>
                    </button>
                    {showTerms && (
                      <div className="mt-3 space-y-2">
                        {/* 매물에서 발견된 용어들을 자동으로 표시 */}
                        {property && (
                          <>
                            {/* 근저당권 관련 */}
                            {property.rights?.some(
                              (r) => r.rightType === "근저당권"
                            ) && (
                              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                                <p className="text-sm text-gray-700 font-medium mb-1">
                                  근저당권
                                </p>
                                <p className="text-xs text-gray-600">
                                  {getTermExplanation("근저당권")}
                                </p>
                              </div>
                            )}

                            {/* 다중 근저당권 */}
                            {property.rights &&
                              property.rights.filter(
                                (r) => r.rightType === "근저당권"
                              ).length > 1 && (
                                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    다중 근저당권
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation("다중 근저당권")}
                                  </p>
                                </div>
                              )}

                            {/* 임차인 관련 */}
                            {property.tenants &&
                              property.tenants.length > 0 && (
                                <>
                                  <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded-r">
                                    <p className="text-sm text-gray-700 font-medium mb-1">
                                      임차인
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      부동산을 임대차 계약으로 사용하는 사람
                                    </p>
                                  </div>

                                  {property.tenants.some(
                                    (t) => t.hasDaehangryeok
                                  ) && (
                                    <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded-r">
                                      <p className="text-sm text-gray-700 font-medium mb-1">
                                        임차인 대항력
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {getTermExplanation("임차인 대항력")}
                                      </p>
                                    </div>
                                  )}

                                  {property.tenants.some(
                                    (t) => t.isSmallTenant
                                  ) && (
                                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                                      <p className="text-sm text-gray-700 font-medium mb-1">
                                        소액임차인
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {getTermExplanation("소액임차인")}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}

                            {/* 경매 관련 기본 용어 */}
                            <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-r">
                              <p className="text-sm text-gray-700 font-medium mb-1">
                                경매
                              </p>
                              <p className="text-xs text-gray-600">
                                {getTermExplanation("경매")}
                              </p>
                            </div>

                            <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-r">
                              <p className="text-sm text-gray-700 font-medium mb-1">
                                감정가
                              </p>
                              <p className="text-xs text-gray-600">
                                {getTermExplanation("감정가")}
                              </p>
                            </div>

                            <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-r">
                              <p className="text-sm text-gray-700 font-medium mb-1">
                                최저가
                              </p>
                              <p className="text-xs text-gray-600">
                                {getTermExplanation("최저가")}
                              </p>
                            </div>

                            {/* 매물 유형별 추가 용어 */}
                            {property.propertyDetails?.usage === "아파트" && (
                              <>
                                <div className="p-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-r">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    관리비
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation("관리비")}
                                  </p>
                                </div>
                                <div className="p-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-r">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    입주민규정
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation("입주민규정")}
                                  </p>
                                </div>
                              </>
                            )}

                            {property.propertyDetails?.usage === "오피스텔" && (
                              <>
                                <div className="p-3 bg-teal-50 border-l-4 border-teal-400 rounded-r">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    상업용관리비
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation("상업용관리비")}
                                  </p>
                                </div>
                                <div className="p-3 bg-teal-50 border-l-4 border-teal-400 rounded-r">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    용도변경제한
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation("용도변경제한")}
                                  </p>
                                </div>
                              </>
                            )}

                            {property.propertyDetails?.usage === "상가" && (
                              <>
                                <div className="p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    임대수익률
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation("임대수익률")}
                                  </p>
                                </div>
                                <div className="p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    상권
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation("상권")}
                                  </p>
                                </div>
                                <div className="p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    유동인구
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {getTermExplanation("유동인구")}
                                  </p>
                                </div>
                              </>
                            )}

                            {/* 권리 관련 추가 용어 */}
                            {property.rights?.some(
                              (r) => r.rightType === "가압류"
                            ) && (
                              <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r">
                                <p className="text-sm text-gray-700 font-medium mb-1">
                                  가압류
                                </p>
                                <p className="text-xs text-gray-600">
                                  {getTermExplanation("가압류")}
                                </p>
                              </div>
                            )}

                            {property.rights?.some(
                              (r) => r.rightType === "전세권"
                            ) && (
                              <div className="p-3 bg-cyan-50 border-l-4 border-cyan-400 rounded-r">
                                <p className="text-sm text-gray-700 font-medium mb-1">
                                  전세권
                                </p>
                                <p className="text-xs text-gray-600">
                                  {getTermExplanation("전세권")}
                                </p>
                              </div>
                            )}

                            {property.rights?.some(
                              (r) => r.rightType === "지상권"
                            ) && (
                              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-400 rounded-r">
                                <p className="text-sm text-gray-700 font-medium mb-1">
                                  지상권
                                </p>
                                <p className="text-xs text-gray-600">
                                  {getTermExplanation("지상권")}
                                </p>
                              </div>
                            )}

                            {/* 말소기준권리 */}
                            {property.rights?.some(
                              (r) => r.isMalsoBaseRight
                            ) && (
                              <div className="p-3 bg-pink-50 border-l-4 border-pink-400 rounded-r">
                                <p className="text-sm text-gray-700 font-medium mb-1">
                                  말소기준권리
                                </p>
                                <p className="text-xs text-gray-600">
                                  {getTermExplanation("말소기준권리")}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 경매분석 리포트 탭 */}
            {activeTab === "report" && devMode.isDevMode && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📊 경매분석 리포트
                  </h3>
                  <button
                    onClick={() => setShowAuctionAnalysisModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span>상세 리포트 보기</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 매물 기본 정보 요약 */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      📋 매물 기본 정보
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-800">
                          소재지
                        </p>
                        <p className="text-sm text-gray-700">
                          {property.basicInfo.location}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-800">
                          물건종류
                        </p>
                        <p className="text-sm text-gray-700">
                          {property.basicInfo.propertyType}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-800">
                            감정가
                          </p>
                          <p className="text-sm font-bold text-blue-600">
                            {property.basicInfo.appraisalValue?.toLocaleString(
                              "ko-KR"
                            ) || "0"}
                            원
                          </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-800">
                            최저가
                          </p>
                          <p className="text-sm font-bold text-red-600">
                            {property.basicInfo.minimumBidPrice?.toLocaleString(
                              "ko-KR"
                            ) || "0"}
                            원
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 권리 현황 분석 */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      ⚖️ 권리 현황 분석
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-800">
                          총 권리 수
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          {property.rights?.length || 0}개
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-800">
                          인수 권리
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {property.rights?.filter((r) => r.willBeAssumed)
                            .length || 0}
                          개
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-800">
                          소멸 권리
                        </p>
                        <p className="text-lg font-bold text-gray-600">
                          {property.rights?.filter((r) => r.willBeExtinguished)
                            .length || 0}
                          개
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 임차인 현황 분석 */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      🏠 임차인 현황 분석
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-800">
                          총 임차인 수
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {property.tenants?.length || 0}명
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-800">
                          소액임차인
                        </p>
                        <p className="text-lg font-bold text-yellow-600">
                          {property.tenants?.filter((t) => t.isSmallTenant)
                            .length || 0}
                          명
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-800">
                          대항력 보유
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {property.tenants?.filter((t) => t.hasDaehangryeok)
                            .length || 0}
                          명
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 투자 분석 */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      💰 투자 분석
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-800">
                          할인율
                        </p>
                        <p className="text-lg font-bold text-purple-600">
                          {Math.round(
                            (1 -
                              (property.basicInfo.minimumBidPrice || 0) /
                                (property.basicInfo.appraisalValue || 1)) *
                              100
                          )}
                          %
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-800">
                            권리 복잡도
                          </p>
                          <p className="text-sm font-bold text-blue-600">
                            {property.rights && property.rights.length > 3
                              ? "높음 ⚠️"
                              : "보통 ✅"}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-800">
                            임차인 리스크
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            {property.tenants && property.tenants.length > 0
                              ? "있음 ⚠️"
                              : "없음 ✅"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 권장 입찰 전략 */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      📈 권장 입찰 전략
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-800">
                          권장 입찰가
                        </p>
                        <p className="text-lg font-bold text-orange-600">
                          {Math.round(
                            (property.basicInfo.minimumBidPrice || 0) * 1.2
                          ).toLocaleString("ko-KR")}
                          원
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">
                          <strong>종합 평가:</strong>{" "}
                          {property.rights && property.rights.length > 3
                            ? "권리가 복잡하여 신중한 검토가 필요합니다. "
                            : "권리 구조가 단순하여 투자하기 적합합니다. "}
                          {property.tenants && property.tenants.length > 0
                            ? "임차인 인수 비용을 고려한 입찰가 산정이 필요합니다."
                            : "임차인 부담이 없어 투자 리스크가 낮습니다."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="mt-6 space-y-3">
              <Link
                href="/"
                className="block w-full px-4 py-3 bg-gray-100 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                다른 매물 보기
              </Link>
            </div>
          </div>
        </div>

        {/* 대기자 명단 수집 모달 */}
        {showWaitlistModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📊 경매분석 리포트
                  </h3>
                  <button
                    onClick={() => setShowWaitlistModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    경매분석 리포트는 현재 개발 중입니다.
                    <br />
                    <strong>서비스가 정식출시되면 알려드리겠습니다.</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    아래 정보를 입력해주시면 출시 시 가장 먼저 알려드리겠습니다.
                  </p>
                </div>

                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      이름 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={waitlistForm.name}
                      onChange={(e) =>
                        setWaitlistForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="홍길동"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      이메일 *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={waitlistForm.email}
                      onChange={(e) =>
                        setWaitlistForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowWaitlistModal(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "제출 중..." : "알림 신청"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 경매분석 상세 리포트 팝업 모달 */}
        <AuctionAnalysisModal
          isOpen={showAuctionAnalysisModal}
          onClose={() => setShowAuctionAnalysisModal(false)}
          property={property}
        />
      </div>
    </div>
  );
}
