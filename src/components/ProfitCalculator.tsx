/**
 * Bid Master AI - 수익 계산기 컴포넌트
 */

"use client";

import { useState } from "react";
import {
  calculateProfit,
  estimateEvictionCost,
  ProfitInput,
  ProfitOutput,
} from "@/lib/profit-calculator";
import {
  formatNumber,
  parseFormattedNumber,
  getFormattedInputValue,
} from "@/lib/format-utils";

export function ProfitCalculator() {
  const [input, setInput] = useState<ProfitInput>({
    appraisalValue: 1000000000, // 10억
    minimumBidPrice: 700000000, // 7억
    expectedBidPrice: 700000000, // 7억
    rightsToAssume: 0,
    evictionCost: 5000000, // 500만원
    remodelingCost: 0,
    holdingPeriod: 12, // 12개월
    expectedSalePrice: 1000000000, // 10억
  });

  const [result, setResult] = useState<ProfitOutput | null>(null);

  const handleCalculate = () => {
    const calculatedResult = calculateProfit(input);
    setResult(calculatedResult);
  };

  const handleInputChange = (field: keyof ProfitInput, value: number) => {
    console.log(
      `수익계산기 입력 변경: ${field} = ${value.toLocaleString("ko-KR")}원`
    );
    setInput({ ...input, [field]: value });
  };

  const handleEstimateEviction = (areaPyeong: number) => {
    const estimated = estimateEvictionCost(areaPyeong);
    setInput({ ...input, evictionCost: estimated });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        경매 수익 계산기
      </h2>

      {/* 입력 폼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            감정가 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.appraisalValue)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("appraisalValue", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="감정가를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            최저 매각가 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.minimumBidPrice)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("minimumBidPrice", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="최저 매각가를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            예상 낙찰가 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.expectedBidPrice)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("expectedBidPrice", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="예상 낙찰가를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            인수 권리 총액 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.rightsToAssume)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("rightsToAssume", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="인수 권리 총액을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            명도 비용 (원)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formatNumber(input.evictionCost)}
              onChange={(e) => {
                const numericValue = parseFormattedNumber(e.target.value);
                handleInputChange("evictionCost", numericValue);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="명도 비용을 입력하세요"
            />
            <button
              onClick={() => {
                const pyeong = prompt("면적을 평 단위로 입력하세요:");
                if (pyeong) handleEstimateEviction(Number(pyeong));
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            >
              추정
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            리모델링 비용 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.remodelingCost)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("remodelingCost", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="리모델링 비용을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            보유 기간 (개월)
          </label>
          <input
            type="number"
            value={input.holdingPeriod}
            onChange={(e) =>
              handleInputChange("holdingPeriod", Number(e.target.value))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            예상 매도가 (원)
          </label>
          <input
            type="text"
            value={formatNumber(input.expectedSalePrice)}
            onChange={(e) => {
              const numericValue = parseFormattedNumber(e.target.value);
              handleInputChange("expectedSalePrice", numericValue);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="예상 매도가를 입력하세요"
          />
        </div>
      </div>

      {/* 계산 버튼 */}
      <button
        onClick={handleCalculate}
        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
      >
        수익 계산하기
      </button>

      {/* 결과 표시 */}
      {result && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-bold text-gray-900">계산 결과</h3>

          {/* 주요 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">총 투자금액</div>
              <div className="text-2xl font-bold text-blue-900">
                {result.totalInvestment.toLocaleString("ko-KR")}원
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">예상 수익</div>
              <div className="text-2xl font-bold text-green-900">
                {result.expectedRevenue.toLocaleString("ko-KR")}원
              </div>
            </div>

            <div
              className={`rounded-lg p-4 ${
                result.netProfit >= 0 ? "bg-purple-50" : "bg-red-50"
              }`}
            >
              <div
                className={`text-sm mb-1 ${
                  result.netProfit >= 0 ? "text-purple-600" : "text-red-600"
                }`}
              >
                순수익
              </div>
              <div
                className={`text-2xl font-bold ${
                  result.netProfit >= 0 ? "text-purple-900" : "text-red-900"
                }`}
              >
                {result.netProfit.toLocaleString("ko-KR")}원
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">투자수익률 (ROI)</span>
              <span className="text-2xl font-bold text-gray-900">
                {result.roi.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">연환산 수익률</span>
              <span className="text-xl font-semibold text-gray-900">
                {result.annualizedRoi.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* 비용 구성 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-3">비용 구성</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">낙찰가</span>
                <span className="font-medium">
                  {result.breakdownCosts.bidPrice.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">인수 권리</span>
                <span className="font-medium">
                  {result.breakdownCosts.rights.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">명도 비용</span>
                <span className="font-medium">
                  {result.breakdownCosts.eviction.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">리모델링</span>
                <span className="font-medium">
                  {result.breakdownCosts.remodeling.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">취득세</span>
                <span className="font-medium">
                  {result.breakdownCosts.acquisitionTax.toLocaleString("ko-KR")}
                  원
                </span>
              </div>
            </div>
          </div>

          {/* 손익분기점 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-yellow-800">
                손익분기점 (최소 매도가)
              </span>
              <span className="text-xl font-bold text-yellow-900">
                {result.breakEvenPrice.toLocaleString("ko-KR")}원
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
