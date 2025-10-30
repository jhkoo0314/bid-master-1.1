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
      <div className="bg-green-50 rounded-2xl shadow-lg w-full max-w-3xl mx-4 overflow-y-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-green-200">
          <h2 className="text-xl font-bold text-green-800">
            🏦 경매분석 리포트
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-green-800"
          >
            ×
          </button>
        </div>

        <div className="divide-y divide-green-200">
          {/* 요약 카드 */}
          <section className="px-6 py-4 bg-green-100/60">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 text-sm">
              <div className="p-3 rounded-lg bg-white border border-green-200">
                <div className="text-[11px] text-green-700">감정가</div>
                <div className="font-semibold text-green-900">
                  {appraised.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-green-200">
                <div className="text-[11px] text-green-700">최저가</div>
                <div className="font-semibold text-green-900">
                  {lowest.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-green-200">
                <div className="text-[11px] text-green-700">할인율</div>
                <div className="font-semibold text-green-900">
                  {Math.round(discountRate * 100)}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-green-200">
                <div className="text-[11px] text-green-700">안전마진</div>
                <div className="font-semibold text-green-900">
                  {safetyMarginLabel}
                </div>
              </div>
            </div>
          </section>

          {/* 입찰가 가이드 */}
          <section className="px-6 py-4 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-green-900">
              ① 입찰가 가이드
            </h3>
            <div className="text-sm">
              <div className="mb-1">
                권장 범위:{" "}
                <span className="font-semibold text-green-800">
                  {recommendBidMin.toLocaleString()}원 ~{" "}
                  {recommendBidMax.toLocaleString()}원
                </span>
              </div>
              <div className="text-xs text-gray-600">
                최저가 기준 + 안전마진 50% 반영한 단순 가이드입니다. 권리
                인수액, 공실/수리비 등 실비를 반영해 조정하세요.
              </div>
            </div>
          </section>

          {/* 배당/현금흐름 요약 */}
          <section className="px-6 py-4 bg-green-50">
            <h3 className="font-semibold mb-2 text-sm text-green-900">
              ② 배당 및 현금흐름 요약
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-white border border-green-200">
                <div className="text-[11px] text-green-700">배당기준금액</div>
                <div className="font-semibold text-green-900">
                  {payoutBase.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-green-200">
                <div className="text-[11px] text-green-700">예상배당합계</div>
                <div className="font-semibold text-green-900">
                  {expectedPayout.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-green-200">
                <div className="text-[11px] text-green-700">순투입(개략)</div>
                <div className="font-semibold text-green-900">
                  {Math.max(0, lowest - expectedPayout).toLocaleString()}원
                </div>
              </div>
            </div>
          </section>

          {/* 핵심 리스크 Top 3 */}
          <section className="px-6 py-4 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-green-900">
              ③ 핵심 리스크 Top 3
            </h3>
            {risks.length > 0 ? (
              <ul className="space-y-2">
                {risks.slice(0, 3).map((r, i) => (
                  <li
                    key={i}
                    className="p-3 rounded border bg-green-50 border-green-200 text-sm"
                  >
                    <div className="font-semibold text-green-900">
                      {r.title}
                    </div>
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

          {/* 일정 체크 */}
          <section className="px-6 py-4 bg-green-50">
            <h3 className="font-semibold mb-2 text-sm text-green-900">
              ④ 일정 체크
            </h3>
            {schedules.length > 0 ? (
              <table className="w-full border border-green-200 text-xs bg-white">
                <thead>
                  <tr className="bg-green-100 text-green-900">
                    <th className="px-2 py-1 border-r border-green-200 text-left">
                      일정
                    </th>
                    <th className="px-2 py-1 border-r border-green-200 text-left">
                      제목
                    </th>
                    <th className="px-2 py-1 border-r border-green-200 text-left">
                      일자
                    </th>
                    <th className="px-2 py-1 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1 border-t border-r border-green-200">
                        {s.day}
                      </td>
                      <td className="px-2 py-1 border-t border-r border-green-200">
                        {s.title}
                      </td>
                      <td className="px-2 py-1 border-t border-r border-green-200">
                        {s.date}
                      </td>
                      <td className="px-2 py-1 border-t border-green-200">
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
          <div className="px-6 py-4 border-t border-green-200 bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
