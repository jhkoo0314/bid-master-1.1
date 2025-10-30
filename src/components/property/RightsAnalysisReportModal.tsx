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

  const notExtinguished = rights.filter((r) => potentiallySurvivingTypes.has(r.type));
  console.log("⚖️ [권리분석] 미소멸 후보 권리 계산:", notExtinguished.map(r => r.type));

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
      <div className="bg-white rounded-lg shadow w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh] flex flex-col font-serif">
        {/* 표준 법원양식 머리말 */}
        <div className="px-8 py-6 border-b border-gray-300 relative">
          <div className="text-center">
            <div className="text-sm tracking-wider">대한민국 법원 경매 분석 서식</div>
            <h1 className="text-2xl font-bold mt-1">권리분석 보고서</h1>
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
                <div className="text-[11px] text-gray-600">안전마진</div>
                <div className="font-semibold text-gray-900">{safetyMarginLabel}</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">인수추정액</div>
                <div className="font-semibold text-gray-900">{totalAssumedLabel}</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">총 권리금액</div>
                <div className="font-semibold text-gray-900">{totalClaim.toLocaleString()}원</div>
              </div>
              <div className="p-3 bg-white border border-gray-300">
                <div className="text-[11px] text-gray-600">미소멸권리 수</div>
                <div className="font-semibold text-gray-900">{notExtinguished.length}건</div>
              </div>
            </div>
          </section>

          {/* 2. 최선순위 / 미소멸권리 */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">1. 최선순위 / 미소멸권리</h3>
            <div className="text-sm">
              <div className="mb-2">
                <span className="text-[12px] text-gray-600 mr-2">최선순위권리</span>
                <span className="font-semibold text-gray-900">
                  {mainRight ? `[${mainRight.type}] ${mainRight.holder || ''}` : '-'}
                </span>
                <span className="ml-2 text-[12px] text-gray-500">{mainRight?.date || ''}</span>
              </div>
              <div className="mt-2">
                <div className="text-[12px] text-gray-600 mb-1">등기상 소멸되지 않는 권리</div>
                {notExtinguished.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {notExtinguished.map((r, i) => (
                      <span key={i} className="inline-block px-2 py-0.5 bg-gray-50 border border-gray-300 text-gray-900 text-xs">
                        {r.type}
                        {r.holder ? `(${r.holder})` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs">없음</div>
                )}
              </div>
            </div>
          </section>

          {/* 3. 등기 권리 목록 (법원양식 표 스타일) */}
          <section className="px-8 py-5 bg-gray-50">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">2. 등기 권리 목록</h3>
            <table className="w-full border border-gray-300 text-xs bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-900">
                  <th className="px-2 py-1 border-r border-gray-300 text-left">순위</th>
                  <th className="px-2 py-1 border-r border-gray-300 text-left">권리</th>
                  <th className="px-2 py-1 border-r border-gray-300 text-left">권리자</th>
                  <th className="px-2 py-1 border-r border-gray-300 text-left">등기일</th>
                  <th className="px-2 py-1 text-left">청구금액</th>
                </tr>
              </thead>
              <tbody>
                {rights.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 border-t border-r border-gray-300">{r.order}</td>
                    <td className="px-2 py-1 border-t border-r border-gray-300">{r.type}</td>
                    <td className="px-2 py-1 border-t border-r border-gray-300">{r.holder}</td>
                    <td className="px-2 py-1 border-t border-r border-gray-300">{r.date}</td>
                    <td className="px-2 py-1 border-t border-gray-300 text-right">{r.claim?.toLocaleString?.()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {notExtinguished.length > 0 && (
              <div className="mt-2 text-xs text-red-700">※ 미소멸권리 인수 가능성 존재: 입찰가 산정에 반드시 반영하세요.</div>
            )}
          </section>

          {/* 4. 배당관계 요약 */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">3. 배당관계 요약</h3>
            <div className="text-xs text-gray-700">
              <div>· 배당기준금액: {data.payout?.base?.toLocaleString?.()}원</div>
              <div>· 예상배당합계: {(data.payout?.rows || []).reduce((s, r) => s + (r.expected || 0), 0).toLocaleString()}원</div>
              <div className="mt-1 text-gray-600">※ 최우선변제, 선순위 임차인 배당요구 여부를 반드시 확인</div>
            </div>
          </section>

          {/* 5. 실무 코멘트 */}
          <section className="px-8 py-5 bg-white">
            <h3 className="font-semibold mb-2 text-sm text-gray-900">4. 실무 코멘트</h3>
            <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
              <li>최선순위권리 확인 후 말소기준권리 판단이 우선입니다.</li>
              <li>미소멸권리 유무에 따른 인수/소멸 여부를 확정하세요.</li>
              <li>안전마진과 인수액을 기반으로 입찰 가능 최고가를 역산합니다.</li>
            </ul>
          </section>

          {/* 닫기 */}
          <div className="px-8 py-4 border-t border-gray-300 bg-white flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-black">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
