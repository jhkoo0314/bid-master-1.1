import React from "react";
import type { PropertyDetail, RightRow } from "@/types/property";

interface CourtDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PropertyDetail;
}

// 9개 매물유형 예시 (meta.type)
const PROPERTY_TYPES = [
  "아파트",
  "연립",
  "빌라",
  "다가구",
  "단독주택",
  "오피스텔",
  "상가",
  "토지",
  "기타",
];

// 13개 권리유형
const RIGHT_TYPES = [
  "근저당권",
  "저당권",
  "압류",
  "가압류",
  "담보가등기",
  "전세권",
  "주택임차권",
  "상가임차권",
  "가처분",
  "소유권이전가등기",
  "유치권",
  "법정지상권",
  "분묘기지권",
];

function filterRightsByType(
  rights: RightRow[],
  typeList: string[]
): RightRow[] {
  return rights.filter((r) => typeList.includes(r.type));
}

export function CourtDocumentModal({
  isOpen,
  onClose,
  data,
}: CourtDocumentModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      console.log("📄 [법원문서] 매각물건명세서 공식문서 표준 양식 렌더링");
    }
  }, [isOpen]);
  if (!isOpen) return null;

  // 기본 매물 정보
  const { caseId, meta, price, nextAuction, rights } = data;
  const address = meta.address;
  const propertyType = PROPERTY_TYPES.includes(meta.type) ? meta.type : "기타";
  const area = meta?.area_pyeong
    ? `${meta.area_pyeong}평`
    : meta?.area_m2
    ? `${meta.area_m2}㎡`
    : "정보없음";
  const appraisal = price.appraised.toLocaleString();
  const lowest = price.lowest.toLocaleString();

  // 주요 권리유형 분리
  const rightGroups: { [k: string]: RightRow[] } = {};
  RIGHT_TYPES.forEach((rt) => {
    rightGroups[rt] = rights.filter((r) => r.type === rt);
  });
  // 최선순위권리: 권리 배열에서 순위 가장 앞선 것(관례)
  const mainRight = rights.length ? rights[0] : null;
  // 지상권 관련 권리
  const jisangRights = ["법정지상권", "유치권", "분묘기지권"].flatMap(
    (type) => rightGroups[type]
  );
  // 소멸되지 않는 권리 예시: 전세권/임차권/법정지상권/가처분 등
  const notExtinguishedRights = rights.filter((r) =>
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

  function tip(text: string, color: string = "red") {
    return (
      <div
        className={`my-2 p-2 text-xs rounded border-l-4 bg-${color}-50 border-${color}-300 text-${color}-700`}
      >
        {text}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh]">
        {/* 헤더 */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            🏛️ 매각 물건 명세서(상세)
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        {/* 본문 */}
        <div className="p-0 divide-y divide-gray-200">
          {/* 01. 사건/매물 기본정보 */}
          <section className="px-6 py-4">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">
              ① 사건 및 부동산 기본정보
            </h3>
            <table className="w-full border border-gray-200 text-xs bg-gray-50">
              <tbody>
                <tr>
                  <th className="w-28 px-2 py-1 text-left border-b border-r">
                    사건번호
                  </th>
                  <td className="px-2 py-1 border-b">{caseId}</td>
                  <th className="w-28 px-2 py-1 text-left border-b border-r">
                    매각일자
                  </th>
                  <td className="px-2 py-1 border-b">
                    {nextAuction?.date || "-"}
                  </td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    법원명
                  </th>
                  <td className="px-2 py-1 border-b">
                    {nextAuction?.court || "-"}
                  </td>
                  <th className="px-2 py-1 text-left border-b border-r">
                    부동산종별
                  </th>
                  <td className="px-2 py-1 border-b">{propertyType}</td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    소재지
                  </th>
                  <td className="px-2 py-1 border-b" colSpan={3}>
                    {address}
                  </td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    면적
                  </th>
                  <td className="px-2 py-1 border-b">{area}</td>
                  <th className="px-2 py-1 text-left border-b border-r">
                    담당법관
                  </th>
                  <td className="px-2 py-1 border-b">-</td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    감정가
                  </th>
                  <td className="px-2 py-1 border-b">{appraisal}원</td>
                  <th className="px-2 py-1 text-left border-b border-r">
                    최저가
                  </th>
                  <td className="px-2 py-1 border-b">{lowest}원</td>
                </tr>
              </tbody>
            </table>
          </section>
          {/* 02. 권리관계(최선순위, 소멸X, 기타) */}
          <section className="px-6 py-4 bg-white">
            <h3 className="font-semibold mb-2 mt-1 text-sm text-gray-700">
              ② 등기 권리관계 및 인수/소멸 정보
            </h3>
            <table className="w-full border border-gray-200 bg-white text-xs">
              <tbody>
                <tr>
                  <th className="w-28 px-2 py-1 text-left border-b border-r">
                    최선순위권리
                  </th>
                  <td className="px-2 py-1 border-b font-semibold text-blue-700">
                    {mainRight ? `[${mainRight.type}]` : "-"}
                  </td>
                  <th className="w-28 px-2 py-1 text-left border-b border-r">
                    권리 설정일
                  </th>
                  <td className="px-2 py-1 border-b">
                    {mainRight?.date || "-"}
                  </td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    등기상 소멸되지 않는 권리
                  </th>
                  <td
                    className="px-2 py-1 border-b text-yellow-900"
                    colSpan={3}
                  >
                    {notExtinguishedRights.length > 0
                      ? notExtinguishedRights.map((r, idx) => (
                          <div
                            key={idx}
                            className="inline-block px-2 mr-2 mb-1 py-0.5 rounded bg-yellow-50 border border-yellow-200"
                          >
                            {r.type}
                            {r.holder ? `(${r.holder})` : ""}
                          </div>
                        ))
                      : "없음"}
                  </td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    지상권
                  </th>
                  <td className="px-2 py-1 border-b text-green-800" colSpan={3}>
                    {jisangRights.length > 0
                      ? jisangRights.map((r, i) => (
                          <div
                            key={i}
                            className="inline-block mr-2 mb-1 px-2 py-0.5 rounded bg-green-50 border border-green-200"
                          >
                            {r.type}
                            {r.holder ? `(${r.holder})` : ""}
                          </div>
                        ))
                      : "없음"}
                  </td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    기타(압류·가압류 등)
                  </th>
                  <td className="px-2 py-1 border-b" colSpan={3}>
                    {[
                      "압류",
                      "가압류",
                      "담보가등기",
                      "가처분",
                      "소유권이전가등기",
                    ].some((type) => rightGroups[type].length > 0)
                      ? [
                          "압류",
                          "가압류",
                          "담보가등기",
                          "가처분",
                          "소유권이전가등기",
                        ].map((type) =>
                          rightGroups[type].map((r, idx) => (
                            <div
                              key={type + idx}
                              className="inline-block mr-2 mb-1 px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700"
                            >
                              {r.type}
                              {r.holder ? `(${r.holder})` : ""}
                            </div>
                          ))
                        )
                      : "없음"}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* 실전 권리분석 주석 */}
            {notExtinguishedRights.length > 0 &&
              tip(
                `※ 미소멸권리 인수의무 존재: 낙찰자 인수대상 주의 (${notExtinguishedRights
                  .map((r) => r.type)
                  .join(", ")})`,
                "red"
              )}
          </section>
          {/* 03. 점유·임차현황·배당 */}
          <section className="px-6 py-4 bg-gray-50">
            <h3 className="font-semibold mb-2 mt-1 text-sm text-gray-700">
              ③ 점유/임차인 현황 및 배당
            </h3>
            <table className="w-full border border-gray-200 bg-white text-xs">
              <tbody>
                <tr>
                  <th className="w-28 px-2 py-1 text-left border-b border-r">
                    임차인수
                  </th>
                  <td className="px-2 py-1 border-b">
                    {imchaRights.length || "-"}
                  </td>
                  <th className="w-28 px-2 py-1 text-left border-b border-r">
                    대항력임차인
                  </th>
                  <td className="px-2 py-1 border-b">{imchaStrong || "-"}</td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    보증금 범위
                  </th>
                  <td className="px-2 py-1 border-b" colSpan={3}>
                    {imchaRights.length > 0 &&
                    minDeposit !== null &&
                    maxDeposit !== null
                      ? `${minDeposit.toLocaleString()}~${maxDeposit.toLocaleString()}원`
                      : "-"}
                  </td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    점유관계
                  </th>
                  <td className="px-2 py-1 border-b" colSpan={3}>
                    {imchaRights.length > 0 ? `임차계약·현황조사 참고` : "투명"}
                  </td>
                </tr>
                <tr>
                  <th className="px-2 py-1 text-left border-b border-r">
                    배당요구종기
                  </th>
                  <td className="px-2 py-1 border-b" colSpan={3}>
                    -
                  </td>
                </tr>
              </tbody>
            </table>
            {/* 임차/점유 등 실전 TIPS */}
            {imchaRights.length > 0 &&
              tip(
                `※ 임차인/점유관계 인수·확정 여부 및 현황조사 확인 후 입찰 권장`,
                "orange"
              )}
          </section>
          {/* 04. 특이사항/비고 */}
          <section className="px-6 py-4">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">
              ④ 비고 / 실전 특이사항
            </h3>
            <div className="text-xs text-gray-700 p-3 border rounded bg-gray-50">
              {mainRight && (
                <div>
                  최선순위권리는 <b>{mainRight.type}</b>로, 말소/인수 여부에
                  따라 매수인 책임 범위가 바뀔 수 있습니다.
                </div>
              )}
              {jisangRights.length > 0 && (
                <div>
                  ※ 등기상 지상권 등 존재: 토지 권리 인수 및 추가 비용 가능.
                </div>
              )}
              <div>
                ※ 권리·점유관계 실제 확인 필수! 배당 순위, 임차현황 등은 현장
                조사/등기부 참고 요망.
              </div>
              <div className="mt-2 text-[11px] text-red-700">
                * 본 안내서는 실전 경매의 정확도와 리얼함을 위해 AI와 법원
                양식을 참조했습니다. 실제 입찰 전 등기/현황/권리관계 반드시
                재점검하세요.
              </div>
            </div>
          </section>
          {/* 닫기 버튼 */}
          <div className="px-6 py-4 border-t flex justify-end bg-white">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourtDocumentModal;
