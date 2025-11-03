"use client";
import React from "react";
import type { PropertyDetail, RiskItem, ScheduleItem } from "@/types/property";
import { useSimulationStore } from "@/store/simulation-store";
import InfoTip from "@/components/common/InfoTip";

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

  const safetyMarginLabel = analysis
    ? `${analysis.safetyMargin.toLocaleString()}원`
    : "-";
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
            <div className="text-sm tracking-wider">대한민국 법원 경매 분석 서식</div>
            <h1 className="text-2xl font-bold mt-1">경매분석 보고서</h1>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="border border-gray-300">
              <div className="flex">
                <div className="w-28 px-3 py-2 border-r border-gray-300 bg-gray-50">사건번호</div>
                <div className="flex-1 px-3 py-2">{data.caseId || '-'}</div>
              </div>
              <div className="flex border-t border-gray-300">
                <div className="w-28 px-3 py-2 border-r border-gray-300 bg-gray-50">관할법원</div>
                <div className="flex-1 px-3 py-2">{data.nextAuction?.court || '-'}</div>
              </div>
            </div>
            <div className="border border-gray-300">
              <div className="flex">
                <div className="w-28 px-3 py-2 border-r border-gray-300 bg-gray-50">물건표시</div>
                <div className="flex-1 px-3 py-2">{data.meta?.address || '-'}</div>
              </div>
              <div className="flex border-t border-gray-300">
                <div className="w-28 px-3 py-2 border-r border-gray-300 bg-gray-50">작성일</div>
                <div className="flex-1 px-3 py-2">{new Date(data.snapshotAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          <div className="absolute top-3 right-4 flex items-center gap-2 no-print">
            {devMode?.isDevMode ? (
              <button
                onClick={() => {
                  console.log("📄 [다운로드] 경매분석 리포트 인쇄/다운로드 (print)");
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
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 text-[13px]">
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600 flex items-center">감정가<InfoTip title="감정가" description={"감정평가사가 산정한 가격. 법원 공고 기준값으로 사용."} /></div>
                <div className="font-semibold text-gray-900">{appraised.toLocaleString()}원</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600 flex items-center">최저가<InfoTip title="최저매각가격" description={"유찰 시 감액 비율을 반영한 현재 매각 최저가."} /></div>
                <div className="font-semibold text-gray-900">{lowest.toLocaleString()}원</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600 flex items-center">할인율<InfoTip title="할인율" description={"1 - 최저가/감정가. 유찰로 인한 감액 수준."} /></div>
                <div className="font-semibold text-gray-900">{Math.round(discountRate * 100)}%</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600 flex items-center">안전마진<InfoTip title="안전마진" description={"최소 필요자기자본.\nmax(인수금액, 유형별 바닥노출) × 위험도 × 난이도.\n1만원 단위 반올림."} /></div>
                <div className="font-semibold text-gray-900">{safetyMarginLabel}</div>
              </div>
            </div>
            {/* 시세 정보 추가 */}
            {analysis?.marketValue && (
              <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 text-[13px]">
                <div className="p-3 bg-white border border-gray-300">
                  <div className="text-[11px] text-gray-600 flex items-center">공정시세(FMV)<InfoTip title="공정시세(FMV)" description={"안전마진 계산에 사용되는 공정시세. 감정가를 기준으로 지역/면적/연식/유형을 반영하여 산정."} /></div>
                  <div className="font-semibold text-gray-900">{analysis.marketValue.fairMarketValue.toLocaleString()}원</div>
                </div>
                <div className="p-3 bg-white border border-gray-300">
                  <div className="text-[11px] text-gray-600 flex items-center">경매가 가이드<InfoTip title="경매가 가이드" description={"입찰 전략 수립용 경매가 중심값. 공정시세 대비 평균 12% 할인 적용."} /></div>
                  <div className="font-semibold text-gray-900">{analysis.marketValue.auctionCenter.toLocaleString()}원</div>
                </div>
                <div className="p-3 bg-white border border-gray-300">
                  <div className="text-[11px] text-gray-600 flex items-center">모델 중심값<InfoTip title="모델 중심값" description={"AI 시세 모델이 산출한 원본 중심값. 계수 적용 전 내부 기준값."} /></div>
                  <div className="font-semibold text-gray-900">{analysis.marketValue.center.toLocaleString()}원</div>
                </div>
              </div>
            )}
          </section>

          {/* 2. 입찰가 가이드 */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">1. 입찰가 가이드</h3>
            <div className="text-sm">
              <div className="mb-1">
                권장 범위: <span className="font-semibold text-gray-900">{recommendBidMin.toLocaleString()}원 ~ {recommendBidMax.toLocaleString()}원</span>
              </div>
              <div className="text-xs text-gray-600">최저가 기준 + 안전마진 50% 반영한 단순 가이드입니다. 권리 인수액, 공실/수리비 등 실비를 반영해 조정하세요.</div>
            </div>
          </section>

          {/* 2-1. 근거 보기 (산출 트레이스) */}
          {analysis?.trace && analysis.trace.length > 0 && (
            <section className="px-8 py-4 bg-gray-50">
              <h3 className="font-semibold mb-2 text-sm text-gray-900">근거 보기</h3>
              <ul className="text-xs text-gray-700 list-disc pl-5 space-y-1">
                {analysis.trace.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 3. 배당/현금흐름 요약 */}
          <section className="px-8 py-5 bg-gray-50">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">2. 배당 및 현금흐름 요약</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">배당기준금액</div>
                <div className="font-semibold text-gray-900">{payoutBase.toLocaleString()}원</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">예상배당합계</div>
                <div className="font-semibold text-gray-900">{expectedPayout.toLocaleString()}원</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">순투입(개략)</div>
                <div className="font-semibold text-gray-900">{Math.max(0, lowest - expectedPayout).toLocaleString()}원</div>
              </div>
            </div>
          </section>

          {/* 4. 핵심 리스크 Top 3 */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">3. 핵심 리스크 Top 3</h3>
            {risks.length > 0 ? (
              <ul className="space-y-2">
                {risks.slice(0, 3).map((r, i) => (
                  <li key={i} className="p-3 border bg-gray-50 border-gray-300 text-sm">
                    <div className="font-semibold text-gray-900">{r.title}</div>
                    <div className="text-xs text-gray-700 mt-1">원인: {r.cause}</div>
                    <div className="text-xs text-gray-700">영향: {r.impact}</div>
                    <div className="text-xs text-gray-700">조치: {r.action}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-600">등록된 리스크가 없습니다.</div>
            )}
          </section>

          {/* 5. 일정 체크 */}
          <section className="px-8 py-5 bg-gray-50">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">4. 일정 체크</h3>
            {schedules.length > 0 ? (
              <table className="w-full border border-gray-300 text-xs bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-900">
                    <th className="px-2 py-1 border-r border-gray-300 text-left">일정</th>
                    <th className="px-2 py-1 border-r border-gray-300 text-left">제목</th>
                    <th className="px-2 py-1 border-r border-gray-300 text-left">일자</th>
                    <th className="px-2 py-1 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1 border-t border-r border-gray-300">{s.day}</td>
                      <td className="px-2 py-1 border-t border-r border-gray-300">{s.title}</td>
                      <td className="px-2 py-1 border-t border-r border-gray-300">{s.date}</td>
                      <td className="px-2 py-1 border-t border-gray-300">{s.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs text-gray-600">등록된 일정이 없습니다.</div>
            )}
          </section>

          {/* 닫기 */}
          <div className="px-8 py-4 border-t border-gray-300 bg-white flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-black">닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
