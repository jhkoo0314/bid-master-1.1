/**
 * 경매분석리포트 상세 팝업 모달 컴포넌트
 * 개발모드에서만 사용
 */

"use client";

import { SimulationScenario } from "@/types/simulation";

interface AuctionAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: SimulationScenario | null;
}

export function AuctionAnalysisModal({
  isOpen,
  onClose,
  property,
}: AuctionAnalysisModalProps) {
  if (!isOpen || !property) return null;

  console.log("경매분석리포트 팝업 열림:", property.id);

  // 권리 분석 데이터 계산
  const totalRights = property.rights?.length || 0;
  const assumedRights =
    property.rights?.filter((r) => r.willBeAssumed).length || 0;
  const extinguishedRights =
    property.rights?.filter((r) => r.willBeExtinguished).length || 0;

  // 임차인 분석 데이터 계산
  const totalTenants = property.tenants?.length || 0;
  const smallTenants =
    property.tenants?.filter((t) => t.isSmallTenant).length || 0;
  const tenantsWithDaehangryeok =
    property.tenants?.filter((t) => t.hasDaehangryeok).length || 0;

  // 투자 분석 데이터 계산
  const appraisalValue = property.basicInfo.appraisalValue || 0;
  const minimumBidPrice = property.basicInfo.minimumBidPrice || 0;
  const discountRate = Math.round((1 - minimumBidPrice / appraisalValue) * 100);
  const recommendedBidPrice = Math.round(minimumBidPrice * 1.2);

  // 리스크 점수 계산
  const riskScore = calculateRiskScore(property);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                매물 상세 분석 리포트
              </h2>
              <p className="text-blue-100">{property.basicInfo.location}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 스크롤 가능한 콘텐츠 */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="space-y-8">
            {/* 매물 기본 정보 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                매물 정보 요약
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    소재지
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {property.basicInfo.location}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    물건종류
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {property.basicInfo.propertyType}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    감정가
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {appraisalValue.toLocaleString("ko-KR")}원
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    최저가
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {minimumBidPrice.toLocaleString("ko-KR")}원
                  </p>
                </div>
              </div>
            </div>

            {/* 권리 현황 상세 분석 */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                권리 현황 분석
              </h3>

              {/* 권리 개요 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    총 권리 수
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {totalRights}개
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    인수 권리
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {assumedRights}개
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    소멸 권리
                  </p>
                  <p className="text-3xl font-bold text-gray-600">
                    {extinguishedRights}개
                  </p>
                </div>
              </div>

              {/* 권리 상세 목록 */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3">
                  권리 상세 내역
                </h4>
                {property.rights && property.rights.length > 0 ? (
                  <div className="space-y-3">
                    {property.rights.map((right, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {right.rightType}
                          </p>
                          <p className="text-sm text-gray-600">
                            권리자: {right.rightHolder}
                          </p>
                          <p className="text-sm text-gray-600">
                            청구금액:{" "}
                            {right.claimAmount?.toLocaleString("ko-KR")}원
                          </p>
                          <p className="text-sm text-gray-500">
                            등기일: {right.registrationDate}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {right.willBeAssumed && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              인수
                            </span>
                          )}
                          {right.willBeExtinguished && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              소멸
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-gray-600 font-medium">
                      권리 부담이 없는 깨끗한 매물입니다
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      이는 매우 매력적인 투자 기회를 의미합니다
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 임차인 현황 상세 분석 */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                임차인 현황 분석
              </h3>

              {/* 임차인 개요 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    총 임차인 수
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {totalTenants}명
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    소액임차인
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {smallTenants}명
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    대항력 보유
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {tenantsWithDaehangryeok}명
                  </p>
                </div>
              </div>

              {/* 임차인 상세 목록 */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3">
                  임차인 상세 내역
                </h4>
                {property.tenants && property.tenants.length > 0 ? (
                  <div className="space-y-3">
                    {property.tenants.map((tenant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {tenant.tenantName}
                          </p>
                          <p className="text-sm text-gray-600">
                            보증금: {tenant.deposit?.toLocaleString("ko-KR")}원
                            | 월세:{" "}
                            {tenant.monthlyRent?.toLocaleString("ko-KR")}원
                          </p>
                          <p className="text-sm text-gray-500">
                            입주일: {tenant.moveInDate}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {tenant.isSmallTenant && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              소액임차인
                            </span>
                          )}
                          {tenant.hasDaehangryeok && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              대항력
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-gray-600 font-medium">
                      임차인이 없는 매물입니다
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      추가 부담 없이 투자할 수 있습니다
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 투자 분석 및 리스크 평가 */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border-l-4 border-purple-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                투자 분석 및 리스크 평가
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 투자 지표 */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    투자 지표
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">할인율</span>
                      <span className="text-lg font-bold text-purple-600">
                        {discountRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">권리 복잡도</span>
                      <span
                        className={`text-sm font-bold ${
                          totalRights > 3 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {totalRights > 3 ? "높음 ⚠️" : "보통 ✅"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        임차인 리스크
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          totalTenants > 0
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {totalTenants > 0 ? "있음 ⚠️" : "없음 ✅"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 리스크 점수 */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    리스크 점수
                  </h4>
                  <div className="text-center">
                    <div
                      className="text-4xl font-bold mb-2"
                      style={{ color: getRiskColor(riskScore) }}
                    >
                      {riskScore}/100
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${riskScore}%`,
                          backgroundColor: getRiskColor(riskScore),
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {getRiskDescription(riskScore)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 권장 입찰 전략 */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border-l-4 border-orange-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                입찰 전략 분석
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    입찰 가격 분석
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">최저가</span>
                      <span className="text-lg font-bold text-red-600">
                        {minimumBidPrice.toLocaleString("ko-KR")}원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">권장 입찰가</span>
                      <span className="text-lg font-bold text-orange-600">
                        {recommendedBidPrice.toLocaleString("ko-KR")}원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">감정가 대비</span>
                      <span className="text-sm font-bold text-blue-600">
                        {Math.round(
                          (recommendedBidPrice / appraisalValue) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    종합 평가
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>투자 적합성:</strong>{" "}
                      {getInvestmentSuitability(property)}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>주의사항:</strong>{" "}
                      {getInvestmentWarnings(property)}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>권장사항:</strong>{" "}
                      {getInvestmentRecommendations(property)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 분석 설명 */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border-l-4 border-gray-500">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                분석 결과 요약
              </h3>

              <div className="space-y-6">
                {/* 매물 기본 정보 설명 */}
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    매물 기본 정보 해석
                  </h4>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <strong>감정가와 최저가의 의미:</strong> 감정가는 전문
                      감정평가사가 정한 시장가치이며, 최저가는 경매에서 시작하는
                      가격입니다. 할인율이 높을수록 투자 기회가 될 수
                      있지만, 동시에 숨겨진 문제가 있을 가능성도 높아집니다.
                    </p>
                    <p>
                      <strong>물건종류별 특성:</strong>{" "}
                      {property.basicInfo.propertyType}은
                      {property.basicInfo.propertyType === "아파트"
                        ? " 일반적으로 투자 안정성이 높고 유동성이 좋은 편입니다."
                        : property.basicInfo.propertyType === "단독주택"
                        ? " 개별적인 특성이 강해 신중한 검토가 필요합니다."
                        : " 특수한 용도로 인해 전문적인 검토가 필요합니다."}
                    </p>
                  </div>
                </div>

                {/* 권리 현황 설명 */}
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    권리 현황 상세 해석
                  </h4>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <strong>권리의 종류와 의미:</strong> 경매에서 권리는 크게
                      두 가지로 나뉩니다.
                      <span className="text-blue-600 font-semibold">
                        인수 권리
                      </span>
                      는 낙찰자가 그대로 인수해야 하는 권리(근저당권, 전세권
                      등)이고,
                      <span className="text-gray-600 font-semibold">
                        소멸 권리
                      </span>
                      는 경매로 인해 자동으로 소멸되는 권리입니다.
                    </p>

                    {totalRights > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="font-semibold text-blue-800 mb-2">
                          현재 매물의 권리 분석:
                        </p>
                        <ul className="space-y-1 text-sm">
                          <li>
                            • 총 {totalRights}개의 권리가 존재하며, 이는{" "}
                            {totalRights > 3 ? "복잡한" : "단순한"} 권리 구조를
                            의미합니다.
                          </li>
                          <li>
                            • {assumedRights}개의 인수 권리는 낙찰 후 추가
                            비용이 발생할 수 있습니다.
                          </li>
                          <li>
                            • {extinguishedRights}개의 소멸 권리는 경매로 인해
                            자동으로 해결됩니다.
                          </li>
                        </ul>
                      </div>
                    )}

                    {totalRights === 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="font-semibold text-green-800">
                          권리 부담이 없는 매물입니다. 이는 투자 기회를 의미합니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 임차인 현황 설명 */}
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    임차인 현황 상세 해석
                  </h4>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <strong>임차인의 중요성:</strong> 경매에서 임차인은 가장
                      중요한 고려사항 중 하나입니다. 임차인이 있는 경우 낙찰자가
                      임차인을 인수해야 하며, 이는 추가 비용과 복잡성을
                      의미합니다.
                    </p>

                    {totalTenants > 0 ? (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="font-semibold text-yellow-800 mb-2">
                          현재 매물의 임차인 분석:
                        </p>
                        <ul className="space-y-1 text-sm">
                          <li>
                            • 총 {totalTenants}명의 임차인이 거주 중입니다.
                          </li>
                          {smallTenants > 0 && (
                            <li>
                              • {smallTenants}명의 소액임차인은 특별한 보호를
                              받아 퇴거가 어려울 수 있습니다.
                            </li>
                          )}
                          {tenantsWithDaehangryeok > 0 && (
                            <li>
                              • {tenantsWithDaehangryeok}명이 대항력을 보유하여
                              강력한 권리를 가지고 있습니다.
                            </li>
                          )}
                        </ul>
                        <p className="mt-2 text-sm text-yellow-700">
                          ⚠️ 임차인 인수 비용과 퇴거 절차를 사전에 계산하고
                          준비해야 합니다.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="font-semibold text-green-800">
                          임차인이 없는 매물로, 추가 부담 없이 투자할 수
                          있습니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 투자 분석 설명 */}
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    투자 분석 상세 해석
                  </h4>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <strong>할인율의 의미:</strong> {discountRate}%의 할인율은
                      {discountRate > 50
                        ? "높은 할인으로 투자 기회이지만, 숨겨진 문제가 있을 가능성이 높습니다."
                        : discountRate > 30
                        ? "적당한 할인으로 균형잡힌 투자 기회입니다."
                        : "낮은 할인으로 경쟁이 치열할 것으로 예상됩니다."}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-800 mb-2">
                          권리 복잡도 분석
                        </h5>
                        <p className="text-sm">
                          {totalRights > 3
                            ? "복잡한 권리 구조로 전문가 상담이 필요합니다. 각 권리의 상세 내용을 꼼꼼히 검토해야 합니다."
                            : "단순한 권리 구조로 투자 리스크가 낮습니다. 신중한 검토 후 투자 결정을 내릴 수 있습니다."}
                        </p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-800 mb-2">
                          임차인 리스크 분석
                        </h5>
                        <p className="text-sm">
                          {totalTenants > 0
                            ? "임차인 존재로 인한 추가 비용과 복잡성을 고려해야 합니다. 퇴거 절차와 비용을 사전에 계산하세요."
                            : "임차인 부담이 없어 투자 리스크가 낮습니다."}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-800 mb-2">
                        리스크 점수 {riskScore}/100 해석
                      </h5>
                      <p className="text-sm">
                        {riskScore >= 70
                          ? "높은 리스크 - 신중한 검토가 필요합니다. 전문가 상담을 권장합니다."
                          : riskScore >= 40
                          ? "보통 리스크 - 주의 깊은 검토 후 투자 결정을 내리세요."
                          : "낮은 리스크 - 투자에 적합한 매물입니다."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 입찰 전략 설명 */}
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    입찰 전략 상세 가이드
                  </h4>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <strong>
                        권장 입찰가{" "}
                        {recommendedBidPrice.toLocaleString("ko-KR")}원의 근거:
                      </strong>
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li>
                        • 최저가 {minimumBidPrice.toLocaleString("ko-KR")}원에서
                        20% 상회한 가격으로 설정
                      </li>
                      <li>
                        • 감정가 대비{" "}
                        {Math.round(
                          (recommendedBidPrice / appraisalValue) * 100
                        )}
                        % 수준으로 적정한 투자 가격
                      </li>
                      <li>
                        • 권리 인수 비용과 임차인 관련 비용을 고려한 실질적인
                        투자 금액
                      </li>
                    </ul>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-orange-800 mb-2">
                        투자 시 고려사항
                      </h5>
                      <ul className="space-y-1 text-sm">
                        <li>• 입찰 전 권리 관계 전문가와 상담 권장</li>
                        <li>• 임차인 인수 비용 사전 계산 및 준비</li>
                        <li>• 시장 상황과 경쟁 입찰자 분석</li>
                        <li>• 자금 조달 계획 및 리스크 관리 방안 수립</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-red-800 mb-2">
                        주의사항
                      </h5>
                      <p className="text-sm">
                        경매는 일회성 거래로 되돌릴 수 없습니다. 신중한 검토와
                        준비 없이 입찰에 참여하지 마시고, 전문가의 조언을 구하는
                        것을 강력히 권장합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 리스크 점수 계산 함수
function calculateRiskScore(property: SimulationScenario): number {
  let score = 0;

  // 권리 복잡도 (0-30점)
  const rightsCount = property.rights?.length || 0;
  if (rightsCount > 5) score += 30;
  else if (rightsCount > 3) score += 20;
  else if (rightsCount > 1) score += 10;

  // 임차인 리스크 (0-40점)
  const tenantsCount = property.tenants?.length || 0;
  const smallTenantsCount =
    property.tenants?.filter((t) => t.isSmallTenant).length || 0;
  const tenantsWithDaehangryeok =
    property.tenants?.filter((t) => t.hasDaehangryeok).length || 0;

  if (tenantsCount > 0) {
    score += 20; // 기본 임차인 리스크
    if (smallTenantsCount > 0) score += 10; // 소액임차인 추가 리스크
    if (tenantsWithDaehangryeok > 0) score += 10; // 대항력 보유 추가 리스크
  }

  // 할인율 리스크 (0-30점)
  const appraisalValue = property.basicInfo.appraisalValue || 0;
  const minimumBidPrice = property.basicInfo.minimumBidPrice || 0;
  const discountRate = (1 - minimumBidPrice / appraisalValue) * 100;

  if (discountRate > 50) score += 30;
  else if (discountRate > 30) score += 20;
  else if (discountRate > 20) score += 10;

  return Math.min(score, 100);
}

// 리스크 색상 반환 함수
function getRiskColor(score: number): string {
  if (score >= 70) return "#ef4444"; // red-500
  if (score >= 40) return "#f59e0b"; // amber-500
  return "#10b981"; // emerald-500
}

// 리스크 설명 반환 함수
function getRiskDescription(score: number): string {
  if (score >= 70) return "높은 리스크 - 신중한 검토 필요";
  if (score >= 40) return "보통 리스크 - 주의 깊은 검토 권장";
  return "낮은 리스크 - 투자 적합";
}

// 투자 적합성 평가 함수
function getInvestmentSuitability(property: SimulationScenario): string {
  const rightsCount = property.rights?.length || 0;
  const tenantsCount = property.tenants?.length || 0;

  if (rightsCount <= 2 && tenantsCount === 0) {
    return "매우 적합 - 권리 구조가 단순하고 임차인 부담이 없음";
  } else if (rightsCount <= 3 && tenantsCount <= 1) {
    return "적합 - 권리 구조가 비교적 단순함";
  } else if (rightsCount <= 5 && tenantsCount <= 2) {
    return "보통 - 신중한 검토 후 투자 결정";
  } else {
    return "부적합 - 높은 리스크로 투자 권장하지 않음";
  }
}

// 투자 주의사항 함수
function getInvestmentWarnings(property: SimulationScenario): string {
  const warnings = [];

  if ((property.rights?.length || 0) > 3) {
    warnings.push("복잡한 권리 구조");
  }

  if ((property.tenants?.length || 0) > 0) {
    warnings.push("임차인 인수 비용 발생");
  }

  if ((property.tenants?.filter((t) => t.hasDaehangryeok).length || 0) > 0) {
    warnings.push("대항력 보유 임차인 존재");
  }

  return warnings.length > 0 ? warnings.join(", ") : "특별한 주의사항 없음";
}

// 투자 권장사항 함수
function getInvestmentRecommendations(property: SimulationScenario): string {
  const recommendations = [];

  if ((property.rights?.length || 0) > 3) {
    recommendations.push("권리 관계 전문가 상담");
  }

  if ((property.tenants?.length || 0) > 0) {
    recommendations.push("임차인 인수 비용 사전 계산");
  }

  if ((property.tenants?.filter((t) => t.isSmallTenant).length || 0) > 0) {
    recommendations.push("소액임차인 보호 조치 검토");
  }

  return recommendations.length > 0
    ? recommendations.join(", ")
    : "기본적인 경매 절차 준수";
}
