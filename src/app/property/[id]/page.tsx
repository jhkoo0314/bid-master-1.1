"use client";

import React, { useState, useEffect, useMemo } from "react";
import SummaryHeader from "@/components/property/SummaryHeader";
import StickyBar from "@/components/property/StickyBar";
import SectionCard from "@/components/property/SectionCard";
import DecisionPanel from "@/components/property/DecisionPanel";
import ScheduleTable from "@/components/property/ScheduleTable";
import RightsTable from "@/components/property/RightsTable";
import PayoutTable from "@/components/property/PayoutTable";
import RegionPanel from "@/components/property/RegionPanel";
import {
  CourtDocumentModal,
  SaleSpecificationModal,
} from "@/components/property/CourtDocumentModal";
import RightsAnalysisReportModal from "@/components/property/RightsAnalysisReportModal";
import AuctionAnalysisReportModal from "@/components/property/AuctionAnalysisReportModal";
import { WaitlistModal } from "@/components/WaitlistModal";
import { PropertyDetail } from "@/types/property";
import { SimulationScenario } from "@/types/simulation";
import { useSimulationStore } from "@/store/simulation-store";
import { mapSimulationToPropertyDetail } from "@/lib/property/formatters";
import { analyzeRights } from "@/lib/rights-analysis-engine";
import {
  calculateRightsAmount,
  mapPropertyTypeToUse,
  calcAcquisitionAndMoS,
  type TaxInput,
  type RiskLevel,
} from "@/lib/auction-cost";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyPage({ params }: PageProps) {
  const [caseId, setCaseId] = useState<string>("");
  const [data, setData] = useState<PropertyDetail | null>(null);
  const [scenario, setScenario] = useState<SimulationScenario | null>(null); // ✨ 원본 시나리오 추가
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courtModalOpen, setCourtModalOpen] = useState(false);
  const [rightsReportOpen, setRightsReportOpen] = useState(false);
  const [auctionReportOpen, setAuctionReportOpen] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  const { getPropertyFromCache, educationalProperties, devMode } =
    useSimulationStore();

  // 권리분석 요약 계산을 컴포넌트 상단에서 일원화하여 하위에서 공용 사용
  const analysis = useMemo(() => {
    if (!scenario || !data) return undefined;
    try {
      // 권리 기반 위험도 요약
      const severityOrder = { high: 3, mid: 2, low: 1 } as const;
      const topSeverity = (data.rights || []).reduce<"low" | "mid" | "high">(
        (acc, r) => {
          const s = (r.severity as "low" | "mid" | "high") || "low";
          return severityOrder[s] > severityOrder[acc] ? s : acc;
        },
        "low"
      );

      // taxlogic.md 기준: marginAmount = V - A
      const propertyType = data.meta?.type || "기타";
      const appraisalValue = data.price?.appraised || 0;
      const marketValue = data.price?.market ?? appraisalValue;
      const minimumBidPrice =
        data.price?.lowest || Math.floor(appraisalValue * 0.7);

      // 권리유형별 인수금액 계산
      const assumedAmount = calculateRightsAmount(
        data.rights || [],
        appraisalValue,
        propertyType
      );

      // taxlogic.md 기준으로 안전마진 계산
      const propertyUse = mapPropertyTypeToUse(propertyType);
      const capex = 5_000_000; // 수리비
      const eviction = 2_000_000; // 명도비
      const carrying = 0; // 보유비
      const contingency = 1_000_000; // 예비비

      const taxInput: TaxInput = {
        use: propertyUse,
        price: minimumBidPrice,
      };

      // calcAcquisitionAndMoS 함수 실행 직전 marketValue 확인
      console.log(
        "💰 [프로퍼티 페이지] calcAcquisitionAndMoS 호출 직전 - marketValue 확인"
      );
      console.log(
        "marketValue type:",
        typeof marketValue,
        "marketValue:",
        marketValue
      );
      console.log("marketValue is NaN:", isNaN(Number(marketValue)));
      console.log("marketValue is undefined:", marketValue === undefined);

      const acquisitionResult = calcAcquisitionAndMoS({
        bidPrice: minimumBidPrice,
        rights: assumedAmount, // 권리만 (임차보증금은 별도로 계산되지 않음)
        capex,
        eviction,
        carrying,
        contingency,
        marketValue,
        taxInput,
      });

      return {
        safetyMargin: acquisitionResult.marginAmount,
        totalAssumedAmount: assumedAmount,
        trace: [],
      };
    } catch (e) {
      console.error(
        "❌ [에러] 안전마진 산출 로직 실패 (calculateSafetyMargin)",
        e
      );
      return undefined;
    }
  }, [scenario, data]);

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
          setScenario(cachedScenario); // 👈 원본 시나리오 저장
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
          setScenario(foundScenario); // 👈 원본 시나리오 저장
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            매물을 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "요청하신 매물 정보가 존재하지 않습니다."}
          </p>
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

      <SummaryHeader
        caseId={data.caseId}
        meta={data.meta}
        price={data.price}
        nextAuction={data.nextAuction}
      />
      <div className="h-3" />
      <StickyBar
        lowestPrice={data.price.lowest}
        nextAuctionDate={data.nextAuction.date}
        court={data.nextAuction.court}
        topRisk={data.risks[0]?.title}
      />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <DecisionPanel
            recommendedRange={{
              min: Math.round(data.price.lowest * 0.95),
              max: Math.round(data.price.lowest * 1.05),
            }}
            risks={data.risks}
          />

          <SectionCard
            title="진행/매각 일정"
            description="진행 상태를 시간 순으로 확인합니다."
            source="법원 공고"
          >
            <ScheduleTable data={data.schedules} />
          </SectionCard>

          <SectionCard
            title="권리관계"
            description="권리의 순위와 말소/인수 여부를 확인합니다."
            source="등기부등본"
          >
            <RightsTable data={data.rights} />
          </SectionCard>

          <SectionCard
            title="예상 배당"
            description="최저가 기준 예상 배당 금액입니다."
            source="배당표 추정"
          >
            <PayoutTable data={data.payout.rows} />
          </SectionCard>

          <RegionPanel region={data.region} />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <SectionCard
            title="매각 물건 명세서"
            description="입찰 전 반드시 참고하세요"
            source="법원 공고"
            collapsible={true}
            defaultCollapsed={!devMode?.isDevMode}
          >
            {(() => {
              if (!data) return null;
              // 일반 모드: 요약 숨기고 준비중 메시지 + 접기 기본
              if (!devMode?.isDevMode) {
                return (
                  <>
                    <div className="text-sm text-gray-600 p-3 rounded bg-gray-50 border border-gray-200 mb-2">
                      서비스 준비중 입니다
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded border border-blue-200 bg-white text-blue-700 font-semibold hover:bg-blue-50 transition"
                        onClick={() => {
                          console.log(
                            "👤 [사용자 액션] 명세서 자세히 클릭 (일반 모드)"
                          );
                          console.log("📧 [사전 알림] 모달 오픈 트리거");
                          setIsWaitlistModalOpen(true);
                        }}
                      >
                        명세서 자세히
                      </button>
                    </div>
                  </>
                );
              }
              // 요약 정보 생성
              const risks = data.risks || [];
              // 리스크: 심각도 순 정렬 후 가장 높은 것
              const sortedRisks = [...risks].sort((a, b) => {
                if (a.severity === b.severity) return 0;
                if (a.severity === "high") return -1;
                if (b.severity === "high") return 1;
                if (a.severity === "mid") return -1;
                if (b.severity === "mid") return 1;
                return 0;
              });
              const topRisk = sortedRisks[0];
              // 권리요약
              const rights = data.rights || [];
              const mainRight = rights.length ? rights[0] : null;
              const hasJeonse = rights.some((r) => r.type === "전세권");
              const hasImcha = rights.some((r) => r.type.includes("임차"));
              const imchaRights = rights.filter((r) => r.type.includes("임차"));
              const imchaStrong = imchaRights.filter((r) =>
                r.note?.includes("대항력")
              ).length;
              const minDeposit =
                imchaRights.length > 0
                  ? Math.min(...imchaRights.map((r) => r.claim || 0))
                  : null;
              const maxDeposit =
                imchaRights.length > 0
                  ? Math.max(...imchaRights.map((r) => r.claim || 0))
                  : null;
              // 리스크 점수(임시: 고위험 70, 중간 50, 저위험 20)
              let riskScore =
                topRisk?.severity === "high"
                  ? 70
                  : topRisk?.severity === "mid"
                  ? 50
                  : 20;
              // 입찰일/법원
              const nextAuction = data.nextAuction;
              // 임차 상세: 점유자 수, 유형, 보증금, 대항력 등
              let imchaInfoText = "-";
              if (imchaRights.length > 0) {
                imchaInfoText = `임차인 ${imchaRights.length}명`;
                if (imchaStrong > 0)
                  imchaInfoText += `, 대항력 ${imchaStrong}명`;
                if (
                  typeof minDeposit === "number" &&
                  typeof maxDeposit === "number" &&
                  minDeposit > 0 &&
                  maxDeposit > 0
                ) {
                  imchaInfoText += `, 보증금 ${minDeposit.toLocaleString()}~${maxDeposit.toLocaleString()}원`;
                }
                // note, 기간, 유형 등
                const otherNotes = Array.from(
                  new Set(imchaRights.map((r) => r.note).filter(Boolean))
                );
                if (otherNotes.length > 0)
                  imchaInfoText += `, 참고 ${otherNotes.join(", ")}`;
              } else {
                imchaInfoText = "임차/점유 정보: 특별 위험 없음";
              }
              // 핵심 인사이트: 조합으로 자동 요약
              const insight =
                riskScore >= 70
                  ? "권리구조 복잡 + 임차/입주 인수 리스크, 단기매수 위주 주의 필요"
                  : riskScore >= 50
                  ? "임차인/권리 체크 필요, 중간 난이도, 실투자 전 점검 추천"
                  : "권리관계 단순, 안정적 낙찰 투자 용이";

              return (
                <>
                  {/* 다음 매각일 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 font-semibold">
                      다음 매각일: {nextAuction?.date || "-"}
                      {nextAuction?.court && (
                        <span className="ml-1">/ {nextAuction.court}</span>
                      )}
                    </span>
                  </div>
                  {/* 1. 리스크/권리구조/임차 등 핵심요약 */}
                  <div className="mb-2">
                    {topRisk && (
                      <div className="inline-block mb-2 px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                        {topRisk.title} 리스크
                        <span className="ml-2">
                          (
                          {topRisk.severity === "high"
                            ? "고위험"
                            : topRisk.severity === "mid"
                            ? "중간위험"
                            : "저위험"}
                          )
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-700 mt-1">
                      {mainRight ? (
                        <>
                          <span className="font-semibold">최선순위권리:</span>{" "}
                          {mainRight.type}
                          {mainRight.holder ? `, ${mainRight.holder}` : ""}
                        </>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {hasJeonse && <span className="mr-2">전세권 있음</span>}
                      {imchaInfoText}
                    </div>
                  </div>
                  {/* 리스크점수/전략 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-900 text-xs font-semibold">
                      권리 리스크 점수: {riskScore} / 100
                    </span>
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs text-gray-700">
                      {riskScore >= 70
                        ? "복잡도 높음"
                        : riskScore >= 50
                        ? "중간"
                        : "낮음"}
                    </span>
                  </div>
                  {/* 핵심 인사이트 */}
                  <div className="p-2 rounded bg-yellow-50 border border-yellow-200 mb-2 text-xs text-yellow-900">
                    <b>핵심 인사이트:</b> {insight}
                  </div>
                  {/* 전략 및 총평 */}
                  <div className="text-xs text-gray-600 mb-3">
                    {riskScore >= 70
                      ? "추천 전략: 전문가 검토, 리스크 대비 단기낙찰용"
                      : riskScore >= 50
                      ? "추천 전략: 권리·임차 점검, 안정/공격형 병행"
                      : "추천 전략: 안정형 투자, 무리없는 낙찰"}
                  </div>
                  {devMode?.isDevMode ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded border border-blue-200 bg-white text-blue-700 font-semibold hover:bg-blue-50 transition"
                        onClick={() => {
                          console.log(
                            "👤 [사용자 액션] 매각물건명세서 자세히 보기 클릭 (개발자 모드)"
                          );
                          setCourtModalOpen(true);
                        }}
                      >
                        명세서 자세히
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded border border-blue-200 bg-white text-blue-700 font-semibold hover:bg-blue-50 transition"
                        onClick={() => {
                          console.log(
                            "👤 [사용자 액션] 명세서 자세히 클릭 (일반 모드)"
                          );
                          console.log("📧 [사전 알림] 모달 오픈 트리거");
                          setIsWaitlistModalOpen(true);
                        }}
                      >
                        명세서 자세히
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </SectionCard>
        </div>
      </div>
      {/* 상세 리포트 진입 버튼 - 데스크톱만 표시 */}
      {devMode?.isDevMode ? (
        <div className="hidden md:flex flex-wrap gap-2 justify-end mb-4">
          <button
            className="px-3 py-1 text-xs rounded border bg-white text-blue-700 border-blue-200 hover:bg-blue-50 transition"
            onClick={() => {
              console.log(
                "👤 [사용자 액션] 매각물건명세서 버튼 클릭 (개발자 모드)"
              );
              setCourtModalOpen(true);
            }}
          >
            매각물건명세서
          </button>
          <button
            className="px-3 py-1 text-xs rounded border bg-white text-yellow-800 border-yellow-300 hover:bg-yellow-50 transition"
            onClick={() => {
              console.log(
                "👤 [사용자 액션] 권리분석 리포트 버튼 클릭 (개발자 모드)"
              );
              setRightsReportOpen(true);
            }}
          >
            권리분석 리포트
          </button>
          <button
            className="px-3 py-1 text-xs rounded border bg-white text-green-800 border-green-200 hover:bg-green-50 transition"
            onClick={() => {
              console.log(
                "👤 [사용자 액션] 경매분석 리포트 버튼 클릭 (개발자 모드)"
              );
              setAuctionReportOpen(true);
            }}
          >
            경매분석 리포트
          </button>
        </div>
      ) : null}
      {/* 법원문서 모달 */}
      {devMode?.isDevMode && courtModalOpen && data && data.meta && (
        <SaleSpecificationModal
          isOpen={courtModalOpen}
          onClose={() => {
            console.log("👤 [사용자 액션] 매각물건명세서 모달 닫기");
            setCourtModalOpen(false);
          }}
          data={data}
          analysis={analysis}
        />
      )}
      {/* 권리분석 리포트 모달 */}
      {devMode?.isDevMode && rightsReportOpen && data && (
        <RightsAnalysisReportModal
          isOpen={rightsReportOpen}
          onClose={() => {
            console.log("👤 [사용자 액션] 권리분석 리포트 닫기");
            setRightsReportOpen(false);
          }}
          data={data}
          analysis={analysis}
        />
      )}
      {/* 경매분석 리포트 모달 */}
      {devMode?.isDevMode && auctionReportOpen && data && (
        <AuctionAnalysisReportModal
          isOpen={auctionReportOpen}
          onClose={() => {
            console.log("👤 [사용자 액션] 경매분석 리포트 닫기");
            setAuctionReportOpen(false);
          }}
          data={data}
          analysis={analysis}
        />
      )}
      {/* 사전 알림 신청 모달 (일반 모드 CTA) */}
      <WaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => {
          console.log("🔔 [사전 알림] 모달 닫기");
          setIsWaitlistModalOpen(false);
        }}
      />
    </div>
  );
}
