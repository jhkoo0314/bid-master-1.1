"use client";
import React from "react";
import type { PropertyDetail, RightRow } from "@/types/property";
import { useSimulationStore } from "@/store/simulation-store";
import InfoTip from "@/components/common/InfoTip";
import SafetyMarginComparison from "@/components/report/SafetyMarginComparison";
import FMVDisplay from "@/components/common/FMVDisplay";
import {
  getTerminologyExplanation,
  getRightTypeExplanation,
} from "@/lib/rights-terminology";

interface RightsAnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PropertyDetail;
  analysis?: {
    safetyMargin: number;
    totalAssumedAmount: number; // 기존 호환성 유지
    assumedRightsAmount?: number; // ✅ v0.1: 인수권리 + 임차인 보증금 합계
    trace?: string[];
    advancedSafetyMargin?: {
      minSafetyMargin: number;
      assumedAmount: number;
      trace: string[];
    };
    // ✅ 권리 소멸/인수 정보 추가
    extinguishedRights?: Array<{
      rightType: string;
      order?: string;
      holder?: string;
      registrationDate?: string;
      claim?: number;
      willBeExtinguished: boolean;
      isMalsoBaseRight?: boolean;
    }>;
    assumedRights?: Array<{
      rightType: string;
      order?: string;
      holder?: string;
      registrationDate?: string;
      claim?: number;
      willBeAssumed: boolean;
      isMalsoBaseRight?: boolean;
    }>;
    malsoBaseRight?: {
      rightType: string;
      order?: string;
      holder?: string;
      registrationDate?: string;
      claim?: number;
    } | null;
    // ✅ 점유 리스크 정보 추가
    tenantRisk?: {
      riskScore: number;
      riskLabel: "낮음" | "중간" | "높음";
      evictionCostMin: number;
      evictionCostMax: number;
      hasDividendRequest: boolean;
      assumedTenants: number;
    };
  };
}
export default function RightsAnalysisReportModal({
  isOpen,
  onClose,
  data,
  analysis,
}: RightsAnalysisReportModalProps) {
  const { devMode } = useSimulationStore();
  React.useEffect(() => {
    if (isOpen) {
      console.log("⚖️ [권리분석] 리포트 열림 (open)");
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const rights = data.rights || [];
  const mainRight: RightRow | null = rights.length ? rights[0] : null;

  // 15가지 권리유형을 모두 고려하여 미소멸 가능성이 높은 권리만 동적으로 필터링
  // 실제 소멸/인수는 말소기준권리와 선후관계에 따라 달라지므로, 프론트 리포트에서는 보수적으로 표시
  const potentiallySurvivingTypes = new Set([
    "전세권",
    "주택임차권",
    "상가임차권",
    "법정지상권",
    "유치권",
    "가처분",
    "소유권이전청구권가등기",
    "담보가등기",
    "분묘기지권",
  ]);

  const notExtinguished = rights.filter((r) =>
    potentiallySurvivingTypes.has(r.type)
  );
  console.log(
    "⚖️ [권리분석] 미소멸 후보 권리 계산:",
    notExtinguished.map((r) => r.type)
  );

  const assumedCandidates = rights.filter((r) => notExtinguished.includes(r));
  const totalClaim = rights.reduce((sum, r) => sum + (r.claim || 0), 0);
  const totalAssume = assumedCandidates.reduce(
    (sum, r) => sum + (r.claim || 0),
    0
  );

  // ✅ v0.1 핫픽스: assumedRightsAmount 필드 우선 확인
  const assumedAmountFromAnalysis = analysis
    ? (analysis.assumedRightsAmount ?? analysis.totalAssumedAmount ?? 0)
    : 0;

  const totalAssumedLabel = analysis
    ? assumedAmountFromAnalysis > 0
      ? `${assumedAmountFromAnalysis.toLocaleString()}원`
      : "0원(추정 불가)"
    : totalAssume > 0
    ? `${totalAssume.toLocaleString()}원`
    : "0원(추정 불가)";

  console.log("⚖️ [권리분석] 인수금액 표시", {
    fromAnalysis: !!analysis,
    assumedRightsAmount: analysis?.assumedRightsAmount,
    totalAssumedAmount: analysis?.totalAssumedAmount,
    finalAmount: assumedAmountFromAnalysis,
    fallbackAmount: totalAssume,
    label: totalAssumedLabel,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-lg shadow w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] flex flex-col font-serif">
        {/* 표준 법원양식 머리말 */}
        <div className="px-8 py-6 border-b border-gray-300 relative">
          <style>{`
            @media print {
              .no-print { display: none !important; }
              .print-border { border-color: #000 !important; }
              .print-bg { background: #fff !important; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}</style>
          <div className="text-center">
            <div className="text-sm tracking-wider">
              대한민국 법원 경매 분석 서식
            </div>
            <h1 className="text-2xl font-bold mt-1">권리분석 보고서</h1>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300">
              <div className="flex">
                <div className="w-28 px-3 py-2 border-r border-gray-300 bg-gray-50">
                  사건번호
                </div>
                <div className="flex-1 px-3 py-2">{data.caseId || "-"}</div>
              </div>
              <div className="flex border-t border-gray-300">
                <div className="w-28 px-3 py-2 border-r border-gray-300 bg-gray-50">
                  관할법원
                </div>
                <div className="flex-1 px-3 py-2">
                  {data.nextAuction?.court || "-"}
                </div>
              </div>
            </div>
            <div className="border border-gray-300">
              <div className="flex">
                <div className="w-28 px-3 py-2 border-r border-gray-300 bg-gray-50">
                  물건표시
                </div>
                <div className="flex-1 px-3 py-2">
                  {data.meta?.address || "-"}
                </div>
              </div>
              <div className="flex border-t border-gray-300">
                <div className="w-28 px-3 py-2 border-r border-gray-300 bg-gray-50">
                  작성일
                </div>
                <div className="flex-1 px-3 py-2">
                  {new Date(data.snapshotAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-3 right-4 flex items-center gap-2 no-print">
            {devMode?.isDevMode ? (
              <button
                onClick={() => {
                  console.log(
                    "📄 [다운로드] 권리분석 리포트 인쇄/다운로드 (print)"
                  );
                  window.print();
                }}
                className="text-xs px-3 py-1 border border-gray-300 bg-white hover:bg-gray-50"
              >
                인쇄
              </button>
            ) : null}
            <button
              onClick={() => {
                console.log("👤 [사용자 액션] 권리분석 리포트 닫기 (close)");
                onClose();
              }}
              className="text-2xl text-gray-400 hover:text-gray-700"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {/* 1. 요약 */}
          <section className="px-8 py-5 bg-gray-50">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 text-[13px]">
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600 flex items-center">
                  인수추정액
                  {(() => {
                    const term = getTerminologyExplanation("인수추정액");
                    return term ? (
                      <InfoTip
                        title={term.title}
                        description={term.description}
                      />
                    ) : (
                      <InfoTip
                        title="인수추정액"
                        description={
                          "미소멸 가능성이 있는 권리 합계(전세/임차/지상/유치/가처분 등).\n권리별 청구액 합산 기준."
                        }
                      />
                    );
                  })()}
                </div>
                <div className="font-semibold text-gray-900">
                  {totalAssumedLabel}
                </div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">총 권리금액</div>
                <div className="font-semibold text-gray-900">
                  {totalClaim.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">미소멸권리 수</div>
                <div className="font-semibold text-gray-900">
                  {notExtinguished.length}건
                </div>
              </div>
              {/* ✅ FMV 표시 추가 */}
              {(data as any)?.analysisV12?.fmv?.fairMarketValue && (
                <div className="col-span-2 md:col-span-3">
                  <FMVDisplay
                    fairMarketValue={
                      (data as any).analysisV12.fmv.fairMarketValue
                    }
                    min={(data as any).analysisV12.fmv.fairMarketValue * 0.95}
                    max={(data as any).analysisV12.fmv.fairMarketValue * 1.05}
                    auctionCenter={(data as any).analysisV12.fmv.auctionCenter}
                    showRange={true}
                  />
                </div>
              )}
            </div>
            {/* 고도화 안전마진 정보 추가 */}
            {analysis?.advancedSafetyMargin && (
              <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 text-[13px]">
                <div className="p-3 bg-green-50 border border-green-300">
                  <div className="text-[11px] text-gray-600 flex items-center">
                    최소 안전마진 (고도화)
                    <InfoTip
                      title="최소 안전마진 (고도화)"
                      description={
                        "매물 유형, 위험도, 난이도를 반영한 최소 안전마진. 유형별 바닥노출과 가중치를 적용합니다."
                      }
                    />
                  </div>
                  <div className="font-semibold text-green-900">
                    {analysis.advancedSafetyMargin.minSafetyMargin.toLocaleString()}
                    원
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ✅ 안전마진 비교 섹션 추가 (v1.2) */}
          {(data as any)?.analysisV12 && (
            <section className="px-8 py-5 bg-white">
              <SafetyMarginComparison
                fmv={{
                  amount: (data as any).analysisV12.fmv.mosAmount,
                  pct: (data as any).analysisV12.fmv.mosRate ?? 0,
                  referencePrice: (data as any).analysisV12.fmv.fairMarketValue,
                }}
                exit={{
                  amount: (data as any).analysisV12.exit.mosAmount,
                  pct: (data as any).analysisV12.exit.mosRate ?? 0,
                  referencePrice: (data as any).analysisV12.exit.exitPrice,
                }}
                user={{
                  amount:
                    (data as any).analysisV12.fmv.fairMarketValue -
                    (data as any).analysisV12.acquisition.parts.bidPrice,
                  pct:
                    (data as any).analysisV12.fmv.fairMarketValue > 0
                      ? ((data as any).analysisV12.fmv.fairMarketValue -
                          (data as any).analysisV12.acquisition.parts
                            .bidPrice) /
                        (data as any).analysisV12.fmv.fairMarketValue
                      : 0,
                  referencePrice: (data as any).analysisV12.fmv.fairMarketValue,
                  bidPrice: (data as any).analysisV12.acquisition.parts
                    .bidPrice,
                }}
              />
            </section>
          )}

          {/* 2. 최선순위 / 미소멸권리 */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">
              1. 최선순위 / 미소멸권리
            </h3>
            <div className="text-sm">
              <div className="mb-2">
                <span className="text-[12px] text-gray-600 mr-2 flex items-center">
                  최선순위권리
                  {(() => {
                    const term = getTerminologyExplanation("말소기준권리");
                    return term ? (
                      <InfoTip
                        title={term.title}
                        description={term.description}
                      />
                    ) : null;
                  })()}
                </span>
                <span className="font-semibold text-gray-900">
                  {mainRight
                    ? `[${mainRight.type}] ${mainRight.holder || ""}`
                    : "-"}
                </span>
                <span className="ml-2 text-[12px] text-gray-500">
                  {mainRight?.date || ""}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-[12px] text-gray-600 mb-1 flex items-center">
                  등기상 소멸되지 않는 권리
                  {(() => {
                    const term = getTerminologyExplanation("미소멸권리");
                    return term ? (
                      <InfoTip
                        title={term.title}
                        description={term.description}
                      />
                    ) : null;
                  })()}
                </div>
                {notExtinguished.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {notExtinguished.map((r, i) => {
                      const rightExplanation = getRightTypeExplanation(r.type);
                      return (
                        <span
                          key={i}
                          className="inline-block px-2 py-0.5 bg-gray-50 border border-gray-300 text-gray-900 text-xs flex items-center"
                        >
                          {r.type}
                          {rightExplanation && (
                            <InfoTip
                              title={rightExplanation.title}
                              description={rightExplanation.description}
                            />
                          )}
                          {r.holder ? `(${r.holder})` : ""}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs">없음</div>
                )}
              </div>
            </div>
          </section>

          {/* 2-1. 근거 보기 (산출 트레이스) */}
          {(analysis?.trace && analysis.trace.length > 0) ||
          (analysis?.advancedSafetyMargin?.trace &&
            analysis.advancedSafetyMargin.trace.length > 0) ? (
            <section className="px-8 py-4 bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                근거 보기
              </h3>
              <div className="space-y-3">
                {/* 고도화 안전마진 계산 근거 */}
                {analysis?.advancedSafetyMargin?.trace &&
                  analysis.advancedSafetyMargin.trace.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800 mb-2">
                        고도화 안전마진 계산 근거
                      </h4>
                      <ul className="text-xs text-gray-700 list-disc pl-5 space-y-1">
                        {analysis.advancedSafetyMargin.trace.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                {/* 기본 trace (기존) */}
                {analysis?.trace && analysis.trace.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-800 mb-2">
                      기본 계산 근거
                    </h4>
                    <ul className="text-xs text-gray-700 list-disc pl-5 space-y-1">
                      {analysis.trace.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* 3. 등기 권리 목록 (법원양식 표 스타일) */}
          <section className="px-8 py-5 bg-gray-50">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">
              2. 등기 권리 목록
            </h3>
            <table className="w-full border border-gray-300 text-xs bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-900">
                  <th className="px-2 py-1 border-r border-gray-300 text-left">
                    순위
                  </th>
                  <th className="px-2 py-1 border-r border-gray-300 text-left">
                    권리
                  </th>
                  <th className="px-2 py-1 border-r border-gray-300 text-left">
                    권리자
                  </th>
                  <th className="px-2 py-1 border-r border-gray-300 text-left">
                    등기일
                  </th>
                  <th className="px-2 py-1 text-left">청구금액</th>
                </tr>
              </thead>
              <tbody>
                {rights.map((r, idx) => {
                  const rightExplanation = getRightTypeExplanation(r.type);
                  return (
                    <tr key={idx}>
                      <td className="px-2 py-1 border-t border-r border-gray-300">
                        {r.order}
                      </td>
                      <td className="px-2 py-1 border-t border-r border-gray-300">
                        <span className="flex items-center">
                          {r.type}
                          {rightExplanation && (
                            <InfoTip
                              title={rightExplanation.title}
                              description={rightExplanation.description}
                            />
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-1 border-t border-r border-gray-300">
                        {r.holder}
                      </td>
                      <td className="px-2 py-1 border-t border-r border-gray-300">
                        {r.date}
                      </td>
                      <td className="px-2 py-1 border-t border-gray-300 text-right">
                        {r.claim?.toLocaleString?.()}원
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {notExtinguished.length > 0 && (
              <div className="mt-2 text-xs text-red-700">
                ※ 미소멸권리 인수 가능성 존재: 입찰가 산정에 반드시 반영하세요.
              </div>
            )}
          </section>

          {/* ✅ 점유 및 명도 리스크 섹션 */}
          {analysis?.tenantRisk && (
            <section className="px-8 py-5 bg-orange-50 border-t border-orange-200">
              <h3 className="font-semibold mb-3 text-sm text-orange-900">
                점유 및 명도 리스크
              </h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 text-sm">
                <div className="p-3 bg-white border border-orange-300 rounded">
                  <div className="text-[11px] text-orange-700 mb-1 flex items-center">
                    AI 예측 점유 위험도
                    <InfoTip
                      title="점유 위험도"
                      description="확정일자, 전입일시, 배당요구, 판례 리스크, 유찰 횟수를 종합하여 산정한 점유 리스크 점수입니다."
                    />
                  </div>
                  <div className="font-semibold text-orange-900 text-base">
                    {analysis.tenantRisk.riskScore}% (
                    {analysis.tenantRisk.riskLabel})
                  </div>
                </div>
                <div className="p-3 bg-white border border-orange-300 rounded">
                  <div className="text-[11px] text-orange-700 mb-1">
                    예상 명도 비용
                  </div>
                  <div className="font-semibold text-orange-900 text-base">
                    {analysis.tenantRisk.evictionCostMin.toLocaleString()}원 ~{" "}
                    {analysis.tenantRisk.evictionCostMax.toLocaleString()}원
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded text-xs">
                <div className="mb-1 flex items-center">
                  <strong>배당요구:</strong>{" "}
                  {analysis.tenantRisk.hasDividendRequest
                    ? "있음"
                    : "없음 (보증금 인수 가능성 있음)"}
                  {(() => {
                    const term = getTerminologyExplanation("배당요구");
                    return term ? (
                      <InfoTip
                        title={term.title}
                        description={term.description}
                      />
                    ) : null;
                  })()}
                </div>
                <div className="text-red-700 font-medium mt-2">
                  ⚠️ 실제 점유 상태는 매각물건명세서/현장 방문으로 확인 필요
                </div>
                {analysis.tenantRisk.assumedTenants > 0 && (
                  <div className="mt-1 text-gray-700">
                    인수 대상 임차인: {analysis.tenantRisk.assumedTenants}명
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 4. 배당관계 요약 */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">
              {analysis?.tenantRisk ? "4. 배당관계 요약" : "3. 배당관계 요약"}
            </h3>
            <div className="text-xs text-gray-700">
              <div>
                · 배당기준금액: {data.payout?.base?.toLocaleString?.()}원
              </div>
              <div>
                · 예상배당합계:{" "}
                {(data.payout?.rows || [])
                  .reduce((s, r) => s + (r.expected || 0), 0)
                  .toLocaleString()}
                원
              </div>
              <div className="mt-1 text-gray-600 flex items-center">
                ※ 최우선변제, 선순위 임차인 배당요구 여부를 반드시 확인
                {(() => {
                  const term = getTerminologyExplanation("배당요구");
                  return term ? (
                    <InfoTip
                      title={term.title}
                      description={term.description}
                    />
                  ) : null;
                })()}
              </div>
            </div>
          </section>

          {/* 5. 실무 코멘트 (사실 기반 + 경고 기반 + 교육적 해석) */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-3 text-sm text-gray-900">
              {analysis?.tenantRisk ? "5. 실무 코멘트" : "4. 실무 코멘트"}
            </h3>
            <div className="space-y-3 text-xs">
              {/* 사실 기반 정보 */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="font-semibold text-gray-900 mb-2">
                  📊 사실 확인
                </div>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  <li>
                    최선순위권리: {mainRight ? `${mainRight.type}` : "없음"}
                  </li>
                  <li>
                    말소기준권리:{" "}
                    {analysis?.malsoBaseRight
                      ? analysis.malsoBaseRight.rightType
                      : mainRight
                      ? mainRight.type
                      : "없음"}
                  </li>
                  <li>
                    말소권리: {analysis?.extinguishedRights?.length || 0}건,
                    인수권리: {analysis?.assumedRights?.length || 0}건
                  </li>
                  {analysis?.assumedRights &&
                    analysis.assumedRights.length === 0 && (
                      <li className="text-green-700">
                        ✅ 인수 위험 없음 (모든 권리 말소 예상)
                      </li>
                    )}
                </ul>
              </div>
              {/* 경고 기반 정보 */}
              {analysis &&
                (analysis.assumedRights?.length > 0 ||
                  (analysis.tenantRisk &&
                    analysis.tenantRisk.riskScore >= 50)) && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="font-semibold text-orange-900 mb-2">
                      ⚠️ 주의사항
                    </div>
                    <ul className="list-disc pl-5 text-orange-800 space-y-1">
                      {analysis.assumedRights &&
                        analysis.assumedRights.length > 0 && (
                          <li>
                            인수권리 {analysis.assumedRights.length}건이 있어
                            입찰가 계산에 반드시 반영해야 합니다.
                          </li>
                        )}
                      {analysis.tenantRisk &&
                        analysis.tenantRisk.riskScore >= 50 && (
                          <li>
                            점유 리스크가 {analysis.tenantRisk.riskLabel}{" "}
                            수준입니다. 명도비용{" "}
                            {analysis.tenantRisk.evictionCostMin.toLocaleString()}
                            원 ~{" "}
                            {analysis.tenantRisk.evictionCostMax.toLocaleString()}
                            원을 추가로 고려하세요.
                          </li>
                        )}
                      {notExtinguished.length > 0 && (
                        <li>
                          미소멸권리 {notExtinguished.length}건이 있어 입찰가
                          산정에 반드시 반영하세요.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              {/* 교육적 해석 */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-semibold text-blue-900 mb-2">
                  💡 투자 판단 가이드
                </div>
                <ul className="list-disc pl-5 text-blue-800 space-y-1">
                  <li>
                    최선순위권리 확인 후 말소기준권리 판단이 우선입니다. 이
                    권리가 모든 권리 소멸/인수의 기준이 됩니다.
                  </li>
                  <li>
                    미소멸권리 유무에 따른 인수/소멸 여부를 확정한 후, 인수액을
                    기반으로 입찰 가능 최고가를 역산합니다.
                  </li>
                  <li>
                    {analysis?.assumedRights &&
                    analysis.assumedRights.length > 0
                      ? `인수권리 ${analysis.assumedRights.length}건과 점유 리스크를 모두 고려하여 총인수금액(A)을 산출한 후, FMV와 비교하여 안전마진을 확인하세요.`
                      : "인수 위험이 없으므로 입찰가 결정이 비교적 단순합니다. 다만 점유 상태는 별도로 확인이 필요합니다."}
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 닫기 */}
          <div className="px-8 py-4 border-t border-gray-300 bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-black"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
