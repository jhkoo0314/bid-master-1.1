/**
 * 입찰표 v2 (채도 낮춘 프리미엄 실전톤)
 */

export default function AuctionBidForm() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center py-10 px-6">
      {/* 상단 요약 카드 */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-[#0B1220] mb-2">경매 입찰</h2>
        <p className="text-sm text-[#5B6475] mb-4">
          실제 법원 양식을 기반으로 한 실전 시뮬레이션입니다.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-[#FAFAFA] rounded-xl border border-neutral-100">
            <p className="text-xs text-[#6B7280]">감정가</p>
            <p className="text-base font-semibold text-[#0B1220]">
              369,849,093원
            </p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded-xl border border-neutral-100">
            <p className="text-xs text-[#6B7280]">최저가</p>
            <p className="text-base font-semibold text-[#B08D57]">
              258,894,365원
            </p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded-xl border border-neutral-100">
            <p className="text-xs text-[#6B7280]">예상 시장가</p>
            <p className="text-base font-semibold text-[#1F2937]">
              335,640,000원
            </p>
          </div>
        </div>
      </div>

      {/* 입찰표 본문 */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 space-y-6">
        <h3 className="text-lg font-bold text-[#0B1220] border-b border-neutral-100 pb-2">
          경매입찰표
        </h3>

        {/* 법원명 */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            1. 법원명
          </label>
          <input
            type="text"
            value="서울지방법원 중구지원"
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-[#FAFAFA] text-[#0B1220] px-4 py-2 text-sm focus:outline-none"
          />
        </div>

        {/* 입찰기일 */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            2. 입찰기일
          </label>
          <input
            type="text"
            value="2025-10-10"
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-[#FAFAFA] text-[#0B1220] px-4 py-2 text-sm"
          />
        </div>

        {/* 사건번호 */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            3. 사건번호
          </label>
          <input
            type="text"
            value="2025타경48198"
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-[#FAFAFA] text-[#0B1220] px-4 py-2 text-sm"
          />
        </div>

        {/* 물건번호 */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            4. 물건번호
          </label>
          <input
            type="text"
            value="1"
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-[#FAFAFA] text-[#0B1220] px-4 py-2 text-sm"
          />
        </div>

        {/* 본인 정보 */}
        <div className="bg-[#F6F6F6] border border-neutral-200 rounded-xl p-4 text-sm text-[#5B6475]">
          <p className="font-semibold mb-1 text-[#374151]">
            5. 본인 정보 (시뮬레이션용)
          </p>
          <p>성명: [시뮬레이션]</p>
          <p>주민등록번호: [시뮬레이션]</p>
          <p>주소: [시뮬레이션]</p>
          <p>전화번호: [시뮬레이션]</p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            * 실제 경매에서는 본인 정보를 정확히 기재해야 합니다.
          </p>
        </div>

        {/* 입찰가격 */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            6. 입찰가격 (원)
          </label>
          <input
            type="text"
            value="258,894,365"
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-[#FAFAFA] text-[#0B1220] px-4 py-2 text-sm"
          />
          <p className="text-xs text-[#9CA3AF] mt-1">
            * AI 추천가 대비 -2.3%
          </p>
        </div>

        {/* 입찰보증금 */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            7. 입찰보증금 (원)
          </label>
          <input
            type="text"
            value="25,889,437"
            readOnly
            className="w-full rounded-lg border border-neutral-200 bg-[#FAFAFA] text-[#0B1220] px-4 py-2 text-sm"
          />
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end pt-4 border-t border-neutral-100">
          <button className="bg-[#0B1220] hover:bg-[#1F2937] text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all duration-200">
            입찰표 제출
          </button>
        </div>
      </div>
    </div>
  );
}
