import React from "react";
import type { PropertyDetail, RightRow } from "@/types/property";

interface RightsAnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PropertyDetail;
  analysis?: {
    safetyMargin: number;
    totalAssumedAmount: number;
  };
}
export default function RightsAnalysisReportModal({
  isOpen,
  onClose,
  data,
  analysis,
}: RightsAnalysisReportModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      console.log("⚖️ [권리분석] 권리분석 리포트 모달 열림");
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const rights = data.rights || [];
  const mainRight: RightRow | null = rights.length ? rights[0] : null;
  const notExtinguished = rights.filter((r) =>
    [
      "전세권",
      "주택임차권",
      "상가임차권",
      "법정지상권",
      "가처분",
      "유치권",
      "분묘기지권",
    ].includes(r.type)
  );

  const assumedCandidates = rights.filter((r) => notExtinguished.includes(r));
  const totalClaim = rights.reduce((sum, r) => sum + (r.claim || 0), 0);
  const totalAssume = assumedCandidates.reduce(
    (sum, r) => sum + (r.claim || 0),
    0
  );

  const safetyMarginLabel = analysis
    ? `${analysis.safetyMargin.toLocaleString()}원`
    : "-";
  const totalAssumedLabel = analysis
    ? `${analysis.totalAssumedAmount.toLocaleString()}원`
    : `${totalAssume.toLocaleString()}원`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-yellow-50 rounded-2xl shadow-lg w-full max-w-3xl mx-4 overflow-y-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-yellow-300">
          <h2 className="text-xl font-bold text-yellow-700">
            ⚖️ 권리분석 리포트
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-yellow-700"
          >
            ×
          </button>
        </div>

        <div className="divide-y divide-yellow-200">
          {/* 요약 카드 */}
          <section className="px-6 py-4 bg-yellow-100/60">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 text-sm">
              <div className="p-3 rounded-lg bg-white border border-yellow-200">
                <div className="text-[11px] text-yellow-700">안전마진</div>
                <div className="font-semibold text-yellow-900">
                  {safetyMarginLabel}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-yellow-200">
                <div className="text-[11px] text-yellow-700">인수추정액</div>
                <div className="font-semibold text-yellow-900">
                  {totalAssumedLabel}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-yellow-200">
                <div className="text-[11px] text-yellow-700">총 권리금액</div>
                <div className="font-semibold text-yellow-900">
                  {totalClaim.toLocaleString()}원
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-yellow-200">
                <div className="text-[11px] text-yellow-700">미소멸권리 수</div>
                <div className="font-semibold text-yellow-900">
                  {notExtinguished.length}건
                </div>
              </div>
            </div>
          </section>

          {/* 최선순위/미소멸권리 */}
          <section className="px-6 py-4 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-yellow-900">
              ① 최선순위 / 미소멸권리
            </h3>
            <div className="text-sm">
              <div className="mb-2">
                <span className="text-[12px] text-gray-600 mr-2">
                  최선순위권리
                </span>
                <span className="font-semibold text-blue-800">
                  {mainRight
                    ? `[${mainRight.type}] ${mainRight.holder || ""}`
                    : "-"}
                </span>
                <span className="ml-2 text-[12px] text-gray-500">
                  {mainRight?.date || ""}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-[12px] text-gray-600 mb-1">
                  등기상 소멸되지 않는 권리
                </div>
                {notExtinguished.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {notExtinguished.map((r, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded bg-yellow-50 border border-yellow-300 text-yellow-900 text-xs"
                      >
                        {r.type}
                        {r.holder ? `(${r.holder})` : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs">없음</div>
                )}
              </div>
            </div>
          </section>

          {/* 권리 목록 테이블 */}
          <section className="px-6 py-4 bg-yellow-50">
            <h3 className="font-semibold mb-2 text-sm text-yellow-900">
              ② 등기 권리 목록
            </h3>
            <table className="w-full border border-yellow-200 text-xs bg-white">
              <thead>
                <tr className="bg-yellow-100 text-yellow-900">
                  <th className="px-2 py-1 border-r border-yellow-200 text-left">
                    순위
                  </th>
                  <th className="px-2 py-1 border-r border-yellow-200 text-left">
                    권리
                  </th>
                  <th className="px-2 py-1 border-r border-yellow-200 text-left">
                    권리자
                  </th>
                  <th className="px-2 py-1 border-r border-yellow-200 text-left">
                    등기일
                  </th>
                  <th className="px-2 py-1 text-left">청구금액</th>
                </tr>
              </thead>
              <tbody>
                {rights.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 border-t border-r border-yellow-200">
                      {r.order}
                    </td>
                    <td className="px-2 py-1 border-t border-r border-yellow-200">
                      {r.type}
                    </td>
                    <td className="px-2 py-1 border-t border-r border-yellow-200">
                      {r.holder}
                    </td>
                    <td className="px-2 py-1 border-t border-r border-yellow-200">
                      {r.date}
                    </td>
                    <td className="px-2 py-1 border-t border-yellow-200 text-right">
                      {r.claim?.toLocaleString?.()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {notExtinguished.length > 0 && (
              <div className="mt-2 text-xs text-red-700">
                ※ 미소멸권리 인수 가능성 존재: 입찰가 산정에 반드시 반영하세요.
              </div>
            )}
          </section>

          {/* 배당/실무 코멘트 */}
          <section className="px-6 py-4 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-yellow-900">
              ③ 실무 코멘트
            </h3>
            <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
              <li>최선순위권리 확인 후 말소기준권리 판단이 우선입니다.</li>
              <li>미소멸권리 유무에 따른 인수/소멸 여부를 확정하세요.</li>
              <li>
                안전마진과 인수액을 기반으로 입찰 가능 최고가를 역산합니다.
              </li>
            </ul>
          </section>

          {/* 닫기 */}
          <div className="px-6 py-4 border-t border-yellow-200 bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
