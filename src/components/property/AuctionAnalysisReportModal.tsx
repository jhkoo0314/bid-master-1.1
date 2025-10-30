import React from "react";
import type { PropertyDetail, RiskItem, ScheduleItem } from "@/types/property";

interface AuctionAnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PropertyDetail;
  analysis?: {
    safetyMargin: number;
    totalAssumedAmount: number;
  };
}
export default function AuctionAnalysisReportModal({
  isOpen,
  onClose,
  data,
  analysis,
}: AuctionAnalysisReportModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      console.log("📊 [경매분석] 경매분석 리포트 모달 열림");
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
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-700"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {/* 1. 요약 */}
          <section className="px-8 py-5 bg-gray-50">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 text-[13px]">
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">감정가</div>
                <div className="font-semibold text-gray-900">{appraised.toLocaleString()}원</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">최저가</div>
                <div className="font-semibold text-gray-900">{lowest.toLocaleString()}원</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">할인율</div>
                <div className="font-semibold text-gray-900">{Math.round(discountRate * 100)}%</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">안전마진</div>
                <div className="font-semibold text-gray-900">{safetyMarginLabel}</div>
              </div>
            </div>
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
