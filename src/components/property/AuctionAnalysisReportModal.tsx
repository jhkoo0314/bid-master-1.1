"use client";
import React from "react";
import type { PropertyDetail, RiskItem, ScheduleItem } from "@/types/property";
import { useSimulationStore } from "@/store/simulation-store";
import InfoTip from "@/components/common/InfoTip";
import { AuctionAnalysisReport } from "./AuctionAnalysisReport";

interface AuctionAnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PropertyDetail;
  analysis?: {
    safetyMargin: number;
    totalAssumedAmount: number;
    trace?: string[];
    marketValue?: {
      fairMarketValue: number; // ✅ FMV: 공정시세
      auctionCenter: number; // 경매가 가이드 중심값
      center: number; // 모델 중심값
    };
    advancedSafetyMargin?: {
      minSafetyMargin: number;
      assumedAmount: number;
      trace: string[];
    };
    // auction-engine.ts v1.2 추가 항목
    auctionEval?: {
      mos_fmv: number; // 즉시 안전마진 (FMV 기준)
      mos_exit: number; // 실전 안전마진 (ExitPrice 기준)
      exitPrice: number; // 미래 매각가
      roi_exit: number; // 실전 수익률
      strategy: Array<{
        stage: "conservative" | "neutral" | "aggressive";
        label: "보수적" | "중립" | "공격적";
        value: number;
      }>;
      costBreakdown: {
        bidPrice: number;
        rights: number;
        taxes: number;
        capex: number;
        eviction: number;
        carrying: number;
        contingency: number;
        total: number;
      };
    };
  };
}
export default function AuctionAnalysisReportModal({
  isOpen,
  onClose,
  data,
  analysis,
}: AuctionAnalysisReportModalProps) {
  const { devMode } = useSimulationStore();
  React.useEffect(() => {
    if (isOpen) {
      console.log("📊 [경매분석] 리포트 열림 (open)");
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const appraised = data.price?.appraised || 0;
  const lowest = data.price?.lowest || 0;
  const discountRate =
    data.price?.discountRate ?? (appraised ? 1 - lowest / appraised : 0);
  const payoutBase = data.payout?.base || 0;
  const expectedPayout = (data.payout?.rows || []).reduce(
    (sum, r) => sum + (r.expected || 0),
    0
  );
  const risks: RiskItem[] = data.risks || [];
  const schedules: ScheduleItem[] = data.schedules || [];

  const recommendBidMin = Math.max(0, lowest);
  const recommendBidMax = Math.max(
    0,
    Math.floor(lowest + (analysis?.safetyMargin || 0) * 0.5)
  );

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
            <h1 className="text-2xl font-bold mt-1">경매분석 보고서</h1>
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
                    "📄 [다운로드] 경매분석 리포트 인쇄/다운로드 (print)"
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
                console.log("👤 [사용자 액션] 경매분석 리포트 닫기 (close)");
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 text-[13px]">
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600 flex items-center">
                  감정가
                  <InfoTip
                    title="감정가"
                    description={
                      "감정평가사가 산정한 가격. 법원 공고 기준값으로 사용."
                    }
                  />
                </div>
                <div className="font-semibold text-gray-900">
                  {appraised.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600 flex items-center">
                  최저가
                  <InfoTip
                    title="최저매각가격"
                    description={"유찰 시 감액 비율을 반영한 현재 매각 최저가."}
                  />
                </div>
                <div className="font-semibold text-gray-900">
                  {lowest.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600 flex items-center">
                  할인율
                  <InfoTip
                    title="할인율"
                    description={"1 - 최저가/감정가. 유찰로 인한 감액 수준."}
                  />
                </div>
                <div className="font-semibold text-gray-900">
                  {Math.round(discountRate * 100)}%
                </div>
              </div>
              {/* 시세 정보 추가 */}
              {analysis?.marketValue && (
                <>
                  <div className="p-3 bg-white border border-gray-300">
                    <div className="text-[11px] text-gray-600 flex items-center">
                      공정시세(FMV)
                      <InfoTip
                        title="공정시세(FMV)"
                        description={
                          "안전마진 계산에 사용되는 공정시세. 감정가를 기준으로 지역/면적/연식/유형을 반영하여 산정."
                        }
                      />
                    </div>
                    <div className="font-semibold text-gray-900">
                      {analysis.marketValue.fairMarketValue.toLocaleString()}원
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-gray-300">
                    <div className="text-[11px] text-gray-600 flex items-center">
                      경매가 가이드
                      <InfoTip
                        title="경매가 가이드"
                        description={
                          "입찰 전략 수립용 경매가 중심값. 공정시세 대비 평균 12% 할인 적용."
                        }
                      />
                    </div>
                    <div className="font-semibold text-gray-900">
                      {analysis.marketValue.auctionCenter.toLocaleString()}원
                    </div>
                  </div>
                </>
              )}
              {/* 고도화 안전마진 정보 추가 */}
              {analysis?.advancedSafetyMargin && (
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
              )}
            </div>
          </section>

          {/* v1.2 경매분석 리포트 (AuctionAnalysisReport 컴포넌트 사용) */}
          {(data as any)?.analysisV12 ? (
            <section className="px-8 py-5 bg-white">
              <AuctionAnalysisReport detail={data} />
            </section>
          ) : (
            <>
              {/* 2. 입찰가 가이드 */}
              <section className="px-8 py-5 bg-white">
                <h3 className="font-semibold mb-2 text-sm text-gray-900">
                  1. 입찰가 가이드
                </h3>
                <div className="text-sm">
                  <div className="mb-1">
                    권장 범위:{" "}
                    <span className="font-semibold text-gray-900">
                      {recommendBidMin.toLocaleString()}원 ~{" "}
                      {recommendBidMax.toLocaleString()}원
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    최저가 기준 + 안전마진 50% 반영한 단순 가이드입니다. 권리
                    인수액, 공실/수리비 등 실비를 반영해 조정하세요.
                  </div>
                </div>

                {/* 3단계 입찰전략 (v1.2) */}
                {analysis?.auctionEval?.strategy &&
                  analysis.auctionEval.strategy.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                        3단계 입찰전략 (FMV 기준)
                        <InfoTip
                          title="3단계 입찰전략"
                          description="공정시세(FMV)를 기준으로 한 보수적/중립/공격적 입찰전략입니다. 보수적(83%), 중립(89%), 공격적(96%) 비율로 FMV에 적용됩니다."
                        />
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {analysis.auctionEval.strategy.map((s, i) => {
                          const colorClass =
                            s.stage === "conservative"
                              ? "bg-blue-50 border-blue-300 text-blue-900"
                              : s.stage === "neutral"
                              ? "bg-green-50 border-green-300 text-green-900"
                              : "bg-orange-50 border-orange-300 text-orange-900";

                          return (
                            <div
                              key={i}
                              className={`p-3 border rounded ${colorClass}`}
                            >
                              <div className="text-[10px] text-gray-600 mb-1">
                                {s.label}
                              </div>
                              <div className="font-semibold text-sm">
                                {s.value.toLocaleString()}원
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </section>

              {/* 2-1. 총인수금액 상세 내역 (v1.2) */}
              {analysis?.auctionEval?.costBreakdown && (
                <section className="px-8 py-5 bg-gray-50">
                  <h3 className="font-semibold mb-3 text-sm text-gray-900">
                    1-1. 총인수금액(A) 상세 내역
                  </h3>
                  <div className="bg-white border border-gray-300">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300">
                          <th className="px-3 py-2 text-left font-semibold text-gray-900">
                            항목
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-900">
                            구분
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-900">
                            금액
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="px-3 py-2 text-gray-700">입찰가</td>
                          <td className="px-3 py-2 text-gray-600 text-[10px]">
                            B
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {analysis.auctionEval.costBreakdown.bidPrice.toLocaleString()}
                            원
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-3 py-2 text-gray-700">인수권리</td>
                          <td className="px-3 py-2 text-gray-600 text-[10px]">
                            R
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {analysis.auctionEval.costBreakdown.rights.toLocaleString()}
                            원
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-3 py-2 text-gray-700">
                            세금 및 수수료
                          </td>
                          <td className="px-3 py-2 text-gray-600 text-[10px]">
                            T
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {analysis.auctionEval.costBreakdown.taxes.toLocaleString()}
                            원
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-3 py-2 text-gray-700">수리비</td>
                          <td className="px-3 py-2 text-gray-600 text-[10px]">
                            C
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {analysis.auctionEval.costBreakdown.capex.toLocaleString()}
                            원
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-3 py-2 text-gray-700">명도비</td>
                          <td className="px-3 py-2 text-gray-600 text-[10px]">
                            E
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {analysis.auctionEval.costBreakdown.eviction.toLocaleString()}
                            원
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-3 py-2 text-gray-700">보유비</td>
                          <td className="px-3 py-2 text-gray-600 text-[10px]">
                            K
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {analysis.auctionEval.costBreakdown.carrying.toLocaleString()}
                            원
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="px-3 py-2 text-gray-700">예비비</td>
                          <td className="px-3 py-2 text-gray-600 text-[10px]">
                            U
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {analysis.auctionEval.costBreakdown.contingency.toLocaleString()}
                            원
                          </td>
                        </tr>
                        <tr className="bg-gray-50 border-t-2 border-gray-400">
                          <td className="px-3 py-2 font-semibold text-gray-900">
                            총인수금액
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-900">
                            A
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900">
                            {analysis.auctionEval.costBreakdown.total.toLocaleString()}
                            원
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="px-3 py-2 text-[10px] text-gray-500 bg-gray-50 border-t border-gray-200">
                      * 총인수금액 A = B + R + T + C + E + K + U
                    </div>
                  </div>
                </section>
              )}

              {/* 2-2. 안전마진 및 수익률 분석 (v1.2) */}
              {analysis?.auctionEval && (
                <section className="px-8 py-5 bg-white">
                  <h3 className="font-semibold mb-3 text-sm text-gray-900">
                    1-2. 안전마진 및 수익률 분석
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-blue-50 border border-blue-300">
                      <div className="text-[10px] text-gray-600 flex items-center mb-1">
                        즉시 안전마진
                        <InfoTip
                          title="즉시 안전마진 (MoS_fmv)"
                          description="공정시세(FMV)에서 총인수금액(A)을 뺀 값입니다. 즉시 매각 가정 시의 안전마진입니다."
                        />
                      </div>
                      <div className="font-semibold text-blue-900 text-sm">
                        {analysis.auctionEval.mos_fmv.toLocaleString()}원
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-300">
                      <div className="text-[10px] text-gray-600 flex items-center mb-1">
                        실전 안전마진
                        <InfoTip
                          title="실전 안전마진 (MoS_exit)"
                          description="미래 매각가(ExitPrice)에서 총인수금액(A)을 뺀 값입니다. 보유기간/상승률/리노베/매도비용을 반영한 실제 안전마진입니다."
                        />
                      </div>
                      <div className="font-semibold text-green-900 text-sm">
                        {analysis.auctionEval.mos_exit.toLocaleString()}원
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-300">
                      <div className="text-[10px] text-gray-600 flex items-center mb-1">
                        미래 매각가
                        <InfoTip
                          title="미래 매각가 (ExitPrice)"
                          description="보유기간(기본 6개월), 연간 상승률(기본 4%), 리노베이션 가산, 매도비용(기본 1.5%)을 반영한 예상 매각가입니다."
                        />
                      </div>
                      <div className="font-semibold text-purple-900 text-sm">
                        {analysis.auctionEval.exitPrice.toLocaleString()}원
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-300">
                      <div className="text-[10px] text-gray-600 flex items-center mb-1">
                        실전 수익률
                        <InfoTip
                          title="실전 수익률 (ROI_exit)"
                          description="실전 안전마진을 총인수금액으로 나눈 값입니다. (MoS_exit / A) × 100%로 계산됩니다."
                        />
                      </div>
                      <div className="font-semibold text-orange-900 text-sm">
                        {(analysis.auctionEval.roi_exit * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {/* 2-1. 근거 보기 (산출 트레이스) */}
          {(analysis?.trace && analysis.trace.length > 0) ||
          (analysis?.advancedSafetyMargin?.trace &&
            analysis.advancedSafetyMargin.trace.length > 0) ? (
            <section className="px-8 py-4 bg-gray-50">
              <h3 className="font-semibold mb-2 text-sm text-gray-900">
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

          {/* 3. 배당/현금흐름 요약 */}
          <section className="px-8 py-5 bg-gray-50">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">
              2. 배당 및 현금흐름 요약
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">배당기준금액</div>
                <div className="font-semibold text-gray-900">
                  {payoutBase.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">예상배당합계</div>
                <div className="font-semibold text-gray-900">
                  {expectedPayout.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">순투입(개략)</div>
                <div className="font-semibold text-gray-900">
                  {Math.max(0, lowest - expectedPayout).toLocaleString()}원
                </div>
              </div>
            </div>
          </section>

          {/* 4. 핵심 리스크 Top 3 */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">
              3. 핵심 리스크 Top 3
            </h3>
            {risks.length > 0 ? (
              <ul className="space-y-2">
                {risks.slice(0, 3).map((r, i) => (
                  <li
                    key={i}
                    className="p-3 border bg-gray-50 border-gray-300 text-sm"
                  >
                    <div className="font-semibold text-gray-900">{r.title}</div>
                    <div className="text-xs text-gray-700 mt-1">
                      원인: {r.cause}
                    </div>
                    <div className="text-xs text-gray-700">
                      영향: {r.impact}
                    </div>
                    <div className="text-xs text-gray-700">
                      조치: {r.action}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-600">
                등록된 리스크가 없습니다.
              </div>
            )}
          </section>

          {/* 5. 일정 체크 */}
          <section className="px-8 py-5 bg-gray-50">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">
              4. 일정 체크
            </h3>
            {schedules.length > 0 ? (
              <table className="w-full border border-gray-300 text-xs bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-900">
                    <th className="px-2 py-1 border-r border-gray-300 text-left">
                      일정
                    </th>
                    <th className="px-2 py-1 border-r border-gray-300 text-left">
                      제목
                    </th>
                    <th className="px-2 py-1 border-r border-gray-300 text-left">
                      일자
                    </th>
                    <th className="px-2 py-1 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1 border-t border-r border-gray-300">
                        {s.day}
                      </td>
                      <td className="px-2 py-1 border-t border-r border-gray-300">
                        {s.title}
                      </td>
                      <td className="px-2 py-1 border-t border-r border-gray-300">
                        {s.date}
                      </td>
                      <td className="px-2 py-1 border-t border-gray-300">
                        {s.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs text-gray-600">
                등록된 일정이 없습니다.
              </div>
            )}
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
